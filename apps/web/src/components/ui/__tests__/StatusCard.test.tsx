import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import StatusCard from '../StatusCard';

describe('StatusCard', () => {
  it('renders title and description', () => {
    render(<StatusCard title="Success" description="Operation completed successfully" />);
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
  });

  it('applies success status classes by default', () => {
    const { container } = render(<StatusCard title="Success" description="Done" />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('border-secondary-200');
  });

  it('applies success status classes', () => {
    const { container } = render(
      <StatusCard title="Success" description="Done" status="success" />
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('border-secondary-200');
  });

  it('applies error status classes', () => {
    const { container } = render(<StatusCard title="Error" description="Failed" status="error" />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('border-red-200');
  });

  it('applies warning status classes', () => {
    const { container } = render(
      <StatusCard title="Warning" description="Caution" status="warning" />
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('border-yellow-200');
  });

  it('applies info status classes', () => {
    const { container } = render(
      <StatusCard title="Info" description="Information" status="info" />
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('border-blue-200');
  });

  it('applies correct text color classes for success', () => {
    const { container } = render(
      <StatusCard title="Success" description="Done" status="success" />
    );
    const title = container.querySelector('p[class*="font-semibold"]');
    expect(title).toHaveClass('text-secondary-900');
  });

  it('applies correct text color classes for error', () => {
    const { container } = render(<StatusCard title="Error" description="Failed" status="error" />);
    const title = container.querySelector('p[class*="font-semibold"]');
    expect(title).toHaveClass('text-red-900');
  });

  it('applies correct text color classes for warning', () => {
    const { container } = render(
      <StatusCard title="Warning" description="Caution" status="warning" />
    );
    const title = container.querySelector('p[class*="font-semibold"]');
    expect(title).toHaveClass('text-yellow-900');
  });

  it('applies correct text color classes for info', () => {
    const { container } = render(
      <StatusCard title="Info" description="Information" status="info" />
    );
    const title = container.querySelector('p[class*="font-semibold"]');
    expect(title).toHaveClass('text-blue-900');
  });

  it('handles long titles', () => {
    render(
      <StatusCard
        title="Very Long Title That Might Wrap"
        description="Description"
        status="success"
      />
    );
    expect(screen.getByText('Very Long Title That Might Wrap')).toBeInTheDocument();
  });

  it('handles long descriptions', () => {
    render(
      <StatusCard
        title="Title"
        description="Very long description that might wrap to multiple lines"
        status="success"
      />
    );
    expect(
      screen.getByText('Very long description that might wrap to multiple lines')
    ).toBeInTheDocument();
  });

  it('handles empty description', () => {
    render(<StatusCard title="Title" description="" status="success" />);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <StatusCard title="Success" description="Done" status="success" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper semantic structure', () => {
      render(<StatusCard title="Title" description="Description" status="success" />);
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });
});
