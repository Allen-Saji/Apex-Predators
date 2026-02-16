'use client';

import { motion } from 'framer-motion';

export default function DamageNumber({
  damage,
  isCrit,
  side,
}: {
  damage: number;
  isCrit: boolean;
  side: 'left' | 'right';
}) {
  return (
    <motion.div
      className="absolute pointer-events-none font-black z-30"
      style={{
        fontSize: isCrit ? '3rem' : '2rem',
        color: isCrit ? '#facc15' : '#ef4444',
        textShadow: '0 0 20px rgba(0,0,0,.9)',
        [side === 'left' ? 'left' : 'right']: '20%',
        top: '10%',
      }}
      initial={{ opacity: 1, y: 0, scale: isCrit ? 1.5 : 1 }}
      animate={{ opacity: 0, y: -100, scale: isCrit ? 2.2 : 1.3 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >
      -{damage}
    </motion.div>
  );
}
