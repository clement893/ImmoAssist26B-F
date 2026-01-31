import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useConfirm, useConfirmAction } from '../useConfirm';

describe('useConfirm', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls window.confirm with message string', async () => {
    const { result } = renderHook(() => useConfirm());
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const confirmed = await result.current('Are you sure?');

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure?');
    expect(confirmed).toBe(true);
  });

  it('calls window.confirm with options object', async () => {
    const { result } = renderHook(() => useConfirm());
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const confirmed = await result.current({
      message: 'Delete item?',
      title: 'Confirm',
    });

    expect(confirmSpy).toHaveBeenCalledWith('Delete item?');
    expect(confirmed).toBe(true);
  });

  it('returns false when user cancels', async () => {
    const { result } = renderHook(() => useConfirm());
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const confirmed = await result.current('Are you sure?');

    expect(confirmed).toBe(false);
  });

  it('returns true when user confirms', async () => {
    const { result } = renderHook(() => useConfirm());
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const confirmed = await result.current('Are you sure?');

    expect(confirmed).toBe(true);
  });
});

describe('useConfirmAction', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('executes action when confirmed', async () => {
    const action = vi.fn().mockResolvedValue('result');
    const { result } = renderHook(() => useConfirmAction(action, 'Are you sure?'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const returnValue = await result.current('arg1', 'arg2');

    expect(action).toHaveBeenCalledWith('arg1', 'arg2');
    expect(returnValue).toBe('result');
  });

  it('does not execute action when cancelled', async () => {
    const action = vi.fn();
    const { result } = renderHook(() => useConfirmAction(action, 'Are you sure?'));
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const returnValue = await result.current('arg1');

    expect(action).not.toHaveBeenCalled();
    expect(returnValue).toBeUndefined();
  });

  it('works with options object', async () => {
    const action = vi.fn().mockResolvedValue('result');
    const { result } = renderHook(() =>
      useConfirmAction(action, {
        message: 'Delete?',
        title: 'Confirm',
      })
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await result.current();

    expect(action).toHaveBeenCalled();
  });

  it('preserves action return type', async () => {
    const action = vi.fn().mockResolvedValue(42);
    const { result } = renderHook(() => useConfirmAction(action, 'Confirm?'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const value = await result.current();

    expect(value).toBe(42);
  });
});
