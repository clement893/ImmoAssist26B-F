import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import StatsCard from '../StatsCard';

describe('StatsCard', () => {
  it('renders title and value', () => {
    render(<StatsCard title="Total Users" value="1,234" />);
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders numeric value', () => {
    render(<StatsCard title="Revenue" value={5000} />);
    expect(screen.getByText('5000')).toBeInTheDocument();
  });

  it('renders increase change', () => {
    render(<StatsCard title="Growth" value="10%" change={{ value: 5, type: 'increase' }} />);
    expect(screen.getByText(/↑ 5%/)).toBeInTheDocument();
  });

  it('renders decrease change', () => {
    render(<StatsCard title="Decline" value="5%" change={{ value: 3, type: 'decrease' }} />);
    expect(screen.getByText(/↓ 3%/)).toBeInTheDocument();
  });

  it('renders period in change', () => {
    render(
      <StatsCard
        title="Sales"
        value="$1,000"
        change={{ value: 10, type: 'increase', period: 'last month' }}
      />
    );
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const icon = <span data-testid="stats-icon">📊</span>;
    render(<StatsCard title="Stats" value="100" icon={icon} />);
    expect(screen.getByTestId('stats-icon')).toBeInTheDocument();
  });

  it('renders trend when provided', () => {
    const trend = <div data-testid="trend">Trending up</div>;
    render(<StatsCard title="Stats" value="100" trend={trend} />);
    expect(screen.getByTestId('trend')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StatsCard title="Stats" value="100" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('does not render change when not provided', () => {
    const { container } = render(<StatsCard title="Stats" value="100" />);
    expect(container.querySelector('[class*="text-success"]')).not.toBeInTheDocument();
    expect(container.querySelector('[class*="text-error"]')).not.toBeInTheDocument();
  });

  it('handles large numeric values', () => {
    render(<StatsCard title="Large Number" value={999999999} />);
    expect(screen.getByText('999999999')).toBeInTheDocument();
  });

  it('handles zero value', () => {
    render(<StatsCard title="Zero" value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles negative change values', () => {
    render(
      <StatsCard title="Negative Change" value="100" change={{ value: -5, type: 'decrease' }} />
    );
    expect(screen.getByText(/↓ 5%/)).toBeInTheDocument();
  });

  it('handles very large change values', () => {
    render(
      <StatsCard title="Large Change" value="100" change={{ value: 999, type: 'increase' }} />
    );
    expect(screen.getByText(/↑ 999%/)).toBeInTheDocument();
  });

  it('renders both icon and trend together', () => {
    const icon = <span data-testid="icon">📊</span>;
    const trend = <div data-testid="trend">Trend</div>;
    render(<StatsCard title="Stats" value="100" icon={icon} trend={trend} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByTestId('trend')).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<StatsCard title="Stats" value="100" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper semantic structure', () => {
      render(<StatsCard title="Stats" value="100" />);
      expect(screen.getByText('Stats')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });
});
