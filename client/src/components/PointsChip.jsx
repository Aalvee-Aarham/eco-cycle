export function PointsChip({ points }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-eco-100 px-2.5 py-0.5 text-xs font-semibold text-eco-700 font-mono">
      +{points} pts
    </span>
  );
}
