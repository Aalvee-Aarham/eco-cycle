export function StreakCounter({ streak }) {
  const n = streak ?? 0;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xl">🔥</span>
      <div>
        <p className="text-sm font-semibold text-slate-800 font-mono">
          {n} day{n !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-slate-400">streak</p>
      </div>
    </div>
  );
}
