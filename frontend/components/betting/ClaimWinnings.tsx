'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useClaimWinnings } from '@/hooks/useContracts';

const DISPUTE_PERIOD = 3600; // 1 hour in seconds

function useDisputeCountdown(resolvedAt: number): number {
  const claimableAt = resolvedAt + DISPUTE_PERIOD;
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, claimableAt - Math.floor(Date.now() / 1000))
  );

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      const r = Math.max(0, claimableAt - Math.floor(Date.now() / 1000));
      setRemaining(r);
      if (r <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [claimableAt]);

  return remaining;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export default function ClaimWinnings({ poolId, amount, resolvedAt }: { poolId: bigint; amount: string; resolvedAt: number }) {
  const { claim, isPending, isSuccess, error } = useClaimWinnings();
  const remaining = useDisputeCountdown(resolvedAt);
  const inDisputePeriod = remaining > 0;

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
        disabled={isPending || inDisputePeriod}
        className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-400 text-white font-black uppercase tracking-wider rounded-xl transition-all text-lg"
        whileHover={!inDisputePeriod ? { scale: 1.02 } : {}}
        whileTap={!inDisputePeriod ? { scale: 0.98 } : {}}
      >
        {isPending
          ? 'Claiming...'
          : inDisputePeriod
            ? `Claimable in ${formatTime(remaining)}`
            : `Claim ${amount} MON`}
      </motion.button>
      {inDisputePeriod && (
        <div className="text-xs text-gray-500 mt-2 text-center">
          Dispute period active — claims open after resolution cooldown
        </div>
      )}
      {error && (
        <div className="text-xs text-red-400 mt-2">
          {(error as any)?.shortMessage || error.message || 'Failed to claim'}
        </div>
      )}
    </div>
  );
}
