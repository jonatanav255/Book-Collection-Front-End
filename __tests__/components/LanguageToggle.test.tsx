import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { LanguageProvider } from '@/i18n';
import { LanguageToggle } from '@/components/common/LanguageToggle';

function renderToggle() {
  return render(
    <LanguageProvider>
      <LanguageToggle />
    </LanguageProvider>
  );
}

describe('LanguageToggle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows "ES" label when current language is English', () => {
    renderToggle();
    expect(screen.getByRole('button')).toHaveTextContent('ES');
  });

  it('shows "EN" label after switching to Spanish', async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveTextContent('EN');
  });

  it('switches back to English after two clicks', async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole('button')); // → ES
    await user.click(screen.getByRole('button')); // → EN

    expect(screen.getByRole('button')).toHaveTextContent('ES');
  });

  it('has a descriptive title attribute in English mode', () => {
    renderToggle();
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Cambiar a Español');
  });

  it('has a descriptive title attribute in Spanish mode', async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveAttribute('title', 'Switch to English');
  });
});
