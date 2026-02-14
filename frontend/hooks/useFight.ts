'use client';

import { useState, useCallback, useRef } from 'react';
import { Turn, Fighter } from '@/lib/types';

function generateFight(left: Fighter, right: Fighter): Turn[] {
  let hpLeft = 100;
  let hpRight = 100;
  const turns: Turn[] = [];
  let attacker: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';

  while (hpLeft > 0 && hpRight > 0 && turns.length < 14) {
    const defender: 'left' | 'right' = attacker === 'left' ? 'right' : 'left';
    const f = attacker === 'left' ? left : right;
    const move = f.moves[Math.floor(Math.random() * f.moves.length)];
    const isCrit = Math.random() < 0.1;
    const baseDmg = move.minDamage + Math.floor(Math.random() * (move.maxDamage - move.minDamage + 1));
    const damage = isCrit ? baseDmg * 2 : baseDmg;

    if (defender === 'left') hpLeft = Math.max(0, hpLeft - damage);
    else hpRight = Math.max(0, hpRight - damage);

    const critText = isCrit ? ' CRITICAL HIT!' : '';
    const text = `${f.name} lands a ${move.name} for ${damage} damage!${critText}`;
    turns.push({ attacker, defender, moveName: move.name, damage, isCrit, hpLeft, hpRight, text });

    if (hpLeft <= 0 || hpRight <= 0) break;
    attacker = defender;
  }
  return turns;
}

export interface FightCallbacks {
  onFightStart?: (f1Name?: string, f2Name?: string) => void;
  onAttack?: (damage: number, isCrit: boolean, attackerName?: string, moveName?: string) => void;
  onKo?: (winnerName?: string, loserName?: string) => void;
  onFightEnd?: () => void;
}

export function useFight(left: Fighter, right: Fighter, callbacks?: FightCallbacks) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [turnIndex, setTurnIndex] = useState(-1);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [hpLeft, setHpLeft] = useState(100);
  const [hpRight, setHpRight] = useState(100);
  const [log, setLog] = useState<string[]>([]);
  const [showDamage, setShowDamage] = useState<{ damage: number; isCrit: boolean; side: 'left' | 'right' } | null>(null);
  const [hitSide, setHitSide] = useState<'left' | 'right' | null>(null);
  const [attackSide, setAttackSide] = useState<'left' | 'right' | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [ko, setKo] = useState<'left' | 'right' | null>(null);
  const [koPhase, setKoPhase] = useState<'impact' | 'cinematic' | 'announce' | 'settle' | null>(null);
  const [introPhase, setIntroPhase] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const playTurn = useCallback((idx: number, t: Turn[]) => {
    const turn = t[idx];
    if (!turn) return;

    setAttackSide(turn.attacker);
    const t1 = setTimeout(() => setAttackSide(null), 400);

    const t2 = setTimeout(() => {
      setHitSide(turn.defender);
      const t2b = setTimeout(() => setHitSide(null), 400);
      timersRef.current.push(t2b);
    }, 250);

    const t3 = setTimeout(() => {
      setShowDamage({ damage: turn.damage, isCrit: turn.isCrit, side: turn.defender });
      const t3b = setTimeout(() => setShowDamage(null), 1200);
      timersRef.current.push(t3b);
    }, 300);

    if (turn.isCrit) {
      const t4 = setTimeout(() => {
        setScreenShake(true);
        const t4b = setTimeout(() => setScreenShake(false), 400);
        timersRef.current.push(t4b);
      }, 250);
      timersRef.current.push(t4);
    }

    const t5 = setTimeout(() => {
      setHpLeft(turn.hpLeft);
      setHpRight(turn.hpRight);
    }, 350);

    // Sound: attack
    const t_sfx = setTimeout(() => {
      const attackerFighter = turn.attacker === 'left' ? left : right;
      callbacks?.onAttack?.(turn.damage, turn.isCrit, attackerFighter.name, turn.moveName);
    }, 280);
    timersRef.current.push(t_sfx);

    setLog((prev) => [...prev, turn.text]);
    setTurnIndex(idx);

    if (turn.hpLeft <= 0 || turn.hpRight <= 0) {
      const t6 = setTimeout(() => {
        const koSide = turn.hpLeft <= 0 ? 'left' as const : 'right' as const;
        setKo(koSide);
        setRunning(false);
        const winnerFighter = turn.hpLeft <= 0 ? right : left;
        const loserFighter = turn.hpLeft <= 0 ? left : right;
        callbacks?.onKo?.(winnerFighter.name, loserFighter.name);

        // KO phase sequencing
        setKoPhase('impact');
        const t_cine = setTimeout(() => setKoPhase('cinematic'), 500);
        const t_ann = setTimeout(() => setKoPhase('announce'), 1500);
        const t_settle = setTimeout(() => { setKoPhase('settle'); setDone(true); }, 3000);
        timersRef.current.push(t_cine, t_ann, t_settle);

        // Fade out ambience after KO
        setTimeout(() => callbacks?.onFightEnd?.(), 3000);
      }, 800);
      timersRef.current.push(t6);
    }

    timersRef.current.push(t1, t2, t3, t5);
  }, []);

  const startFight = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const newFight = generateFight(left, right);
    setTurns(newFight);
    setTurnIndex(-1);
    setDone(false);
    setHpLeft(100);
    setHpRight(100);
    setLog([]);
    setKo(null);
    setKoPhase(null);
    setShowDamage(null);
    setHitSide(null);
    setAttackSide(null);

    // Intro phase
    setIntroPhase(true);
    setRunning(true);
    callbacks?.onFightStart?.(left.name, right.name);
    const introTimer = setTimeout(() => {
      setIntroPhase(false);
      newFight.forEach((_, i) => {
        const t = setTimeout(() => playTurn(i, newFight), (i + 1) * 5000);
        timersRef.current.push(t);
      });
    }, 4000);
    timersRef.current.push(introTimer);
  }, [left, right, playTurn]);

  const winner = ko === 'left' ? right : ko === 'right' ? left : null;

  return {
    turns, turnIndex, running, done, hpLeft, hpRight, log,
    showDamage, hitSide, attackSide, screenShake, ko, koPhase, introPhase,
    startFight, winner,
  };
}
