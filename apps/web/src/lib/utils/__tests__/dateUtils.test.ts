import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatDistanceToNow } from '../dateUtils';

describe('formatDistanceToNow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for dates less than 60 seconds ago', () => {
    const date = new Date('2024-01-15T11:59:30Z');
    expect(formatDistanceToNow(date)).toBe('just now');
  });

  it('returns minutes ago for dates less than 60 minutes ago', () => {
    const date = new Date('2024-01-15T11:30:00Z');
    expect(formatDistanceToNow(date)).toBe('30 minutes ago');
  });

  it('returns singular minute for 1 minute', () => {
    const date = new Date('2024-01-15T11:59:00Z');
    expect(formatDistanceToNow(date)).toBe('1 minute ago');
  });

  it('returns hours ago for dates less than 24 hours ago', () => {
    const date = new Date('2024-01-15T08:00:00Z');
    expect(formatDistanceToNow(date)).toBe('4 hours ago');
  });

  it('returns singular hour for 1 hour', () => {
    const date = new Date('2024-01-15T11:00:00Z');
    expect(formatDistanceToNow(date)).toBe('1 hour ago');
  });

  it('returns days ago for dates less than 7 days ago', () => {
    const date = new Date('2024-01-13T12:00:00Z');
    expect(formatDistanceToNow(date)).toBe('2 days ago');
  });

  it('returns singular day for 1 day', () => {
    const date = new Date('2024-01-14T12:00:00Z');
    expect(formatDistanceToNow(date)).toBe('1 day ago');
  });

  it('returns locale date string for dates 7 or more days ago', () => {
    const date = new Date('2024-01-01T12:00:00Z');
    const result = formatDistanceToNow(date);
    expect(result).toBe(date.toLocaleDateString());
  });

  it('handles edge case of exactly 60 seconds', () => {
    const date = new Date('2024-01-15T11:59:00Z');
    expect(formatDistanceToNow(date)).toBe('1 minute ago');
  });

  it('handles edge case of exactly 60 minutes', () => {
    const date = new Date('2024-01-15T11:00:00Z');
    expect(formatDistanceToNow(date)).toBe('1 hour ago');
  });

  it('handles edge case of exactly 24 hours', () => {
    const date = new Date('2024-01-14T12:00:00Z');
    expect(formatDistanceToNow(date)).toBe('1 day ago');
  });

  it('handles edge case of exactly 7 days', () => {
    const date = new Date('2024-01-08T12:00:00Z');
    const result = formatDistanceToNow(date);
    expect(result).toBe(date.toLocaleDateString());
  });
});
