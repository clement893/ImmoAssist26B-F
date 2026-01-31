import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Container from '../Container';

describe('Container', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Container>
        <div>Test Content</div>
      </Container>
    );
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('applies maxWidth classes', () => {
    const { rerender, container } = render(<Container maxWidth="sm">Content</Container>);
    expect(container.firstChild).toHaveClass('max-w-screen-sm');

    rerender(<Container maxWidth="md">Content</Container>);
    expect(container.firstChild).toHaveClass('max-w-screen-md');

    rerender(<Container maxWidth="lg">Content</Container>);
    expect(container.firstChild).toHaveClass('max-w-screen-lg');

    rerender(<Container maxWidth="xl">Content</Container>);
    expect(container.firstChild).toHaveClass('max-w-screen-xl');

    rerender(<Container maxWidth="2xl">Content</Container>);
    expect(container.firstChild).toHaveClass('max-w-screen-2xl');

    rerender(<Container maxWidth="full">Content</Container>);
    expect(container.firstChild).toHaveClass('max-w-full');
  });

  it('applies padding by default', () => {
    const { container } = render(<Container>Content</Container>);
    expect(container.firstChild).toHaveClass('px-4');
  });

  it('removes padding when padding is false', () => {
    const { container } = render(<Container padding={false}>Content</Container>);
    expect(container.firstChild).not.toHaveClass('px-4');
  });

  it('applies custom className', () => {
    const { container } = render(<Container className="custom-class">Content</Container>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has mx-auto class for centering', () => {
    const { container } = render(<Container>Content</Container>);
    expect(container.firstChild).toHaveClass('mx-auto');
  });
});
