'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ClaimWinnings({ amount, fightId }: { amount: number; fightId: string }) {
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    setClaiming(true);
    await new Promise((r) => setTimeout(r, 1500));
    setClaimed(true);
    setClaiming(false);
  };

  if (claimed) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center p-6 bg-red-500/10 border border-red-500/30 rounded-xl"
      >
        <div className="text-green-400 font-bold text-lg uppercase tracking-wider">Winnings Claimed</div>
        <div className="text-white font-mono font-bold text-2xl mt-1">{amount.toFixed(2)} MON</div>
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={handleClaim}
      disabled={claiming}
      className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-black uppercase tracking-wider rounded-xl transition-all text-lg"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {claiming ? 'Claiming...' : `Claim ${amount.toFixed(2)} MON`}
    </motion.button>
  );
}
