'use client';

import { motion } from 'framer-motion';
import Bracket from '@/components/tournament/Bracket';
import { tournamentMatches } from '@/lib/mock-data';

export default function TournamentPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-[0.3em] text-amber-500 font-bold">Season 1</span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mt-2">
            Tournament Bracket
          </h1>
          <p className="text-gray-400 mt-2">8 fighters. Single elimination. One champion.</p>
        </div>
      </motion.div>

      <Bracket matches={tournamentMatches} />

      {/* Season info */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Current Round</div>
          <div className="text-2xl font-black text-white">Quarterfinals</div>
          <div className="text-sm text-gray-400 mt-1">3 of 4 matches completed</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Total Prize Pool</div>
          <div className="text-2xl font-black text-amber-400 font-mono">12,500 $APEX</div>
          <div className="text-sm text-gray-400 mt-1">Growing with each bet</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Next Match</div>
          <div className="text-2xl font-black text-white">Kong vs Jaws</div>
          <div className="text-sm text-red-400 mt-1">Tonight · Betting Open</div>
        </div>
      </div>
    </div>
  );
}
