'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Fighter } from '@/lib/types';
import { getFightReaction } from '@/lib/agent-api';

export default function PostFightReaction({
  winner,
  loser,
  method,
}: {
  winner: Fighter;
  loser: Fighter;
  method: string;
}) {
  const [winnerText, setWinnerText] = useState<string | null>(null);
  const [loserText, setLoserText] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      try {
        const [wResp, lResp] = await Promise.all([
          getFightReaction(winner.id, loser.id, true, method),
          getFightReaction(loser.id, winner.id, false, method),
        ]);
        if (!cancelled) {
          setWinnerText(wResp.text);
          setLoserText(lResp.text);
        }
      } catch {
        if (!cancelled) {
          setWinnerText(winner.catchphrase);
          setLoserText('...');
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [winner, loser, method]);

  if (!loaded) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mt-8">
      <div className="text-center mb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-gray-500">Post-Fight Reactions</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Winner card */}
        <AnimatePresence>
          {winnerText && (
            <motion.div
              className="relative border border-white/10 rounded-xl p-5 bg-white/5 overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div
                className="absolute top-0 left-0 w-full h-1"
                style={{ background: winner.color }}
              />
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg overflow-hidden border flex-shrink-0"
                  style={{ borderColor: `${winner.color}66` }}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={winner.image}
                      alt={winner.name}
                      fill
                      className="object-cover"
                      style={{ objectPosition: winner.focalPoint || 'center center' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold uppercase" style={{ color: winner.color }}>
                    {winner.name}
                  </div>
                  <div className="text-[10px] text-green-400 uppercase tracking-wider">Winner</div>
                </div>
              </div>
              <div className="text-sm text-gray-200 leading-relaxed italic">
                &ldquo;{winnerText}&rdquo;
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loser card */}
        <AnimatePresence>
          {loserText && (
            <motion.div
              className="relative border border-white/5 rounded-xl p-5 bg-white/[0.02] overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-700" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 grayscale">
                  <div className="relative w-full h-full">
                    <Image
                      src={loser.image}
                      alt={loser.name}
                      fill
                      className="object-cover"
                      style={{ objectPosition: loser.focalPoint || 'center center' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold uppercase text-gray-400">
                    {loser.name}
                  </div>
                  <div className="text-[10px] text-red-400 uppercase tracking-wider">Defeated</div>
                </div>
              </div>
              <div className="text-sm text-gray-400 leading-relaxed italic">
                &ldquo;{loserText}&rdquo;
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
