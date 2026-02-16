import {
  createPool,
  closePool,
  cancelPool,
  getPool,
  createFight,
  commitSeed,
  revealAndResolve,
  getMinRevealDelay,
  getFighterMoves,
  getFighterOnChain,
} from './blockchain.js';
import { generateSeed, hashSeed, simulateFight, type FightSimResult, type TurnResult, type Move } from './fight-sim.js';
import { fightEvents } from './fight-events.js';
import {
  generateTrashTalk,
  generateFightReaction,
  generateCommentary,
} from './agent.js';
import { getAllPersonalities } from './personalities.js';

// ── Types ───────────────────────────────────────────────────────────

export interface FightEvent {
  type: 'pool_created' | 'pool_closed' | 'fight_created' | 'seed_committed' | 'fight_resolved' | 'trash_talk' | 'reaction' | 'commentary' | 'auto_mode' | 'error';
  timestamp: number;
  data: Record<string, any>;
}

export interface FightRunResult {
  poolId: bigint;
  fightId: bigint;
  fighter1Id: bigint;
  fighter2Id: bigint;
  result: FightSimResult;
  reactions: { winner: string; loser: string };
}

// ── State ───────────────────────────────────────────────────────────

const eventLog: FightEvent[] = [];
let autoModeInterval: ReturnType<typeof setInterval> | null = null;
let autoModeEnabled = false;
let activeFight: { fighter1Id: bigint; fighter2Id: bigint; poolId?: bigint; stage: string } | null = null;

function log(event: FightEvent) {
  eventLog.push(event);
  // Keep max 500 events in memory
  if (eventLog.length > 500) eventLog.splice(0, eventLog.length - 500);
  console.log(`[arena] ${event.type}:`, JSON.stringify(event.data));
}

// ── Helpers ─────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Map personality id (string) → on-chain fighter id (bigint). Simple name-based lookup. */
async function resolveFighterName(nameOrId: string): Promise<{ id: bigint; name: string; personalityId: string } | null> {
  const personalities = getAllPersonalities();
  const match = personalities.find(
    (p) => p.id === nameOrId.toLowerCase() || p.name.toLowerCase() === nameOrId.toLowerCase(),
  );
  if (!match) return null;

  // On-chain fighters are 1-indexed; match order to personalities array
  const idx = personalities.indexOf(match);
  const fighterId = BigInt(idx + 1);
  return { id: fighterId, name: match.name, personalityId: match.id };
}

async function getMovesForFighter(fighterId: bigint): Promise<Move[]> {
  const raw = await getFighterMoves(fighterId);
  return (raw as any[]).map((m: any) => ({
    name: m.name,
    minDamage: Number(m.minDamage),
    maxDamage: Number(m.maxDamage),
  }));
}

// ── Core: runFight ──────────────────────────────────────────────────

