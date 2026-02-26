import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LanguageProvider } from '@/i18n';

function renderDialog(props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Delete Book',
    message: 'Are you sure?',
    ...props,
  };
  return render(
    <LanguageProvider>
      <ConfirmDialog {...defaults} />
    </LanguageProvider>
  );
}

describe('ConfirmDialog', () => {
  it('renders title and message when open', () => {
    renderDialog({ title: 'Confirm Action', message: 'This cannot be undone.' });

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    renderDialog({ isOpen: false });

    expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
  });

  it('renders default confirm and cancel button text', () => {
    renderDialog();

    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders custom confirmText and cancelText', () => {
    renderDialog({ confirmText: 'Yes, delete', cancelText: 'No, keep it' });

    expect(screen.getByRole('button', { name: /yes, delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /no, keep it/i })).toBeInTheDocument();
  });

  it('calls onConfirm AND onClose when confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    renderDialog({ onConfirm, onClose });
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls only onClose when cancel button is clicked', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    renderDialog({ onConfirm, onClose });
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
