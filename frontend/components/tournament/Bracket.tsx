'use client';

import { motion } from 'framer-motion';
import { TournamentMatch } from '@/lib/types';
import MatchCard from './MatchCard';
import { TrophyIcon } from '@/components/icons';

export default function Bracket({ matches }: { matches: TournamentMatch[] }) {
  const qf = matches.filter((m) => m.round === 'quarterfinal');
  const sf = matches.filter((m) => m.round === 'semifinal');
  const final = matches.filter((m) => m.round === 'final');

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center gap-8 min-w-[800px] justify-center py-8">
        {/* Quarterfinals */}
        <div className="flex flex-col gap-6">
          <div className="text-center text-xs uppercase tracking-wider text-gray-500 mb-2">Quarterfinals</div>
          {qf.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <MatchCard match={m} />
            </motion.div>
          ))}
        </div>

        {/* Connectors */}
        <div className="flex flex-col gap-24 text-gray-700">
          {[0, 1].map((i) => (
            <div key={i} className="text-2xl">→</div>
          ))}
        </div>

        {/* Semifinals */}
        <div className="flex flex-col gap-16">
          <div className="text-center text-xs uppercase tracking-wider text-gray-500 mb-2">Semifinals</div>
          {sf.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <MatchCard match={m} />
            </motion.div>
          ))}
        </div>

        {/* Connector */}
        <div className="text-gray-700 text-2xl">→</div>

        {/* Final */}
        <div className="flex flex-col">
          <div className="text-center text-xs uppercase tracking-wider text-amber-500 mb-2 font-bold flex items-center justify-center gap-1"><TrophyIcon size={16} /> Grand Final</div>
          {final.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <MatchCard match={m} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
