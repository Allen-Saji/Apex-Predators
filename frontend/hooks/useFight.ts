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

    const critText = isCrit ? ' 💥 CRITICAL HIT!' : '';
    const text = `${f.name} lands a ${move.name} for ${damage} damage!${critText}`;
    turns.push({ attacker, defender, moveName: move.name, damage, isCrit, hpLeft, hpRight, text });

    if (hpLeft <= 0 || hpRight <= 0) break;
    attacker = defender;
  }
  return turns;
}

export function useFight(left: Fighter, right: Fighter) {
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

    setLog((prev) => [...prev, turn.text]);
    setTurnIndex(idx);

    if (turn.hpLeft <= 0 || turn.hpRight <= 0) {
      const t6 = setTimeout(() => {
        setKo(turn.hpLeft <= 0 ? 'left' : 'right');
        setDone(true);
        setRunning(false);
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
    setShowDamage(null);
    setHitSide(null);
    setAttackSide(null);

    // Intro phase
    setIntroPhase(true);
    setRunning(true);
    const introTimer = setTimeout(() => {
      setIntroPhase(false);
      newFight.forEach((_, i) => {
        const t = setTimeout(() => playTurn(i, newFight), (i + 1) * 2000);
        timersRef.current.push(t);
      });
    }, 3000);
    timersRef.current.push(introTimer);
  }, [left, right, playTurn]);

  const winner = ko === 'left' ? right : ko === 'right' ? left : null;

  return {
    turns, turnIndex, running, done, hpLeft, hpRight, log,
    showDamage, hitSide, attackSide, screenShake, ko, introPhase,
    startFight, winner,
  };
}
