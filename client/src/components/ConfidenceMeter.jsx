import { motion } from 'framer-motion';

export function ConfidenceMeter({ value }) {
  const pct = Math.round((value ?? 0) * 100);
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 72 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex flex-col items-center gap-1">
      <svg width={100} height={100} className="-rotate-90">
        <circle cx={50} cy={50} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={8} />
        <motion.circle
          cx={50}
          cy={50}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold font-mono" style={{ color }}>
          {pct}%
        </span>
        <span className="text-[10px] text-slate-500">confidence</span>
      </div>
    </div>
  );
}
