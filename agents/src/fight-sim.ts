import { randomBytes } from 'crypto';
import { keccak256, encodePacked, encodeAbiParameters, parseAbiParameters, type Hex } from 'viem';
import seedrandom from 'seedrandom';

// ── Types ───────────────────────────────────────────────────────────

export interface Move {
  name: string;
  minDamage: number;
  maxDamage: number;
}

export interface TurnResult {
  attacker: 'f1' | 'f2';
  defender: 'f1' | 'f2';
  moveName: string;
  damage: number;
  isCrit: boolean;
  hpF1: number;
  hpF2: number;
}

export interface FightSimResult {
  winnerId: bigint;
  loserId: bigint;
  totalTurns: number;
  outcome: number; // 0 = Decision, 1 = KO
  turnLog: TurnResult[];
  turnLogBytes: Hex;
}

// ── Seed helpers ────────────────────────────────────────────────────

export function generateSeed(): Hex {
  return `0x${randomBytes(32).toString('hex')}` as Hex;
}

export function hashSeed(seed: Hex): Hex {
  return keccak256(seed);
}

// ── Deterministic fight simulation ──────────────────────────────────

export function simulateFight(
  f1Id: bigint,
  f2Id: bigint,
  f1Moves: Move[],
  f2Moves: Move[],
  seed: Hex,
): FightSimResult {
  const rng = seedrandom(seed);
  const MAX_TURNS = 14;
  const CRIT_CHANCE = 0.1;

  let hpF1 = 100;
  let hpF2 = 100;
  const turns: TurnResult[] = [];
  let attacker: 'f1' | 'f2' = rng() > 0.5 ? 'f1' : 'f2';

  while (hpF1 > 0 && hpF2 > 0 && turns.length < MAX_TURNS) {
    const defender: 'f1' | 'f2' = attacker === 'f1' ? 'f2' : 'f1';
    const moves = attacker === 'f1' ? f1Moves : f2Moves;
    const move = moves[Math.floor(rng() * moves.length)];
    const isCrit = rng() < CRIT_CHANCE;
    const baseDmg = move.minDamage + Math.floor(rng() * (move.maxDamage - move.minDamage + 1));
    const damage = isCrit ? baseDmg * 2 : baseDmg;

    if (defender === 'f1') hpF1 = Math.max(0, hpF1 - damage);
    else hpF2 = Math.max(0, hpF2 - damage);

    turns.push({ attacker, defender, moveName: move.name, damage, isCrit, hpF1, hpF2 });

    if (hpF1 <= 0 || hpF2 <= 0) break;
    attacker = defender;
  }

  // Determine winner
  let winnerId: bigint;
  let loserId: bigint;
  let outcome: number;

  if (hpF1 <= 0) {
    winnerId = f2Id;
    loserId = f1Id;
    outcome = 1; // KO
  } else if (hpF2 <= 0) {
    winnerId = f1Id;
    loserId = f2Id;
    outcome = 1; // KO
  } else {
    // Decision — whoever has more HP wins
    winnerId = hpF1 >= hpF2 ? f1Id : f2Id;
    loserId = hpF1 >= hpF2 ? f2Id : f1Id;
    outcome = 0; // Decision
  }

  // Encode turn log as ABI bytes for on-chain storage
  // Each turn: (uint8 attacker, uint8 damage, bool isCrit) — packed tightly
  const turnBytes = turns.map((t) => {
    const attackerByte = t.attacker === 'f1' ? 1 : 2;
    return encodePacked(
      ['uint8', 'uint8', 'bool'],
      [attackerByte, t.damage, t.isCrit],
    );
  });
  // Concatenate all turn bytes
  const turnLogBytes = (`0x` + turnBytes.map((b) => b.slice(2)).join('')) as Hex;

  return {
    winnerId,
    loserId,
    totalTurns: turns.length,
    outcome,
    turnLog: turns,
    turnLogBytes,
  };
}
