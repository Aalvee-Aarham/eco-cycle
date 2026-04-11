import { CATEGORY_META } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function CategoryBadge({ category, className }) {
  const meta = CATEGORY_META[category] ?? {
    label: category,
    color: 'bg-slate-100 text-slate-600',
    icon: '?',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        meta.color,
        className
      )}
    >
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
}
