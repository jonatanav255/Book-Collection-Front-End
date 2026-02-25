import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '@/services/api';
import { queryKeys } from './queryKeys';
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '@/types';

// Notes hook with React Query caching and optimistic updates
// CRUD operations update the cache in-place via setQueryData (no refetch needed)
export function useNotes(bookId: string | null, sortBy: 'page' | 'date' = 'page') {
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: queryKeys.notes.list(bookId!, sortBy),
    queryFn: () => notesApi.list(bookId!, sortBy),
    enabled: !!bookId,
    staleTime: 60 * 1000,
  });

  // Create note and prepend to cache (newest first)
  const createNote = useCallback(async (noteData: CreateNoteRequest) => {
    if (!bookId) throw new Error('No book ID provided');
    const newNote = await notesApi.create(bookId, noteData);
    queryClient.setQueryData<Note[]>(
      queryKeys.notes.list(bookId, sortBy),
      (old) => old ? [newNote, ...old] : [newNote]
    );
    return newNote;
  }, [bookId, sortBy, queryClient]);

  // Update note and replace it in cache by ID
  const updateNote = useCallback(async (noteId: string, updates: UpdateNoteRequest) => {
    const updated = await notesApi.update(noteId, updates);
    if (bookId) {
      queryClient.setQueryData<Note[]>(
        queryKeys.notes.list(bookId, sortBy),
        (old) => old?.map(note => note.id === noteId ? updated : note) ?? []
      );
    }
    return updated;
  }, [bookId, sortBy, queryClient]);

  // Delete note and remove from cache
  const deleteNote = useCallback(async (noteId: string) => {
    await notesApi.delete(noteId);
    if (bookId) {
      queryClient.setQueryData<Note[]>(
        queryKeys.notes.list(bookId, sortBy),
        (old) => old?.filter(note => note.id !== noteId) ?? []
      );
    }
  }, [bookId, sortBy, queryClient]);

  // Download notes as markdown file
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
    error: queryError ? (queryError as Error).message : null,
    refetch: () => bookId ? queryClient.invalidateQueries({ queryKey: queryKeys.notes.list(bookId, sortBy) }) : undefined,
    createNote,
    updateNote,
    deleteNote,
    exportNotes,
  };
}
