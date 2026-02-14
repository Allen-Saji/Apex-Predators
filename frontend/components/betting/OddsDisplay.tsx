'use client';

import { motion } from 'framer-motion';
import { Fighter } from '@/lib/types';

export default function OddsDisplay({
  fighter1,
  fighter2,
  pool1,
  pool2,
}: {
  fighter1: Fighter;
  fighter2: Fighter;
  pool1: number;
  pool2: number;
}) {
  const total = pool1 + pool2;
  const pct1 = total > 0 ? Math.round((pool1 / total) * 100) : 50;
  const pct2 = 100 - pct1;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm font-bold mb-2">
        <span style={{ color: fighter1.color }}>{fighter1.name} ({pct1}%)</span>
        <span style={{ color: fighter2.color }}>{fighter2.name} ({pct2}%)</span>
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
        <motion.div
          className="h-full rounded-l-full"
          style={{ backgroundColor: fighter1.color }}
          animate={{ width: `${pct1}%` }}
          transition={{ duration: 0.8 }}
        />
        <motion.div
          className="h-full rounded-r-full"
          style={{ backgroundColor: fighter2.color }}
          animate={{ width: `${pct2}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </div>
  );
}
