import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Breadcrumb from '../Breadcrumb';

describe('Breadcrumb', () => {
  it('renders breadcrumb items', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Current' },
    ];

    render(<Breadcrumb items={items} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('shows home item by default', () => {
    const items = [{ label: 'Page' }];
    render(<Breadcrumb items={items} />);

    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Page')).toBeInTheDocument();
  });

  it('hides home item when showHome is false', () => {
    const items = [{ label: 'Page' }];
    render(<Breadcrumb items={items} showHome={false} />);

    expect(screen.queryByText('Accueil')).not.toBeInTheDocument();
    expect(screen.getByText('Page')).toBeInTheDocument();
  });

  it('renders links for non-last items with href', () => {
    const items = [{ label: 'Home', href: '/' }, { label: 'Current' }];

    render(<Breadcrumb items={items} showHome={false} />);

    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders span for last item', () => {
    const items = [{ label: 'Home', href: '/' }, { label: 'Current' }];

    const { container } = render(<Breadcrumb items={items} showHome={false} />);

    const currentItem = screen.getByText('Current');
    expect(currentItem.tagName).toBe('SPAN');
    // aria-current is on the parent span, not the text span
    const parentSpan = currentItem.parentElement;
    expect(parentSpan).toHaveAttribute('aria-current', 'page');
  });

  it('renders custom separator', () => {
    const items = [{ label: 'Page' }];
    const customSeparator = <span data-testid="custom-separator">/</span>;

    render(<Breadcrumb items={items} separator={customSeparator} showHome={false} />);

    // Custom separator should be rendered between items (but there's only one item, so no separator)
    // When there are multiple items, separator appears between them
    const items2 = [{ label: 'Page1' }, { label: 'Page2' }];
    const { rerender } = render(
      <Breadcrumb items={items2} separator={customSeparator} showHome={false} />
    );
    expect(screen.getByTestId('custom-separator')).toBeInTheDocument();
  });

  it('renders icons when provided', () => {
    const items = [{ label: 'Page', icon: <span data-testid="page-icon">📄</span> }];

    render(<Breadcrumb items={items} showHome={false} />);

    expect(screen.getByTestId('page-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const items = [{ label: 'Page' }];
    const { container } = render(
      <Breadcrumb items={items} className="custom-class" showHome={false} />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('uses custom homeHref', () => {
    const items = [{ label: 'Page' }];
    render(<Breadcrumb items={items} homeHref="/custom-home" />);

    const homeLink = screen.getByText('Accueil').closest('a');
    expect(homeLink).toHaveAttribute('href', '/custom-home');
  });

  it('has proper ARIA label', () => {
    const items = [{ label: 'Page' }];
    render(<Breadcrumb items={items} showHome={false} />);

    const nav = screen.getByLabelText('Breadcrumb');
    expect(nav).toBeInTheDocument();
  });

  it('renders item without href as span', () => {
    const items = [{ label: 'No Link' }, { label: 'Current' }];

    render(<Breadcrumb items={items} showHome={false} />);

    const noLinkItem = screen.getByText('No Link');
    expect(noLinkItem.tagName).toBe('SPAN');
  });
});
