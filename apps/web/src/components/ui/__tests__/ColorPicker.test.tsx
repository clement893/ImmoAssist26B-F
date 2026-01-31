/**
 * ColorPicker Component Tests
 *
 * Comprehensive test suite for the ColorPicker component covering:
 * - Rendering with different props
 * - Color selection from presets
 * - Custom color input
 * - Controlled and uncontrolled modes
 * - User interactions
 * - Edge cases
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import ColorPicker from '../ColorPicker';

describe('ColorPicker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders color picker with label', () => {
      render(<ColorPicker label="Select Color" />);
      expect(screen.getByText('Select Color')).toBeInTheDocument();
    });

    it('renders without label', () => {
      const { container } = render(<ColorPicker />);
      const button = container.querySelector('button[type="button"]');
      expect(button).toBeInTheDocument();
    });

    it('renders color preview button', () => {
      const { container } = render(<ColorPicker value="#FF0000" />);
      const button = container.querySelector('button[type="button"]');
      expect(button).toBeInTheDocument();
      expect(button).toHaveStyle({ backgroundColor: '#FF0000' });
    });

    it('renders color input by default', () => {
      render(<ColorPicker />);
      const input = screen.getByPlaceholderText('#000000');
      expect(input).toBeInTheDocument();
    });

    it('hides color input when showInput is false', () => {
      render(<ColorPicker showInput={false} />);
      const input = screen.queryByPlaceholderText('#000000');
      expect(input).not.toBeInTheDocument();
    });
  });

  describe('Controlled Mode', () => {
    it('uses controlled value', () => {
      render(<ColorPicker value="#FF5733" onChange={vi.fn()} />);
      const input = screen.getByDisplayValue('#FF5733');
      expect(input).toBeInTheDocument();
    });

    it('calls onChange when color changes', async () => {
      const handleChange = vi.fn();
      render(<ColorPicker value="#000000" onChange={handleChange} />);
      const input = screen.getByDisplayValue('#000000');

      fireEvent.change(input, { target: { value: '#FF0000' } });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('#FF0000');
      });
    });
  });

  describe('Uncontrolled Mode', () => {
    it('uses defaultValue', () => {
      render(<ColorPicker defaultValue="#00FF00" />);
      const input = screen.getByDisplayValue('#00FF00');
      expect(input).toBeInTheDocument();
    });

    it('updates internal state on change', async () => {
      render(<ColorPicker defaultValue="#000000" />);
      const input = screen.getByDisplayValue('#000000');

      fireEvent.change(input, { target: { value: '#0000FF' } });

      await waitFor(() => {
        expect(input).toHaveValue('#0000FF');
      });
    });
  });

  describe('Preset Colors', () => {
    it('displays default preset colors', async () => {
      const { container } = render(<ColorPicker />);
      const button = container.querySelector('button[type="button"]');

      fireEvent.click(button!);

      await waitFor(() => {
        expect(screen.getByLabelText(/Sélectionner #000000/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Sélectionner #FFFFFF/i)).toBeInTheDocument();
      });
    });

    it('displays custom preset colors', async () => {
      const customColors = ['#FF0000', '#00FF00', '#0000FF'];
      const { container } = render(<ColorPicker presetColors={customColors} />);
      const button = container.querySelector('button[type="button"]');

      fireEvent.click(button!);

      await waitFor(() => {
        expect(screen.getByLabelText(/Sélectionner #FF0000/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Sélectionner #00FF00/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Sélectionner #0000FF/i)).toBeInTheDocument();
      });
    });

    it('selects preset color on click', async () => {
      const handleChange = vi.fn();
      const { container } = render(<ColorPicker onChange={handleChange} />);
      const button = container.querySelector('button[type="button"]');

      fireEvent.click(button!);

      await waitFor(() => {
        const colorButton = screen.getByLabelText(/Sélectionner #EF4444/i);
        fireEvent.click(colorButton);
      });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('#EF4444');
      });
    });

    it('shows checkmark on selected preset color', async () => {
      const { container } = render(<ColorPicker value="#EF4444" />);
      const button = container.querySelector('button[type="button"]');

      fireEvent.click(button!);

      await waitFor(() => {
        const colorButton = screen.getByLabelText(/Sélectionner #EF4444/i);
        const checkIcon = colorButton.querySelector('svg');
        expect(checkIcon).toBeInTheDocument();
      });
    });

    it('closes picker after selecting preset color', async () => {
      const { container } = render(<ColorPicker />);
      const button = container.querySelector('button[type="button"]');

      fireEvent.click(button!);

      await waitFor(() => {
        const colorButton = screen.getByLabelText(/Sélectionner #EF4444/i);
        fireEvent.click(colorButton);
      });

      await waitFor(() => {
        expect(screen.queryByLabelText(/Sélectionner #000000/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Color Input', () => {
    it('updates color via text input', async () => {
      const handleChange = vi.fn();
      render(<ColorPicker value="#000000" onChange={handleChange} />);
      const input = screen.getByDisplayValue('#000000');

      fireEvent.change(input, { target: { value: '#ABCDEF' } });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('#ABCDEF');
      });
    });

    it('updates preview button color when input changes', async () => {
      const { container } = render(<ColorPicker value="#000000" />);
      const input = screen.getByDisplayValue('#000000');
      const button = container.querySelector('button[type="button"]');

      fireEvent.change(input, { target: { value: '#FF0000' } });

      await waitFor(() => {
        expect(button).toHaveStyle({ backgroundColor: '#FF0000' });
      });
    });
  });

  describe('Native Color Picker', () => {
    it('renders native color picker when showInput is true', async () => {
      const { container } = render(<ColorPicker showInput={true} />);
      const button = container.querySelector('button[type="button"]');

      fireEvent.click(button!);

      await waitFor(() => {
        const colorInput = container.querySelector('input[type="color"]');
        expect(colorInput).toBeInTheDocument();
      });
    });

    it('does not render native color picker when showInput is false', async () => {
      const { container } = render(<ColorPicker showInput={false} />);
      const button = container.querySelector('button[type="button"]');

      fireEvent.click(button!);

      await waitFor(() => {
        const colorInput = container.querySelector('input[type="color"]');
        expect(colorInput).not.toBeInTheDocument();
      });
    });

    it('updates color via native color picker', async () => {
      const handleChange = vi.fn();
      const { container } = render(
        <ColorPicker value="#000000" onChange={handleChange} showInput={true} />
      );
      const button = container.querySelector('button[type="button"]');

      fireEvent.click(button!);

      await waitFor(() => {
        const colorInput = container.querySelector('input[type="color"]') as HTMLInputElement;
        fireEvent.change(colorInput, { target: { value: '#FF5733' } });
      });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('#FF5733');
      });
    });
  });

  describe('Picker Toggle', () => {
    it('opens picker when button is clicked', async () => {
      const { container } = render(<ColorPicker />);
      const button = container.querySelector('button[type="button"]');

      fireEvent.click(button!);

      await waitFor(() => {
        expect(screen.getByLabelText(/Sélectionner/i)).toBeInTheDocument();
      });
    });

    it('closes picker when button is clicked again', async () => {
      const { container } = render(<ColorPicker />);
      const button = container.querySelector('button[type="button"]');

      fireEvent.click(button!);

      await waitFor(() => {
        expect(screen.getByLabelText(/Sélectionner/i)).toBeInTheDocument();
      });

      fireEvent.click(button!);

      await waitFor(() => {
        expect(screen.queryByLabelText(/Sélectionner/i)).not.toBeInTheDocument();
      });
    });

    it('sets aria-expanded when picker is open', async () => {
      const { container } = render(<ColorPicker />);
      const button = container.querySelector('button[type="button"]') as HTMLButtonElement;

      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('Click Outside', () => {
    it('closes picker when clicking outside', async () => {
      const { container } = render(<ColorPicker />);
      const button = container.querySelector('button[type="button"]');

      fireEvent.click(button!);

      await waitFor(() => {
        expect(screen.getByLabelText(/Sélectionner/i)).toBeInTheDocument();
      });

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByLabelText(/Sélectionner/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Disabled State', () => {
    it('disables button when disabled prop is true', () => {
      const { container } = render(<ColorPicker disabled />);
      const button = container.querySelector('button[type="button"]') as HTMLButtonElement;
      expect(button).toBeDisabled();
    });

    it('disables input when disabled prop is true', () => {
      render(<ColorPicker disabled />);
      const input = screen.getByPlaceholderText('#000000');
      expect(input).toBeDisabled();
    });

    it('does not open picker when disabled', async () => {
      const { container } = render(<ColorPicker disabled />);
      const button = container.querySelector('button[type="button"]');

      fireEvent.click(button!);

      await waitFor(() => {
        expect(screen.queryByLabelText(/Sélectionner/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Props Handling', () => {
    it('handles fullWidth prop', () => {
      const { container } = render(<ColorPicker fullWidth />);
      const wrapper = container.querySelector('.w-full');
      expect(wrapper).toBeInTheDocument();
    });

    it('handles custom className', () => {
      const { container } = render(<ColorPicker className="custom-class" />);
      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Color Case Handling', () => {
    it('handles lowercase color values', () => {
      render(<ColorPicker value="#ff0000" />);
      const input = screen.getByDisplayValue('#ff0000');
      expect(input).toBeInTheDocument();
    });

    it('handles uppercase color values', () => {
      render(<ColorPicker value="#FF0000" />);
      const input = screen.getByDisplayValue('#FF0000');
      expect(input).toBeInTheDocument();
    });

    it('matches color case-insensitively for preset selection', async () => {
      const { container } = render(<ColorPicker value="#ef4444" />);
      const button = container.querySelector('button[type="button"]');

      fireEvent.click(button!);

      await waitFor(() => {
        const colorButton = screen.getByLabelText(/Sélectionner #EF4444/i);
        const checkIcon = colorButton.querySelector('svg');
        expect(checkIcon).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<ColorPicker label="Color" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has aria-label on color button', () => {
      const { container } = render(<ColorPicker label="Select Color" />);
      const button = container.querySelector('button[type="button"]') as HTMLButtonElement;
      expect(button).toHaveAttribute('aria-label');
    });

    it('has aria-label on preset color buttons', async () => {
      const { container } = render(<ColorPicker />);
      const button = container.querySelector('button[type="button"]');

      fireEvent.click(button!);

      await waitFor(() => {
        const colorButton = screen.getByLabelText(/Sélectionner/i);
        expect(colorButton).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty value', () => {
      render(<ColorPicker value="" />);
      const input = screen.getByPlaceholderText('#000000');
      expect(input).toHaveValue('');
    });

    it('handles invalid color value', () => {
      render(<ColorPicker value="invalid" />);
      const input = screen.getByPlaceholderText('#000000');
      // Component should handle invalid input gracefully
      expect(input).toHaveValue('invalid');
    });

    it('handles short hex color (#RGB)', () => {
      render(<ColorPicker value="#F00" />);
      const input = screen.getByDisplayValue('#F00');
      expect(input).toBeInTheDocument();
    });

    it('handles long hex color (#RRGGBB)', () => {
      render(<ColorPicker value="#FF0000" />);
      const input = screen.getByDisplayValue('#FF0000');
      expect(input).toBeInTheDocument();
    });
  });
});
