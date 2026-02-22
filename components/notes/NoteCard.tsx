'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Pin, Edit2, Trash2, MoreVertical } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Note, NoteColor } from '@/types';
import { formatDistanceToNow } from '@/utils/date';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
}

export function NoteCard({ note, onEdit, onDelete, onTogglePin }: NoteCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const colorStyles = {
    [NoteColor.IDEA]: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-700',
    [NoteColor.QUESTION]: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700',
    [NoteColor.SUMMARY]: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700',
    [NoteColor.QUOTE]: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700',
  };

  const colorLabels = {
    [NoteColor.IDEA]: 'Idea',
    [NoteColor.QUESTION]: 'Question',
    [NoteColor.SUMMARY]: 'Summary',
    [NoteColor.QUOTE]: 'Quote',
  };

  const labelStyles = {
    [NoteColor.IDEA]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    [NoteColor.QUESTION]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    [NoteColor.SUMMARY]: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    [NoteColor.QUOTE]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  };

  const codeBlockStyles = {
    [NoteColor.IDEA]: { backgroundColor: '#2d3748', borderLeft: '4px solid #3b82f6' },
    [NoteColor.QUESTION]: { backgroundColor: '#2d3748', borderLeft: '4px solid #eab308' },
    [NoteColor.SUMMARY]: { backgroundColor: '#2d3748', borderLeft: '4px solid #10b981' },
    [NoteColor.QUOTE]: { backgroundColor: '#2d3748', borderLeft: '4px solid #a855f7' },
  };

  return (
    <div
      className={`relative p-4 border rounded-lg ${colorStyles[note.color]} transition-all hover:shadow-md`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            Page {note.pageNumber}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${labelStyles[note.color]}`}>
            {colorLabels[note.color]}
          </span>
          <button
            onClick={() => onTogglePin(note.id, !note.pinned)}
            className="p-0.5 rounded hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
            title={note.pinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin
              className="w-3 h-3 text-gray-600 dark:text-gray-400"
              fill={note.pinned ? "currentColor" : "none"}
            />
          </button>
        </div>

        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 rounded hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div ref={menuRef} className="absolute right-4 top-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 min-w-[150px]">
            <button
              onClick={() => {
                onTogglePin(note.id, !note.pinned);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
            >
              <Pin className="w-4 h-4" />
              {note.pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              onClick={() => {
                onEdit(note);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => {
                onDelete(note.id);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="text-sm text-gray-800 dark:text-gray-200 mb-2 pr-8">
        <div className={`break-words markdown-content ${isExpanded ? '' : 'line-clamp-3'}`}>
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div style={codeBlockStyles[note.color]} className="rounded-lg overflow-hidden my-2">
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        background: 'transparent',
                        padding: '1rem',
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                );
              },
              p: ({ children }) => <p className="mb-2">{children}</p>,
              h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-bold mb-1">{children}</h3>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic my-2">
                  {children}
                </blockquote>
              ),
            }}
          >
            {note.content}
          </ReactMarkdown>
        </div>
        {note.content.length > 150 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {formatDistanceToNow(note.createdAt)}
        {Math.abs(new Date(note.updatedAt).getTime() - new Date(note.createdAt).getTime()) > 1000 && ' (edited)'}
      </div>
    </div>
  );
}
