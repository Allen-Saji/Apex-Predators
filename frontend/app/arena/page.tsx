'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { fighters } from '@/lib/fighters';
import { Fighter } from '@/lib/types';
import FightViewer from '@/components/fight/FightViewer';

function FighterPicker({ selected, onSelect, disabledId }: { selected: Fighter | null; onSelect: (f: Fighter) => void; disabledId?: string }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {fighters.map((f) => {
        const isSelected = selected?.id === f.id;
        const isDisabled = f.id === disabledId;
        return (
          <button
            key={f.id}
            onClick={() => !isDisabled && onSelect(f)}
            disabled={isDisabled}
            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
              isSelected
                ? 'ring-2 ring-red-500 scale-105'
                : isDisabled
                ? 'opacity-30 cursor-not-allowed'
                : 'border-white/10 hover:border-white/30 hover:scale-105'
            }`}
            style={isSelected ? { borderColor: f.color } : undefined}
          >
            <Image src={f.image} alt={f.name} fill className="object-cover" style={{ objectPosition: f.focalPoint || 'center center' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-1.5 left-1.5 right-1.5 text-center">
              <div className="text-[10px] md:text-xs font-bold uppercase text-white truncate">{f.name}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function ArenaPage() {
  const [fighter1, setFighter1] = useState<Fighter | null>(null);
  const [fighter2, setFighter2] = useState<Fighter | null>(null);
  const [fighting, setFighting] = useState(false);

  if (fighting && fighter1 && fighter2) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => setFighting(false)}
          className="mb-4 text-sm text-gray-400 hover:text-white transition-colors uppercase tracking-wider font-bold"
        >
          &larr; Back to Fighter Select
        </button>
        <FightViewer left={fighter1} right={fighter2} onBack={() => setFighting(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-2">
          The <span className="text-red-500">Arena</span>
        </h1>
        <div className="flex items-center gap-3 mb-8">
          <p className="text-gray-400">Pick two fighters and watch them battle.</p>
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
            Demo Mode
          </span>
        </div>
      </motion.div>

      {/* Coming soon banner */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-center">
        <div className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-2">Coming Soon</div>
        <div className="text-white font-bold text-lg">Live Fights & Betting Pools</div>
        <p className="text-gray-500 text-sm mt-1">On-chain fights with real MON bets are coming. Try a demo fight below.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Fighter 1 picker */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
            Fighter 1
            {fighter1 && <span className="ml-2" style={{ color: fighter1.color }}>{fighter1.name}</span>}
          </h2>
          <FighterPicker selected={fighter1} onSelect={setFighter1} disabledId={fighter2?.id} />
        </div>

        {/* Fighter 2 picker */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
            Fighter 2
            {fighter2 && <span className="ml-2" style={{ color: fighter2.color }}>{fighter2.name}</span>}
          </h2>
          <FighterPicker selected={fighter2} onSelect={setFighter2} disabledId={fighter1?.id} />
        </div>
      </div>

      {/* VS preview + start button */}
      {fighter1 && fighter2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 relative rounded-xl overflow-hidden border-2" style={{ borderColor: fighter1.color }}>
                <Image src={fighter1.image} alt={fighter1.name} fill className="object-cover" style={{ objectPosition: fighter1.focalPoint || 'center center' }} />
              </div>
              <span className="text-sm font-black uppercase" style={{ color: fighter1.color }}>{fighter1.name}</span>
            </div>
            <span className="text-3xl font-black text-red-500">VS</span>
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 relative rounded-xl overflow-hidden border-2" style={{ borderColor: fighter2.color }}>
                <Image src={fighter2.image} alt={fighter2.name} fill className="object-cover" style={{ objectPosition: fighter2.focalPoint || 'center center' }} />
              </div>
              <span className="text-sm font-black uppercase" style={{ color: fighter2.color }}>{fighter2.name}</span>
            </div>
          </div>
          <button
            onClick={() => setFighting(true)}
            className="px-10 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-lg uppercase tracking-wider transition-all hover:scale-105"
          >
            Start Demo Fight
          </button>
        </motion.div>
      )}
    </div>
  );
}
