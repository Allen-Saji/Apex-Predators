'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import SoundEngine from '@/lib/sound-engine';
import CommentaryEngine from '@/lib/commentary';
import type { CommentaryCategory } from '@/lib/commentary';

export function useFightSounds() {
  const engineRef = useRef<SoundEngine | null>(null);
  const commentaryRef = useRef<CommentaryEngine | null>(null);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const [muted, setMuted] = useState(false);
  const [commentaryOn, setCommentaryOn] = useState(true);

  /** Schedule a delayed action, tracked for cleanup on unmount */
  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, ms);
    timersRef.current.add(id);
  }, []);

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = SoundEngine.getInstance();
    }
    return engineRef.current;
  }, []);

  const getCommentary = useCallback(() => {
    if (!commentaryRef.current) {
      commentaryRef.current = CommentaryEngine.getInstance();
    }
    return commentaryRef.current;
  }, []);

  const onFightStart = useCallback((_f1Name?: string, _f2Name?: string, f1Animal?: string, f2Animal?: string) => {
    const e = getEngine();
    const c = getCommentary();
    e.stopCelebration();
    c.warmup();
    e.startAmbience();
    // Animal roars as fighters are introduced (staggered)
    if (f1Animal) schedule(() => e.playAnimalIntro(f1Animal), 300);
    if (f2Animal) schedule(() => e.playAnimalIntro(f2Animal), 1200);
    e.playFightStart();
    // Wait for bell + animal intros before commentary
    schedule(() => c.playClip('intro'), 2000);
  }, [getEngine, getCommentary, schedule]);

  const onAttack = useCallback((damage: number, isCrit: boolean, attackerName?: string, moveName?: string) => {
    const e = getEngine();
    e.playHit(damage, isCrit);
    // Crowd reactions based on damage
    if (damage >= 16 || isCrit) {
      schedule(() => e.playCrowdReact('heavy'), 200);
    } else if (damage >= 11) {
      schedule(() => e.playCrowdReact('medium'), 200);
    } else if (damage >= 6) {
      schedule(() => e.playCrowdReact('light'), 200);
    }

    let category: CommentaryCategory;
    if (isCrit) {
      category = 'crit';
    } else if (damage >= 15) {
      category = 'heavy';
    } else if (damage <= 5) {
      category = 'light';
    } else {
      category = 'medium';
    }

    const c = getCommentary();
    const priority = isCrit ? 'high' as const : 'normal' as const;
    if (attackerName && moveName) {
      schedule(() => c.playMove(attackerName, moveName, category, priority), 300);
    } else {
      schedule(() => c.playClip(category, priority), 300);
    }
  }, [getEngine, getCommentary, schedule]);

  const onKo = useCallback(() => {
    const e = getEngine();
    const c = getCommentary();
    // Kill any in-flight attack commentary immediately
    c.stop();
    // 1. Crowd goes SILENT immediately
    e.stopAmbience();
    // 2. 300ms of total silence, then KO bell
    schedule(() => {
      e.playKoBell();
      // 3. 200ms after bell starts, crowd EXPLODES
      schedule(() => e.playKoCrowdRoar(), 200);
    }, 300);
    // KO call — wait for bell to hit, then announce
    schedule(() => c.playClip('ko', 'high'), 1200);
    // Celebration fanfare when winner screen appears (~3s after KO)
    schedule(() => e.playCelebration(), 3000);
    // Exit wrap-up — give KO line time to finish (~5s)
    schedule(() => c.playClip('exit', 'high'), 6000);
  }, [getEngine, getCommentary, schedule]);

  const onFightEnd = useCallback(() => {
    const e = getEngine();
    e.fadeOutAmbience();
  }, [getEngine]);

  const toggleMute = useCallback(() => {
    const e = getEngine();
    const nowMuted = e.toggleMute();
    setMuted(nowMuted);
    if (nowMuted) getCommentary().setEnabled(false);
    else getCommentary().setEnabled(commentaryOn);
  }, [getEngine, getCommentary, commentaryOn]);

  const toggleCommentary = useCallback(() => {
    const c = getCommentary();
    const nowOn = c.toggleEnabled();
    setCommentaryOn(nowOn);
  }, [getCommentary]);

  const cleanup = useCallback(() => {
    const e = getEngine();
    const c = getCommentary();
    e.stopCelebration();
    e.stopAmbience();
    c.stop();
  }, [getEngine, getCommentary]);

  // Stop all sounds and cancel pending timers on unmount
  useEffect(() => {
    return () => {
      // Cancel all pending hook-level timers
      for (const id of timersRef.current) clearTimeout(id);
      timersRef.current.clear();
      // Stop engine sounds + its internal timers
      SoundEngine.getInstance().stopAll();
      CommentaryEngine.getInstance().stop();
    };
  }, []);

  return { muted, commentaryOn, onFightStart, onAttack, onKo, onFightEnd, toggleMute, toggleCommentary, cleanup };
}
