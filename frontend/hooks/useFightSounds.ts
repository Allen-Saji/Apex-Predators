'use client';

import { useCallback, useRef, useState } from 'react';
import SoundEngine from '@/lib/sound-engine';
import CommentaryEngine, { getIntroCommentary, getAttackCommentary, getKoCommentary } from '@/lib/commentary';

export function useFightSounds() {
  const engineRef = useRef<SoundEngine | null>(null);
  const commentaryRef = useRef<CommentaryEngine | null>(null);
  const [muted, setMuted] = useState(false);
  const [commentaryOn, setCommentaryOn] = useState(true);

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

  const onFightStart = useCallback((f1Name?: string, f2Name?: string) => {
    const e = getEngine();
    const c = getCommentary();
    c.warmup();
    e.startAmbience();
    e.playFightStart();
    if (f1Name && f2Name) {
      setTimeout(() => c.speak(getIntroCommentary(f1Name, f2Name)), 300);
    }
  }, [getEngine, getCommentary]);

  const onAttack = useCallback((damage: number, isCrit: boolean, attackerName?: string, moveName?: string) => {
    const e = getEngine();
    e.playHit(damage, isCrit);
    // Crowd reactions based on damage
    if (damage >= 16 || isCrit) {
      setTimeout(() => e.playCrowdReact('heavy'), 200);
    } else if (damage >= 11) {
      setTimeout(() => e.playCrowdReact('medium'), 200);
    } else if (damage >= 6) {
      setTimeout(() => e.playCrowdReact('light'), 200);
    }
    if (attackerName && moveName) {
      const c = getCommentary();
      setTimeout(() => c.speak(getAttackCommentary(attackerName, moveName, damage, isCrit), isCrit ? 'high' : 'normal'), 300);
    }
  }, [getEngine, getCommentary]);

  const onKo = useCallback((winnerName?: string, loserName?: string) => {
    const e = getEngine();
    // 1. Crowd goes SILENT immediately
    e.stopAmbience();
    // 2. 300ms of total silence, then KO bell
    setTimeout(() => {
      e.playKoBell();
      // 3. 200ms after bell starts, crowd EXPLODES
      setTimeout(() => e.playKoCrowdRoar(), 200);
    }, 300);
    if (winnerName && loserName) {
      const c = getCommentary();
      setTimeout(() => c.speak(getKoCommentary(winnerName, loserName), 'high'), 600);
    }
  }, [getEngine, getCommentary]);

  const onFightEnd = useCallback(() => {
    const e = getEngine();
    e.fadeOutAmbience();
    getCommentary().stop();
  }, [getEngine, getCommentary]);

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

  return { muted, commentaryOn, onFightStart, onAttack, onKo, onFightEnd, toggleMute, toggleCommentary };
}
