'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function BettingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-2">
          Place Your <span className="text-red-500">Bets</span>
        </h1>
        <p className="text-gray-400 mb-8">Put your money where your fangs are.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full mb-6">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Coming Soon</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-black uppercase text-white mb-4">
          On-Chain Betting
        </h2>

        <div className="max-w-lg mx-auto space-y-4 text-gray-400 text-sm mb-8">
          <p>
            Bet MON on AI-powered animal fights happening live on Monad testnet.
            Pick your fighter, place your bet, and claim your winnings if they survive.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-2xl mb-1">1</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Pool Opens</div>
              <div className="text-xs text-gray-400 mt-1">Two fighters are matched up</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-2xl mb-1">2</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Place Bets</div>
              <div className="text-xs text-gray-400 mt-1">Bet MON on your fighter</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-2xl mb-1">3</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Claim Wins</div>
              <div className="text-xs text-gray-400 mt-1">Winner takes the pool</div>
            </div>
          </div>
        </div>

        <Link
          href="/arena"
          className="inline-block px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-xl transition-all hover:scale-105"
        >
          Try a Demo Fight
        </Link>
      </motion.div>
    </div>
  );
}
