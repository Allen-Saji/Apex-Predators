'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import FighterShowcase from '@/components/fighters/FighterShowcase';
import { fighters } from '@/lib/fighters';
import { useArenaState, FightOutcome } from '@/hooks/useArenaState';

function NextFightSection() {
  const { pool, fighter1, fighter2, status, fight } = useArenaState();

  if (status === 'no-pools' || !fighter1 || !fighter2) return null;

  // Resolved — show result
  if (status === 'resolved' && pool) {
    const winner = pool.winnerId === pool.fighter1Id ? fighter1 : fighter2;
    const outcomeLabel = fight?.result.outcome === FightOutcome.KO ? 'KO' : 'Decision';
    return (
      <section>
        <h2 className="text-2xl font-black uppercase tracking-wider text-white mb-6">
          Latest Result
        </h2>
        <motion.div
          className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
          whileHover={{ borderColor: 'rgba(220,38,38,0.3)' }}
        >
          <div className="flex items-center justify-between">
            <FighterThumb fighter={fighter1} isWinner={pool.winnerId === pool.fighter1Id} />
            <div className="flex flex-col items-center gap-2">
              <div className="text-3xl md:text-5xl font-black text-red-500">VS</div>
              <span className="text-xs text-green-400 uppercase font-bold">{winner.name} wins &middot; {outcomeLabel}</span>
              <Link
                href="/arena"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
              >
                Watch Replay
              </Link>
            </div>
            <FighterThumb fighter={fighter2} isWinner={pool.winnerId === pool.fighter2Id} />
          </div>
        </motion.div>
      </section>
    );
  }

  // Closed — fight in progress
  if (status === 'closed') {
    return (
      <section>
        <h2 className="text-2xl font-black uppercase tracking-wider text-white mb-6">
          <span className="relative inline-flex mr-3 h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>Fight In Progress
        </h2>
        <motion.div
          className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
          whileHover={{ borderColor: 'rgba(220,38,38,0.3)' }}
        >
          <div className="flex items-center justify-between">
            <FighterThumb fighter={fighter1} />
            <div className="flex flex-col items-center gap-2">
              <div className="text-3xl md:text-5xl font-black text-red-500">VS</div>
              <span className="text-xs text-amber-400 uppercase">In progress...</span>
            </div>
            <FighterThumb fighter={fighter2} />
          </div>
        </motion.div>
      </section>
    );
  }

  // Open — betting available
  const closesAt = pool ? new Date(pool.closesAt * 1000) : null;
  return (
    <section>
      <h2 className="text-2xl font-black uppercase tracking-wider text-white mb-6">
        <span className="relative inline-flex mr-3 h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>Next Fight
      </h2>
      <motion.div
        className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
        whileHover={{ borderColor: 'rgba(220,38,38,0.3)' }}
      >
        <div className="flex items-center justify-between">
          <FighterThumb fighter={fighter1} />
          <div className="flex flex-col items-center gap-2">
            <div className="text-3xl md:text-5xl font-black text-red-500">VS</div>
            {closesAt && (
              <span className="text-xs text-gray-500 uppercase">
                Betting closes {closesAt.toLocaleTimeString()}
              </span>
            )}
            <Link
              href="/betting"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
            >
              Bet Now
            </Link>
          </div>
          <FighterThumb fighter={fighter2} />
        </div>
      </motion.div>
    </section>
  );
}

function FighterThumb({ fighter, isWinner }: { fighter: { name: string; image: string; color: string; wins: number; losses: number; focalPoint?: string }; isWinner?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 flex-1">
      <div className={`w-20 h-20 md:w-28 md:h-28 relative rounded-xl overflow-hidden border-2 ${isWinner ? 'ring-2 ring-green-500' : ''}`} style={{ borderColor: fighter.color }}>
        <Image src={fighter.image} alt={fighter.name} fill className="object-cover" style={{ objectPosition: fighter.focalPoint || 'center center' }} />
      </div>
      <div className="text-center">
        <div className="font-black uppercase text-white">{fighter.name}</div>
        <div className="text-xs text-gray-500">{fighter.wins}W-{fighter.losses}L</div>
        {isWinner && <div className="text-xs text-green-400 font-bold">Winner</div>}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-16">
      {/* Hero */}
      <section className="relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tight">
            <span className="text-red-500">Apex</span>{' '}
            <span className="text-white">Predators</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mt-3 max-w-2xl mx-auto">
            AI-powered animal fighters compete in MMA-style tournaments on Monad.
            Bet on blood. Only the strongest survive.
          </p>
          <div className="flex gap-4 justify-center mt-6">
            <Link
              href="/arena"
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-xl transition-all hover:scale-105"
            >
              Watch a Fight
            </Link>
            <Link
              href="/betting"
              className="px-8 py-3 bg-white/10 hover:bg-white/15 text-white font-bold uppercase tracking-wider rounded-xl transition-all border border-white/10"
            >
              Place a Bet
            </Link>
          </div>
        </motion.div>

        <FighterShowcase />
      </section>

      <NextFightSection />

      {/* Fighter Grid Preview */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black uppercase tracking-wider text-white">Fighters</h2>
          <Link href="/fighters" className="text-sm text-red-400 hover:text-red-300 font-bold uppercase tracking-wider">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {fighters.map((f) => (
            <Link key={f.id} href={`/fighters/${f.id}`}>
              <motion.div
                className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group cursor-pointer"
                whileHover={{ scale: 1.08, borderColor: f.color }}
              >
                <Image src={f.image} alt={f.name} fill className="object-cover group-hover:scale-110 transition-transform duration-300" style={{ objectPosition: f.focalPoint || "center center" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-1.5 left-1.5 right-1.5 text-center">
                  <div className="text-[10px] md:text-xs font-bold uppercase text-white truncate">{f.name}</div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
