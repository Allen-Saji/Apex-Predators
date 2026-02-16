'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAllPools, type PoolWithId } from '@/hooks/useAllPools';
import { useLiveFights } from '@/hooks/useLiveFight';
import { PoolStatus } from '@/hooks/useArenaState';
import { Fighter } from '@/lib/types';
import FightStageStepper from '@/components/arena/FightStageStepper';

function Countdown({ closesAt }: { closesAt: number }) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useState(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  });

  const diff = closesAt - now;
  if (diff <= 0) return <span className="text-red-400 text-xs font-bold">Closing...</span>;

  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;

  return (
    <span className="font-mono text-white text-xs">
      {h > 0 && `${h}h `}{m}m {s}s
    </span>
  );
}

function StatusBadge({ status, closesAt }: { status: number; closesAt?: number }) {
  if (status === PoolStatus.Open) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        Open
      </span>
    );
  }
  if (status === PoolStatus.Closed) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Live
      </span>
    );
  }
  if (status === PoolStatus.Resolved) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-green-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Resolved
      </span>
    );
  }
  return null;
}

function FighterAvatar({ fighter, size = 'md' }: { fighter: Fighter; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-12 h-12' : 'w-16 h-16';
  return (
    <div
      className={`${sizeClass} relative rounded-lg overflow-hidden border-2 shrink-0`}
      style={{ borderColor: fighter.color }}
    >
      <Image src={fighter.image} alt={fighter.name} fill className="object-cover" style={{ objectPosition: fighter.focalPoint || 'center center' }} />
    </div>
  );
}

function PoolCard({ pool }: { pool: PoolWithId }) {
  const { fighter1, fighter2, status, poolId, closesAt } = pool;
  const liveFights = useLiveFights();
  const liveFight = liveFights.get(String(poolId));
  const isLive = !!liveFight;
  const now = Math.floor(Date.now() / 1000);
  const isStuck = !isLive && status === PoolStatus.Closed && closesAt > 0 && now - closesAt > 600;

  if (!fighter1 || !fighter2) return null;

  const winner = status === PoolStatus.Resolved
    ? (pool.winnerId === pool.fighter1Id ? fighter1 : fighter2)
    : null;

  const href = `/arena/${poolId}`;

  return (
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:bg-white/[0.07] transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-4">
          {isStuck ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
              Stalled
            </span>
          ) : (
            <StatusBadge status={status} closesAt={closesAt} />
          )}
          <span className="text-xs text-gray-600 font-mono">#{String(poolId)}</span>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <FighterAvatar fighter={fighter1} />
          <div className="flex flex-col items-center flex-1">
            <span className="text-lg font-black text-red-500">VS</span>
            {status === PoolStatus.Open && (
              <Countdown closesAt={closesAt} />
            )}
          </div>
          <FighterAvatar fighter={fighter2} />
        </div>

        {/* Live fight progress — full-width below avatars */}
        {isLive && status === PoolStatus.Closed && (
          <div className="mb-3 flex justify-center">
            {liveFight?.turns.length ? (
              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                </span>
                Turn {liveFight.turns.length} — Live
              </span>
            ) : (
              <FightStageStepper currentStage={liveFight?.stage ?? null} eta={liveFight?.eta ?? null} variant="compact" />
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-white font-bold">{fighter1.name}</span>
            <span className="text-gray-600 mx-1">vs</span>
            <span className="text-white font-bold">{fighter2.name}</span>
          </div>
        </div>

        {/* Pool sizes for open */}
        {status === PoolStatus.Open && (
          <div className="flex gap-2 mt-3">
            <div className="flex-1 bg-white/5 rounded-lg px-2 py-1.5 text-center">
              <div className="text-[10px] text-gray-500 uppercase">{fighter1.name}</div>
              <div className="text-xs font-mono text-white">{parseFloat(pool.totalFighter1).toFixed(2)} MON</div>
            </div>
            <div className="flex-1 bg-white/5 rounded-lg px-2 py-1.5 text-center">
              <div className="text-[10px] text-gray-500 uppercase">{fighter2.name}</div>
              <div className="text-xs font-mono text-white">{parseFloat(pool.totalFighter2).toFixed(2)} MON</div>
            </div>
          </div>
        )}

        {/* Winner for resolved */}
        {winner && (
          <div className="mt-3 text-center text-sm">
            <span className="text-green-400 font-bold">{winner.name}</span>
            <span className="text-gray-500"> wins</span>
          </div>
        )}

        {/* Action hint */}
        <div className="mt-3 text-center">
          {status === PoolStatus.Open && (
            <span className="text-xs text-red-400 font-bold uppercase tracking-wider group-hover:text-red-300 transition-colors">
              Bet Now
            </span>
          )}
          {status === PoolStatus.Closed && !isStuck && (
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider group-hover:text-amber-300 transition-colors">
              Watch Live
            </span>
          )}
          {isStuck && (
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider group-hover:text-gray-400 transition-colors">
              Watch Simulation
            </span>
          )}
          {status === PoolStatus.Resolved && (
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider group-hover:text-gray-400 transition-colors">
              View Details
            </span>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export default function ArenaPage() {
  const { pools, loading } = useAllPools();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-lg animate-pulse">Loading arena...</div>
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-black uppercase text-white mb-2">No Fights Yet</div>
          <p className="text-gray-400">Check back soon. The arena is being prepared.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-2">
          The <span className="text-red-500">Arena</span>
        </h1>
        <p className="text-gray-400 mb-8">All active fights and betting pools.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pools.map((pool) => (
          <PoolCard key={String(pool.poolId)} pool={pool} />
        ))}
      </div>
    </div>
  );
}
