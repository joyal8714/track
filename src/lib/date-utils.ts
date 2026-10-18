// Date handling utilities for Asia/Kolkata timezone

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns today's date formatted as YYYY-MM-DD in Asia/Kolkata timezone
 */
export function getTodayIST(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Returns current month formatted as YYYY-MM in Asia/Kolkata timezone
 */
export function getCurrentMonthIST(): string {
  const today = getTodayIST();
  return today.substring(0, 7);
}

/**
 * Validates whether a string matches YYYY-MM-DD
 */
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(`${dateStr}T12:00:00Z`);
  return !isNaN(date.getTime());
}

/**
 * Formats YYYY-MM-DD to a clean human-readable date in IST (e.g. "17 Oct 2026")
 */
export function formatISTDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: DEFAULT_TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Formats YYYY-MM to a clean human-readable month (e.g. "October 2026")
 */
export function formatISTMonth(monthStr: string): string {
  try {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: DEFAULT_TIMEZONE,
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return monthStr;
  }
}

/**
 * Extracts month YYYY-MM from YYYY-MM-DD
 */
export function getMonthFromDate(dateStr: string): string {
  return dateStr.substring(0, 7);
}
