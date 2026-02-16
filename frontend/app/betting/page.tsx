'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useAllPools, type PoolWithId } from '@/hooks/useAllPools';
import { PoolStatus } from '@/hooks/useArenaState';
import { useUserBet, usePlaceBet, useMinBet, useHasClaimed } from '@/hooks/useContracts';
import BetForm from '@/components/betting/BetForm';
import OddsDisplay from '@/components/betting/OddsDisplay';
import HypeMeter from '@/components/betting/HypeMeter';
import ClaimWinnings from '@/components/betting/ClaimWinnings';

function BetCountdown({ closesAt }: { closesAt: number }) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = closesAt - now;
  if (diff <= 0) return <span className="text-red-400 font-bold text-xs">Betting closed</span>;

  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;

  const urgent = diff < 60;

  return (
    <span className={`font-mono text-xs ${urgent ? 'text-red-400' : 'text-amber-400'}`}>
      {h > 0 && `${h}h `}{m}m {s}s
    </span>
  );
}

function OpenPoolCard({ pool }: { pool: PoolWithId }) {
  const { fighter1, fighter2, poolId } = pool;
  const f1Id = pool.fighter1Id;
  const f2Id = pool.fighter2Id;

  const { data: userBet1 } = useUserBet(poolId, f1Id);
  const { data: userBet2 } = useUserBet(poolId, f2Id);
  const { data: minBetWei } = useMinBet();
  const { placeBet, isPending: isBetPending, isSuccess: betSuccess, error: betError } = usePlaceBet();

  const minBet = minBetWei ? parseFloat(formatEther(minBetWei as bigint)) : 0.01;
  const pool1Num = parseFloat(pool.totalFighter1);
  const pool2Num = parseFloat(pool.totalFighter2);

  const userBet1Amount = userBet1 ? parseFloat(formatEther(userBet1 as bigint)) : 0;
  const userBet2Amount = userBet2 ? parseFloat(formatEther(userBet2 as bigint)) : 0;
  const hasBet = userBet1Amount > 0 || userBet2Amount > 0;

  const handlePlaceBet = (fighterId: bigint, amount: string) => {
    placeBet(poolId, fighterId, amount);
  };

  if (!fighter1 || !fighter2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-red-500 font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Betting Open
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600 font-mono">Pool #{String(poolId)}</span>
          <span className="text-xs text-gray-500 flex items-center gap-1.5">
            Closes in <BetCountdown closesAt={pool.closesAt} />
          </span>
        </div>
      </div>

      <OddsDisplay fighter1={fighter1} fighter2={fighter2} pool1={pool1Num} pool2={pool2Num} />
      <HypeMeter pool={pool1Num + pool2Num} maxPool={100} />

      {hasBet || betSuccess ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-white/10 pt-6 text-center"
        >
          <div className="text-lg font-black text-white uppercase tracking-wider">Bet Placed</div>
          <div className="text-sm text-gray-400 mt-1">
            {userBet1Amount > 0 && `${userBet1Amount.toFixed(4)} MON on ${fighter1.name}`}
            {userBet2Amount > 0 && `${userBet2Amount.toFixed(4)} MON on ${fighter2.name}`}
            {betSuccess && !hasBet && 'Your bet is locked in. Good luck.'}
          </div>
        </motion.div>
      ) : (
        <div className="border-t border-white/10 pt-6">
          <h2 className="text-lg font-black uppercase tracking-wider text-white mb-4">Choose Your Fighter</h2>
          <BetForm
            fighter1={fighter1}
            fighter2={fighter2}
            fighter1Id={f1Id}
            fighter2Id={f2Id}
            pool1={pool1Num}
            pool2={pool2Num}
            onPlaceBet={handlePlaceBet}
            isPlacing={isBetPending}
            minBet={minBet}
          />
          {betError && (
            <div className="text-xs text-red-400 mt-2">
              {(betError as any)?.shortMessage || betError.message || 'Failed to place bet'}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function ResolvedPoolCard({ pool }: { pool: PoolWithId }) {
  const { fighter1, fighter2, poolId } = pool;
  const f1Id = pool.fighter1Id;
  const f2Id = pool.fighter2Id;

  const { data: userBet1 } = useUserBet(poolId, f1Id);
  const { data: userBet2 } = useUserBet(poolId, f2Id);
  const { data: hasClaimed } = useHasClaimed(poolId);

  const userBet1Amount = userBet1 ? parseFloat(formatEther(userBet1 as bigint)) : 0;
  const userBet2Amount = userBet2 ? parseFloat(formatEther(userBet2 as bigint)) : 0;
  const hasBet = userBet1Amount > 0 || userBet2Amount > 0;

  const userBetOnWinner = pool && (
    (pool.winnerId === f1Id && userBet1Amount > 0) ||
    (pool.winnerId === f2Id && userBet2Amount > 0)
  );
  const canClaim = userBetOnWinner && !hasClaimed;

  const getEstimatedWinnings = () => {
    if (!pool || !userBetOnWinner) return '0';
    const totalPool = pool.totalFighter1Wei + pool.totalFighter2Wei;
    const winnerPool = pool.winnerId === f1Id ? pool.totalFighter1Wei : pool.totalFighter2Wei;
    const userBet = pool.winnerId === f1Id ? (userBet1 as bigint) : (userBet2 as bigint);
    if (winnerPool === BigInt(0)) return '0';
    const payout = (userBet * totalPool) / winnerPool;
    return parseFloat(formatEther(payout)).toFixed(4);
  };

  if (!fighter1 || !fighter2 || !hasBet) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-gray-500">Fight Resolved</span>
          <span className="text-xs text-gray-600 font-mono ml-2">#{String(poolId)}</span>
          <div className="font-bold text-white mt-1">
            {pool.winnerId === f1Id ? fighter1.name : fighter2.name} wins!
          </div>
        </div>
        {userBetOnWinner && (
          <span className="text-green-400 text-sm font-bold">You won!</span>
        )}
        {hasBet && !userBetOnWinner && (
          <span className="text-red-400 text-sm font-bold">Better luck next time</span>
        )}
      </div>
      {canClaim && (
        <ClaimWinnings poolId={poolId} amount={getEstimatedWinnings()} resolvedAt={pool.resolvedAt} />
      )}
      {hasClaimed && (
        <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
          <div className="text-green-400 font-bold uppercase tracking-wider">Winnings Already Claimed</div>
        </div>
      )}
    </motion.div>
  );
}

export default function BettingPage() {
  const { isConnected } = useAccount();
  const { openPools, resolvedPools, loading } = useAllPools();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-12 w-72 bg-white/10 rounded animate-pulse mb-2" />
          <div className="h-5 w-56 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-white/10 rounded" />
                <div className="h-4 w-32 bg-white/10 rounded" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 h-16 bg-white/10 rounded-xl" />
                <div className="h-6 w-8 bg-white/10 rounded" />
                <div className="flex-1 h-16 bg-white/10 rounded-xl" />
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full" />
              <div className="h-10 w-full bg-white/10 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-2">
          Place Your Bets
        </h1>
        <p className="text-gray-400 mb-8">Put your money where your fangs are.</p>
      </motion.div>

      {!isConnected && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-lg font-bold text-white mb-2">Connect Your Wallet</div>
          <p className="text-gray-400">Connect your wallet to place bets and claim winnings.</p>
        </div>
      )}

      {isConnected && openPools.length === 0 && resolvedPools.length === 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-lg font-bold text-white mb-2">No Active Betting Pools</div>
          <p className="text-gray-400">There are no fights to bet on right now. Check back soon.</p>
        </div>
      )}

      {isConnected && openPools.length > 0 && (
        <div className="space-y-6 mb-8">
          {openPools.map((pool) => (
            <OpenPoolCard key={String(pool.poolId)} pool={pool} />
          ))}
        </div>
      )}

      {isConnected && resolvedPools.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold">Recent Results</h2>
          {resolvedPools.map((pool) => (
            <ResolvedPoolCard key={String(pool.poolId)} pool={pool} />
          ))}
        </div>
      )}
    </div>
  );
}
