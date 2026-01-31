import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagInput from '../TagInput';

describe('TagInput', () => {
  it('renders input', () => {
    render(<TagInput />);
    const input = screen.getByPlaceholderText('Ajouter un tag...');
    expect(input).toBeInTheDocument();
  });

  it('adds tag on Enter key', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<TagInput onChange={handleChange} />);

    const input = screen.getByPlaceholderText('Ajouter un tag...');
    await user.type(input, 'tag1');
    await user.keyboard('{Enter}');

    expect(handleChange).toHaveBeenCalledWith(['tag1']);
  });

  it('adds tag on comma key', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<TagInput onChange={handleChange} />);

    const input = screen.getByPlaceholderText('Ajouter un tag...');
    await user.type(input, 'tag1');
    await user.keyboard(',');

    expect(handleChange).toHaveBeenCalledWith(['tag1']);
  });

  it('adds tag on blur', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<TagInput onChange={handleChange} />);

    const input = screen.getByPlaceholderText('Ajouter un tag...');
    await user.type(input, 'tag1');
    await user.tab();

    expect(handleChange).toHaveBeenCalledWith(['tag1']);
  });

  it('removes tag when X is clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<TagInput value={['tag1']} onChange={handleChange} />);

    const removeButton = screen.getByRole('button', { name: /supprimer tag1/i });
    await user.click(removeButton);

    expect(handleChange).toHaveBeenCalledWith([]);
  });

  it('removes last tag on Backspace when input is empty', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<TagInput value={['tag1']} onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, '{Backspace}');

    expect(handleChange).toHaveBeenCalledWith([]);
  });

  it('does not add duplicate tags when allowDuplicates is false', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<TagInput value={['tag1']} onChange={handleChange} allowDuplicates={false} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'tag1');
    await user.keyboard('{Enter}');

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('allows duplicate tags when allowDuplicates is true', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<TagInput value={['tag1']} onChange={handleChange} allowDuplicates={true} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'tag1');
    await user.keyboard('{Enter}');

    expect(handleChange).toHaveBeenCalledWith(['tag1', 'tag1']);
  });

  it('respects maxTags limit', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<TagInput value={['tag1', 'tag2']} onChange={handleChange} maxTags={2} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'tag3');
    await user.keyboard('{Enter}');

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('validates tags with tagValidator', async () => {
    const handleChange = vi.fn();
    const tagValidator = vi.fn((tag) => tag.length >= 3);
    const user = userEvent.setup();

    render(<TagInput onChange={handleChange} tagValidator={tagValidator} />);

    const input = screen.getByPlaceholderText('Ajouter un tag...');
    await user.type(input, 'ab');
    await user.keyboard('{Enter}');

    expect(tagValidator).toHaveBeenCalledWith('ab');
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('calls onTagAdd when tag is added', async () => {
    const onTagAdd = vi.fn();
    const user = userEvent.setup();

    render(<TagInput onTagAdd={onTagAdd} />);

    const input = screen.getByPlaceholderText('Ajouter un tag...');
    await user.type(input, 'tag1');
    await user.keyboard('{Enter}');

    expect(onTagAdd).toHaveBeenCalledWith('tag1');
  });

  it('calls onTagRemove when tag is removed', async () => {
    const onTagRemove = vi.fn();
    const user = userEvent.setup();

    render(<TagInput value={['tag1']} onTagRemove={onTagRemove} />);

    const removeButton = screen.getByRole('button', { name: /supprimer tag1/i });
    await user.click(removeButton);

    expect(onTagRemove).toHaveBeenCalledWith('tag1');
  });

  it('renders existing tags', () => {
    render(<TagInput value={['tag1', 'tag2']} />);
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
  });

  it('applies custom placeholder', () => {
    render(<TagInput placeholder="Add tags..." />);
    expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
  });
});
