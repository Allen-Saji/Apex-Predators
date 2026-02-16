'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import FighterShowcase from '@/components/fighters/FighterShowcase';
import { fighters } from '@/lib/fighters';

function DemoFightCTA() {
  return (
    <section>
      <h2 className="text-2xl font-black uppercase tracking-wider text-white mb-6">
        Try the Arena
      </h2>
      <motion.div
        className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
        whileHover={{ borderColor: 'rgba(220,38,38,0.3)' }}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Demo Mode</span>
          </div>
          <p className="text-gray-400 max-w-md">
            Pick two fighters and watch them battle in a client-side simulation.
            Live on-chain fights and betting coming soon.
          </p>
          <Link
            href="/arena"
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-xl transition-all hover:scale-105"
          >
            Try a Demo Fight
          </Link>
        </div>
      </motion.div>
    </section>
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
              Try a Demo Fight
            </Link>
            <Link
              href="/fighters"
              className="px-8 py-3 bg-white/10 hover:bg-white/15 text-white font-bold uppercase tracking-wider rounded-xl transition-all border border-white/10"
            >
              Meet the Fighters
            </Link>
          </div>
        </motion.div>

        <FighterShowcase />
      </section>

      <DemoFightCTA />

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
