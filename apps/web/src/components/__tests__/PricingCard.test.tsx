import { render, screen, fireEvent } from '@testing-library/react';
import { PricingCard, Plan } from '../subscriptions/PricingCard';

describe('PricingCard', () => {
  const mockPlan: Plan = {
    id: 1,
    name: 'Pro Plan',
    description: 'For professionals',
    amount: 2900,
    currency: 'usd',
    interval: 'MONTH',
    interval_count: 1,
    is_popular: false,
    features: '{"max_users": 10}',
  };

  it('renders plan information correctly', () => {
    const onSelect = jest.fn();
    render(<PricingCard plan={mockPlan} onSelect={onSelect} />);

    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    expect(screen.getByText('For professionals')).toBeInTheDocument();
    expect(screen.getByText('$29.00')).toBeInTheDocument();
  });

  it('calls onSelect when button is clicked', () => {
    const onSelect = jest.fn();
    render(<PricingCard plan={mockPlan} onSelect={onSelect} />);

    const button = screen.getByText('Select Plan');
    fireEvent.click(button);

    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('disables button when loading', () => {
    const onSelect = jest.fn();
    render(<PricingCard plan={mockPlan} onSelect={onSelect} isLoading={true} />);

    const button = screen.getByText('Processing...');
    expect(button).toBeDisabled();
  });

  it('shows current plan when plan is selected', () => {
    const onSelect = jest.fn();
    render(<PricingCard plan={mockPlan} onSelect={onSelect} currentPlanId={1} />);

    expect(screen.getByText('Current Plan')).toBeInTheDocument();
  });
});
