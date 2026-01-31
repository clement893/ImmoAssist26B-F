import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Example Test', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should render a component', () => {
    const TestComponent = () => <div>Test Content</div>;
    render(<TestComponent />);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
