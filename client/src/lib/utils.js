import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export const cn = (...inputs) => twMerge(clsx(inputs));
export const formatDate = (d) => format(new Date(d), 'MMM d, yyyy HH:mm');
export const truncate = (str, n = 40) => (str?.length > n ? str.slice(0, n) + '…' : str);

/** Resolve image/media URLs from API (relative or absolute). */
export function assetUrl(path) {
  if (!path) return '';
  if (typeof path !== 'string') return '';
  if (path.startsWith('http')) return path;
  const api = import.meta.env.VITE_API_URL || '';
  const base = api.replace(/\/api\/?$/, '') || window.location.origin;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}
