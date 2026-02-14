'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Fighter } from '@/lib/types';

export default function FighterProfile({ fighter }: { fighter: Fighter }) {
  const winRate = Math.round((fighter.wins / (fighter.wins + fighter.losses)) * 100);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative aspect-square rounded-2xl overflow-hidden border-2"
          style={{ borderColor: fighter.color }}
        >
          <Image src={fighter.image} alt={fighter.name} fill className="object-cover" style={{ objectPosition: fighter.focalPoint || "center center" }} priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: fighter.color + '33', color: fighter.color }}
            >
              {fighter.animal}
            </span>
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-6"
        >
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tight text-white mb-2">
              {fighter.name}
            </h1>
            <p className="text-gray-400 italic">&ldquo;{fighter.catchphrase}&rdquo;</p>
          </div>

          <p className="text-gray-300 leading-relaxed">{fighter.backstory}</p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Wins', value: fighter.wins, color: 'text-green-400' },
              { label: 'Losses', value: fighter.losses, color: 'text-red-400' },
              { label: 'KOs', value: fighter.kos, color: 'text-yellow-400' },
              { label: 'Win Rate', value: `${winRate}%`, color: 'text-white' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className={`text-2xl font-black font-mono ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Special trait */}
          <div
            className="p-4 rounded-xl border"
            style={{ borderColor: fighter.color + '44', backgroundColor: fighter.color + '11' }}
          >
            <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">Special Trait</div>
            <div className="font-bold text-white">{fighter.specialTrait.name}</div>
            <div className="text-sm text-gray-400 mt-1">{fighter.specialTrait.description}</div>
          </div>

          {/* Moves */}
          <div>
            <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-3">Move Set</h3>
            <div className="space-y-2">
              {fighter.moves.map((move) => (
                <div
                  key={move.name}
                  className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2.5"
                >
                  <span className="font-semibold text-white text-sm">{move.name}</span>
                  <span className="font-mono text-xs text-gray-400">
                    {move.minDamage}-{move.maxDamage} DMG
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href={`/arena/demo?left=${fighter.id}&right=${fighter.id === 'kodiak' ? 'fang' : 'kodiak'}`}
            className="inline-block text-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-lg transition-colors"
          >
            Watch Fight →
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
