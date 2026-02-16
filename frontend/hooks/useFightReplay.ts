'use client';

import { useMemo } from 'react';
import { useReadContracts, useReadContract } from 'wagmi';
import { CONTRACTS, FIGHT_RESOLVER_ABI } from '@/lib/contracts';
import { fighters } from '@/lib/fighters';
import { Turn, Fighter } from '@/lib/types';

const LOOKBACK = 10; // Max fights to scan backward

function mapFighter(onChainId: bigint): Fighter | undefined {
  return fighters[Number(onChainId) - 1];
}

/** Find a move name that could produce this damage for the given fighter */
function guessMoveName(fighter: Fighter, damage: number, isCrit: boolean): string {
  const baseDmg = isCrit ? Math.round(damage / 2) : damage;
  // Find a move whose range includes the base damage
  const match = fighter.moves.find(
    (m) => baseDmg >= m.minDamage && baseDmg <= m.maxDamage
  );
  return match?.name ?? fighter.moves[0]?.name ?? 'Attack';
}

/** Decode packed turnLog bytes into Turn[] */
function decodeTurnLog(
  turnLogHex: string,
  fighter1: Fighter,
  fighter2: Fighter,
): Turn[] {
  // Remove 0x prefix
  const hex = turnLogHex.startsWith('0x') ? turnLogHex.slice(2) : turnLogHex;

  // Each turn = 3 bytes: uint8 attacker + uint8 damage + bool isCrit (1 byte)
  const BYTES_PER_TURN = 3;
  const totalTurns = Math.floor(hex.length / (BYTES_PER_TURN * 2)); // 2 hex chars per byte

  let hpLeft = 100;
  let hpRight = 100;
  const turns: Turn[] = [];

  for (let i = 0; i < totalTurns; i++) {
    const offset = i * BYTES_PER_TURN * 2;
    const attackerByte = parseInt(hex.slice(offset, offset + 2), 16);
    const damage = parseInt(hex.slice(offset + 2, offset + 4), 16);
    const isCrit = parseInt(hex.slice(offset + 4, offset + 6), 16) !== 0;

    // attacker 1 = fighter1 (left), 2 = fighter2 (right)
    const attacker: 'left' | 'right' = attackerByte === 1 ? 'left' : 'right';
    const defender: 'left' | 'right' = attacker === 'left' ? 'right' : 'left';
    const attackerFighter = attacker === 'left' ? fighter1 : fighter2;

    if (defender === 'left') hpLeft = Math.max(0, hpLeft - damage);
    else hpRight = Math.max(0, hpRight - damage);

    const moveName = guessMoveName(attackerFighter, damage, isCrit);
    const critText = isCrit ? ' CRITICAL HIT!' : '';
    const text = `${attackerFighter.name} lands a ${moveName} for ${damage} damage!${critText}`;

    turns.push({ attacker, defender, moveName, damage, isCrit, hpLeft, hpRight, text });
  }

  return turns;
}

/**
 * Hook to fetch and decode the on-chain fight replay for a given poolId.
 * Scans recent fights to find the one matching this pool, then decodes the turnLog.
 */
export function useFightReplay(poolId: bigint | undefined) {
  const { data: fightCount } = useReadContract({
    address: CONTRACTS.fightResolver,
    abi: FIGHT_RESOLVER_ABI,
    functionName: 'fightCount',
    query: { enabled: poolId !== undefined },
  });

  // Build contract calls to scan the last LOOKBACK fights
  const fightContracts = useMemo(() => {
    if (fightCount === undefined || fightCount === BigInt(0) || poolId === undefined) return [];
    const contracts = [];
    const count = Number(fightCount);
    const start = Math.max(0, count - LOOKBACK);
    for (let i = count - 1; i >= start; i--) {
      contracts.push({
        address: CONTRACTS.fightResolver as `0x${string}`,
        abi: FIGHT_RESOLVER_ABI,
        functionName: 'getFight' as const,
        args: [BigInt(i)] as const,
      });
    }
    return contracts;
  }, [fightCount, poolId]);

  const { data: fightResults, isLoading } = useReadContracts({
    contracts: fightContracts,
    query: { enabled: fightContracts.length > 0 },
  });

  const replay = useMemo(() => {
    if (!fightResults || poolId === undefined) return null;

    for (const result of fightResults) {
      if (result.status !== 'success' || !result.result) continue;
      const d = result.result as any;
      // getFight returns: (poolId, fighter1Id, fighter2Id, seedHash, seed, status, result)
      const fightPoolId = d[0] ?? d.poolId;
      if (BigInt(fightPoolId) !== poolId) continue;

      const fighter1Id = d[1] ?? d.fighter1Id;
      const fighter2Id = d[2] ?? d.fighter2Id;
      const fightResult = d[6] ?? d.result;
      const turnLogHex = fightResult?.turnLog ?? fightResult?.[4];

      if (!turnLogHex || turnLogHex === '0x') return null;

      const fighter1 = mapFighter(fighter1Id);
      const fighter2 = mapFighter(fighter2Id);
      if (!fighter1 || !fighter2) return null;

      return decodeTurnLog(turnLogHex, fighter1, fighter2);
    }

    return null;
  }, [fightResults, poolId]);

  return { turns: replay, isLoading };
}
