'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { fighters } from '@/lib/fighters';
import BetForm from '@/components/betting/BetForm';
import OddsDisplay from '@/components/betting/OddsDisplay';
import HypeMeter from '@/components/betting/HypeMeter';
import ClaimWinnings from '@/components/betting/ClaimWinnings';

export default function BettingPage() {
  const [isPlacing, setIsPlacing] = useState(false);
  const [betPlaced, setBetPlaced] = useState(false);

  const fighter1 = fighters[3]; // Jaws
  const fighter2 = fighters[6]; // Kong

  const pool1 = 3200;
  const pool2 = 4800;

  const handleBet = async (fighterId: string, amount: number) => {
    setIsPlacing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsPlacing(false);
    setBetPlaced(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-2">
          Place Your Bets
        </h1>
        <p className="text-gray-400 mb-8">Put your money where your fangs are.</p>
      </motion.div>

      {/* Active fight card */}
      <div className="space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-amber-500 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live · Quarterfinal 4
            </span>
            <span className="text-xs text-gray-500">Betting closes in 2h 15m</span>
          </div>

          <OddsDisplay fighter1={fighter1} fighter2={fighter2} pool1={pool1} pool2={pool2} />

          <div className="mt-4">
            <HypeMeter pool={pool1 + pool2} maxPool={15000} />
          </div>
        </div>

        {!betPlaced ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Choose Your Fighter</h2>
            <BetForm
              fighter1={fighter1}
              fighter2={fighter2}
              pool1={pool1}
              pool2={pool2}
              onPlaceBet={handleBet}
              isPlacing={isPlacing}
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-green-500/20 rounded-2xl p-6 text-center"
          >
            <div className="text-lg font-bold text-white uppercase tracking-wider">Bet Placed</div>
            <div className="text-sm text-gray-400 mt-1">Your bet is locked in. Good luck.</div>
          </motion.div>
        )}

        {/* Past fight with claimable winnings */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-500">Quarterfinal 1 · Completed</span>
              <div className="font-bold text-white mt-1">Kodiak def. Venom — KO Round 6</div>
            </div>
            <span className="text-green-400 text-sm font-bold">You won!</span>
          </div>
          <ClaimWinnings amount={3.45} fightId="fight-1" />
        </div>
      </div>
    </div>
  );
}
