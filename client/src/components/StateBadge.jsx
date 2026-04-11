import { STATE_META } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function StateBadge({ state, className }) {
  const meta = STATE_META[state] ?? { label: state, color: 'bg-slate-100 text-slate-600' };
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', meta.color, className)}
    >
      {meta.label}
    </span>
  );
}
