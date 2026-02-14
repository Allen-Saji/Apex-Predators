'use client';

import { motion } from 'framer-motion';
import { leaderboard } from '@/lib/mock-data';
import { shortenAddress } from '@/lib/utils';

export default function LeaderboardPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-2">
          Leaderboard
        </h1>
        <p className="text-gray-400 mb-8">The sharpest minds in the arena.</p>
      </motion.div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-white/5 text-xs uppercase tracking-wider text-gray-500 font-bold">
          <span>Rank</span>
          <span className="col-span-2">Address</span>
          <span className="text-right">Profit</span>
          <span className="text-right">Streak</span>
          <span className="text-right">Volume</span>
        </div>

        {/* Rows */}
        {leaderboard.map((entry, i) => (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`grid grid-cols-6 gap-4 px-6 py-4 border-t border-white/5 items-center ${
              i < 3 ? 'bg-amber-500/5' : ''
            }`}
          >
            <span className="font-bold">
              {entry.rank <= 3 ? (
                <span className={"text-lg font-black " + (entry.rank === 1 ? "text-amber-400" : entry.rank === 2 ? "text-gray-300" : "text-amber-700")}>{entry.rank}</span>
              ) : (
                <span className="text-gray-500 font-mono">#{entry.rank}</span>
              )}
            </span>
            <span className="col-span-2 font-mono text-sm text-gray-300">
              {shortenAddress(entry.address)}
            </span>
            <span className="text-right font-mono font-bold text-green-400">
              +{entry.profit.toFixed(1)}
            </span>
            <span className="text-right">
              <span className="inline-flex items-center gap-1 text-amber-400 font-mono font-bold text-sm">
                {entry.streak}
              </span>
            </span>
            <span className="text-right font-mono text-sm text-gray-400">
              {entry.volume.toFixed(1)}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
