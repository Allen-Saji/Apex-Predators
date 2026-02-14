'use client';

import Image from 'next/image';
import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fighter } from '@/lib/types';
import { useFight } from '@/hooks/useFight';
import { useFightSounds } from '@/hooks/useFightSounds';
import HealthBar from './HealthBar';
import DamageNumber from './DamageNumber';
import ArenaBackground from './ArenaBackground';
import CommentaryOverlay, { CommentaryEvent, CommentaryType } from './CommentaryOverlay';

export default function FightViewer({ left, right }: { left: Fighter; right: Fighter }) {
  const { muted, commentaryOn, onFightStart, onAttack, onKo, onFightEnd, toggleMute, toggleCommentary } = useFightSounds();
  const [commentaryEvent, setCommentaryEvent] = useState<CommentaryEvent | null>(null);
  const commentaryIdRef = useRef(0);

  const fireCommentary = useCallback((text: string, type: CommentaryType, subText?: string) => {
    commentaryIdRef.current += 1;
    setCommentaryEvent({ id: commentaryIdRef.current, text, type, subText });
  }, []);

  const clearCommentary = useCallback(() => setCommentaryEvent(null), []);

  const wrappedOnFightStart = useCallback((f1?: string, f2?: string) => {
    onFightStart(f1, f2);
    fireCommentary('FIGHT!', 'intro');
  }, [onFightStart, fireCommentary]);

  const wrappedOnAttack = useCallback((damage: number, isCrit: boolean, attackerName?: string, moveName?: string) => {
    onAttack(damage, isCrit, attackerName, moveName);
    const name = (attackerName ?? '').toUpperCase();
    const move = moveName ?? 'Attack';
    const hitText = `${name} ► ${move} — ${damage} DMG`;
    let type: CommentaryType = 'normal';
    if (isCrit) type = 'crit';
    else if (damage >= 15) type = 'heavy';
    else if (damage <= 5) type = 'low';
    if (type === 'crit') {
      fireCommentary('CRITICAL HIT', 'crit', hitText);
    } else {
      fireCommentary(hitText, type);
    }
  }, [onAttack, fireCommentary]);

  const wrappedOnKo = useCallback((winnerName?: string, loserName?: string) => {
    onKo(winnerName, loserName);
    fireCommentary('K.O.!', 'ko', `${winnerName?.toUpperCase()} WINS!`);
  }, [onKo, fireCommentary]);

  const {
    turns, turnIndex, running, done, hpLeft, hpRight, log,
    showDamage, hitSide, attackSide, screenShake, ko, introPhase,
    startFight, winner,
  } = useFight(left, right, { onFightStart: wrappedOnFightStart, onAttack: wrappedOnAttack, onKo: wrappedOnKo, onFightEnd });

  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center p-4">
      <ArenaBackground />

      <motion.div
        className="w-full max-w-4xl relative z-10"
        animate={screenShake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {/* Arena header */}
        <div className="text-center mb-4">
          <span className="text-xs uppercase tracking-[0.3em] text-gray-500">Season 1 · The Jungle</span>
        </div>

        {/* Intro overlay */}
        <AnimatePresence>
          {introPhase && (
            <motion.div
              className="absolute inset-0 z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-4 md:gap-12">
                <motion.div
                  initial={{ x: -200, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
                  className="text-center"
                >
                  <div className="w-28 h-28 md:w-40 md:h-40 relative rounded-xl overflow-hidden border-2 mb-3" style={{ borderColor: left.color }}>
                    <Image src={left.image} alt={left.name} fill className="object-cover" />
                  </div>
                  <div className="font-black text-xl md:text-3xl uppercase text-white">{left.name}</div>
                  <div className="text-xs text-gray-500 uppercase">{left.animal}</div>
                  <div className="flex gap-2 justify-center mt-1 text-xs font-mono">
                    <span className="text-green-400">{left.wins}W</span>
                    <span className="text-red-400">{left.losses}L</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
                  className="text-4xl md:text-6xl font-black text-red-500"
                  style={{ textShadow: '0 0 30px rgba(220,38,38,0.5)' }}
                >
                  VS
                </motion.div>

                <motion.div
                  initial={{ x: 200, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
                  className="text-center"
                >
                  <div className="w-28 h-28 md:w-40 md:h-40 relative rounded-xl overflow-hidden border-2 mb-3" style={{ borderColor: right.color }}>
                    <Image src={right.image} alt={right.name} fill className="object-cover" />
                  </div>
                  <div className="font-black text-xl md:text-3xl uppercase text-white">{right.name}</div>
                  <div className="text-xs text-gray-500 uppercase">{right.animal}</div>
                  <div className="flex gap-2 justify-center mt-1 text-xs font-mono">
                    <span className="text-green-400">{right.wins}W</span>
                    <span className="text-red-400">{right.losses}L</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Turn counter */}
        {turnIndex >= 0 && !introPhase && (
          <div className="text-center text-sm text-gray-400 mb-4 font-mono">
            Round {turnIndex + 1} / {turns.length}
          </div>
        )}

        {/* Fighters */}
        <div className="flex items-center justify-between relative" style={{ minHeight: 350 }}>
          {/* Left fighter */}
          <div className="flex flex-col items-center gap-3 w-[40%]">
            <span className="text-sm font-black uppercase tracking-wider" style={{ color: left.color }}>
              {left.name}
            </span>
            <div className="w-full max-w-[200px]">
              <HealthBar hp={hpLeft} maxHp={100} />
            </div>
            <motion.div
              className="relative w-32 h-32 md:w-44 md:h-44 rounded-xl overflow-hidden"
              style={{ border: `2px solid ${left.color}44` }}
              animate={
                ko === 'left'
                  ? { opacity: 0, rotate: 90, y: 80, scale: 0.5 }
                  : attackSide === 'left'
                  ? { x: 80, scale: 1.1 }
                  : hitSide === 'left'
                  ? { x: [0, -12, 12, -10, 10, -5, 5, 0] }
                  : running && !introPhase
                  ? { y: [0, -4, 0, -4, 0], transition: { duration: 2, repeat: Infinity } }
                  : { x: 0, opacity: 1, rotate: 0, y: 0, scale: 1 }
              }
              transition={
                ko === 'left'
                  ? { duration: 1 }
                  : attackSide === 'left'
                  ? { type: 'spring', stiffness: 400, damping: 15 }
                  : { duration: 0.3 }
              }
            >
              <Image src={left.image} alt={left.name} fill className="object-cover" />
              {hitSide === 'left' && (
                <motion.div
                  className="absolute inset-0 bg-red-500/40"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                />
              )}
            </motion.div>
            <AnimatePresence>
              {showDamage && showDamage.side === 'left' && (
                <DamageNumber key={`dmg-l-${turnIndex}`} {...showDamage} />
              )}
            </AnimatePresence>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center gap-2">
            {!running && !done && (
              <div className="text-4xl font-black text-gray-700 select-none">VS</div>
            )}
          </div>

          {/* Right fighter */}
          <div className="flex flex-col items-center gap-3 w-[40%]">
            <span className="text-sm font-black uppercase tracking-wider" style={{ color: right.color }}>
              {right.name}
            </span>
            <div className="w-full max-w-[200px]">
              <HealthBar hp={hpRight} maxHp={100} reverse />
            </div>
            <motion.div
              className="relative w-32 h-32 md:w-44 md:h-44 rounded-xl overflow-hidden"
              style={{ border: `2px solid ${right.color}44`, transform: 'scaleX(-1)' }}
              animate={
                ko === 'right'
                  ? { opacity: 0, rotate: -90, y: 80, scale: 0.5 }
                  : attackSide === 'right'
                  ? { x: -80, scale: 1.1 }
                  : hitSide === 'right'
                  ? { x: [0, -12, 12, -10, 10, -5, 5, 0] }
                  : running && !introPhase
                  ? { y: [0, -4, 0, -4, 0], transition: { duration: 2, repeat: Infinity, delay: 0.5 } }
                  : { x: 0, opacity: 1, rotate: 0, y: 0, scale: 1 }
              }
              transition={
                ko === 'right'
                  ? { duration: 1 }
                  : attackSide === 'right'
                  ? { type: 'spring', stiffness: 400, damping: 15 }
                  : { duration: 0.3 }
              }
            >
              <Image src={right.image} alt={right.name} fill className="object-cover" />
              {hitSide === 'right' && (
                <motion.div
                  className="absolute inset-0 bg-red-500/40"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                />
              )}
            </motion.div>
            <AnimatePresence>
              {showDamage && showDamage.side === 'right' && (
                <DamageNumber key={`dmg-r-${turnIndex}`} {...showDamage} />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Commentary overlay */}
        <CommentaryOverlay event={commentaryEvent} onClear={clearCommentary} />

        {/* Sound toggles */}
        <div className="absolute top-4 right-4 flex gap-2 z-50">
          <button
            onClick={toggleCommentary}
            className={`transition-colors text-xl ${commentaryOn && !muted ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-400'}`}
            title={commentaryOn ? 'Disable commentary' : 'Enable commentary'}
          >
            🎙️
          </button>
          <button
            onClick={toggleMute}
            className="text-gray-600 hover:text-white transition-colors text-xl"
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          {!running && !done && (
            <button
              onClick={startFight}
              className="px-10 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-lg uppercase tracking-wider transition-all hover:scale-105"
            >
              ⚔️ Start Fight
            </button>
          )}
          {done && (
            <button
              onClick={startFight}
              className="px-10 py-4 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-lg uppercase tracking-wider transition-all hover:scale-105"
            >
              🔄 Rematch
            </button>
          )}
        </div>

      </motion.div>
    </div>
  );
}
