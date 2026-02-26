import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SearchBar } from '@/components/library/SearchBar';
import { LanguageProvider } from '@/i18n';

function renderSearchBar(props: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return render(
    <LanguageProvider>
      <SearchBar {...props} />
    </LanguageProvider>
  );
}

describe('SearchBar', () => {
  it('renders with the default i18n placeholder', () => {
    renderSearchBar({ value: '', onChange: vi.fn() });
    expect(screen.getByPlaceholderText('Search books...')).toBeInTheDocument();
  });

  it('renders with a custom placeholder when provided', () => {
    renderSearchBar({ value: '', onChange: vi.fn(), placeholder: 'Find something...' });
    expect(screen.getByPlaceholderText('Find something...')).toBeInTheDocument();
  });

  it('displays the current value', () => {
    renderSearchBar({ value: 'Dune', onChange: vi.fn() });
    expect(screen.getByDisplayValue('Dune')).toBeInTheDocument();
  });

  it('calls onChange with the new value when user types', async () => {
    const onChange = vi.fn();
    renderSearchBar({ value: '', onChange });
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'H');
    expect(onChange).toHaveBeenCalledWith('H');
  });

  it('does not show the clear button when value is empty', () => {
    renderSearchBar({ value: '', onChange: vi.fn() });
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('shows the clear button when value is non-empty', () => {
    renderSearchBar({ value: 'Dune', onChange: vi.fn() });
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('calls onChange with empty string when clear button is clicked', async () => {
    const onChange = vi.fn();
    renderSearchBar({ value: 'Dune', onChange });
    await userEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onChange).toHaveBeenCalledWith('');
  });
});
