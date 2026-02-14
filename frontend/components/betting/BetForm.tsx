'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Fighter } from '@/lib/types';

const PRESETS = [0.1, 0.5, 1, 5];

export default function BetForm({
  fighter1,
  fighter2,
  pool1,
  pool2,
  onPlaceBet,
  isPlacing,
}: {
  fighter1: Fighter;
  fighter2: Fighter;
  pool1: number;
  pool2: number;
  onPlaceBet: (fighterId: string, amount: number) => void;
  isPlacing: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount] = useState(1);
  const [customMode, setCustomMode] = useState(false);

  const total = pool1 + pool2 + amount;
  const myPool = selected === fighter1.id ? pool1 + amount : pool2 + amount;
  const payout = total > 0 ? (amount / myPool) * total : 0;

  return (
    <div className="space-y-6">
      {/* Face-off layout */}
      <div className="flex items-center justify-center gap-4">
        {[fighter1, fighter2].map((f, i) => (
          <motion.button
            key={f.id}
            onClick={() => setSelected(f.id)}
            className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              selected === f.id
                ? 'border-red-500 bg-red-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-20 h-20 md:w-28 md:h-28 relative rounded-xl overflow-hidden border-2" style={{ borderColor: f.color }}>
              <Image
                src={f.image}
                alt={f.name}
                fill
                className="object-cover"
                style={{ objectPosition: f.focalPoint || 'center center' }}
              />
            </div>
            <div className="text-center">
              <div className="font-black uppercase tracking-wider text-white">{f.name}</div>
              <div className="text-xs text-gray-500">{f.animal}</div>
            </div>
          </motion.button>
        ))}
        <div className="absolute text-2xl font-black text-red-500 pointer-events-none" style={{ position: 'relative', flex: 'none', margin: '0 -1rem' }}>
        </div>
      </div>
      {/* VS overlay */}
      <div className="flex justify-center -mt-10 mb-2">
        <span className="text-2xl font-black text-red-500 uppercase tracking-widest">VS</span>
      </div>

      {/* Amount */}
      {selected && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Bet Amount (MON)</div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => { setAmount(p); setCustomMode(false); }}
                className={`py-2 rounded-lg font-bold text-sm transition-all ${
                  amount === p && !customMode
                    ? 'bg-red-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {p} MON
              </button>
            ))}
          </div>
          <button
            onClick={() => setCustomMode(true)}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Custom amount
          </button>
          {customMode && (
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full mt-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono focus:border-red-500 focus:outline-none"
              min={0.01}
              step={0.1}
            />
          )}

          {/* Potential payout */}
          <div className="mt-4 p-3 bg-white/5 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Potential Payout</span>
              <span className="font-bold text-red-400 font-mono">{payout.toFixed(2)} MON</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Multiplier</span>
              <span className="text-gray-400 font-mono">{(payout / amount).toFixed(2)}x</span>
            </div>
          </div>

          <button
            onClick={() => onPlaceBet(selected, amount)}
            disabled={isPlacing}
            className="w-full mt-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-black uppercase tracking-wider rounded-xl transition-all text-lg"
          >
            {isPlacing ? 'Placing Bet...' : `Bet ${amount} MON on ${selected === fighter1.id ? fighter1.name : fighter2.name}`}
          </button>
        </motion.div>
      )}
    </div>
  );
}
