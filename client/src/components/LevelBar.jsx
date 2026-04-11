import { Progress } from '@/components/ui/Progress';

export function LevelBar({ totalPoints = 0 }) {
  const level = Math.min(10, Math.floor(totalPoints / 100) + 1);
  const pointsInLevel = totalPoints % 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>Level {level}</span>
        <span className="font-mono">
          {pointsInLevel}/100 XP
        </span>
      </div>
      <Progress value={pointsInLevel} className="h-2" />
    </div>
  );
}
