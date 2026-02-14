'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import FighterShowcase from '@/components/fighters/FighterShowcase';
import StatCard from '@/components/common/StatCard';
import { fighters } from '@/lib/fighters';
import { platformStats } from '@/lib/mock-data';
import { SwordsIcon, DiceIcon, CoinIcon, FlameIcon } from '@/components/icons';

export default function HomePage() {
  const nextFight = { left: fighters[3], right: fighters[6] }; // Jaws vs Kong

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
              href="/arena/demo"
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

      {/* Stats */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Fights" value={platformStats.totalFights} icon={<SwordsIcon size={28} />} />
          <StatCard label="Total Bets" value={platformStats.totalBets.toLocaleString()} icon={<DiceIcon size={28} />} />
          <StatCard label="Volume ($APEX)" value="28.4K" icon={<CoinIcon size={28} />} />
          <StatCard label="Active Fighters" value={platformStats.activeFighters} icon={<SwordsIcon size={28} />} />
        </div>
      </section>

      {/* Upcoming Fight */}
      <section>
        <h2 className="text-2xl font-black uppercase tracking-wider text-white mb-6">
          <FlameIcon size={24} className="inline-block mr-2" /> Next Fight
        </h2>
        <motion.div
          className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
          whileHover={{ borderColor: 'rgba(220,38,38,0.3)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="w-20 h-20 md:w-28 md:h-28 relative rounded-xl overflow-hidden border-2" style={{ borderColor: nextFight.left.color }}>
                <Image src={nextFight.left.image} alt={nextFight.left.name} fill className="object-cover" style={{ objectPosition: nextFight.left.focalPoint || "center center" }} />
              </div>
              <div className="text-center">
                <div className="font-black uppercase text-white">{nextFight.left.name}</div>
                <div className="text-xs text-gray-500">{nextFight.left.wins}W-{nextFight.left.losses}L</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-3xl md:text-5xl font-black text-red-500">VS</div>
              <span className="text-xs text-gray-500 uppercase">Tonight 9PM UTC</span>
              <Link
                href="/betting"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
              >
                Bet Now
              </Link>
            </div>
            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="w-20 h-20 md:w-28 md:h-28 relative rounded-xl overflow-hidden border-2" style={{ borderColor: nextFight.right.color }}>
                <Image src={nextFight.right.image} alt={nextFight.right.name} fill className="object-cover" style={{ objectPosition: nextFight.right.focalPoint || "center center" }} />
              </div>
              <div className="text-center">
                <div className="font-black uppercase text-white">{nextFight.right.name}</div>
                <div className="text-xs text-gray-500">{nextFight.right.wins}W-{nextFight.right.losses}L</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

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
