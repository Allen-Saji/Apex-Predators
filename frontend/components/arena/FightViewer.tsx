'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Fighter } from '@/lib/types';
import { useFight } from '@/hooks/useFight';
import HealthBar from './HealthBar';
import DamageNumber from './DamageNumber';
import FightLog from './FightLog';
import ArenaBackground from './ArenaBackground';

export default function FightViewer({ left, right }: { left: Fighter; right: Fighter }) {
  const {
    turns, turnIndex, running, done, hpLeft, hpRight, log,
    showDamage, hitSide, attackSide, screenShake, ko, introPhase,
    startFight, winner,
  } = useFight(left, right);

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

          {/* VS / Critical text */}
          <div className="flex flex-col items-center gap-2">
            <AnimatePresence>
              {showDamage?.isCrit && (
                <motion.div
                  className="text-yellow-400 font-black text-xl md:text-3xl uppercase"
                  style={{ textShadow: '0 0 20px rgba(250,204,21,0.6)' }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  CRITICAL!
                </motion.div>
              )}
            </AnimatePresence>
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

        {/* KO overlay */}
        <AnimatePresence>
          {done && ko && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-red-900/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                className="text-7xl md:text-9xl font-black text-red-500"
                style={{ textShadow: '0 0 60px rgba(239,68,68,.8)' }}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
              >
                K.O.!
              </motion.div>
              <motion.div
                className="text-2xl md:text-3xl font-bold text-amber-400 mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                🏆 {winner?.name} Wins!
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sound toggle (UI only) */}
        <button className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors text-xl">
          🔇
        </button>

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

        <FightLog log={log} />
      </motion.div>
    </div>
  );
}
