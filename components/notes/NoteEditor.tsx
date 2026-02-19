'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Note, NoteColor, CreateNoteRequest } from '@/types';

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: CreateNoteRequest | { id: string; updates: Partial<Note> }) => void;
  currentPage: number;
  editingNote?: Note | null;
}

export function NoteEditor({ isOpen, onClose, onSave, currentPage, editingNote }: NoteEditorProps) {
  const [content, setContent] = useState('');
  const [color, setColor] = useState<NoteColor>(NoteColor.IDEA);
  const [pageNumber, setPageNumber] = useState(currentPage);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (editingNote) {
      setContent(editingNote.content);
      setColor(editingNote.color);
      setPageNumber(editingNote.pageNumber);
      setPinned(editingNote.pinned);
    } else {
      setContent('');
      setColor(NoteColor.IDEA);
      setPageNumber(currentPage);
      setPinned(false);
    }
  }, [editingNote, currentPage, isOpen]);

  const handleSave = () => {
    if (!content.trim()) return;

    if (editingNote) {
      onSave({
        id: editingNote.id,
        updates: { content, color, pinned },
      });
    } else {
      onSave({
        pageNumber,
        content,
        color,
        pinned,
      });
    }

    onClose();
  };

  const colors = [
    { value: NoteColor.IDEA, label: 'Idea', color: 'bg-blue-500' },
    { value: NoteColor.QUESTION, label: 'Question', color: 'bg-yellow-500' },
    { value: NoteColor.SUMMARY, label: 'Summary', color: 'bg-green-500' },
    { value: NoteColor.QUOTE, label: 'Quote', color: 'bg-purple-500' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingNote ? 'Edit Note' : 'New Note'}
      size="md"
    >
      <div className="space-y-4">
        {/* Page Number */}
        {!editingNote && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Page Number
            </label>
            <input
              type="number"
              value={pageNumber}
              onChange={(e) => setPageNumber(parseInt(e.target.value) || 1)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                  color === c.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${c.color}`} />
                <span className="text-sm">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Note Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Write your note here... (Markdown supported)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Pinned */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="pinned"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="pinned" className="text-sm text-gray-700 dark:text-gray-300">
            Pin this note to the top
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!content.trim()}>
            {editingNote ? 'Update' : 'Create'} Note
          </Button>
        </div>
      </div>
    </Modal>
  );
}
