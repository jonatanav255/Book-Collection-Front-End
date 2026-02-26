import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ToastProvider, useToast } from '@/components/common/Toast';
import { LanguageProvider } from '@/i18n';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ToastProvider>{children}</ToastProvider>
    </LanguageProvider>
  );
}

// Consumer that triggers toasts via buttons
function ToastTrigger() {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast('Hello!', 'success')}>show success</button>
      <button onClick={() => showToast('Oops!', 'error')}>show error</button>
      <button onClick={() => showToast('Heads up', 'info')}>show info</button>
      <button onClick={() => showToast('Watch out', 'warning')}>show warning</button>
      <button onClick={() => showToast('Default type')}>show default</button>
    </div>
  );
}

describe('Toast / useToast', () => {
  it('throws when used outside ToastProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function BadConsumer() {
      useToast();
      return null;
    }
    expect(() => render(<BadConsumer />)).toThrow('useToast must be used within ToastProvider');
    consoleSpy.mockRestore();
  });

  it('shows a success toast with the correct message', async () => {
    render(<Wrapper><ToastTrigger /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: 'show success' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Hello!');
  });

  it('shows an error toast', async () => {
    render(<Wrapper><ToastTrigger /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: 'show error' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Oops!');
  });

  it('shows multiple toasts at once', async () => {
    render(<Wrapper><ToastTrigger /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: 'show success' }));
    await userEvent.click(screen.getByRole('button', { name: 'show error' }));
    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);
  });

  it('dismisses a toast when the dismiss button is clicked', async () => {
    render(<Wrapper><ToastTrigger /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: 'show info' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
    await userEvent.click(dismissBtn);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('auto-dismisses after 5 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime.bind(vi) });
      render(<Wrapper><ToastTrigger /></Wrapper>);

      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'show warning' }));
      });
      expect(screen.getByRole('alert')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(5001);
      });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  }, 10000);

  it('defaults to info type when no type is provided', async () => {
    render(<Wrapper><ToastTrigger /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: 'show default' }));
    // info type uses blue styles
    expect(screen.getByRole('alert').className).toContain('bg-blue-50');
  });
});
