'use client';

import { motion } from 'framer-motion';
import { fighters } from '@/lib/fighters';
import FighterCard from '@/components/fighters/FighterCard';

export default function FightersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-2">
          The Roster
        </h1>
        <p className="text-gray-400 mb-8">8 apex predators. One champion. Who do you back?</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {fighters.map((f, i) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <FighterCard fighter={f} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
