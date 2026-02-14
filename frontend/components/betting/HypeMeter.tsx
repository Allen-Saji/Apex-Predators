'use client';

import { motion } from 'framer-motion';
import { FlameIcon, LightningIcon, SparkIcon, SnowflakeIcon } from '@/components/icons';
import { ReactNode } from 'react';

function getHypeLevel(pct: number): { icon: ReactNode; label: string } {
  if (pct > 80) return { icon: <FlameIcon size={16} className="inline-block" />, label: 'INSANE' };
  if (pct > 60) return { icon: <FlameIcon size={16} className="inline-block" />, label: 'HOT' };
  if (pct > 40) return { icon: <LightningIcon size={16} className="inline-block" />, label: 'HEATING UP' };
  if (pct > 20) return { icon: <SparkIcon size={16} className="inline-block" />, label: 'BUILDING' };
  return { icon: <SnowflakeIcon size={16} className="inline-block" />, label: 'COLD' };
}

export default function HypeMeter({ pool, maxPool }: { pool: number; maxPool: number }) {
  const pct = Math.min((pool / maxPool) * 100, 100);
  const level = getHypeLevel(pct);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs uppercase tracking-wider text-gray-500">Hype Meter</span>
        <span className="text-sm font-bold text-red-400 flex items-center gap-1">{level.icon} {level.label}</span>
      </div>
      <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, #7f1d1d, #dc2626)`,
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
