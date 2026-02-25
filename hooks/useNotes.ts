import { useState, useEffect, useCallback } from 'react';
import { notesApi } from '@/services/api';
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '@/types';

export function useNotes(bookId: string | null, sortBy: 'page' | 'date' = 'page') {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!bookId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await notesApi.list(bookId, sortBy);
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  }, [bookId, sortBy]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const createNote = useCallback(
    async (noteData: CreateNoteRequest) => {
      if (!bookId) throw new Error('No book ID provided');

      const newNote = await notesApi.create(bookId, noteData);
      setNotes((prev) => [newNote, ...prev]);
      return newNote;
    },
    [bookId]
  );

  const updateNote = useCallback(async (noteId: string, updates: UpdateNoteRequest) => {
    const updated = await notesApi.update(noteId, updates);
    setNotes((prev) =>
      prev.map((note) => (note.id === noteId ? updated : note))
    );
    return updated;
  }, []);

  const deleteNote = useCallback(async (noteId: string) => {
    await notesApi.delete(noteId);
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
  }, []);

  const exportNotes = useCallback(async () => {
    if (!bookId) throw new Error('No book ID provided');

    const blob = await notesApi.export(bookId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-${bookId}.md`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, [bookId]);

  return {
    notes,
    loading,
    error,
    refetch: fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    exportNotes,
  };
}
