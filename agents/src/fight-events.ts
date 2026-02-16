import { EventEmitter } from 'events';
import type { TurnResult } from './fight-sim.js';

// ── Event types ────────────────────────────────────────────────────

export interface FightStartEvent {
  poolId: string;
  fighter1Id: string;
  fighter2Id: string;
  fighter1Name: string;
  fighter2Name: string;
}

export interface FightTurnEvent {
  poolId: string;
  turn: TurnResult;
  turnIndex: number;
  totalTurns: number;
}

export interface FightEndEvent {
  poolId: string;
  winnerId: string;
  loserId: string;
  outcome: number; // 0 = Decision, 1 = KO
}

export interface FightProgressEvent {
  poolId: string;
  stage: string;
  message: string;
  /** Optional ETA as unix timestamp (seconds) — e.g. when reveal window opens */
  eta?: number;
}

// ── Late-join replay state ─────────────────────────────────────────

export interface LiveFightState {
  start?: FightStartEvent;
  progress?: FightProgressEvent;
  turns: FightTurnEvent[];
  ended: boolean;
  end?: FightEndEvent;
}

// ── Singleton emitter ──────────────────────────────────────────────

class FightEventBus extends EventEmitter {
  private activeFights: Map<string, LiveFightState> = new Map();

  emitFightProgress(data: FightProgressEvent) {
    let fight = this.activeFights.get(data.poolId);
    if (!fight) {
      fight = { progress: data, turns: [], ended: false };
      this.activeFights.set(data.poolId, fight);
    } else {
      fight.progress = data;
    }
    this.emit('fight:progress', data);
  }

  emitFightStart(data: FightStartEvent) {
    const existing = this.activeFights.get(data.poolId);
    if (existing) {
      existing.start = data;
    } else {
      this.activeFights.set(data.poolId, { start: data, turns: [], ended: false });
    }
    this.emit('fight:start', data);
  }

  emitFightTurn(data: FightTurnEvent) {
    const fight = this.activeFights.get(data.poolId);
    if (fight) {
      fight.turns.push(data);
    }
    this.emit('fight:turn', data);
  }

  emitFightEnd(data: FightEndEvent) {
    const fight = this.activeFights.get(data.poolId);
    if (fight) {
      fight.ended = true;
      fight.end = data;
    }
    this.emit('fight:end', data);
    // Remove from active fights after a short delay so late-joiners during resolution still get it
    setTimeout(() => {
      const f = this.activeFights.get(data.poolId);
      if (f?.ended) {
        this.activeFights.delete(data.poolId);
      }
    }, 5000);
  }

  /** Returns all active fight states for late-join replay */
  getActiveFights(): Map<string, LiveFightState> {
    return this.activeFights;
  }

  /** Returns a single fight state by poolId, or null */
  getCurrentFight(): LiveFightState | null {
    // Backwards compat: return the first active fight (or null)
    for (const fight of this.activeFights.values()) {
      return fight;
    }
    return null;
  }
}

export const fightEvents = new FightEventBus();
