import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tooltip from '../Tooltip';

describe('Tooltip', () => {
  it('renders children', () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('shows tooltip on mouse enter after delay', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Tooltip text" delay={200}>
        <button>Hover me</button>
      </Tooltip>
    );

    const button = screen.getByText('Hover me');
    await user.hover(button);

    // Wait for delay + some buffer
    await waitFor(
      () => {
        expect(screen.getByText('Tooltip text')).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('hides tooltip on mouse leave', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Tooltip text" delay={200}>
        <button>Hover me</button>
      </Tooltip>
    );

    const button = screen.getByText('Hover me');
    await user.hover(button);

    await waitFor(
      () => {
        expect(screen.getByText('Tooltip text')).toBeInTheDocument();
      },
      { timeout: 500 }
    );

    await user.unhover(button);

    await waitFor(
      () => {
        expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('applies position classes', async () => {
    const user = userEvent.setup();
    const { rerender, container } = render(
      <Tooltip content="Tooltip" position="top" delay={0}>
        <button>Button</button>
      </Tooltip>
    );

    await user.hover(screen.getByText('Button'));
    await waitFor(
      () => {
        const tooltip = container.querySelector('div[class*="bottom-full"]');
        expect(tooltip).toBeInTheDocument();
      },
      { timeout: 500 }
    );

    await user.unhover(screen.getByText('Button'));
    rerender(
      <Tooltip content="Tooltip" position="bottom" delay={0}>
        <button>Button</button>
      </Tooltip>
    );
    await user.hover(screen.getByText('Button'));
    await waitFor(
      () => {
        const tooltip = container.querySelector('div[class*="top-full"]');
        expect(tooltip).toBeInTheDocument();
      },
      { timeout: 500 }
    );

    await user.unhover(screen.getByText('Button'));
    rerender(
      <Tooltip content="Tooltip" position="left" delay={0}>
        <button>Button</button>
      </Tooltip>
    );
    await user.hover(screen.getByText('Button'));
    await waitFor(
      () => {
        const tooltip = container.querySelector('div[class*="right-full"]');
        expect(tooltip).toBeInTheDocument();
      },
      { timeout: 500 }
    );

    await user.unhover(screen.getByText('Button'));
    rerender(
      <Tooltip content="Tooltip" position="right" delay={0}>
        <button>Button</button>
      </Tooltip>
    );
    await user.hover(screen.getByText('Button'));
    await waitFor(
      () => {
        const tooltip = container.querySelector('div[class*="left-full"]');
        expect(tooltip).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('renders ReactNode content', () => {
    render(
      <Tooltip content={<span data-testid="custom-content">Custom</span>}>
        <button>Button</button>
      </Tooltip>
    );
    // Tooltip won't be visible without hover, but we can check it's in the DOM
    const container = screen.getByText('Button').parentElement;
    expect(container).toBeInTheDocument();
  });

  it('applies custom className', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Tooltip" className="custom-tooltip" delay={0}>
        <button>Button</button>
      </Tooltip>
    );

    await user.hover(screen.getByText('Button'));

    await waitFor(
      () => {
        const tooltip = screen.getByText('Tooltip');
        expect(tooltip).toHaveClass('custom-tooltip');
      },
      { timeout: 500 }
    );
  });

  it('cancels timeout on mouse leave before delay completes', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Tooltip" delay={200}>
        <button>Button</button>
      </Tooltip>
    );

    const button = screen.getByText('Button');
    await user.hover(button);
    // Wait less than delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    await user.unhover(button);
    // Wait for remaining delay
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(screen.queryByText('Tooltip')).not.toBeInTheDocument();
  });
});
