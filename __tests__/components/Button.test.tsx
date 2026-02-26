import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Button } from '@/components/common/Button';
import { LanguageProvider } from '@/i18n';

function renderButton(props: React.ComponentProps<typeof Button>) {
  return render(
    <LanguageProvider>
      <Button {...props} />
    </LanguageProvider>
  );
}

describe('Button', () => {
  it('renders its children', () => {
    renderButton({ children: 'Click me' });
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const onClick = vi.fn();
    renderButton({ children: 'Submit', onClick });
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled and shows loading text when isLoading=true', () => {
    renderButton({ children: 'Save', isLoading: true });
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent('Loading...');
  });

  it('does not call onClick while loading', async () => {
    const onClick = vi.fn();
    renderButton({ children: 'Save', isLoading: true, onClick });
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    renderButton({ children: 'Disabled', disabled: true });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies the danger variant class', () => {
    renderButton({ children: 'Delete', variant: 'danger' });
    expect(screen.getByRole('button').className).toContain('bg-red-600');
  });

  it('applies the secondary variant class', () => {
    renderButton({ children: 'Cancel', variant: 'secondary' });
    expect(screen.getByRole('button').className).toContain('bg-gray-200');
  });

  it('applies additional className passed via props', () => {
    renderButton({ children: 'Custom', className: 'my-custom-class' });
    expect(screen.getByRole('button').className).toContain('my-custom-class');
  });
});
