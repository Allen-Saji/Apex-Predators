'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export type CommentaryType = 'intro' | 'normal' | 'heavy' | 'crit' | 'low' | 'ko';

export interface CommentaryEvent {
  id: number;
  text: string;
  subText?: string;
  type: CommentaryType;
}

const DURATIONS: Record<CommentaryType, number> = {
  intro: 2500,
  normal: 2500,
  heavy: 2500,
  crit: 3000,
  low: 1800,
  ko: 999999,
};

export default function CommentaryOverlay({ event, onClear }: { event: CommentaryEvent | null; onClear: () => void }) {
  const [visible, setVisible] = useState<CommentaryEvent | null>(null);

  useEffect(() => {
    if (!event) { setVisible(null); return; }
    setVisible(event);
    if (event.type === 'ko') return;
    const t = setTimeout(() => { setVisible(null); onClear(); }, DURATIONS[event.type]);
    return () => clearTimeout(t);
  }, [event, onClear]);

  return (
    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
      <AnimatePresence mode="wait">
        {visible && visible.type === 'crit' && (
          <motion.div
            key={`flash-${visible.id}`}
            className="absolute inset-0"
            style={{ boxShadow: 'inset 0 0 120px 60px rgba(220,38,38,0.4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.6, 1, 0] }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {visible && <OverlayContent key={visible.id} event={visible} />}
      </AnimatePresence>
    </div>
  );
}

function OverlayContent({ event }: { event: CommentaryEvent }) {
  switch (event.type) {
    case 'intro':
      return (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <span
            className="text-5xl sm:text-7xl md:text-9xl font-black uppercase text-red-500 select-none"
            style={{ textShadow: '0 0 40px rgba(220,38,38,0.8), 0 0 80px rgba(220,38,38,0.4)' }}
          >
            🔔 FIGHT!
          </span>
        </motion.div>
      );

    case 'ko':
      return (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-6xl sm:text-8xl md:text-9xl font-black uppercase select-none"
            style={{
              color: '#FFD700',
              textShadow: '0 0 40px rgba(255,215,0,0.8), 0 0 80px rgba(220,38,38,0.6)',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.15, 1] }}
            transition={{ type: 'spring', stiffness: 250, damping: 12 }}
          >
            🏆 K.O.!
          </motion.div>
          {event.subText && (
            <motion.div
              className="text-xl sm:text-2xl md:text-4xl font-black uppercase mt-4 text-amber-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ textShadow: '0 0 20px rgba(255,215,0,0.5)' }}
            >
              {event.subText}
            </motion.div>
          )}
          {/* Sparkle particles */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: i % 2 === 0 ? '#FFD700' : '#DC2626',
                  left: `${10 + Math.random() * 80}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  y: [0, -40 - Math.random() * 60],
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.3 + i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />
            ))}
          </div>
        </motion.div>
      );

    case 'crit':
      return (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0.8, 1], scale: [0, 1.2, 1] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span
            className="text-3xl sm:text-5xl md:text-7xl font-black uppercase select-none"
            style={{
              color: '#FFD700',
              textShadow: '0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,215,0,0.4)',
            }}
          >
            ⚡ CRITICAL HIT ⚡
          </span>
          {event.subText && (
            <motion.div
              className="mt-3 px-6 py-2 bg-black/70 backdrop-blur-sm border-l-4 border-yellow-500"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-base sm:text-xl md:text-2xl font-black uppercase text-yellow-300"
                style={{ textShadow: '0 0 10px rgba(255,215,0,0.5)' }}
              >
                {event.subText}
              </span>
            </motion.div>
          )}
        </motion.div>
      );

    case 'heavy':
      return (
        <motion.div
          className="absolute bottom-16 sm:bottom-20 left-0 right-0 flex justify-center"
          initial={{ x: '-100%' }}
          animate={{ x: ['-100%', '0%', '0%', '0%'] }}
          exit={{ x: '100%' }}
          transition={{ duration: 1.2, times: [0, 0.2, 0.85, 1] }}
        >
          <motion.div
            className="px-6 py-3 bg-black/70 backdrop-blur-sm border-l-4 border-yellow-500 max-w-[90%]"
            animate={{ x: [0, -5, 5, -3, 3, 0] }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <span
              className="text-lg sm:text-2xl md:text-3xl font-black uppercase select-none"
              style={{ color: '#FFD700', textShadow: '0 0 15px rgba(255,215,0,0.5)' }}
            >
              💥 {event.text}
            </span>
          </motion.div>
        </motion.div>
      );

    case 'low':
      return (
        <motion.div
          className="absolute bottom-16 sm:bottom-20 left-0 right-0 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-4 py-2 bg-black/50 backdrop-blur-sm border-l-4 border-gray-600 max-w-[90%]">
            <span className="text-sm sm:text-base md:text-lg font-bold text-gray-400 select-none">
              {event.text}
            </span>
          </div>
        </motion.div>
      );

    default: // normal
      return (
        <motion.div
          className="absolute bottom-16 sm:bottom-20 left-0 right-0 flex justify-center"
          initial={{ x: '-100%' }}
          animate={{ x: ['-100%', '0%', '0%', '0%'] }}
          exit={{ x: '100%' }}
          transition={{ duration: 1.2, times: [0, 0.2, 0.85, 1] }}
        >
          <div className="px-6 py-3 bg-black/70 backdrop-blur-sm border-l-4 border-red-600 max-w-[90%]">
            <span className="text-base sm:text-xl md:text-2xl font-black uppercase text-white select-none">
              {event.text}
            </span>
          </div>
        </motion.div>
      );
  }
}
