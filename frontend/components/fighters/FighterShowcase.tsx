'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { fighters } from '@/lib/fighters';

export default function FighterShowcase() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % fighters.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const fighter = fighters[current];

  return (
    <div className="relative h-[600px] md:h-[700px] overflow-hidden rounded-2xl border border-white/10">
      <AnimatePresence mode="wait">
        <motion.div
          key={fighter.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <Image
            src={fighter.image}
            alt={fighter.name}
            fill
            className="object-cover"
            style={{ objectPosition: fighter.focalPoint || 'center center' }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/60 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={fighter.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="text-xs uppercase tracking-[0.3em] mb-2 font-bold"
              style={{ color: fighter.color }}
            >
              {fighter.animal}
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tight text-white mb-3">
              {fighter.name}
            </h2>
            <p className="text-gray-400 text-sm md:text-base max-w-lg italic mb-4">
              &ldquo;{fighter.catchphrase}&rdquo;
            </p>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-green-400 font-mono font-bold">{fighter.wins}W</span>
              <span className="text-red-400 font-mono font-bold">{fighter.losses}L</span>
              <span className="text-yellow-400 font-mono font-bold">{fighter.kos} KOs</span>
            </div>
            <Link
              href={`/fighters/${fighter.id}`}
              className="inline-block px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase tracking-wider rounded-lg transition-colors"
            >
              View Profile →
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="absolute bottom-6 right-6 flex gap-2">
        {fighters.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === current ? 'bg-red-500 scale-125' : 'bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
