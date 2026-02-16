'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { Turn } from '@/lib/types';

const AGENT_API = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:3004';

// Backend TurnResult shape (f1/f2 based)
interface BackendTurnResult {
  attacker: 'f1' | 'f2';
  defender: 'f1' | 'f2';
  moveName: string;
  damage: number;
  isCrit: boolean;
  hpF1: number;
  hpF2: number;
}

interface FightProgressData {
  poolId: string;
  stage: string;
  message: string;
  eta?: number;
}

interface FightStartData {
  poolId: string;
  fighter1Id: string;
  fighter2Id: string;
  fighter1Name: string;
  fighter2Name: string;
}

interface FightTurnData {
  poolId: string;
  turn: BackendTurnResult;
  turnIndex: number;
  totalTurns: number;
}

interface FightEndData {
  poolId: string;
  winnerId: string;
  loserId: string;
  outcome: number;
}

export interface LiveFightState {
  isLive: boolean;
  poolId: string | null;
  fighter1Name: string | null;
  fighter2Name: string | null;
  fighter1Id: string | null;
  fighter2Id: string | null;
  turns: Turn[];
  ended: boolean;
  winnerId: string | null;
  outcome: number | null;
  /** Pre-fight progress stage (e.g. waiting_reveal_delay) */
  stage: string | null;
  /** Human-readable progress message */
  progressMessage: string | null;
  /** ETA as unix timestamp (seconds) — e.g. when reveal delay ends */
  eta: number | null;
}

const EMPTY_FIGHT: LiveFightState = {
  isLive: false,
  poolId: null,
  fighter1Name: null,
  fighter2Name: null,
  fighter1Id: null,
  fighter2Id: null,
  turns: [],
  ended: false,
  winnerId: null,
  outcome: null,
  stage: null,
  progressMessage: null,
  eta: null,
};

function mapTurn(t: BackendTurnResult, f1Name: string, f2Name: string): Turn {
  const attacker: 'left' | 'right' = t.attacker === 'f1' ? 'left' : 'right';
  const defender: 'left' | 'right' = t.defender === 'f1' ? 'left' : 'right';
  const attackerName = t.attacker === 'f1' ? f1Name : f2Name;
  const critText = t.isCrit ? ' CRITICAL HIT!' : '';
  const text = `${attackerName} lands a ${t.moveName} for ${t.damage} damage!${critText}`;
  return {
    attacker,
    defender,
    moveName: t.moveName,
    damage: t.damage,
    isCrit: t.isCrit,
    hpLeft: t.hpF1,
    hpRight: t.hpF2,
    text,
  };
}

// ── Module-level singleton SSE connection ──────────────────────────
// Shared across all components — only ONE EventSource connection

type Listener = () => void;

class LiveFightStore {
  private fights = new Map<string, LiveFightState>();
  private names = new Map<string, { f1: string; f2: string }>();
  private listeners = new Set<Listener>();
  private es: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private refCount = 0;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    this.refCount++;
    if (this.refCount === 1) this.connect();
    return () => {
      this.listeners.delete(listener);
      this.refCount--;
      if (this.refCount === 0) this.disconnect();
    };
  }

  getSnapshot(): Map<string, LiveFightState> {
    return this.fights;
  }

  private notify() {
    for (const listener of this.listeners) listener();
  }

  private connect() {
    if (this.es) return;

    const es = new EventSource(`${AGENT_API}/api/arena/live`);
    this.es = es;

    es.addEventListener('fight:progress', (e) => {
      const data: FightProgressData = JSON.parse(e.data);
      const existing = this.fights.get(data.poolId);
      const next = new Map(this.fights);
      next.set(data.poolId, {
        ...(existing ?? EMPTY_FIGHT),
        isLive: true,
        poolId: data.poolId,
        stage: data.stage,
        progressMessage: data.message,
        eta: data.eta ?? null,
      });
      this.fights = next;
      this.notify();
    });

    es.addEventListener('fight:start', (e) => {
      const data: FightStartData = JSON.parse(e.data);
      this.names.set(data.poolId, { f1: data.fighter1Name, f2: data.fighter2Name });
      const existing = this.fights.get(data.poolId);
      const next = new Map(this.fights);
      next.set(data.poolId, {
        ...(existing ?? EMPTY_FIGHT),
        isLive: true,
        poolId: data.poolId,
        fighter1Name: data.fighter1Name,
        fighter2Name: data.fighter2Name,
        fighter1Id: data.fighter1Id,
        fighter2Id: data.fighter2Id,
        turns: [],
        ended: false,
        winnerId: null,
        outcome: null,
        stage: 'streaming',
        progressMessage: 'Fight is live!',
      });
      this.fights = next;
      this.notify();
    });

    es.addEventListener('fight:turn', (e) => {
      const data: FightTurnData = JSON.parse(e.data);
      const names = this.names.get(data.poolId);
      if (!names) return;
      const existing = this.fights.get(data.poolId);
      if (!existing) return;
      const turn = mapTurn(data.turn, names.f1, names.f2);
      const next = new Map(this.fights);
      next.set(data.poolId, { ...existing, turns: [...existing.turns, turn] });
      this.fights = next;
      this.notify();
    });

    es.addEventListener('fight:end', (e) => {
      const data: FightEndData = JSON.parse(e.data);
      const existing = this.fights.get(data.poolId);
      if (!existing) return;
      const next = new Map(this.fights);
      next.set(data.poolId, { ...existing, ended: true, winnerId: data.winnerId, outcome: data.outcome });
      this.fights = next;
      this.notify();

      // Remove ended fight after 10s
      setTimeout(() => {
        const f = this.fights.get(data.poolId);
        if (!f?.ended) return;
        const cleaned = new Map(this.fights);
        cleaned.delete(data.poolId);
        this.names.delete(data.poolId);
        this.fights = cleaned;
        this.notify();
      }, 10000);
    });

    es.onerror = () => {
      this.cleanupConnection();
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };
  }

  private disconnect() {
    this.cleanupConnection();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private cleanupConnection() {
    if (this.es) {
      this.es.close();
      this.es = null;
    }
  }
}

const store = typeof window !== 'undefined' ? new LiveFightStore() : null;

const serverSnapshot = new Map<string, LiveFightState>();

/** Track all live fights across all pools — shared singleton connection */
export function useLiveFights(): Map<string, LiveFightState> {
  const fights = useSyncExternalStore(
    (cb) => store?.subscribe(cb) ?? (() => {}),
    () => store?.getSnapshot() ?? serverSnapshot,
    () => serverSnapshot,
  );
  return fights;
}

/** Convenience: track a single pool's live fight */
export function useLiveFight(poolId?: string | bigint): LiveFightState {
  const fights = useLiveFights();
  const key = poolId !== undefined ? String(poolId) : null;

  return useMemo(() => {
    if (!key) return EMPTY_FIGHT;
    return fights.get(key) ?? EMPTY_FIGHT;
  }, [fights, key]);
}
