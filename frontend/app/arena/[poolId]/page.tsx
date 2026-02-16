'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatEther } from 'viem';
import { useReadContract } from 'wagmi';
import { CONTRACTS, BETTING_POOL_ABI } from '@/lib/contracts';
import { useLiveFight } from '@/hooks/useLiveFight';
import { PoolStatus, FightOutcome } from '@/hooks/useArenaState';
import FightViewer from '@/components/fight/FightViewer';
import FightStageStepper from '@/components/arena/FightStageStepper';
import { Fighter } from '@/lib/types';
import { fighters } from '@/lib/fighters';
import { useFightReplay } from '@/hooks/useFightReplay';

function mapFighter(onChainId: bigint): Fighter | undefined {
  return fighters[Number(onChainId) - 1];
}

function Countdown({ closesAt }: { closesAt: number }) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useState(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  });

  const diff = closesAt - now;
  if (diff <= 0) return <span className="text-red-400 font-bold">Betting closed</span>;

  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;

  return (
    <span className="font-mono text-white">
      {h > 0 && `${h}h `}{m}m {s}s
    </span>
  );
}

function FighterCard({ fighter, label }: { fighter: Fighter; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 flex-1">
      <div
        className="w-24 h-24 md:w-32 md:h-32 relative rounded-xl overflow-hidden border-2"
        style={{ borderColor: fighter.color }}
      >
        <Image src={fighter.image} alt={fighter.name} fill className="object-cover" style={{ objectPosition: fighter.focalPoint || 'center center' }} />
      </div>
      <div className="text-center">
        <div className="font-black uppercase text-white">{fighter.name}</div>
        <div className="text-xs text-gray-500">{fighter.animal}</div>
        {label && <div className="text-xs text-amber-400 font-bold mt-1">{label}</div>}
      </div>
    </div>
  );
}

