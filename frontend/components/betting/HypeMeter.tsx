'use client';

import { motion } from 'framer-motion';

export default function HypeMeter({ pool, maxPool }: { pool: number; maxPool: number }) {
  const pct = Math.min((pool / maxPool) * 100, 100);
  const level = pct > 80 ? '🔥 INSANE' : pct > 60 ? '🔥 HOT' : pct > 40 ? '⚡ HEATING UP' : pct > 20 ? '💫 BUILDING' : '❄️ COLD';

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs uppercase tracking-wider text-gray-500">Hype Meter</span>
        <span className="text-sm font-bold text-amber-400">{level}</span>
      </div>
      <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, #dc2626, #fbbf24)`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray-500">Pool Size</span>
        <span className="text-sm font-mono font-bold text-white">{pool.toLocaleString()} $APEX</span>
      </div>
    </div>
  );
}
