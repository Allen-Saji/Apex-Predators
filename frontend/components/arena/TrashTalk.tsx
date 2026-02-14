'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Fighter } from '@/lib/types';
import { getTrashTalk } from '@/lib/agent-api';

interface TrashTalkLine {
  fighterId: string;
  side: 'left' | 'right';
  text: string;
}

export default function TrashTalk({
  left,
  right,
  onComplete,
}: {
  left: Fighter;
  right: Fighter;
  onComplete?: () => void;
}) {
  const [lines, setLines] = useState<TrashTalkLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchExchanges = useCallback(async () => {
    setLoading(true);
    setError(false);
    const newLines: TrashTalkLine[] = [];

    try {
      // 3 exchanges: left, right, left
      const pairs: [Fighter, Fighter, 'left' | 'right'][] = [
        [left, right, 'left'],
        [right, left, 'right'],
        [left, right, 'left'],
      ];

      for (const [speaker, target, side] of pairs) {
        const resp = await getTrashTalk(speaker.id, target.id);
        newLines.push({ fighterId: speaker.id, side, text: resp.text });
      }

      setLines(newLines);
    } catch {
      setError(true);
      // Use catchphrases as fallback
      setLines([
        { fighterId: left.id, side: 'left', text: left.catchphrase },
        { fighterId: right.id, side: 'right', text: right.catchphrase },
        { fighterId: left.id, side: 'left', text: 'Let\'s settle this in the arena.' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [left, right]);

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  useEffect(() => {
    if (!loading && lines.length > 0 && onComplete) {
      const timer = setTimeout(onComplete, lines.length * 3000 + 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, lines, onComplete]);

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto py-8">
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">Pre-Fight Trash Talk</div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
          <div className="text-gray-600 text-sm mt-3">Fighters are warming up...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-6">
      <div className="text-center mb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-gray-500">Pre-Fight Trash Talk</div>
        {error && (
          <div className="text-xs text-gray-600 mt-1">Agent API unavailable — showing catchphrases</div>
        )}
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {lines.map((line, i) => {
            const fighter = line.side === 'left' ? left : right;
            const isLeft = line.side === 'left';

            return (
              <motion.div
                key={i}
                className={`flex items-start gap-3 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
                initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 1.5, duration: 0.5, type: 'spring', stiffness: 100 }}
              >
                {/* Fighter avatar */}
                <div
                  className="w-12 h-12 rounded-lg overflow-hidden border flex-shrink-0"
                  style={{ borderColor: `${fighter.color}66` }}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={fighter.image}
                      alt={fighter.name}
                      fill
                      className="object-cover"
                      style={{ objectPosition: fighter.focalPoint || 'center center' }}
                    />
                  </div>
                </div>

                {/* Speech bubble */}
                <div
                  className={`relative max-w-[75%] px-4 py-3 rounded-xl border border-white/5 ${
                    isLeft ? 'bg-white/5' : 'bg-white/5'
                  }`}
                >
                  <div
                    className="text-[10px] uppercase tracking-wider font-bold mb-1"
                    style={{ color: fighter.color }}
                  >
                    {fighter.name}
                  </div>
                  <div className="text-sm text-gray-200 leading-relaxed">
                    &ldquo;{line.text}&rdquo;
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
