import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import Button from '../Button';
import Card from '../Card';
import Input from '../Input';

describe('Accessibility Tests', () => {
  it('Button has no accessibility violations', async () => {
    const { container } = render(<Button>Test Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Card has no accessibility violations', async () => {
    const { container } = render(<Card title="Test Card">Content</Card>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Input has no accessibility violations', async () => {
    const { container } = render(<Input label="Test Input" name="test" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
