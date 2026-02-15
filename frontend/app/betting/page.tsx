'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useArenaState, PoolStatus } from '@/hooks/useArenaState';
import { useUserBet, usePlaceBet, useMinBet, useHasClaimed } from '@/hooks/useContracts';
import BetForm from '@/components/betting/BetForm';
import OddsDisplay from '@/components/betting/OddsDisplay';
import HypeMeter from '@/components/betting/HypeMeter';
import ClaimWinnings from '@/components/betting/ClaimWinnings';

export default function BettingPage() {
  const { isConnected, address } = useAccount();
  const { pool, fighter1, fighter2, poolId, status, loading } = useArenaState();

  const f1Id = pool?.fighter1Id;
  const f2Id = pool?.fighter2Id;

  const { data: userBet1 } = useUserBet(poolId, f1Id);
  const { data: userBet2 } = useUserBet(poolId, f2Id);
  const { data: hasClaimed } = useHasClaimed(poolId);
  const { data: minBetWei } = useMinBet();
  const { placeBet, isPending: isBetPending, isSuccess: betSuccess, error: betError } = usePlaceBet();

  const minBet = minBetWei ? parseFloat(formatEther(minBetWei as bigint)) : 0.01;

  const pool1Num = pool ? parseFloat(pool.totalFighter1) : 0;
  const pool2Num = pool ? parseFloat(pool.totalFighter2) : 0;

  const userBet1Amount = userBet1 ? parseFloat(formatEther(userBet1 as bigint)) : 0;
  const userBet2Amount = userBet2 ? parseFloat(formatEther(userBet2 as bigint)) : 0;
  const hasBet = userBet1Amount > 0 || userBet2Amount > 0;

  // Determine if user won
  const isResolved = status === 'resolved' && pool;
  const userBetOnWinner = isResolved && pool && (
    (pool.winnerId === f1Id && userBet1Amount > 0) ||
    (pool.winnerId === f2Id && userBet2Amount > 0)
  );
  const canClaim = userBetOnWinner && !hasClaimed;

  // Calculate estimated winnings
  const getEstimatedWinnings = () => {
    if (!pool || !userBetOnWinner) return '0';
    const totalPool = pool.totalFighter1Wei + pool.totalFighter2Wei;
    const winnerPool = pool.winnerId === f1Id ? pool.totalFighter1Wei : pool.totalFighter2Wei;
    const userBet = pool.winnerId === f1Id ? (userBet1 as bigint) : (userBet2 as bigint);
    if (winnerPool === BigInt(0)) return '0';
    const payout = (userBet * totalPool) / winnerPool;
    return parseFloat(formatEther(payout)).toFixed(4);
  };

  const handlePlaceBet = (fighterId: bigint, amount: string) => {
    if (poolId === undefined) return;
    placeBet(poolId, fighterId, amount);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-gray-400 text-lg animate-pulse">Loading betting pools...</div>
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

      {/* Wallet not connected */}
      {!isConnected && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-lg font-bold text-white mb-2">Connect Your Wallet</div>
          <p className="text-gray-400">Connect your wallet to place bets and claim winnings.</p>
        </div>
      )}

      {/* No open pool */}
      {isConnected && (status === 'no-pools' || status === 'cancelled') && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-lg font-bold text-white mb-2">No Active Betting Pool</div>
          <p className="text-gray-400">There are no fights to bet on right now. Check back soon.</p>
        </div>
      )}

      {/* Open pool — place bets */}
      {isConnected && status === 'open' && pool && fighter1 && fighter2 && f1Id && f2Id && (
        <div className="space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-red-500 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Betting Open
              </span>
              <span className="text-xs text-gray-500">
                Closes at {new Date(pool.closesAt * 1000).toLocaleTimeString()}
              </span>
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
          </div>
        </div>
      )}

      {/* Closed pool — fight in progress */}
      {isConnected && status === 'closed' && fighter1 && fighter2 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-xs uppercase tracking-wider text-amber-500 font-bold flex items-center justify-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Fight In Progress
          </div>
          <div className="text-lg font-bold text-white">
            {fighter1.name} vs {fighter2.name}
          </div>
          <p className="text-gray-400 mt-2">Betting is closed. Waiting for the fight to resolve.</p>
          {hasBet && (
            <div className="text-sm text-gray-500 mt-4">
              Your bet: {userBet1Amount > 0 ? `${userBet1Amount.toFixed(4)} MON on ${fighter1.name}` : `${userBet2Amount.toFixed(4)} MON on ${fighter2.name}`}
            </div>
          )}
        </div>
      )}

      {/* Resolved pool — claim winnings */}
      {isConnected && isResolved && pool && fighter1 && fighter2 && (
        <div className="space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-500">Fight Resolved</span>
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
            {canClaim && poolId !== undefined && (
              <ClaimWinnings poolId={poolId} amount={getEstimatedWinnings()} />
            )}
            {hasClaimed && (
              <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="text-green-400 font-bold uppercase tracking-wider">Winnings Already Claimed</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
