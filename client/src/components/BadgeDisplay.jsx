import { BADGE_META } from '@/lib/constants';

export function BadgeDisplay({ badges = [] }) {
  if (!badges.length) return <p className="text-sm text-slate-400">No badges yet</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((id) => {
        const meta = BADGE_META[id] ?? { label: id, icon: '🏷️' };
        return (
          <div
            key={id}
            title={meta.label}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-eco-50 border border-eco-200 text-xl cursor-default select-none"
          >
            {meta.icon}
          </div>
        );
      })}
    </div>
  );
}