export async function runFight(
  fighter1: string,
  fighter2: string,
  durationMinutes: number = 0,
): Promise<FightRunResult> {
  const f1 = await resolveFighterName(fighter1);
  const f2 = await resolveFighterName(fighter2);
  if (!f1 || !f2) throw new Error(`Unknown fighter: ${!f1 ? fighter1 : fighter2}`);

  const f1Id = f1.id;
  const f2Id = f2.id;

  activeFight = { fighter1Id: f1Id, fighter2Id: f2Id, stage: 'creating_pool' };

  // 1. Create betting pool
  const closesAt = BigInt(Math.floor(Date.now() / 1000) + (durationMinutes > 0 ? durationMinutes * 60 : 30));
  const { poolId } = await createPool(f1Id, f2Id, closesAt);
  activeFight.poolId = poolId;
  log({ type: 'pool_created', timestamp: Date.now(), data: { poolId: poolId.toString(), f1: f1.name, f2: f2.name, closesAt: closesAt.toString() } });

  // 2. Generate trash talk (non-blocking, run in parallel)
  activeFight.stage = 'trash_talk';
  const [trash1, trash2] = await Promise.allSettled([
    generateTrashTalk(f1.personalityId, f2.personalityId),
    generateTrashTalk(f2.personalityId, f1.personalityId),
  ]);
  if (trash1.status === 'fulfilled') {
    log({ type: 'trash_talk', timestamp: Date.now(), data: { fighter: f1.name, text: trash1.value } });
  }
  if (trash2.status === 'fulfilled') {
    log({ type: 'trash_talk', timestamp: Date.now(), data: { fighter: f2.name, text: trash2.value } });
  }

  // 3. Wait for betting window to close
  if (durationMinutes > 0) {
    activeFight.stage = 'waiting_for_bets';
    console.log(`[arena] Waiting ${durationMinutes}m for betting window...`);
    await sleep(durationMinutes * 60 * 1000);
  }

  // 4. Close pool
  activeFight.stage = 'closing_pool';
  await closePool(poolId);
  log({ type: 'pool_closed', timestamp: Date.now(), data: { poolId: poolId.toString() } });

  // 4b. Check if any bets were placed — skip fight if none
  const poolData = await getPool(poolId) as any;
  const totalF1 = BigInt(poolData.totalFighter1 ?? poolData[2] ?? 0);
  const totalF2 = BigInt(poolData.totalFighter2 ?? poolData[3] ?? 0);
  if (totalF1 === 0n && totalF2 === 0n) {
    console.log(`[arena] No bets placed on pool ${poolId} — cancelling`);
    await cancelPool(poolId);
    log({ type: 'pool_closed', timestamp: Date.now(), data: { poolId: poolId.toString(), skipped: true, reason: 'no_bets' } });
    fightEvents.emitFightProgress({
      poolId: poolId.toString(),
      stage: 'cancelled',
      message: 'No bets placed — fight cancelled.',
    });
    activeFight = null;
    throw new Error('No bets placed — fight skipped');
  }

  // Notify SSE subscribers that this pool's fight is being prepared
  fightEvents.emitFightProgress({
    poolId: poolId.toString(),
    stage: 'closing_pool',
    message: 'Pool closed — preparing fight...',
  });

  // 5. Create fight on-chain
  activeFight.stage = 'creating_fight';
  fightEvents.emitFightProgress({ poolId: poolId.toString(), stage: 'creating_fight', message: 'Creating fight on-chain...' });
  const { fightId } = await createFight(poolId, f1Id, f2Id);
  log({ type: 'fight_created', timestamp: Date.now(), data: { fightId: fightId.toString(), poolId: poolId.toString() } });

  // 6. Generate seed and commit hash
  activeFight.stage = 'committing_seed';
  fightEvents.emitFightProgress({ poolId: poolId.toString(), stage: 'committing_seed', message: 'Committing fight seed...' });
  const seed = generateSeed();
  const seedHash = hashSeed(seed);
  await commitSeed(fightId, seedHash);
  log({ type: 'seed_committed', timestamp: Date.now(), data: { fightId: fightId.toString() } });

  // 7. Wait for minRevealDelay + buffer
  activeFight.stage = 'waiting_reveal_delay';
  let revealDelay: bigint;
  try {
    revealDelay = await getMinRevealDelay();
  } catch {
    revealDelay = 300n; // default 5 min
  }
  const delayMs = Number(revealDelay) * 1000 + 10_000; // + 10s buffer
  const delaySec = Math.ceil(delayMs / 1000);
  const revealEta = Math.floor(Date.now() / 1000) + delaySec;
  fightEvents.emitFightProgress({
    poolId: poolId.toString(),
    stage: 'waiting_reveal_delay',
    message: `Waiting for reveal window (~${Math.ceil(delaySec / 60)}min)...`,
    eta: revealEta,
  });
  console.log(`[arena] Waiting ${delaySec}s for reveal delay...`);
  await sleep(delayMs);

  // 8. Simulate fight deterministically
  activeFight.stage = 'simulating';
  fightEvents.emitFightProgress({ poolId: poolId.toString(), stage: 'simulating', message: 'Simulating fight...' });
  const f1Moves = await getMovesForFighter(f1Id);
  const f2Moves = await getMovesForFighter(f2Id);
  const fightResult = simulateFight(f1Id, f2Id, f1Moves, f2Moves, seed);

  // 8b. Stream fight turns via SSE
  activeFight.stage = 'streaming';
  fightEvents.emitFightStart({
    poolId: poolId.toString(),
    fighter1Id: f1Id.toString(),
    fighter2Id: f2Id.toString(),
    fighter1Name: f1.name,
    fighter2Name: f2.name,
  });

  for (let i = 0; i < fightResult.turnLog.length; i++) {
    const turn = fightResult.turnLog[i];
    // Variable delay matching frontend pacing
    let delay: number;
    if (turn.isCrit) delay = 7500;
    else if (turn.damage >= 15) delay = 6500;
    else if (turn.damage >= 8) delay = 5000;
    else delay = 3500;
    await sleep(delay);

    fightEvents.emitFightTurn({
      poolId: poolId.toString(),
      turn,
      turnIndex: i,
      totalTurns: fightResult.turnLog.length,
    });
  }

  // Short pause after last turn before resolution
  await sleep(2000);

  fightEvents.emitFightEnd({
    poolId: poolId.toString(),
    winnerId: fightResult.winnerId.toString(),
    loserId: fightResult.loserId.toString(),
    outcome: fightResult.outcome,
  });

  // 9. Reveal and resolve on-chain
  activeFight.stage = 'resolving';
  await revealAndResolve(fightId, seed, {
    winnerId: fightResult.winnerId,
    loserId: fightResult.loserId,
    totalTurns: fightResult.totalTurns,
    outcome: fightResult.outcome,
    turnLog: fightResult.turnLogBytes,
  });
  log({
    type: 'fight_resolved',
    timestamp: Date.now(),
    data: {
      fightId: fightId.toString(),
      winnerId: fightResult.winnerId.toString(),
      loserId: fightResult.loserId.toString(),
      totalTurns: fightResult.totalTurns,
      outcome: fightResult.outcome === 1 ? 'KO' : 'Decision',
    },
  });

  // 10. Generate winner/loser reactions
  activeFight.stage = 'reactions';
  const winnerPId = fightResult.winnerId === f1Id ? f1.personalityId : f2.personalityId;
  const loserPId = fightResult.loserId === f1Id ? f1.personalityId : f2.personalityId;
  const method = fightResult.outcome === 1 ? 'knockout' : 'decision';

  const [winReaction, loseReaction] = await Promise.allSettled([
    generateFightReaction(winnerPId, loserPId, true, method),
    generateFightReaction(loserPId, winnerPId, false, method),
  ]);

  const winText = winReaction.status === 'fulfilled' ? winReaction.value : '';
  const loseText = loseReaction.status === 'fulfilled' ? loseReaction.value : '';

  if (winText) log({ type: 'reaction', timestamp: Date.now(), data: { fighter: winnerPId, won: true, text: winText } });
  if (loseText) log({ type: 'reaction', timestamp: Date.now(), data: { fighter: loserPId, won: false, text: loseText } });

  activeFight = null;

  return {
    poolId,
    fightId,
    fighter1Id: f1Id,
    fighter2Id: f2Id,
    result: fightResult,
    reactions: { winner: winText, loser: loseText },
  };
}

