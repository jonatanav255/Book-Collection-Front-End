'use client';

import React, { useState } from 'react';
import { StickyNote, Plus, Download, X, ArrowUpDown } from 'lucide-react';
import { Note, CreateNoteRequest } from '@/types';
import { NoteCard } from './NoteCard';
import { NoteEditor } from './NoteEditor';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface NotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  currentPage: number;
  onCreateNote: (note: CreateNoteRequest) => Promise<void>;
  onUpdateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onExportNotes: () => Promise<void>;
}

export function NotesPanel({
  isOpen,
  onClose,
  notes,
  currentPage,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onExportNotes,
}: NotesPanelProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'page' | 'date'>('page');

  if (!isOpen) return null;

  const handleSaveNote = async (data: CreateNoteRequest | { id: string; updates: Partial<Note> }) => {
    if ('id' in data) {
      await onUpdateNote(data.id, data.updates);
    } else {
      await onCreateNote(data);
    }
    setEditingNote(null);
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setShowEditor(true);
  };

  const handleDelete = async (id: string) => {
    await onDeleteNote(id);
    setDeleteConfirm(null);
  };

  const sortedNotes = [...notes].sort((a, b) => {
    // Pinned notes always come first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    if (sortBy === 'page') {
      return a.pageNumber - b.pageNumber;
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Notes ({notes.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
          <Button size="sm" onClick={() => setShowEditor(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Note
          </Button>

          <div className="flex gap-2">
            <button
              onClick={() => setSortBy(sortBy === 'page' ? 'date' : 'page')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={`Sort by ${sortBy === 'page' ? 'date' : 'page'}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
            <button
              onClick={onExportNotes}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Export notes"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sortedNotes.length === 0 ? (
            <div className="text-center py-12">
              <StickyNote className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No notes yet for this book
              </p>
              <Button
                size="sm"
                onClick={() => setShowEditor(true)}
                className="mt-4"
              >
                Create First Note
              </Button>
            </div>
          ) : (
            sortedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteConfirm(id)}
                onTogglePin={(id, pinned) => onUpdateNote(id, { pinned })}
              />
            ))
          )}
        </div>
      </div>

      {/* Note Editor */}
      <NoteEditor
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        currentPage={currentPage}
        editingNote={editingNote}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}
