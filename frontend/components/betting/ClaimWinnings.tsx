'use client';

import { motion } from 'framer-motion';
import { useClaimWinnings } from '@/hooks/useContracts';

export default function ClaimWinnings({ poolId, amount }: { poolId: bigint; amount: string }) {
  const { claim, isPending, isSuccess, error } = useClaimWinnings();

  if (isSuccess) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center p-6 bg-red-500/10 border border-red-500/30 rounded-xl"
      >
        <div className="text-green-400 font-bold text-lg uppercase tracking-wider">Winnings Claimed</div>
        <div className="text-white font-mono font-bold text-2xl mt-1">{amount} MON</div>
      </motion.div>
    );
  }

  return (
    <div>
      <motion.button
        onClick={() => claim(poolId)}
        disabled={isPending}
        className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-black uppercase tracking-wider rounded-xl transition-all text-lg"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isPending ? 'Claiming...' : `Claim ${amount} MON`}
      </motion.button>
      {error && (
        <div className="text-xs text-red-400 mt-2">
          {(error as any)?.shortMessage || error.message || 'Failed to claim'}
        </div>
      )}
    </div>
  );
}
