import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Popover from '../Popover';

describe('Popover', () => {
  it('renders trigger', () => {
    render(<Popover trigger={<button>Open</button>} content={<div>Content</div>} />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('opens popover when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<Popover trigger={<button>Open</button>} content={<div>Popover Content</div>} />);

    await user.click(screen.getByText('Open'));

    await waitFor(
      () => {
        expect(screen.getByText('Popover Content')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('closes popover when trigger is clicked again', async () => {
    const user = userEvent.setup();
    render(<Popover trigger={<button>Open</button>} content={<div>Content</div>} />);

    await user.click(screen.getByText('Open'));

    await waitFor(
      () => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await user.click(screen.getByText('Open'));

    await waitFor(
      () => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('closes on Escape key when closeOnEscape is true', async () => {
    const user = userEvent.setup();
    render(
      <Popover trigger={<button>Open</button>} content={<div>Content</div>} closeOnEscape={true} />
    );

    await user.click(screen.getByText('Open'));

    await waitFor(
      () => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await user.keyboard('{Escape}');

    await waitFor(
      () => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('does not close on Escape when closeOnEscape is false', async () => {
    const user = userEvent.setup();
    render(
      <Popover trigger={<button>Open</button>} content={<div>Content</div>} closeOnEscape={false} />
    );

    await user.click(screen.getByText('Open'));

    await waitFor(
      () => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await user.keyboard('{Escape}');

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('closes on outside click when closeOnClickOutside is true', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Popover
          trigger={<button>Open</button>}
          content={<div>Content</div>}
          closeOnClickOutside={true}
        />
        <button>Outside</button>
      </div>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(
      () => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await user.click(screen.getByText('Outside'));

    await waitFor(
      () => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('uses controlled open state', async () => {
    const handleOpenChange = vi.fn();
    const { rerender } = render(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Content</div>}
        open={false}
        onOpenChange={handleOpenChange}
      />
    );

    expect(screen.queryByText('Content')).not.toBeInTheDocument();

    rerender(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Content</div>}
        open={true}
        onOpenChange={handleOpenChange}
      />
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies placement classes', async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(
      <Popover trigger={<button>Open</button>} content={<div>Content</div>} placement="top" />
    );

    await user.click(screen.getByText('Open'));

    await waitFor(
      () => {
        const content = container.querySelector('[role="dialog"]');
        expect(content).toBeInTheDocument();
        // Check for placement class - top placement should have bottom-full
        expect(content).toHaveClass('bottom-full');
      },
      { timeout: 3000 }
    );

    unmount();

    const { container: container2 } = render(
      <Popover trigger={<button>Open</button>} content={<div>Content</div>} placement="bottom" />
    );

    await user.click(screen.getByText('Open'));

    await waitFor(
      () => {
        const content = container2.querySelector('[role="dialog"]');
        expect(content).toBeInTheDocument();
        // Check for placement class - bottom placement should have top-full
        expect(content).toHaveClass('top-full');
      },
      { timeout: 3000 }
    );
  });

  it('renders arrow when arrow prop is true', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Popover trigger={<button>Open</button>} content={<div>Content</div>} arrow={true} />
    );

    await user.click(screen.getByText('Open'));

    await waitFor(
      () => {
        const arrow = container.querySelector('div[class*="border-"]');
        expect(arrow).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('applies custom className', () => {
    const { container } = render(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Content</div>}
        className="custom-class"
      />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('calls onOpenChange when popover opens', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();
    render(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Content</div>}
        onOpenChange={handleOpenChange}
      />
    );

    await user.click(screen.getByText('Open'));

    await waitFor(
      () => {
        expect(handleOpenChange).toHaveBeenCalledWith(true);
      },
      { timeout: 3000 }
    );
  });

  it('calls onOpenChange when popover closes', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();
    render(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Content</div>}
        onOpenChange={handleOpenChange}
      />
    );

    await user.click(screen.getByText('Open'));

    await waitFor(
      () => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await user.click(screen.getByText('Open'));

    await waitFor(
      () => {
        expect(handleOpenChange).toHaveBeenCalledWith(false);
      },
      { timeout: 3000 }
    );
  });

  it('does not close on outside click when closeOnClickOutside is false', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Popover
          trigger={<button>Open</button>}
          content={<div>Content</div>}
          closeOnClickOutside={false}
        />
        <button>Outside</button>
      </div>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(
      () => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await user.click(screen.getByText('Outside'));

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('handles all placement options', async () => {
    const user = userEvent.setup();
    const placements = ['top', 'bottom', 'left', 'right'] as const;

    for (const placement of placements) {
      const { container, unmount } = render(
        <Popover
          trigger={<button>Open</button>}
          content={<div>Content</div>}
          placement={placement}
        />
      );

      await user.click(screen.getByText('Open'));

      await waitFor(
        () => {
          const content = container.querySelector('[role="dialog"]');
          expect(content).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      unmount();
    }
  });

  it('renders without arrow when arrow prop is false', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Popover trigger={<button>Open</button>} content={<div>Content</div>} arrow={false} />
    );

    await user.click(screen.getByText('Open'));

    await waitFor(
      () => {
        const content = container.querySelector('[role="dialog"]');
        expect(content).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('handles complex trigger elements', () => {
    render(
      <Popover
        trigger={
          <div>
            <span>Complex</span>
            <button>Trigger</button>
          </div>
        }
        content={<div>Content</div>}
      />
    );
    expect(screen.getByText('Complex')).toBeInTheDocument();
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('handles complex content', () => {
    render(
      <Popover
        trigger={<button>Open</button>}
        content={
          <div>
            <h2>Title</h2>
            <p>Paragraph</p>
            <button>Action</button>
          </div>
        }
      />
    );
    expect(screen.getByText('Open')).toBeInTheDocument();
  });
});
