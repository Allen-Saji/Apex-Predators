'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAllPools, type PoolWithId } from '@/hooks/useAllPools';
import { useLiveFights, type LiveFightState } from '@/hooks/useLiveFight';
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
  if (status === PoolStatus.Cancelled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
        Cancelled
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

function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse flex flex-col h-[280px]">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-16 bg-white/10 rounded" />
        <div className="h-4 w-8 bg-white/10 rounded" />
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-16 h-16 rounded-lg bg-white/10 shrink-0" />
        <div className="flex-1 flex justify-center">
          <div className="h-6 w-8 bg-white/10 rounded" />
        </div>
        <div className="w-16 h-16 rounded-lg bg-white/10 shrink-0" />
      </div>
      <div className="h-4 w-32 bg-white/10 rounded mb-3" />
      <div className="mt-auto h-4 w-20 bg-white/10 rounded mx-auto" />
    </div>
  );
}

function useCountdown(target: number | null): number | null {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  useState(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  });
  if (!target) return null;
  const diff = target - now;
  return diff > 0 ? diff : null;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getStageEta(stage: string | null, remaining: number | null): { label: string; value: string } | null {
  if (stage === 'waiting_reveal_delay' && remaining && remaining > 0) {
    return { label: 'Starts in', value: formatCountdown(remaining) };
  }
  if (stage === 'simulating') return { label: 'Starts in', value: 'Seconds...' };
  if (stage === 'streaming') return { label: 'Status', value: 'LIVE' };
  if (stage === 'closing_pool' || stage === 'creating_fight' || stage === 'committing_seed') {
    return { label: 'Starts in', value: '~5-6 min' };
  }
  return null;
}

