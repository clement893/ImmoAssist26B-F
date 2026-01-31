/**
 * TimePicker Component Tests
 *
 * Comprehensive test suite for the TimePicker component covering:
 * - Rendering with different props
 * - Time selection (12h and 24h formats)
 * - Controlled and uncontrolled modes
 * - User interactions
 * - Edge cases
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import TimePicker from '../TimePicker';

describe('TimePicker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders time picker with label', () => {
      render(<TimePicker label="Select Time" />);
      expect(screen.getByLabelText('Select Time')).toBeInTheDocument();
    });

    it('renders without label', () => {
      const { container } = render(<TimePicker />);
      const input = container.querySelector('input[type="text"]');
      expect(input).toBeInTheDocument();
    });

    it('renders clock icon', () => {
      const { container } = render(<TimePicker />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('shows placeholder for 24h format', () => {
      render(<TimePicker format="24h" />);
      const input = screen.getByPlaceholderText('12:00');
      expect(input).toBeInTheDocument();
    });

    it('shows placeholder for 12h format', () => {
      render(<TimePicker format="12h" />);
      const input = screen.getByPlaceholderText('12:00 PM');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Controlled Mode', () => {
    it('uses controlled value', () => {
      render(<TimePicker value="14:30" onChange={vi.fn()} />);
      const input = screen.getByDisplayValue('14:30');
      expect(input).toBeInTheDocument();
    });

    it('calls onChange when time changes', async () => {
      const handleChange = vi.fn();
      render(<TimePicker value="12:00" onChange={handleChange} />);
      const input = screen.getByDisplayValue('12:00');

      fireEvent.change(input, { target: { value: '15:30' } });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('15:30');
      });
    });
  });

  describe('Uncontrolled Mode', () => {
    it('uses defaultValue', () => {
      render(<TimePicker defaultValue="09:15" />);
      const input = screen.getByDisplayValue('09:15');
      expect(input).toBeInTheDocument();
    });

    it('updates internal state on change', async () => {
      render(<TimePicker defaultValue="12:00" />);
      const input = screen.getByDisplayValue('12:00');

      fireEvent.change(input, { target: { value: '18:45' } });

      await waitFor(() => {
        expect(input).toHaveValue('18:45');
      });
    });
  });

  describe('Time Format - 24h', () => {
    it('displays time in 24h format', () => {
      render(<TimePicker format="24h" value="14:30" />);
      const input = screen.getByDisplayValue('14:30');
      expect(input).toBeInTheDocument();
    });

    it('opens picker with 24 hours', async () => {
      render(<TimePicker format="24h" />);
      const input = screen.getByPlaceholderText('12:00');

      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('00')).toBeInTheDocument();
        expect(screen.getByText('23')).toBeInTheDocument();
      });
    });

    it('does not show AM/PM buttons in 24h format', async () => {
      render(<TimePicker format="24h" />);
      const input = screen.getByPlaceholderText('12:00');

      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.queryByText('AM')).not.toBeInTheDocument();
        expect(screen.queryByText('PM')).not.toBeInTheDocument();
      });
    });
  });

  describe('Time Format - 12h', () => {
    it('displays time in 12h format', () => {
      render(<TimePicker format="12h" value="02:30 PM" />);
      const input = screen.getByDisplayValue('02:30 PM');
      expect(input).toBeInTheDocument();
    });

    it('opens picker with 12 hours', async () => {
      render(<TimePicker format="12h" />);
      const input = screen.getByPlaceholderText('12:00 PM');

      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
      });
    });

    it('shows AM/PM buttons in 12h format', async () => {
      render(<TimePicker format="12h" />);
      const input = screen.getByPlaceholderText('12:00 PM');

      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('AM')).toBeInTheDocument();
        expect(screen.getByText('PM')).toBeInTheDocument();
      });
    });
  });

  describe('Time Selection', () => {
    it('selects hour from picker', async () => {
      const handleChange = vi.fn();
      render(<TimePicker format="24h" onChange={handleChange} />);
      const input = screen.getByPlaceholderText('12:00');

      fireEvent.focus(input);

      await waitFor(() => {
        const hoursSection = screen.getByText('Heures').closest('div')?.parentElement;
        const hourButtons = hoursSection?.querySelectorAll('button');
        const hour15Button = Array.from(hourButtons || []).find((btn) => btn.textContent === '15');
        expect(hour15Button).toBeInTheDocument();
        if (hour15Button) fireEvent.click(hour15Button);
      });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalled();
      });
    });

    it('selects minute from picker', async () => {
      const handleChange = vi.fn();
      render(<TimePicker format="24h" onChange={handleChange} />);
      const input = screen.getByPlaceholderText('12:00');

      fireEvent.focus(input);

      await waitFor(() => {
        const minutesSection = screen.getByText('Minutes').closest('div')?.parentElement;
        const minuteButtons = minutesSection?.querySelectorAll('button');
        const minute30Button = Array.from(minuteButtons || []).find(
          (btn) => btn.textContent === '30'
        );
        expect(minute30Button).toBeInTheDocument();
        if (minute30Button) fireEvent.click(minute30Button);
      });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalled();
      });
    });

    it('closes picker after selection', async () => {
      render(<TimePicker format="24h" />);
      const input = screen.getByPlaceholderText('12:00');

      fireEvent.focus(input);

      await waitFor(() => {
        const hourButton = screen.getByText('15');
        fireEvent.click(hourButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Heures')).not.toBeInTheDocument();
      });
    });
  });

  describe('12h Format Interactions', () => {
    it('switches to AM period', async () => {
      const handleChange = vi.fn();
      render(<TimePicker format="12h" value="02:30 PM" onChange={handleChange} />);
      const input = screen.getByDisplayValue('02:30 PM');

      fireEvent.focus(input);

      await waitFor(() => {
        const amButton = screen.getByText('AM');
        fireEvent.click(amButton);
      });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalled();
        const callValue = handleChange.mock.calls[0][0];
        expect(callValue).toContain('AM');
      });
    });

    it('switches to PM period', async () => {
      const handleChange = vi.fn();
      render(<TimePicker format="12h" value="02:30 AM" onChange={handleChange} />);
      const input = screen.getByDisplayValue('02:30 AM');

      fireEvent.focus(input);

      await waitFor(() => {
        const pmButton = screen.getByText('PM');
        fireEvent.click(pmButton);
      });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalled();
        const callValue = handleChange.mock.calls[0][0];
        expect(callValue).toContain('PM');
      });
    });
  });

  describe('Click Outside', () => {
    it('closes picker when clicking outside', async () => {
      render(<TimePicker format="24h" />);
      const input = screen.getByPlaceholderText('12:00');

      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('Heures')).toBeInTheDocument();
      });

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Heures')).not.toBeInTheDocument();
      });
    });
  });

  describe('Disabled State', () => {
    it('disables input when disabled prop is true', () => {
      render(<TimePicker disabled />);
      const input = screen.getByPlaceholderText('12:00');
      expect(input).toBeDisabled();
    });

    it('does not open picker when disabled', async () => {
      render(<TimePicker disabled format="24h" />);
      const input = screen.getByPlaceholderText('12:00');

      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.queryByText('Heures')).not.toBeInTheDocument();
      });
    });
  });

  describe('Props Handling', () => {
    it('handles fullWidth prop', () => {
      const { container } = render(<TimePicker fullWidth />);
      const wrapper = container.querySelector('.w-full');
      expect(wrapper).toBeInTheDocument();
    });

    it('handles custom className', () => {
      const { container } = render(<TimePicker className="custom-class" />);
      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Time Parsing', () => {
    it('parses valid 24h time string', async () => {
      render(<TimePicker format="24h" value="14:30" />);
      const input = screen.getByDisplayValue('14:30');
      expect(input).toBeInTheDocument();
    });

    it('parses valid 12h time string', async () => {
      render(<TimePicker format="12h" value="02:30 PM" />);
      const input = screen.getByDisplayValue('02:30 PM');
      expect(input).toBeInTheDocument();
    });

    it('handles invalid time string gracefully', () => {
      render(<TimePicker format="24h" value="invalid" />);
      const input = screen.getByPlaceholderText('12:00');
      // Component should handle invalid input gracefully
      expect(input).toBeInTheDocument();
    });
  });

  describe('Minutes Filtering', () => {
    it('shows only minutes divisible by 5', async () => {
      render(<TimePicker format="24h" />);
      const input = screen.getByPlaceholderText('12:00');

      fireEvent.focus(input);

      await waitFor(() => {
        const minutesSection = screen.getByText('Minutes').closest('div')?.parentElement;
        const minuteButtons = minutesSection?.querySelectorAll('button');
        const minuteTexts = Array.from(minuteButtons || []).map((btn) => btn.textContent);

        expect(minuteTexts).toContain('00');
        expect(minuteTexts).toContain('05');
        expect(minuteTexts).toContain('30');
        expect(minuteTexts).toContain('55');
        // Should not show minutes not divisible by 5
        expect(minuteTexts).not.toContain('01');
        expect(minuteTexts).not.toContain('03');
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<TimePicker label="Time" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('associates label with input', () => {
      render(<TimePicker label="Select Time" />);
      const input = screen.getByLabelText('Select Time');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty value', () => {
      render(<TimePicker value="" />);
      const input = screen.getByPlaceholderText('12:00');
      expect(input).toHaveValue('');
    });

    it('handles midnight in 24h format', () => {
      render(<TimePicker format="24h" value="00:00" />);
      const input = screen.getByDisplayValue('00:00');
      expect(input).toBeInTheDocument();
    });

    it('handles midnight in 12h format', () => {
      render(<TimePicker format="12h" value="12:00 AM" />);
      const input = screen.getByDisplayValue('12:00 AM');
      expect(input).toBeInTheDocument();
    });

    it('handles noon in 12h format', () => {
      render(<TimePicker format="12h" value="12:00 PM" />);
      const input = screen.getByDisplayValue('12:00 PM');
      expect(input).toBeInTheDocument();
    });
  });
});
