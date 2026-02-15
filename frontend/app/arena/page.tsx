'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useArenaState, PoolStatus, FightOutcome } from '@/hooks/useArenaState';
import FightViewer from '@/components/arena/FightViewer';
import { Fighter } from '@/lib/types';

function Countdown({ closesAt }: { closesAt: number }) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  // Update every second
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

export default function ArenaPage() {
  const { pool, fight, fighter1, fighter2, status, loading } = useArenaState();
  const [watching, setWatching] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-lg animate-pulse">Loading arena...</div>
      </div>
    );
  }

  // Watching simulation — use FightViewer with the real fighters
  if (watching && fighter1 && fighter2) {
    return (
      <div className="min-h-screen">
        <FightViewer left={fighter1} right={fighter2} onBack={() => setWatching(false)} />
      </div>
    );
  }

  // No pools
  if (status === 'no-pools') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-black uppercase text-white mb-2">No Fights Yet</div>
          <p className="text-gray-400">Check back soon. The arena is being prepared.</p>
        </div>
      </div>
    );
  }

  // Pool Open
  if (status === 'open' && pool && fighter1 && fighter2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
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

            {/* Pool sizes */}
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

  // Pool Closed — fight in progress
  if (status === 'closed' && fighter1 && fighter2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="text-xs uppercase tracking-wider text-amber-500 font-bold flex items-center justify-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Fight In Progress
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-8">
            {fighter1.name} <span className="text-red-500">vs</span> {fighter2.name}
          </h1>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center justify-between">
              <FighterCard fighter={fighter1} />
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-sm text-gray-400">Waiting for result...</div>
              </div>
              <FighterCard fighter={fighter2} />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Pool Resolved
  if (status === 'resolved' && pool && fighter1 && fighter2) {
    const winner = pool.winnerId === pool.fighter1Id ? fighter1 : fighter2;
    const loser = pool.winnerId === pool.fighter1Id ? fighter2 : fighter1;
    const outcomeLabel = fight?.result.outcome === FightOutcome.KO ? 'KO' : 'Decision';
    const turns = fight?.result.totalTurns ?? 0;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
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
                <div className="text-sm text-gray-400">{outcomeLabel} &middot; {turns} turns</div>
              </div>
              <FighterCard fighter={fighter2} label={pool.winnerId === pool.fighter2Id ? 'Winner' : undefined} />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setWatching(true)}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider rounded-xl transition-all text-lg"
              >
                Watch Simulation
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

  // Cancelled or other
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl font-black uppercase text-white mb-2">Fight Cancelled</div>
        <p className="text-gray-400">This fight was cancelled. Check back for the next one.</p>
      </div>
    </div>
  );
}
