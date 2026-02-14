'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Fighter } from '@/lib/types';

export default function FighterCard({ fighter }: { fighter: Fighter }) {
  return (
    <Link href={`/fighters/${fighter.id}`}>
      <motion.div
        className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden cursor-pointer"
        whileHover={{ scale: 1.03, borderColor: fighter.color }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={fighter.image}
            alt={fighter.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            style={{ objectPosition: fighter.focalPoint || 'center center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ backgroundColor: fighter.color }}
          />
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-black text-lg uppercase tracking-wide text-white">{fighter.name}</h3>
            <span className="text-xs text-gray-500 uppercase">{fighter.animal}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-400 font-mono font-bold">{fighter.wins}W</span>
            <span className="text-red-400 font-mono font-bold">{fighter.losses}L</span>
            <span className="text-yellow-400 font-mono font-bold">{fighter.kos} KOs</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: fighter.color }}
            />
            <span className="text-xs text-gray-400">{fighter.specialTrait.name}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
