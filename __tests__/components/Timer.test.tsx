import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Timer } from '@/components/reader/Timer';
import { LanguageProvider } from '@/i18n';

// Suppress Notification API not available in jsdom
Object.defineProperty(window, 'Notification', {
  value: { permission: 'default', requestPermission: vi.fn() },
  writable: true,
});

function renderTimer(props: Partial<React.ComponentProps<typeof Timer>> = {}) {
  return render(
    <LanguageProvider>
      <Timer
        isOpen={true}
        onClose={vi.fn()}
        {...props}
      />
    </LanguageProvider>
  );
}

/**
 * Timer component tests — countdown/count-up modes with start/reset/pomodoro controls
 */
describe('Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Visibility
  it('renders when isOpen=true', () => {
    renderTimer();
    expect(screen.getByText(/reading timer/i)).toBeInTheDocument();
  });

  it('does not render when isOpen=false', () => {
    renderTimer({ isOpen: false });
    expect(screen.queryByText(/reading timer/i)).not.toBeInTheDocument();
  });

  // ── Default mode and switching
  it('shows countdown mode by default', () => {
    renderTimer();
    // Countdown starts at 25:00
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  it('shows count-up mode after clicking Count Up', () => {
    renderTimer();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /count up/i }));
    });

    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  // ── UI controls
  it('renders multiple buttons including close', () => {
    const onClose = vi.fn();
    renderTimer({ onClose });
    // X button exists (no accessible name since it wraps an SVG icon)
    const closeButtons = screen.getAllByRole('button');
    expect(closeButtons.length).toBeGreaterThanOrEqual(3); // X, Start, Reset
  });

  it('shows start button when not running', () => {
    renderTimer();
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
  });

  it('shows reset button', () => {
    renderTimer();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  // ── Display formatting and features
  it('displays time in MM:SS format', () => {
    renderTimer();
    // Default 25:00 is displayed — verify the MM:SS format pattern
    const timeDisplay = screen.getByText(/\d+:\d{2}/);
    expect(timeDisplay).toBeInTheDocument();
  });

  it('count-up mode button is present and clickable', () => {
    renderTimer();
    expect(screen.getByRole('button', { name: /count up/i })).toBeInTheDocument();
  });

  it('pomodoro tab button is rendered', () => {
    renderTimer();
    expect(screen.getByRole('button', { name: /pomodoro/i })).toBeInTheDocument();
  });
});