export default function ArenaDetailPage() {
  const params = useParams();
  const poolIdStr = params.poolId as string;
  const poolId = useMemo(() => {
    try { return BigInt(poolIdStr); } catch { return undefined; }
  }, [poolIdStr]);

  const { data: poolData, isLoading } = useReadContract({
    address: CONTRACTS.bettingPool,
    abi: BETTING_POOL_ABI,
    functionName: 'getPool',
    args: poolId !== undefined ? [poolId] : undefined,
    query: { enabled: poolId !== undefined, refetchInterval: 5000 },
  });
  const liveFight = useLiveFight(poolId !== undefined ? String(poolId) : undefined);
  const { turns: replayTurns } = useFightReplay(poolId);
  const [watching, setWatching] = useState(false);

  const pool = useMemo(() => {
    if (!poolData) return null;
    const d = poolData as any;
    return {
      fighter1Id: d.fighter1Id ?? d[0],
      fighter2Id: d.fighter2Id ?? d[1],
      totalFighter1Wei: d.totalFighter1 ?? d[2],
      totalFighter1: formatEther(d.totalFighter1 ?? d[2]),
      totalFighter2Wei: d.totalFighter2 ?? d[3],
      totalFighter2: formatEther(d.totalFighter2 ?? d[3]),
      winnerId: d.winnerId ?? d[4],
      status: Number(d.status ?? d[5]),
      closesAt: Number(d.closesAt ?? d[6]),
      resolvedAt: Number(d.resolvedAt ?? d[8]),
    };
  }, [poolData]);

  const fighter1 = pool ? mapFighter(pool.fighter1Id) : undefined;
  const fighter2 = pool ? mapFighter(pool.fighter2Id) : undefined;

  let status: 'loading' | 'not-found' | 'open' | 'closed' | 'resolved' | 'cancelled' = 'loading';
  if (!isLoading && !pool) status = 'not-found';
  else if (pool) {
    switch (pool.status) {
      case PoolStatus.Open: status = 'open'; break;
      case PoolStatus.Closed: status = 'closed'; break;
      case PoolStatus.Resolved: status = 'resolved'; break;
      case PoolStatus.Cancelled: status = 'cancelled'; break;
    }
  }

  const backButton = (
    <Link href="/arena" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      Back to Arena
    </Link>
  );

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-lg animate-pulse">Loading fight...</div>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {backButton}
        <div className="text-center">
          <div className="text-4xl font-black uppercase text-white mb-2">Fight Not Found</div>
          <p className="text-gray-400">Pool #{poolIdStr} does not exist.</p>
        </div>
      </div>
    );
  }

  // Watching simulation — use on-chain replay if available, else random
  if (watching && fighter1 && fighter2) {
    return (
      <div className="min-h-screen">
        <FightViewer left={fighter1} right={fighter2} onBack={() => setWatching(false)} presetTurns={replayTurns ?? undefined} autoStart={!!replayTurns} />
      </div>
    );
  }

  // Pool Open
  if (status === 'open' && pool && fighter1 && fighter2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {backButton}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <span className="text-xs uppercase tracking-wider text-red-500 font-bold flex items-center justify-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Betting Open
            </span>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white">
              {fighter1.name} <span className="text-red-500">vs</span> {fighter2.name}
            </h1>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <FighterCard fighter={fighter1} />
              <div className="flex flex-col items-center gap-2">
                <div className="text-3xl md:text-5xl font-black text-red-500">VS</div>
                <div className="text-xs text-gray-500 uppercase">Closes in</div>
                <Countdown closesAt={pool.closesAt} />
              </div>
              <FighterCard fighter={fighter2} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 uppercase">{fighter1.name} Pool</div>
                <div className="text-lg font-mono font-bold text-white">{parseFloat(pool.totalFighter1).toFixed(2)} MON</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 uppercase">{fighter2.name} Pool</div>
                <div className="text-lg font-mono font-bold text-white">{parseFloat(pool.totalFighter2).toFixed(2)} MON</div>
              </div>
            </div>

            <Link
              href="/betting"
              className="block w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider rounded-xl transition-all text-lg text-center"
            >
              Place Bet
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Pool Closed — fight in progress or stuck
  if (status === 'closed' && pool && fighter1 && fighter2) {
    // Live fight streaming — show FightViewer with real turns
    if (liveFight.isLive && liveFight.turns.length > 0) {
      return (
        <div className="min-h-screen">
          <FightViewer left={fighter1} right={fighter2} presetTurns={liveFight.turns} autoStart liveMode />
        </div>
      );
    }

    // Detect stuck pool: closesAt has long passed, no SSE data, no resolution
    const now = Math.floor(Date.now() / 1000);
    const isStuck = !liveFight.isLive && pool.closesAt > 0 && now - pool.closesAt > 600; // 10 min past close + no SSE = likely stuck

    // Determine status message from SSE progress
    let statusMessage = 'Waiting for result...';
    if (liveFight.isLive && liveFight.progressMessage) {
      statusMessage = liveFight.progressMessage;
    } else if (liveFight.isLive) {
      statusMessage = 'Fight starting soon...';
    }

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {backButton}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="text-xs uppercase tracking-wider text-amber-500 font-bold flex items-center justify-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {isStuck ? 'Fight Stalled' : 'Fight In Progress'}
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-8">
            {fighter1.name} <span className="text-red-500">vs</span> {fighter2.name}
          </h1>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <FighterCard fighter={fighter1} />
              <div className="flex flex-col items-center gap-3">
                {isStuck ? (
                  <div className="text-sm text-gray-400">
                    This fight appears to have stalled during resolution.
                  </div>
                ) : liveFight.isLive && liveFight.stage ? (
                  <FightStageStepper currentStage={liveFight.stage} eta={liveFight.eta} variant="full" />
                ) : (
                  <>
                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <div className="text-sm text-gray-400">
                      {statusMessage}
                    </div>
                  </>
                )}
              </div>
              <FighterCard fighter={fighter2} />
            </div>
            {isStuck && (
              <button
                onClick={() => setWatching(true)}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider rounded-xl transition-all text-lg"
              >
                {replayTurns ? 'Watch Replay' : 'Watch Simulation'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Pool Resolved
  if (status === 'resolved' && pool && fighter1 && fighter2) {
    const winner = pool.winnerId === pool.fighter1Id ? fighter1 : fighter2;
    const outcomeLabel = 'Fight Complete';

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {backButton}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <span className="text-xs uppercase tracking-wider text-green-500 font-bold mb-4 block">Fight Resolved</span>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white">
              {winner.name} <span className="text-green-500">Wins!</span>
            </h1>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <FighterCard fighter={fighter1} label={pool.winnerId === pool.fighter1Id ? 'Winner' : undefined} />
              <div className="flex flex-col items-center gap-2">
                <div className="text-2xl font-black text-red-500">VS</div>
                <div className="text-sm text-gray-400">{outcomeLabel}</div>
              </div>
              <FighterCard fighter={fighter2} label={pool.winnerId === pool.fighter2Id ? 'Winner' : undefined} />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setWatching(true)}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider rounded-xl transition-all text-lg"
              >
                {replayTurns ? 'Watch Replay' : 'Watch Simulation'}
              </button>
              <Link
                href="/betting"
                className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white font-black uppercase tracking-wider rounded-xl transition-all text-lg text-center border border-white/10"
              >
                Claim Winnings
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Cancelled
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {backButton}
      <div className="text-center">
        <div className="text-4xl font-black uppercase text-white mb-2">Fight Cancelled</div>
        <p className="text-gray-400">This fight was cancelled.</p>
      </div>
    </div>
  );
}
