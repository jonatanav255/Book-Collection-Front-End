'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Code } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Note, NoteColor, CreateNoteRequest } from '@/types';
import { useLanguage } from '@/i18n';

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: CreateNoteRequest | { id: string; updates: Partial<Note> }) => void;
  currentPage: number;
  totalPages?: number;
  editingNote?: Note | null;
}

export function NoteEditor({ isOpen, onClose, onSave, currentPage, totalPages, editingNote }: NoteEditorProps) {
  const { t } = useLanguage();
  const [content, setContent] = useState('');
  const [color, setColor] = useState<NoteColor>(NoteColor.IDEA);
  const [pageNumber, setPageNumber] = useState(currentPage);
  const [pinned, setPinned] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const languages = [
    'javascript', 'python', 'typescript', 'java', 'go', 'rust', 'php', 'ruby',
    'swift', 'kotlin', 'sql', 'bash', 'html', 'css', 'c', 'cpp', 'csharp'
  ];

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

  const handleInsertCode = () => {
    if (!codeInput.trim()) return;

    const codeBlock = `\`\`\`${selectedLanguage}\n${codeInput}\n\`\`\`\n\n`;
    setContent(content + codeBlock);
    setCodeInput('');
    setShowCodeModal(false);
  };

  const colors = [
    { value: NoteColor.IDEA, label: t('notes.idea'), color: 'bg-blue-500' },
    { value: NoteColor.QUESTION, label: t('notes.question'), color: 'bg-yellow-500' },
    { value: NoteColor.SUMMARY, label: t('notes.summary'), color: 'bg-green-500' },
    { value: NoteColor.QUOTE, label: t('notes.quote'), color: 'bg-purple-500' },
  ];

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingNote ? t('notes.editNote') : t('notes.newNote')}
      size="md"
    >
      <div className="space-y-4">
        {/* Page Number */}
        {!editingNote && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('notes.pageNumber')}
            </label>
            <input
              type="number"
              value={pageNumber}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setPageNumber(Math.max(1, totalPages ? Math.min(val, totalPages) : val));
              }}
              min="1"
              max={totalPages}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('notes.category')}
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
                <span className="text-sm text-gray-700 dark:text-gray-300">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('notes.noteContent')}
            </label>
            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              <Code className="w-3.5 h-3.5" />
              <span>{t('notes.addCode')}</span>
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder={t('notes.writeNoteHere')}
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
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="pinned" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            {t('notes.pinToTop')}
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!content.trim()}>
            {editingNote ? t('notes.updateNote') : t('notes.createNote')}
          </Button>
        </div>
      </div>
    </Modal>

      {/* Code Input Modal */}
      {showCodeModal && (
        <Modal
          isOpen={showCodeModal}
          onClose={() => {
            setShowCodeModal(false);
            setCodeInput('');
          }}
          title={t('notes.addCodeBlock')}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('notes.programmingLanguage')}
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('notes.yourCode')}
              </label>
              <textarea
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                rows={10}
                placeholder={t('notes.pasteCodeHere')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCodeModal(false);
                  setCodeInput('');
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={handleInsertCode} disabled={!codeInput.trim()}>
                {t('notes.insertCode')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
