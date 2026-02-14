'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export default function StatCard({ label, value, icon }: { label: string; value: string | number; icon?: ReactNode }) {
  return (
    <motion.div
      className="bg-white/5 border border-white/10 rounded-xl p-4 text-center"
      whileHover={{ scale: 1.02, borderColor: 'rgba(220,38,38,0.3)' }}
    >
      {icon && <div className="text-2xl mb-1 flex justify-center">{icon}</div>}
      <div className="text-2xl md:text-3xl font-black text-white">{value}</div>
      <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">{label}</div>
    </motion.div>
  );
}
