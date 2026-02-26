import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useRef } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';

function TestComponent({
  handler,
  enabled = true,
}: {
  handler: () => void;
  enabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, handler, enabled);

  return (
    <div>
      <div ref={ref} data-testid="inside">Inside box</div>
      <button data-testid="outside">Outside button</button>
    </div>
  );
}

describe('useClickOutside', () => {
  it('calls handler when clicking outside the ref element', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();

    render(<TestComponent handler={handler} />);
    await user.click(screen.getByTestId('outside'));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does NOT call handler when clicking inside the ref element', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();

    render(<TestComponent handler={handler} />);
    await user.click(screen.getByTestId('inside'));

    expect(handler).not.toHaveBeenCalled();
  });

  it('does NOT call handler when enabled=false', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();

    render(<TestComponent handler={handler} enabled={false} />);
    await user.click(screen.getByTestId('outside'));

    expect(handler).not.toHaveBeenCalled();
  });

  it('calls handler multiple times for repeated outside clicks', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();

    render(<TestComponent handler={handler} />);
    await user.click(screen.getByTestId('outside'));
    await user.click(screen.getByTestId('outside'));
    await user.click(screen.getByTestId('outside'));

    expect(handler).toHaveBeenCalledTimes(3);
  });
});
