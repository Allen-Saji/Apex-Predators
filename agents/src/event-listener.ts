import {
  publicClient,
  CONTRACTS,
  BETTING_POOL_ABI,
  FIGHT_RESOLVER_ABI,
} from './blockchain.js';
import { generateCommentary, generateFightReaction } from './agent.js';
import { getAllPersonalities } from './personalities.js';
import type { Log } from 'viem';

// ── Types ───────────────────────────────────────────────────────────

export interface ChainEvent {
  type: string;
  blockNumber: bigint;
  txHash: string;
  timestamp: number;
  data: Record<string, any>;
  llmReaction?: string;
}

// ── State ───────────────────────────────────────────────────────────

const recentEvents: ChainEvent[] = [];
const unwatchers: (() => void)[] = [];

function pushEvent(event: ChainEvent) {
  recentEvents.push(event);
  if (recentEvents.length > 200) recentEvents.splice(0, recentEvents.length - 200);
  console.log(`[events] ${event.type} (block ${event.blockNumber}):`, JSON.stringify(event.data));
}

/** Best-effort fighter name lookup by on-chain ID */
function fighterName(id: bigint | number): string {
  const personalities = getAllPersonalities();
  const idx = Number(id) - 1; // 1-indexed
  return personalities[idx]?.name ?? `Fighter#${id}`;
}

function fighterPId(id: bigint | number): string {
  const personalities = getAllPersonalities();
  const idx = Number(id) - 1;
  return personalities[idx]?.id ?? '';
}

// ── Event watchers ──────────────────────────────────────────────────

export function watchEvents() {
  console.log('[events] Starting on-chain event watchers...');

  // Pool Created
  const unwatchPool = publicClient.watchContractEvent({
    address: CONTRACTS.bettingPool,
    abi: BETTING_POOL_ABI,
    eventName: 'PoolCreated',
    onLogs: async (logs) => {
      for (const log of logs) {
        const args = (log as any).args;
        const event: ChainEvent = {
          type: 'PoolCreated',
          blockNumber: log.blockNumber ?? 0n,
          txHash: log.transactionHash ?? '',
          timestamp: Date.now(),
          data: {
            poolId: args.poolId?.toString(),
            fighter1: fighterName(args.fighter1Id),
            fighter2: fighterName(args.fighter2Id),
            closesAt: args.closesAt?.toString(),
          },
        };

        // Generate commentary
        const f1pid = fighterPId(args.fighter1Id);
        const f2pid = fighterPId(args.fighter2Id);
        if (f1pid && f2pid) {
          try {
            event.llmReaction = await generateCommentary(f1pid, f2pid, `New betting pool opened! ${event.data.fighter1} vs ${event.data.fighter2}`);
          } catch {}
        }
        pushEvent(event);
      }
    },
  });
  unwatchers.push(unwatchPool);

  // Bet Placed
  const unwatchBet = publicClient.watchContractEvent({
    address: CONTRACTS.bettingPool,
    abi: BETTING_POOL_ABI,
    eventName: 'BetPlaced',
    onLogs: async (logs) => {
      for (const log of logs) {
        const args = (log as any).args;
        const event: ChainEvent = {
          type: 'BetPlaced',
          blockNumber: log.blockNumber ?? 0n,
          txHash: log.transactionHash ?? '',
          timestamp: Date.now(),
          data: {
            poolId: args.poolId?.toString(),
            bettor: args.bettor,
            fighterId: args.fighterId?.toString(),
            fighterName: fighterName(args.fighterId),
            amount: args.amount?.toString(),
          },
        };
        pushEvent(event);
      }
    },
  });
  unwatchers.push(unwatchBet);

  // Fight Resolved
  const unwatchFight = publicClient.watchContractEvent({
    address: CONTRACTS.fightResolver,
    abi: FIGHT_RESOLVER_ABI,
    eventName: 'FightResolved',
    onLogs: async (logs) => {
      for (const log of logs) {
        const args = (log as any).args;
        const winnerPid = fighterPId(args.winnerId);
        const loserPid = fighterPId(args.loserId);

        const event: ChainEvent = {
          type: 'FightResolved',
          blockNumber: log.blockNumber ?? 0n,
          txHash: log.transactionHash ?? '',
          timestamp: Date.now(),
          data: {
            fightId: args.fightId?.toString(),
            winner: fighterName(args.winnerId),
            loser: fighterName(args.loserId),
          },
        };

        if (winnerPid && loserPid) {
          try {
            event.llmReaction = await generateCommentary(winnerPid, loserPid, `FIGHT OVER! ${event.data.winner} defeats ${event.data.loser}!`);
          } catch {}
        }
        pushEvent(event);
      }
    },
  });
  unwatchers.push(unwatchFight);

  // Pool Resolved
  const unwatchPoolResolved = publicClient.watchContractEvent({
    address: CONTRACTS.bettingPool,
    abi: BETTING_POOL_ABI,
    eventName: 'PoolResolved',
    onLogs: async (logs) => {
      for (const log of logs) {
        const args = (log as any).args;
        const event: ChainEvent = {
          type: 'PoolResolved',
          blockNumber: log.blockNumber ?? 0n,
          txHash: log.transactionHash ?? '',
          timestamp: Date.now(),
          data: {
            poolId: args.poolId?.toString(),
            winnerId: args.winnerId?.toString(),
            winnerName: fighterName(args.winnerId),
          },
        };
        pushEvent(event);
      }
    },
  });
  unwatchers.push(unwatchPoolResolved);

  console.log('[events] Watching: PoolCreated, BetPlaced, FightResolved, PoolResolved');
}

export function stopWatching() {
  unwatchers.forEach((u) => u());
  unwatchers.length = 0;
  console.log('[events] Stopped all watchers');
}

export function getRecentEvents(count: number = 50): ChainEvent[] {
  return recentEvents.slice(-count);
}
