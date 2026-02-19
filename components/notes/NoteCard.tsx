'use client';

import React, { useState } from 'react';
import { Pin, Edit2, Trash2, MoreVertical } from 'lucide-react';
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

  const colorStyles = {
    [NoteColor.IDEA]: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700',
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

  return (
    <div
      className={`relative p-4 border rounded-lg ${colorStyles[note.color]} transition-all hover:shadow-md`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Page {note.pageNumber}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20 font-medium">
            {colorLabels[note.color]}
          </span>
          {note.pinned && (
            <Pin className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="currentColor" />
          )}
        </div>

        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 rounded hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-4 top-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 min-w-[150px]">
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
      <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-2">
        {note.content}
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {formatDistanceToNow(note.createdAt)}
        {note.updatedAt !== note.createdAt && ' (edited)'}
      </div>
    </div>
  );
}
