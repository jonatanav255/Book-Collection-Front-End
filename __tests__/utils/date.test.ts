import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatDistanceToNow } from '@/utils/date';

describe('formatDistanceToNow', () => {
  const NOW = new Date('2024-06-15T12:00:00Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "unknown" for empty string', () => {
    expect(formatDistanceToNow('')).toBe('unknown');
  });

  it('returns "unknown" for an invalid date string', () => {
    expect(formatDistanceToNow('not-a-date')).toBe('unknown');
  });

  it('returns "just now" for a future date', () => {
    const future = new Date(NOW + 60_000).toISOString();
    expect(formatDistanceToNow(future)).toBe('just now');
  });

  it('returns "just now" for a date less than 1 minute ago', () => {
    const recent = new Date(NOW - 30_000).toISOString(); // 30 seconds ago
    expect(formatDistanceToNow(recent)).toBe('just now');
  });

  it('returns singular "1 min ago" for exactly 1 minute ago', () => {
    const oneMinAgo = new Date(NOW - 60_000).toISOString();
    expect(formatDistanceToNow(oneMinAgo)).toBe('1 min ago');
  });

  it('returns plural "mins ago" for multiple minutes', () => {
    const fiveMinsAgo = new Date(NOW - 5 * 60_000).toISOString();
    expect(formatDistanceToNow(fiveMinsAgo)).toBe('5 mins ago');
  });

  it('returns "1 hour ago" for exactly 1 hour ago', () => {
    const oneHourAgo = new Date(NOW - 3_600_000).toISOString();
    expect(formatDistanceToNow(oneHourAgo)).toBe('1 hour ago');
  });

  it('returns plural "hours ago" for multiple hours', () => {
    const threeHoursAgo = new Date(NOW - 3 * 3_600_000).toISOString();
    expect(formatDistanceToNow(threeHoursAgo)).toBe('3 hours ago');
  });

  it('returns "1 day ago" for exactly 1 day ago', () => {
    const oneDayAgo = new Date(NOW - 86_400_000).toISOString();
    expect(formatDistanceToNow(oneDayAgo)).toBe('1 day ago');
  });

  it('returns "1 week ago" for 7 days ago', () => {
    const oneWeekAgo = new Date(NOW - 7 * 86_400_000).toISOString();
    expect(formatDistanceToNow(oneWeekAgo)).toBe('1 week ago');
  });

  it('returns "2 weeks ago" for 14 days ago', () => {
    const twoWeeksAgo = new Date(NOW - 14 * 86_400_000).toISOString();
    expect(formatDistanceToNow(twoWeeksAgo)).toBe('2 weeks ago');
  });

  it('returns "1 month ago" for 30 days ago', () => {
    const oneMonthAgo = new Date(NOW - 30 * 86_400_000).toISOString();
    expect(formatDistanceToNow(oneMonthAgo)).toBe('1 month ago');
  });

  it('returns "1 year ago" for 365 days ago', () => {
    const oneYearAgo = new Date(NOW - 365 * 86_400_000).toISOString();
    expect(formatDistanceToNow(oneYearAgo)).toBe('1 year ago');
  });

  it('returns plural "years ago" for multiple years', () => {
    const twoYearsAgo = new Date(NOW - 730 * 86_400_000).toISOString();
    expect(formatDistanceToNow(twoYearsAgo)).toBe('2 years ago');
  });
});
