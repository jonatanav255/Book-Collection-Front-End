import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Modal } from '@/components/common/Modal';
import { LanguageProvider } from '@/i18n';

function renderModal(props: Partial<React.ComponentProps<typeof Modal>> = {}) {
  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    children: <p>Modal content</p>,
    ...props,
  };
  return render(
    <LanguageProvider>
      <Modal {...defaults} />
    </LanguageProvider>
  );
}

describe('Modal', () => {
  it('renders children when open', () => {
    renderModal();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render children when closed', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders title when provided', () => {
    renderModal({ title: 'My Modal Title' });
    expect(screen.getByText('My Modal Title')).toBeInTheDocument();
  });

  it('renders close button when title is provided', () => {
    renderModal({ title: 'Close Me' });
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    renderModal({ title: 'Test Modal', onClose });
    await user.click(screen.getByRole('button', { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    renderModal({ title: 'Backdrop Test', onClose });

    // The backdrop is the absolute div behind the modal content
    const backdrop = document.querySelector('.absolute.inset-0') as HTMLElement;
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalled();
  });

  it('has role="dialog" for accessibility', () => {
    renderModal({ title: 'Accessible Modal' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
