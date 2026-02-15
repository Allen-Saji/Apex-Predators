'use client';

import { motion } from 'framer-motion';
import { hpColor } from '@/lib/utils';

export default function HealthBar({ hp, maxHp, reverse }: { hp: number; maxHp: number; reverse?: boolean }) {
  const pct = (hp / maxHp) * 100;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-mono text-gray-500 mb-1">
        <span>HP</span>
        <span>{hp}/{maxHp}</span>
      </div>
      <div className={`h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700 ${reverse ? 'flex justify-end' : ''}`}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: hpColor(pct) }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
