'use client';

import Image from 'next/image';
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fighter, Turn } from '@/lib/types';
import { useFight } from '@/hooks/useFight';
import { useFightSounds } from '@/hooks/useFightSounds';
import SoundEngine from '@/lib/sound-engine';
import HealthBar from './HealthBar';
import DamageNumber from './DamageNumber';
import ArenaBackground from './ArenaBackground';
import CommentaryOverlay, { CommentaryEvent, CommentaryType } from './CommentaryOverlay';
import { SkullIcon, MicIcon, SpeakerIcon, SpeakerMuteIcon, FistIcon, RefreshIcon, CrownIcon } from '@/components/icons';
import TrashTalk from './TrashTalk';
import PostFightReaction from './PostFightReaction';

export default function FightViewer({ left, right, onBack, presetTurns, autoStart, liveMode }: { left: Fighter; right: Fighter; onBack?: () => void; presetTurns?: Turn[]; autoStart?: boolean; liveMode?: boolean }) {
  const { muted, commentaryOn, onFightStart, onAttack, onKo, onFightEnd, toggleMute, toggleCommentary } = useFightSounds();

  // Preload SFX on mount
  useEffect(() => {
    SoundEngine.getInstance().preload();
  }, []);
  const [commentaryEvent, setCommentaryEvent] = useState<CommentaryEvent | null>(null);
  const commentaryIdRef = useRef(0);

  const fireCommentary = useCallback((text: string, type: CommentaryType, subText?: string) => {
    commentaryIdRef.current += 1;
    setCommentaryEvent({ id: commentaryIdRef.current, text, type, subText });
  }, []);

  const clearCommentary = useCallback(() => setCommentaryEvent(null), []);

  const wrappedOnFightStart = useCallback((f1?: string, f2?: string, f1Animal?: string, f2Animal?: string) => {
    onFightStart(f1, f2, f1Animal, f2Animal);
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
    onKo();
    // Don't fire commentary for KO — FightViewer handles it directly
  }, [onKo]);

  const [showTrashTalk, setShowTrashTalk] = useState(!liveMode);
  const [reactionsLoaded, setReactionsLoaded] = useState(false);
  const [liveIntro, setLiveIntro] = useState<'fight' | 'joining' | null>(null);

  const {
    turns, turnIndex, running, done, hpLeft, hpRight, log,
    showDamage, hitSide, attackSide, screenShake, ko, koPhase, introPhase,
    startFight, startLive, winner,
  } = useFight(left, right, { onFightStart: wrappedOnFightStart, onAttack: wrappedOnAttack, onKo: wrappedOnKo, onFightEnd }, presetTurns, liveMode);

  const handleStartFight = useCallback(() => {
    setShowTrashTalk(false);
    setReactionsLoaded(false);
    startFight();
  }, [startFight]);

  // Auto-start when presetTurns are provided and autoStart is set
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStart && presetTurns && presetTurns.length > 0 && !autoStarted.current) {
      autoStarted.current = true;
      if (liveMode) {
        // Brief intro flash before starting
        const joinedLate = presetTurns.length > 2;
        setLiveIntro(joinedLate ? 'joining' : 'fight');
        setTimeout(() => {
          setLiveIntro(null);
          startLive();
          wrappedOnFightStart(left.name, right.name, left.animal, right.animal);
        }, 1500);
      } else {
        handleStartFight();
      }
    }
  }, [autoStart, presetTurns, handleStartFight, liveMode, startLive]);

  const isKoActive = koPhase !== null;
  const winnerSide: 'left' | 'right' | null = ko === 'left' ? 'right' : ko === 'right' ? 'left' : null;
  const winnerFighter = winnerSide === 'left' ? left : winnerSide === 'right' ? right : null;
  const winnerColor = winnerFighter?.color ?? '#FFD700';

  const isLoser = (side: 'left' | 'right') => ko === side;

  // Fighter animation for a given side
  const getFighterAnimate = (side: 'left' | 'right') => {
    const flipSign = side === 'left' ? 1 : -1;

    // During cinematic/impact, subtle KO reaction before takeover covers them
    if (isLoser(side) && koPhase === 'impact') {
      return { opacity: 0.5, rotate: side === 'left' ? 6 : -6, y: 15, scale: 0.95 };
    }
    if (isLoser(side) && koPhase === 'cinematic') {
      return { opacity: 0.3, rotate: side === 'left' ? 8 : -8, y: 20, scale: 0.9 };
    }
    if (attackSide === side) return { x: 80 * flipSign, scale: 1.1 };
    if (hitSide === side) return { x: [0, -12, 12, -10, 10, -5, 5, 0] };
    if (running && !introPhase) return { y: [0, -4, 0, -4, 0], transition: { duration: 2, repeat: Infinity, delay: side === 'right' ? 0.5 : 0 } };
    return { x: 0, opacity: 1, rotate: 0, y: 0, scale: 1 };
  };

  const getFighterTransition = (side: 'left' | 'right') => {
    if (isLoser(side) && (koPhase === 'impact' || koPhase === 'cinematic')) return { duration: 0.6 };
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

        {/* Live mode brief intro flash */}
        <AnimatePresence>
          {liveIntro && (
            <motion.div
              className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
            >
              <div className="absolute inset-0 bg-[#050505]" />
              <div className="relative z-10 flex flex-col items-center gap-4">
                {liveIntro === 'fight' ? (
                  <>
                    <motion.div
                      className="flex items-center gap-4 md:gap-8 mb-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 relative rounded-xl overflow-hidden border-2" style={{ borderColor: left.color }}>
                        <Image src={left.image} alt={left.name} fill className="object-cover" style={{ objectPosition: left.focalPoint || 'center center' }} />
                      </div>
                      <span className="text-2xl md:text-3xl font-black text-red-500">VS</span>
                      <div className="w-16 h-16 md:w-20 md:h-20 relative rounded-xl overflow-hidden border-2" style={{ borderColor: right.color }}>
                        <Image src={right.image} alt={right.name} fill className="object-cover" style={{ objectPosition: right.focalPoint || 'center center' }} />
                      </div>
                    </motion.div>
                    <motion.div
                      className="text-5xl md:text-7xl font-black text-red-500"
                      style={{ textShadow: '0 0 40px rgba(220,38,38,0.6)' }}
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.3, 1] }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    >
                      FIGHT!
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div
                      className="flex items-center gap-2 mb-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                      </span>
                      <span className="text-xs uppercase tracking-widest text-red-400 font-bold">Live</span>
                    </motion.div>
                    <motion.div
                      className="text-3xl md:text-5xl font-black text-white"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      {left.name} <span className="text-red-500">vs</span> {right.name}
                    </motion.div>
                    <motion.div
                      className="text-sm text-gray-400 font-mono"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Joining at Round {(presetTurns?.length ?? 0)}...
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Intro overlay with spotlight sequence */}
        <AnimatePresence>
          {introPhase && (
            <motion.div
              className="absolute inset-0 z-50 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
            >
              {/* Dark base */}
              <div className="absolute inset-0 bg-[#050505]" />

              {/* Animated spotlight — sweeps left → right → center */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    background: [
                      `radial-gradient(ellipse 40% 70% at 30% 50%, ${left.color}30 0%, transparent 70%)`,
                      `radial-gradient(ellipse 40% 70% at 30% 50%, ${left.color}30 0%, transparent 70%)`,
                      `radial-gradient(ellipse 40% 70% at 70% 50%, ${right.color}30 0%, transparent 70%)`,
                      `radial-gradient(ellipse 40% 70% at 70% 50%, ${right.color}30 0%, transparent 70%)`,
                      `radial-gradient(ellipse 80% 80% at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 70%)`,
                    ],
                  }}
                  transition={{ duration: 3.5, times: [0, 0.3, 0.35, 0.6, 0.7], ease: 'easeInOut' }}
                />
              </motion.div>

              {/* Fighter intros + VS */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-4 md:gap-12">
                  {/* Left fighter — spotlight first */}
                  <motion.div
                    className="text-center"
                    initial={{ x: -120, opacity: 0, scale: 0.8 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.2 }}
                  >
                    {/* Spotlight ring glow */}
                    <motion.div
                      className="relative"
                      animate={{ filter: ['brightness(1)', 'brightness(1.4)', 'brightness(1)'] }}
                      transition={{ duration: 1.5, delay: 0.3 }}
                    >
                      <motion.div
                        className="absolute -inset-2 rounded-xl"
                        style={{ background: left.color, filter: 'blur(16px)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.5, 0.2] }}
                        transition={{ duration: 1.5, delay: 0.3 }}
                      />
                      <div className="w-28 h-28 md:w-40 md:h-40 relative rounded-xl overflow-hidden border-2 mb-3" style={{ borderColor: left.color }}>
                        <Image src={left.image} alt={left.name} fill className="object-cover" style={{ objectPosition: left.focalPoint || "center center" }} />
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="font-black text-xl md:text-3xl uppercase text-white">{left.name}</div>
                      <div className="text-xs uppercase mt-0.5" style={{ color: left.color }}>{left.animal}</div>
                      <div className="flex gap-2 justify-center mt-1 text-xs font-mono">
                        <span className="text-green-400">{left.wins}W</span>
                        <span className="text-red-400">{left.losses}L</span>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* VS — appears after both fighters */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.3, 1], opacity: 1 }}
                    transition={{ type: 'tween', duration: 0.5, ease: 'easeOut', delay: 2.2 }}
                    className="text-4xl md:text-6xl font-black text-red-500"
                    style={{ textShadow: '0 0 30px rgba(220,38,38,0.5)' }}
                  >
                    VS
                  </motion.div>

                  {/* Right fighter — spotlight second */}
                  <motion.div
                    className="text-center"
                    initial={{ x: 120, opacity: 0, scale: 0.8 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 1.2 }}
                  >
                    <motion.div
                      className="relative"
                      animate={{ filter: ['brightness(1)', 'brightness(1.4)', 'brightness(1)'] }}
                      transition={{ duration: 1.5, delay: 1.3 }}
                    >
                      <motion.div
                        className="absolute -inset-2 rounded-xl"
                        style={{ background: right.color, filter: 'blur(16px)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.5, 0.2] }}
                        transition={{ duration: 1.5, delay: 1.3 }}
                      />
                      <div className="w-28 h-28 md:w-40 md:h-40 relative rounded-xl overflow-hidden border-2 mb-3" style={{ borderColor: right.color }}>
                        <Image src={right.image} alt={right.name} fill className="object-cover" style={{ objectPosition: right.focalPoint || "center center" }} />
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.5 }}
                    >
                      <div className="font-black text-xl md:text-3xl uppercase text-white">{right.name}</div>
                      <div className="text-xs uppercase mt-0.5" style={{ color: right.color }}>{right.animal}</div>
                      <div className="flex gap-2 justify-center mt-1 text-xs font-mono">
                        <span className="text-green-400">{right.wins}W</span>
                        <span className="text-red-400">{right.losses}L</span>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
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

        {/* === KO WIN SCREEN — fades in with arena bg === */}
        <AnimatePresence>
          {(koPhase === 'cinematic' || koPhase === 'announce' || koPhase === 'settle') && winnerFighter && (
            <motion.div
              className="fixed inset-0 z-[100] overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: koPhase === 'cinematic' ? 0.5 : 1 }}
              transition={{ duration: 0.8 }}
            >
              {/* Arena background for win screen */}
              <div className="fixed inset-0">
                <Image
                  src="/arenas/jungle.jpg"
                  alt=""
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/60" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.7)_100%)]" />
              </div>

              {/* Sparkle particles — CSS-only for performance */}
              <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{
                      background: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? winnerColor : '#fff',
                      left: `${10 + (i * 8.5)}%`,
                      top: `${15 + ((i * 37) % 70)}%`,
                      opacity: 0.6,
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: '2s',
                    }}
                  />
                ))}
              </div>

              {/* Scrollable content — two-column on desktop */}
              <div className="relative min-h-full flex flex-col items-center pt-20 pb-12 px-4">
                {/* K.O.! text — always centered at top */}
                <motion.div
                  className="text-6xl sm:text-8xl md:text-9xl font-black uppercase select-none mb-8"
                  style={{
                    color: '#FFD700',
                    textShadow: '0 0 40px rgba(255,215,0,0.6), 0 0 80px rgba(255,215,0,0.3)',
                    letterSpacing: '0.1em',
                  }}
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: [0, 1.2, 1], rotate: 0 }}
                  transition={{ type: 'tween', duration: 0.5, ease: 'easeOut' }}
                >
                  K.O.!
                </motion.div>

                {/* Two-column layout: winner left, reactions right */}
                <div className="w-full max-w-5xl flex flex-col md:flex-row md:items-start md:gap-10 gap-8">

                  {/* Left column — winner showcase (centered until reactions load) */}
                  <motion.div
                    className="flex flex-col items-center"
                    animate={{
                      flex: reactionsLoaded ? 1 : undefined,
                      width: reactionsLoaded ? 'auto' : '100%',
                    }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                    style={!reactionsLoaded ? { width: '100%' } : undefined}
                  >
                    {/* Winner image */}
                    <motion.div
                      className="relative mb-6"
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
                    >
                      <motion.div
                        className="absolute -top-9 left-1/2 -translate-x-1/2 z-10"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.4, ease: 'easeOut' }}
                      >
                        <CrownIcon size={40} className="text-yellow-400 drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]" />
                      </motion.div>

                      <div
                        className="absolute -inset-4 rounded-2xl animate-pulse"
                        style={{
                          background: `linear-gradient(135deg, ${winnerColor}, #FFD700, ${winnerColor})`,
                          filter: 'blur(16px)',
                          opacity: 0.45,
                        }}
                      />

                      <div
                        className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-2xl overflow-hidden"
                        style={{
                          border: `3px solid ${winnerColor}`,
                          boxShadow: `0 0 30px ${winnerColor}88, 0 0 60px ${winnerColor}44`,
                        }}
                      >
                        <Image
                          src={winnerFighter.image}
                          alt={winnerFighter.name}
                          fill
                          className="object-cover"
                          style={{ objectPosition: winnerFighter.focalPoint || 'center center' }}
                        />
                      </div>
                    </motion.div>

                    {/* Winner name */}
                    <motion.div
                      className="text-center"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      <div
                        className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-wider"
                        style={{ color: winnerColor, textShadow: `0 0 20px ${winnerColor}88` }}
                      >
                        {winnerFighter.name}
                      </div>
                      <div className="text-sm uppercase tracking-[0.3em] text-yellow-400/80 mt-1 font-bold">
                        Victorious
                      </div>
                    </motion.div>

                    {/* Defeated chip */}
                    {ko && (
                      <motion.div
                        className="flex items-center gap-3 mt-4 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        <div className="w-8 h-8 rounded-md overflow-hidden grayscale opacity-50 flex-shrink-0">
                          <div className="relative w-full h-full">
                            <Image
                              src={(ko === 'left' ? left : right).image}
                              alt={(ko === 'left' ? left : right).name}
                              fill
                              className="object-cover"
                              style={{ objectPosition: (ko === 'left' ? left : right).focalPoint || 'center center' }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 font-bold uppercase">{(ko === 'left' ? left : right).name}</span>
                        <span className="text-xs text-red-500/60 uppercase">Defeated</span>
                      </motion.div>
                    )}

                    {/* Buttons */}
                    {koPhase === 'settle' && (
                      <motion.div
                        className="flex items-center gap-3 mt-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.4, ease: 'easeOut' }}
                      >
                        <button
                          onClick={handleStartFight}
                          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-sm uppercase tracking-wider transition-all hover:scale-105"
                        >
                          <RefreshIcon size={16} className="inline-block mr-2" /> Rematch
                        </button>
                        {onBack && (
                          <button
                            onClick={onBack}
                            className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold rounded-xl text-sm uppercase tracking-wider transition-all hover:scale-105"
                          >
                            Back to Results
                          </button>
                        )}
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Right column — post-fight reactions (fade in once loaded) */}
                  {koPhase === 'settle' && (
                    <motion.div
                      className="md:flex-1 w-full md:w-auto"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: reactionsLoaded ? 1 : 0, x: reactionsLoaded ? 0 : 30 }}
                      transition={{ duration: 0.6 }}
                    >
                      <PostFightReaction
                        winner={winnerSide === 'left' ? left : right}
                        loser={winnerSide === 'left' ? right : left}
                        method="knockout"
                        onLoaded={() => setReactionsLoaded(true)}
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
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
          <div className="flex flex-col items-center gap-3 w-[40%]">
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

        {/* (KO announcement + sparkles now part of the win screen takeover above) */}

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

        {/* Start Fight button (only pre-fight) */}
        <div className="flex justify-center gap-4 mt-8">
          {!running && !done && !isKoActive && !liveMode && (
            <button
              onClick={handleStartFight}
              className="px-10 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-lg uppercase tracking-wider transition-all hover:scale-105"
            >
              <FistIcon size={20} className="inline-block mr-2" /> Start Fight
            </button>
          )}
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

      {/* Post-fight reactions now inside the win screen takeover */}
    </div>
  );
}
