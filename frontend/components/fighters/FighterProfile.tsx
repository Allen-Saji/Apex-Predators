'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Fighter } from '@/lib/types';
import { fighters } from '@/lib/fighters';
import FightViewer from '@/components/fight/FightViewer';
import { FistIcon, LightningIcon } from '@/components/icons';

export default function FighterProfile({ fighter }: { fighter: Fighter }) {
  const [opponent, setOpponent] = useState<Fighter | null>(null);

  const startDemoFight = () => {
    const others = fighters.filter((f) => f.id !== fighter.id);
    setOpponent(others[Math.floor(Math.random() * others.length)]);
  };

  if (opponent) {
    return (
      <div className="min-h-screen">
        <FightViewer left={fighter} right={opponent} onBack={() => setOpponent(null)} />
      </div>
    );
  }

  const winRate = fighter.wins + fighter.losses > 0
    ? Math.round((fighter.wins / (fighter.wins + fighter.losses)) * 100)
    : 0;
  const avgDmg = fighter.wins + fighter.losses > 0
    ? Math.round(fighter.damageDealt / (fighter.wins + fighter.losses))
    : 0;
  const maxMoveDmg = Math.max(...fighter.moves.map((m) => m.maxDamage));

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Section 1: Cinematic Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-[50vh] md:h-[70vh] min-h-[500px] overflow-hidden"
      >
        {/* Background image */}
        <Image
          src={fighter.image}
          alt={fighter.name}
          fill
          className="object-cover"
          style={{ objectPosition: fighter.focalPoint || 'center center' }}
          priority
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 to-transparent" />

        {/* Content pinned bottom-left */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
              style={{ backgroundColor: fighter.color + '33', color: fighter.color }}
            >
              {fighter.animal}
            </span>

            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight text-white leading-none mb-2">
              {fighter.name}
            </h1>

            <p className="text-gray-400 italic text-lg mb-4">
              &ldquo;{fighter.catchphrase}&rdquo;
            </p>

            <div className="flex items-center gap-4 mb-6">
              <span className="font-mono font-bold text-green-400">{fighter.wins}W</span>
              <span className="text-gray-600">&middot;</span>
              <span className="font-mono font-bold text-red-400">{fighter.losses}L</span>
              <span className="text-gray-600">&middot;</span>
              <span className="font-mono font-bold text-yellow-400">{fighter.kos} KOs</span>
            </div>

            <button
              onClick={startDemoFight}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider rounded-xl transition-all hover:scale-105 text-sm flex items-center gap-2 w-fit"
            >
              <FistIcon size={18} /> Demo Fight
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* Section 2: Stats Bar — overlapping hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative -mt-6 z-10 max-w-5xl mx-auto px-4"
      >
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { label: 'Wins', value: fighter.wins, color: 'text-green-400' },
              { label: 'Losses', value: fighter.losses, color: 'text-red-400' },
              { label: 'KOs', value: fighter.kos, color: 'text-yellow-400' },
              { label: 'Win Rate', value: `${winRate}%`, color: 'text-white' },
              { label: 'Avg Dmg', value: avgDmg, color: 'text-white' },
              { label: 'Total Dmg', value: fighter.damageDealt.toLocaleString(), color: 'text-white' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Section 3: Two-column content */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left: Backstory */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="md:col-span-3"
          >
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 h-full">
              <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-4">Origin Story</h2>
              <p className="text-gray-300 leading-relaxed">{fighter.backstory}</p>
            </div>
          </motion.div>

          {/* Right: Special Trait */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="md:col-span-2"
          >
            <div
              className="rounded-xl p-6 border h-full"
              style={{ borderColor: fighter.color + '44', backgroundColor: fighter.color + '0a' }}
            >
              <span style={{ color: fighter.color }}><LightningIcon size={28} className="mb-3" /></span>
              <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-3">Special Trait</h2>
              <div className="font-bold text-white text-lg mb-1">{fighter.specialTrait.name}</div>
              <div className="text-gray-400 text-sm leading-relaxed">{fighter.specialTrait.description}</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 4: Move Set — Arsenal */}
      <section className="max-w-5xl mx-auto px-4 pb-10">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-6">Arsenal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fighter.moves.map((move, i) => {
            const severity = move.maxDamage >= 20 ? '#EF4444' : move.maxDamage >= 15 ? '#F59E0B' : '#6B7280';
            return (
              <motion.div
                key={move.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.07 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-white">{move.name}</span>
                  <span className="font-mono text-sm text-gray-400">
                    {move.minDamage}–{move.maxDamage}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(move.maxDamage / maxMoveDmg) * 100}%`,
                      backgroundColor: severity,
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Section 5: Bottom CTA */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/5 border border-white/10 rounded-xl p-8 text-center"
          style={{ boxShadow: `0 0 40px ${fighter.color}22` }}
        >
          <h3 className="text-2xl font-black uppercase text-white mb-4">Ready to Fight?</h3>
          <button
            onClick={startDemoFight}
            className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider rounded-xl transition-all hover:scale-105 text-base flex items-center gap-2 mx-auto"
          >
            <FistIcon size={20} /> Demo Fight
          </button>
        </motion.div>
      </section>
    </div>
  );
}
