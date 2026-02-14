'use client';

import Image from 'next/image';
import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fighter } from '@/lib/types';
import { useFight } from '@/hooks/useFight';
import { useFightSounds } from '@/hooks/useFightSounds';
import HealthBar from './HealthBar';
import DamageNumber from './DamageNumber';
import ArenaBackground from './ArenaBackground';
import CommentaryOverlay, { CommentaryEvent, CommentaryType } from './CommentaryOverlay';
import { SkullIcon, MicIcon, SpeakerIcon, SpeakerMuteIcon, FistIcon, RefreshIcon } from '@/components/icons';
import TrashTalk from './TrashTalk';
import PostFightReaction from './PostFightReaction';

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
    // Don't fire commentary for KO — FightViewer handles it directly
  }, [onKo]);

  const [showTrashTalk, setShowTrashTalk] = useState(true);

  const {
    turns, turnIndex, running, done, hpLeft, hpRight, log,
    showDamage, hitSide, attackSide, screenShake, ko, koPhase, introPhase,
    startFight, winner,
  } = useFight(left, right, { onFightStart: wrappedOnFightStart, onAttack: wrappedOnAttack, onKo: wrappedOnKo, onFightEnd });

  const handleStartFight = useCallback(() => {
    setShowTrashTalk(false);
    startFight();
  }, [startFight]);

  const isKoActive = koPhase !== null;
  const winnerSide: 'left' | 'right' | null = ko === 'left' ? 'right' : ko === 'right' ? 'left' : null;
  const winnerFighter = winnerSide === 'left' ? left : winnerSide === 'right' ? right : null;
  const winnerColor = winnerFighter?.color ?? '#FFD700';

  // Helper: should this side show winner treatment?
  const isWinner = (side: 'left' | 'right') => winnerSide === side;
  const isLoser = (side: 'left' | 'right') => ko === side;

  // Fighter animation for a given side
  const getFighterAnimate = (side: 'left' | 'right') => {
    const fighter = side === 'left' ? left : right;
    const flipSign = side === 'left' ? 1 : -1;

    if (isLoser(side) && isKoActive) {
      return {
        opacity: 0.4,
        rotate: side === 'left' ? 8 : -8,
        y: 20,
        scale: 0.9,
      };
    }
    if (isWinner(side) && koPhase && koPhase !== 'impact') {
      const settleScale = koPhase === 'settle' ? undefined : 1.3; // breathing handled by CSS animation
      return {
        scale: 1.3,
        y: -20,
      };
    }
    if (attackSide === side) return { x: 80 * flipSign, scale: 1.1 };
    if (hitSide === side) return { x: [0, -12, 12, -10, 10, -5, 5, 0] };
    if (running && !introPhase) return { y: [0, -4, 0, -4, 0], transition: { duration: 2, repeat: Infinity, delay: side === 'right' ? 0.5 : 0 } };
    return { x: 0, opacity: 1, rotate: 0, y: 0, scale: 1 };
  };

  const getFighterTransition = (side: 'left' | 'right') => {
    if (isLoser(side) && isKoActive) return { duration: 0.8 };
    if (isWinner(side) && koPhase && koPhase !== 'impact') return { duration: 0.8 };
    if (attackSide === side) return { type: 'spring' as const, stiffness: 400, damping: 15 };
    return { duration: 0.3 };
  };

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
              className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]"
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
                    <Image src={left.image} alt={left.name} fill className="object-cover" style={{ objectPosition: left.focalPoint || "center center" }} />
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
                    <Image src={right.image} alt={right.name} fill className="object-cover" style={{ objectPosition: right.focalPoint || "center center" }} />
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

        {/* White flash on KO impact */}
        <AnimatePresence>
          {koPhase === 'impact' && (
            <motion.div
              className="absolute inset-0 z-40 bg-white pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0] }}
              transition={{ duration: 0.15 }}
            />
          )}
        </AnimatePresence>

        {/* Dark cinematic overlay */}
        <AnimatePresence>
          {(koPhase === 'cinematic' || koPhase === 'announce' || koPhase === 'settle') && (
            <motion.div
              className="absolute inset-0 bg-black/80 z-20 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>

        {/* Turn counter — fades out during KO */}
        <AnimatePresence>
          {turnIndex >= 0 && !introPhase && !isKoActive && (
            <motion.div
              className="text-center text-sm text-gray-400 mb-4 font-mono"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              Round {turnIndex + 1} / {turns.length}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fighters */}
        <div className="flex items-center justify-between relative" style={{ minHeight: 350 }}>
          {/* Left fighter */}
          <div className={`flex flex-col items-center gap-3 w-[40%] ${isWinner('left') && koPhase && koPhase !== 'impact' ? 'z-30 relative' : ''}`}>
            <span className="text-sm font-black uppercase tracking-wider" style={{ color: left.color }}>
              {left.name}
            </span>

            {/* HP bar — fades out during KO */}
            <AnimatePresence>
              {!isKoActive && (
                <motion.div className="w-full max-w-[200px]" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <HealthBar hp={hpLeft} maxHp={100} />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className={`relative w-32 h-32 md:w-44 md:h-44 rounded-xl overflow-hidden ${isLoser('left') && isKoActive ? 'grayscale' : ''}`}
              style={{
                border: `2px solid ${left.color}44`,
                ...(isWinner('left') && koPhase && koPhase !== 'impact'
                  ? { boxShadow: `0 0 30px ${left.color}, 0 0 60px ${left.color}88, 0 0 90px ${left.color}44` }
                  : {}),
              }}
              animate={getFighterAnimate('left')}
              transition={getFighterTransition('left')}
            >
              <Image src={left.image} alt={left.name} fill className="object-cover" style={{ objectPosition: left.focalPoint || "center center" }} />
              {hitSide === 'left' && (
                <motion.div
                  className="absolute inset-0 bg-red-500/40"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                />
              )}
            </motion.div>

            {/* Winner breathing pulse */}
            {isWinner('left') && koPhase === 'settle' && (
              <style>{`
                @keyframes winner-breathe { 0%, 100% { transform: scale(1.3); } 50% { transform: scale(1.28); } }
              `}</style>
            )}

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
          <div className={`flex flex-col items-center gap-3 w-[40%] ${isWinner('right') && koPhase && koPhase !== 'impact' ? 'z-30 relative' : ''}`}>
            <span className="text-sm font-black uppercase tracking-wider" style={{ color: right.color }}>
              {right.name}
            </span>

            {/* HP bar — fades out during KO */}
            <AnimatePresence>
              {!isKoActive && (
                <motion.div className="w-full max-w-[200px]" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <HealthBar hp={hpRight} maxHp={100} reverse />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className={`relative w-32 h-32 md:w-44 md:h-44 rounded-xl overflow-hidden ${isLoser('right') && isKoActive ? 'grayscale' : ''}`}
              style={{
                border: `2px solid ${right.color}44`,
                transform: 'scaleX(-1)',
                ...(isWinner('right') && koPhase && koPhase !== 'impact'
                  ? { boxShadow: `0 0 30px ${right.color}, 0 0 60px ${right.color}88, 0 0 90px ${right.color}44` }
                  : {}),
              }}
              animate={getFighterAnimate('right')}
              transition={getFighterTransition('right')}
            >
              <Image src={right.image} alt={right.name} fill className="object-cover" style={{ objectPosition: right.focalPoint || "center center" }} />
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

        {/* KO Announcement — positioned in top third, above fighters */}
        <AnimatePresence>
          {(koPhase === 'announce' || koPhase === 'settle') && (
            <motion.div
              className="absolute inset-x-0 top-[10%] z-40 flex flex-col items-center pointer-events-none"
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
                <SkullIcon size={48} className="inline-block" /> K.O.!
              </motion.div>
              {winnerFighter && (
                <motion.div
                  className="text-xl sm:text-2xl md:text-4xl font-black uppercase mt-4 text-amber-400"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  style={{ textShadow: '0 0 20px rgba(255,215,0,0.5)' }}
                >
                  {winnerFighter.name.toUpperCase()} WINS!
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sparkle particles around winner during announce/settle */}
        <AnimatePresence>
          {(koPhase === 'announce' || koPhase === 'settle') && winnerSide && (
            <div className={`absolute z-30 pointer-events-none ${winnerSide === 'left' ? 'left-[5%] w-[45%]' : 'right-[5%] w-[45%]'}`} style={{ top: '20%', bottom: '20%' }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: i % 2 === 0 ? '#FFD700' : winnerColor,
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`,
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
          )}
        </AnimatePresence>

        {/* Commentary overlay */}
        <CommentaryOverlay event={commentaryEvent} onClear={clearCommentary} />

        {/* Sound toggles */}
        <div className="absolute top-4 right-4 flex gap-2 z-50">
          <button
            onClick={toggleCommentary}
            className={`transition-colors text-xl ${commentaryOn && !muted ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-400'}`}
            title={commentaryOn ? 'Disable commentary' : 'Enable commentary'}
          >
            <MicIcon size={20} />
          </button>
          <button
            onClick={toggleMute}
            className="text-gray-600 hover:text-white transition-colors text-xl"
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <SpeakerMuteIcon size={20} /> : <SpeakerIcon size={20} />}
          </button>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          {!running && !done && !isKoActive && (
            <button
              onClick={handleStartFight}
              className="px-10 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-lg uppercase tracking-wider transition-all hover:scale-105"
            >
              <FistIcon size={20} className="inline-block mr-2" /> Start Fight
            </button>
          )}
          <AnimatePresence>
            {koPhase === 'settle' && (
              <motion.button
                onClick={handleStartFight}
                className="px-10 py-4 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-lg uppercase tracking-wider transition-all hover:scale-105 z-40 relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <RefreshIcon size={20} className="inline-block mr-2" /> Rematch
              </motion.button>
            )}
          </AnimatePresence>
        </div>

      </motion.div>

      {/* Pre-fight trash talk */}
      <AnimatePresence>
        {showTrashTalk && !running && !done && (
          <motion.div
            className="w-full max-w-4xl relative z-10"
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TrashTalk left={left} right={right} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post-fight reactions */}
      <AnimatePresence>
        {koPhase === 'settle' && winnerFighter && (
          <motion.div
            className="w-full max-w-4xl relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <PostFightReaction
              winner={winnerSide === 'left' ? left : right}
              loser={winnerSide === 'left' ? right : left}
              method="knockout"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