// ── Tournament ──────────────────────────────────────────────────────

export async function runTournament(
  fighterNames: string[],
  durationMinutes: number = 1,
): Promise<{ results: FightRunResult[]; championName: string }> {
  if (fighterNames.length < 2) throw new Error('Need at least 2 fighters');

  // Pad to power of 2 if needed (repeat fighters)
  let bracket = [...fighterNames];
  while (bracket.length & (bracket.length - 1)) {
    bracket.push(bracket[bracket.length - 1]);
  }

  const results: FightRunResult[] = [];
  let round = 1;

  while (bracket.length > 1) {
    console.log(`[arena] Tournament round ${round}: ${bracket.join(' vs ')}`);
    const nextRound: string[] = [];

    for (let i = 0; i < bracket.length; i += 2) {
      const f1 = bracket[i];
      const f2 = bracket[i + 1];

      try {
        const result = await runFight(f1, f2, durationMinutes);
        results.push(result);

        // Figure out winner name
        const f1Info = await resolveFighterName(f1);
        const winnerName = result.result.winnerId === f1Info!.id ? f1 : f2;
        nextRound.push(winnerName);
      } catch (err: any) {
        console.error(`[arena] Tournament fight error: ${err.message}`);
        log({ type: 'error', timestamp: Date.now(), data: { error: err.message, round, f1, f2 } });
        // Advance first fighter by default on error
        nextRound.push(f1);
      }
    }

    bracket = nextRound;
    round++;
  }

  const championName = bracket[0];
  console.log(`[arena] Tournament champion: ${championName}`);
  return { results, championName };
}

// ── Auto Mode ───────────────────────────────────────────────────────

export function startAutoMode(intervalMinutes: number = 5) {
  if (autoModeInterval) {
    console.log('[arena] Auto mode already running');
    return;
  }

  autoModeEnabled = true;
  log({ type: 'auto_mode', timestamp: Date.now(), data: { enabled: true, intervalMinutes } });

  const tick = async () => {
    if (!autoModeEnabled) return;

    const personalities = getAllPersonalities();
    // Pick 2 random different fighters
    const idx1 = Math.floor(Math.random() * personalities.length);
    let idx2 = Math.floor(Math.random() * (personalities.length - 1));
    if (idx2 >= idx1) idx2++;

    const f1 = personalities[idx1].id;
    const f2 = personalities[idx2].id;

    console.log(`[arena] Auto mode: ${f1} vs ${f2}`);
    try {
      await runFight(f1, f2, 1); // 1 min betting window
    } catch (err: any) {
      console.error(`[arena] Auto mode fight error: ${err.message}`);
      log({ type: 'error', timestamp: Date.now(), data: { error: err.message, auto: true } });
    }
  };

  // Run first fight immediately
  tick();
  autoModeInterval = setInterval(tick, intervalMinutes * 60 * 1000);
}

export function stopAutoMode() {
  autoModeEnabled = false;
  if (autoModeInterval) {
    clearInterval(autoModeInterval);
    autoModeInterval = null;
  }
  log({ type: 'auto_mode', timestamp: Date.now(), data: { enabled: false } });
}

// ── Getters ─────────────────────────────────────────────────────────

export function getEventLog(): FightEvent[] {
  return eventLog;
}

export function getRecentEvents(count: number = 50): FightEvent[] {
  return eventLog.slice(-count);
}

export function getStatus() {
  return {
    autoModeEnabled,
    activeFight: activeFight
      ? {
          fighter1Id: activeFight.fighter1Id.toString(),
          fighter2Id: activeFight.fighter2Id.toString(),
          poolId: activeFight.poolId?.toString() ?? null,
          stage: activeFight.stage,
        }
      : null,
    totalEvents: eventLog.length,
  };
}
