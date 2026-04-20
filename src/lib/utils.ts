import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date) {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? '';
}

export function initials(fullName: string) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function todayISODate() {
  // YYYY-MM-DD in local TZ — matches what Postgres's `date` column expects.
  const d = new Date();
  const tzOffsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return 'Something went wrong.';
}