function LiveFightCard({ pool, liveFight }: { pool: PoolWithId; liveFight?: LiveFightState }) {
  const { fighter1, fighter2, poolId } = pool;
  const remaining = useCountdown(liveFight?.eta ?? null);
  const etaInfo = getStageEta(liveFight?.stage ?? null, remaining);

  if (!fighter1 || !fighter2) return null;

  return (
    <Link href={`/arena/${poolId}`} className="block min-w-0 w-full shrink-0">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/[0.07] transition-all cursor-pointer group">
        <div className="flex items-center gap-6 md:gap-10">
          {/* Fighter 1 */}
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <div
              className="w-20 h-20 md:w-24 md:h-24 relative rounded-xl overflow-hidden border-2 shrink-0"
              style={{ borderColor: fighter1.color }}
            >
              <Image src={fighter1.image} alt={fighter1.name} fill className="object-cover" style={{ objectPosition: fighter1.focalPoint || 'center center' }} />
            </div>
            <div className="text-center">
              <div className="font-black uppercase text-white text-sm">{fighter1.name}</div>
              <div className="text-[10px] text-gray-500">{fighter1.wins ?? 0}W-{fighter1.losses ?? 0}L</div>
            </div>
          </div>

          {/* Center: VS + stepper + ETA */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <span className="text-2xl md:text-3xl font-black text-red-500">VS</span>
            {liveFight?.stage && !liveFight.turns.length && (
              <FightStageStepper currentStage={liveFight.stage} eta={liveFight.eta} variant="compact" />
            )}
            {liveFight?.turns.length ? (
              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                </span>
                Turn {liveFight.turns.length} — Live
              </span>
            ) : etaInfo ? (
              <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md">
                <div className="text-[9px] uppercase tracking-widest text-amber-500/70">{etaInfo.label}</div>
                <div className="text-sm font-mono font-bold text-amber-400 text-center">{etaInfo.value}</div>
              </div>
            ) : null}
          </div>

          {/* Fighter 2 */}
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <div
              className="w-20 h-20 md:w-24 md:h-24 relative rounded-xl overflow-hidden border-2 shrink-0"
              style={{ borderColor: fighter2.color }}
            >
              <Image src={fighter2.image} alt={fighter2.name} fill className="object-cover" style={{ objectPosition: fighter2.focalPoint || 'center center' }} />
            </div>
            <div className="text-center">
              <div className="font-black uppercase text-white text-sm">{fighter2.name}</div>
              <div className="text-[10px] text-gray-500">{fighter2.wins ?? 0}W-{fighter2.losses ?? 0}L</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function LiveFightCarousel({ pools, liveFights }: { pools: PoolWithId[]; liveFights: Map<string, LiveFightState> }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);
  const count = pools.length;

  const goTo = useCallback((i: number) => {
    setActiveIndex(Math.max(0, Math.min(count - 1, i)));
  }, [count]);

  if (count === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          Fight{count > 1 ? 's' : ''} In Progress
        </span>
        {count > 1 && (
          <span className="text-xs text-gray-500 font-mono">{activeIndex + 1}/{count}</span>
        )}
      </div>

      <div
        className="relative overflow-hidden"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (dx > 50) goTo(activeIndex - 1);
          else if (dx < -50) goTo(activeIndex + 1);
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={String(pools[activeIndex].poolId)}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <LiveFightCard
              pool={pools[activeIndex]}
              liveFight={liveFights.get(String(pools[activeIndex].poolId))}
            />
          </motion.div>
        </AnimatePresence>

        {/* Nav arrows */}
        {count > 1 && (
          <>
            <button
              onClick={() => goTo(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white disabled:opacity-20 hover:bg-black/80 transition-all z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={() => goTo(activeIndex + 1)}
              disabled={activeIndex === count - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white disabled:opacity-20 hover:bg-black/80 transition-all z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {count > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {pools.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === activeIndex ? 'bg-amber-400 w-4' : 'bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PoolCard({ pool }: { pool: PoolWithId }) {
  const { fighter1, fighter2, status, poolId, closesAt } = pool;
  const liveFights = useLiveFights();
  const liveFight = liveFights.get(String(poolId));
  const isLive = !!liveFight;

  if (!fighter1 || !fighter2) return null;

  const winner = status === PoolStatus.Resolved
    ? (pool.winnerId === pool.fighter1Id ? fighter1 : fighter2)
    : null;

  const now = Math.floor(Date.now() / 1000);
  const isClosing = status === PoolStatus.Open && closesAt > 0 && now >= closesAt;

  const href = `/arena/${poolId}`;

  return (
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:bg-white/[0.07] transition-all cursor-pointer group flex flex-col h-[280px]"
      >
        <div className="flex items-center justify-between mb-4">
          <StatusBadge status={status} closesAt={closesAt} />
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

        {/* Pool sizes for open (hide when closing) */}
        {status === PoolStatus.Open && !isClosing && (
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

        {/* Action hint — pushed to bottom */}
        <div className="mt-auto pt-3 text-center">
          {status === PoolStatus.Open && !isClosing && (
            <span className="text-xs text-red-400 font-bold uppercase tracking-wider group-hover:text-red-300 transition-colors">
              Bet Now
            </span>
          )}
          {isClosing && (
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
              Closing...
            </span>
          )}
          {status === PoolStatus.Closed && (
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider group-hover:text-amber-300 transition-colors">
              Watch Live
            </span>
          )}
          {status === PoolStatus.Resolved && (
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider group-hover:text-gray-400 transition-colors">
              View Details
            </span>
          )}
          {status === PoolStatus.Cancelled && (
            <span className="text-xs text-gray-600 font-bold uppercase tracking-wider">
              No Bets
            </span>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export default function ArenaPage() {
  const { pools, loading } = useAllPools();

  // Filter out stalled pools
  const liveFights = useLiveFights();
  const now = Math.floor(Date.now() / 1000);
  const visiblePools = pools.filter((p) => {
    // Hide stale open pools (timer expired, agent never closed them)
    if (p.status === PoolStatus.Open && p.closesAt > 0 && now >= p.closesAt) return false;
    // Hide stalled closed pools (closed > 10 min with no live fight)
    if (p.status === PoolStatus.Closed) {
      const isLive = liveFights.has(String(p.poolId));
      const isStuck = !isLive && p.closesAt > 0 && now - p.closesAt > 600;
      return !isStuck;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-12 w-64 bg-white/10 rounded animate-pulse mb-2" />
          <div className="h-5 w-48 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (visiblePools.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-black uppercase text-white mb-2">No Fights Yet</div>
          <p className="text-gray-400">Check back soon. The arena is being prepared.</p>
        </div>
      </div>
    );
  }

  // Split live fights (carousel) from grid pools
  const livePools = visiblePools.filter(
    (p) => p.status === PoolStatus.Closed && liveFights.has(String(p.poolId)),
  );
  const gridPools = visiblePools.filter(
    (p) => !(p.status === PoolStatus.Closed && liveFights.has(String(p.poolId))),
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-2">
          The <span className="text-red-500">Arena</span>
        </h1>
        <p className="text-gray-400 mb-8">All active fights and betting pools.</p>
      </motion.div>

      {livePools.length > 0 && (
        <LiveFightCarousel pools={livePools} liveFights={liveFights} />
      )}

      {gridPools.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gridPools.map((pool) => (
            <PoolCard key={String(pool.poolId)} pool={pool} />
          ))}
        </div>
      )}
    </div>
  );
}
