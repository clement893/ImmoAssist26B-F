/**
 * MultiSelect Component Tests
 *
 * Comprehensive test suite for the MultiSelect component covering:
 * - Rendering with different props
 * - Option selection and deselection
 * - Multiple selections
 * - Search functionality
 * - Grouped options
 * - Max selected limit
 * - Tag removal
 * - Edge cases
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import MultiSelect from '../MultiSelect';
import type { MultiSelectOption } from '../MultiSelect';

const mockOptions: MultiSelectOption[] = [
  { label: 'Option 1', value: 'opt1' },
  { label: 'Option 2', value: 'opt2' },
  { label: 'Option 3', value: 'opt3' },
  { label: 'Disabled Option', value: 'opt4', disabled: true },
];

const groupedOptions: MultiSelectOption[] = [
  { label: 'Apple', value: 'apple', group: 'Fruits' },
  { label: 'Banana', value: 'banana', group: 'Fruits' },
  { label: 'Carrot', value: 'carrot', group: 'Vegetables' },
  { label: 'Potato', value: 'potato', group: 'Vegetables' },
];

describe('MultiSelect Component', () => {
  const defaultProps = {
    options: mockOptions,
    value: [],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders multi-select with label', () => {
      render(<MultiSelect {...defaultProps} label="Select Options" />);
      expect(screen.getByText('Select Options')).toBeInTheDocument();
    });

    it('renders without label', () => {
      const { container } = render(<MultiSelect {...defaultProps} />);
      const input = container.querySelector('input[type="text"]');
      expect(input).toBeInTheDocument();
    });

    it('displays placeholder when no options selected', () => {
      render(<MultiSelect {...defaultProps} placeholder="Choose options" />);
      const input = screen.getByPlaceholderText('Choose options');
      expect(input).toBeInTheDocument();
    });

    it('hides placeholder when options are selected', () => {
      render(<MultiSelect {...defaultProps} value={['opt1']} placeholder="Choose options" />);
      const input = screen.queryByPlaceholderText('Choose options');
      expect(input).not.toBeInTheDocument();
    });
  });

  describe('Option Selection', () => {
    it('opens dropdown when clicked', async () => {
      render(<MultiSelect {...defaultProps} />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });
    });

    it('selects an option', async () => {
      const handleChange = vi.fn();
      render(<MultiSelect {...defaultProps} onChange={handleChange} />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        const option = screen.getByText('Option 1');
        fireEvent.click(option);
      });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith(['opt1']);
      });
    });

    it('displays selected option as tag', async () => {
      const handleChange = vi.fn();
      render(<MultiSelect {...defaultProps} onChange={handleChange} />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        const option = screen.getByText('Option 1');
        fireEvent.click(option);
      });

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });
    });

    it('deselects an option when clicked again', async () => {
      const handleChange = vi.fn();
      render(<MultiSelect {...defaultProps} value={['opt1']} onChange={handleChange} />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        const option = screen.getByText('Option 1');
        fireEvent.click(option);
      });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('Multiple Selections', () => {
    it('selects multiple options', async () => {
      const handleChange = vi.fn();
      render(<MultiSelect {...defaultProps} onChange={handleChange} />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Option 1'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Option 2'));
      });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith(['opt1', 'opt2']);
      });
    });

    it('displays multiple selected options as tags', () => {
      render(<MultiSelect {...defaultProps} value={['opt1', 'opt2', 'opt3']} />);
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });
  });

  describe('Tag Removal', () => {
    it('removes tag when remove button is clicked', async () => {
      const handleChange = vi.fn();
      render(<MultiSelect {...defaultProps} value={['opt1']} onChange={handleChange} />);

      const removeButton = screen.getByLabelText('Remove Option 1');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith([]);
      });
    });

    it('removes correct tag when multiple tags exist', async () => {
      const handleChange = vi.fn();
      render(<MultiSelect {...defaultProps} value={['opt1', 'opt2']} onChange={handleChange} />);

      const removeButton = screen.getByLabelText('Remove Option 1');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith(['opt2']);
      });
    });
  });

  describe('Clear All', () => {
    it('shows clear button when options are selected', () => {
      render(<MultiSelect {...defaultProps} value={['opt1']} clearable />);
      const clearButton = screen.getByLabelText('Clear selection');
      expect(clearButton).toBeInTheDocument();
    });

    it('hides clear button when no options are selected', () => {
      render(<MultiSelect {...defaultProps} value={[]} clearable />);
      const clearButton = screen.queryByLabelText('Clear selection');
      expect(clearButton).not.toBeInTheDocument();
    });

    it('clears all selections when clear button is clicked', async () => {
      const handleChange = vi.fn();
      render(
        <MultiSelect {...defaultProps} value={['opt1', 'opt2']} onChange={handleChange} clearable />
      );

      const clearButton = screen.getByLabelText('Clear selection');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith([]);
      });
    });

    it('hides clear button when clearable is false', () => {
      render(<MultiSelect {...defaultProps} value={['opt1']} clearable={false} />);
      const clearButton = screen.queryByLabelText('Clear selection');
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters options based on search input', async () => {
      render(<MultiSelect {...defaultProps} searchable />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'Option 1' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Option 3')).not.toBeInTheDocument();
      });
    });

    it('shows no results message when search has no matches', async () => {
      render(<MultiSelect {...defaultProps} searchable />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'NonExistent' } });
      });

      await waitFor(() => {
        expect(screen.getByText(/Aucune option trouvée/i)).toBeInTheDocument();
      });
    });

    it('does not filter when searchable is false', async () => {
      render(<MultiSelect {...defaultProps} searchable={false} />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.getByText('Option 2')).toBeInTheDocument();
        expect(screen.getByText('Option 3')).toBeInTheDocument();
      });
    });

    it('hides search input when maxSelected is reached', async () => {
      render(<MultiSelect {...defaultProps} maxSelected={1} value={['opt1']} />);
      const input = screen.queryByRole('textbox');
      expect(input).not.toBeInTheDocument();
    });
  });

  describe('Grouped Options', () => {
    it('displays grouped options with group headers', async () => {
      render(<MultiSelect options={groupedOptions} value={[]} onChange={vi.fn()} />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        expect(screen.getByText('FRUITS')).toBeInTheDocument();
        expect(screen.getByText('VEGETABLES')).toBeInTheDocument();
      });
    });

    it('does not show group header when only one group exists', async () => {
      const singleGroupOptions = [
        { label: 'Apple', value: 'apple', group: 'Fruits' },
        { label: 'Banana', value: 'banana', group: 'Fruits' },
      ];
      render(<MultiSelect options={singleGroupOptions} value={[]} onChange={vi.fn()} />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        expect(screen.queryByText('FRUITS')).not.toBeInTheDocument();
      });
    });
  });

  describe('Max Selected Limit', () => {
    it('prevents selection when maxSelected is reached', async () => {
      const handleChange = vi.fn();
      render(
        <MultiSelect {...defaultProps} value={['opt1']} maxSelected={1} onChange={handleChange} />
      );
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        const option2 = screen.getByText('Option 2');
        expect(option2.closest('button')).toBeDisabled();
      });
    });

    it('allows deselection when maxSelected is reached', async () => {
      const handleChange = vi.fn();
      render(
        <MultiSelect {...defaultProps} value={['opt1']} maxSelected={1} onChange={handleChange} />
      );
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        const option1 = screen.getByText('Option 1');
        fireEvent.click(option1);
      });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('Disabled Options', () => {
    it('disables disabled options', async () => {
      render(<MultiSelect {...defaultProps} />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        const disabledOption = screen.getByText('Disabled Option');
        expect(disabledOption.closest('button')).toBeDisabled();
      });
    });

    it('does not select disabled options', async () => {
      const handleChange = vi.fn();
      render(<MultiSelect {...defaultProps} onChange={handleChange} />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        const disabledOption = screen.getByText('Disabled Option');
        fireEvent.click(disabledOption);
      });

      await waitFor(() => {
        expect(handleChange).not.toHaveBeenCalled();
      });
    });
  });

  describe('Disabled State', () => {
    it('disables component when disabled prop is true', () => {
      render(<MultiSelect {...defaultProps} disabled />);
      const input = screen.queryByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('hides remove buttons when disabled', () => {
      render(<MultiSelect {...defaultProps} value={['opt1']} disabled />);
      const removeButton = screen.queryByLabelText('Remove Option 1');
      expect(removeButton).not.toBeInTheDocument();
    });

    it('does not open dropdown when disabled', async () => {
      render(<MultiSelect {...defaultProps} disabled />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Click Outside', () => {
    it('closes dropdown when clicking outside', async () => {
      render(<MultiSelect {...defaultProps} />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
      });
    });

    it('clears search when clicking outside', async () => {
      render(<MultiSelect {...defaultProps} searchable />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'test' } });
      });

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        expect(input).toHaveValue('');
      });
    });
  });

  describe('Error and Helper Text', () => {
    it('displays error message', () => {
      render(<MultiSelect {...defaultProps} error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('displays helper text when no error', () => {
      render(<MultiSelect {...defaultProps} helperText="Select multiple options" />);
      expect(screen.getByText('Select multiple options')).toBeInTheDocument();
    });

    it('prioritizes error over helper text', () => {
      render(<MultiSelect {...defaultProps} error="Error" helperText="Helper" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    });

    it('applies error styling', () => {
      const { container } = render(<MultiSelect {...defaultProps} error="Error" />);
      const inputContainer = container.querySelector('.border-error-500');
      expect(inputContainer).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('handles fullWidth prop', () => {
      const { container } = render(<MultiSelect {...defaultProps} fullWidth />);
      const wrapper = container.querySelector('.w-full');
      expect(wrapper).toBeInTheDocument();
    });

    it('handles custom className', () => {
      const { container } = render(<MultiSelect {...defaultProps} className="custom-class" />);
      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<MultiSelect {...defaultProps} label="Options" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has role="listbox" on dropdown', async () => {
      render(<MultiSelect {...defaultProps} />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        expect(listbox).toBeInTheDocument();
      });
    });

    it('has role="option" on options', async () => {
      render(<MultiSelect {...defaultProps} />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options.length).toBeGreaterThan(0);
      });
    });

    it('has aria-selected on selected options', async () => {
      render(<MultiSelect {...defaultProps} value={['opt1']} />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      await waitFor(() => {
        const option = screen.getByText('Option 1').closest('button');
        expect(option).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('has aria-label on remove buttons', () => {
      render(<MultiSelect {...defaultProps} value={['opt1']} />);
      const removeButton = screen.getByLabelText('Remove Option 1');
      expect(removeButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty options array', () => {
      render(<MultiSelect options={[]} value={[]} onChange={vi.fn()} />);
      const container = screen.getByRole('textbox').closest('div');

      fireEvent.click(container!);

      expect(screen.getByText(/Aucune option trouvée/i)).toBeInTheDocument();
    });

    it('handles empty value array', () => {
      render(<MultiSelect {...defaultProps} value={[]} />);
      const tags = screen.queryAllByText(/Option \d/);
      expect(tags.length).toBe(0);
    });

    it('handles value with non-existent option', () => {
      render(<MultiSelect {...defaultProps} value={['nonexistent']} />);
      // Component should handle gracefully
      const tags = screen.queryAllByText(/Option \d/);
      expect(tags.length).toBe(0);
    });
  });
});
