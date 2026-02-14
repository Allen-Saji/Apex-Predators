'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TournamentMatch } from '@/lib/types';
import { getFighter } from '@/lib/fighters';

export default function MatchCard({ match }: { match: TournamentMatch }) {
  const f1 = match.fighter1Id ? getFighter(match.fighter1Id) : null;
  const f2 = match.fighter2Id ? getFighter(match.fighter2Id) : null;
  const isComplete = !!match.winnerId;
  const isUpcoming = f1 && f2 && !match.winnerId;
  const isTBD = !f1 || !f2;

  return (
    <motion.div
      className={`bg-white/5 border rounded-xl p-3 min-w-[200px] ${
        isComplete ? 'border-white/10' : isTBD ? 'border-white/5' : 'border-amber-500/30'
      }`}
      whileHover={{ scale: 1.03 }}
    >
      {/* Fighter 1 */}
      <div
        className={`flex items-center gap-2 p-2 rounded-lg mb-1 ${
          match.winnerId === match.fighter1Id ? 'bg-green-500/10' :
          isComplete && match.winnerId !== match.fighter1Id ? 'opacity-40' : ''
        }`}
      >
        {f1 ? (
          <>
            <div className="w-8 h-8 relative rounded overflow-hidden flex-shrink-0">
              <Image src={f1.image} alt={f1.name} fill className="object-cover" />
            </div>
            <span className="font-bold text-sm text-white">{f1.name}</span>
            {match.winnerId === match.fighter1Id && <span className="text-green-400 text-xs font-bold ml-auto uppercase">W</span>}
          </>
        ) : (
          <span className="text-gray-600 text-sm italic">TBD</span>
        )}
      </div>

      {/* Divider */}
      <div className="text-center text-xs text-gray-600 font-bold py-0.5">
        {isComplete ? 'FINISHED' : isUpcoming ? (
          <Link href="/betting" className="text-amber-400 hover:text-amber-300">BET NOW</Link>
        ) : 'VS'}
      </div>

      {/* Fighter 2 */}
      <div
        className={`flex items-center gap-2 p-2 rounded-lg mt-1 ${
          match.winnerId === match.fighter2Id ? 'bg-green-500/10' :
          isComplete && match.winnerId !== match.fighter2Id ? 'opacity-40' : ''
        }`}
      >
        {f2 ? (
          <>
            <div className="w-8 h-8 relative rounded overflow-hidden flex-shrink-0">
              <Image src={f2.image} alt={f2.name} fill className="object-cover" />
            </div>
            <span className="font-bold text-sm text-white">{f2.name}</span>
            {match.winnerId === match.fighter2Id && <span className="text-green-400 text-xs font-bold ml-auto uppercase">W</span>}
          </>
        ) : (
          <span className="text-gray-600 text-sm italic">TBD</span>
        )}
      </div>
    </motion.div>
  );
}
