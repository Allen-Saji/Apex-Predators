'use client';

import { useMemo } from 'react';
import { fighters } from '@/lib/fighters';
import { Fighter } from '@/lib/types';
import { usePoolCount, useFightCount, useFight as useFightOnChain } from './useContracts';
import { useReadContracts } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACTS, BETTING_POOL_ABI } from '@/lib/contracts';

// Pool status enum from contract
export const PoolStatus = { Open: 0, Closed: 1, Resolved: 2, Cancelled: 3 } as const;
// Fight status enum from contract
export const FightStatus = { Pending: 0, CommitPhase: 1, Resolved: 2 } as const;
// Fight outcome enum from contract
export const FightOutcome = { KO: 0, Decision: 1 } as const;

function mapFighter(onChainId: bigint): Fighter | undefined {
  return fighters[Number(onChainId) - 1];
}

export interface ArenaPool {
  fighter1Id: bigint;
  fighter2Id: bigint;
  totalFighter1: string; // formatted MON
  totalFighter1Wei: bigint;
  totalFighter2: string;
  totalFighter2Wei: bigint;
  winnerId: bigint;
  status: number;
  closesAt: number; // unix seconds
  resolvedAt: number;
}

export interface ArenaFight {
  poolId: bigint;
  fighter1Id: bigint;
  fighter2Id: bigint;
  status: number;
  result: {
    winnerId: bigint;
    loserId: bigint;
    totalTurns: number;
    outcome: number; // 0=KO, 1=Decision
  };
}

export interface ArenaState {
  pool: ArenaPool | null;
  fight: ArenaFight | null;
  fighter1: Fighter | undefined;
  fighter2: Fighter | undefined;
  poolId: bigint | undefined;
  fightId: bigint | undefined;
  status: 'no-pools' | 'open' | 'closed' | 'resolved' | 'cancelled';
  loading: boolean;
  refetch: () => void;
}

const LOOKBACK = 5; // Max pools to scan backward for an open one

function parsePoolData(d: any): ArenaPool {
  return {
    fighter1Id: d.fighter1Id ?? d[0],
    fighter2Id: d.fighter2Id ?? d[1],
    totalFighter1Wei: d.totalFighter1 ?? d[2],
    totalFighter1: formatEther(d.totalFighter1 ?? d[2]),
    totalFighter2Wei: d.totalFighter2 ?? d[3],
    totalFighter2: formatEther(d.totalFighter2 ?? d[3]),
    winnerId: d.winnerId ?? d[4],
    status: Number(d.status ?? d[5]),
    closesAt: Number(d.closesAt ?? d[6]),
    resolvedAt: Number(d.resolvedAt ?? d[8]),
  };
}

export function useArenaState(refetchInterval = 5000): ArenaState {
  const { data: poolCount, isLoading: poolCountLoading, refetch: refetchPoolCount } = usePoolCount();

  const hasPool = poolCount !== undefined && poolCount > BigInt(0);
  // Pools are 1-indexed: valid IDs are 1..poolCount
  const latestPoolId = hasPool ? poolCount : undefined;

  // Build contracts array for the last LOOKBACK pools
  const poolContracts = useMemo(() => {
    if (latestPoolId === undefined) return [];
    const contracts = [];
    const start = latestPoolId > BigInt(LOOKBACK) ? latestPoolId - BigInt(LOOKBACK - 1) : BigInt(1);
    for (let i = latestPoolId; i >= start; i--) {
      contracts.push({
        address: CONTRACTS.bettingPool as `0x${string}`,
        abi: BETTING_POOL_ABI,
        functionName: 'getPool' as const,
        args: [i] as const,
      });
    }
    return contracts;
  }, [latestPoolId]);

  const { data: poolResults, isLoading: poolsLoading, refetch: refetchPools } = useReadContracts({
    contracts: poolContracts,
    query: { enabled: poolContracts.length > 0 },
  });

  // Also read the latest pool directly for the common case (fast path)
  const { data: fightCount, refetch: refetchFightCount } = useFightCount();
  const hasFight = fightCount !== undefined && fightCount > BigInt(0);
  const latestFightId = hasFight ? fightCount - BigInt(1) : undefined;

  const { data: fightData, refetch: refetchFight } = useFightOnChain(latestFightId);

  const loading = poolCountLoading || (hasPool && poolsLoading);

  const refetch = () => {
    refetchPoolCount();
    refetchPools();
    refetchFightCount();
    refetchFight();
  };

  // Find the best pool: prefer open, fall back to latest
  const { bestPool, bestPoolId } = useMemo(() => {
    if (!poolResults || poolResults.length === 0 || latestPoolId === undefined) {
      return { bestPool: null, bestPoolId: undefined };
    }

    // Scan results looking for an open pool
    for (let i = 0; i < poolResults.length; i++) {
      const result = poolResults[i];
      if (result.status !== 'success' || !result.result) continue;
      const parsed = parsePoolData(result.result);
      if (parsed.status === PoolStatus.Open) {
        const id = latestPoolId - BigInt(i);
        return { bestPool: parsed, bestPoolId: id };
      }
    }

    // No open pool found — fall back to latest
    const latest = poolResults[0];
    if (latest?.status === 'success' && latest.result) {
      return { bestPool: parsePoolData(latest.result), bestPoolId: latestPoolId };
    }

    return { bestPool: null, bestPoolId: undefined };
  }, [poolResults, latestPoolId]);

  if (!hasPool) {
    return { pool: null, fight: null, fighter1: undefined, fighter2: undefined, poolId: undefined, fightId: undefined, status: 'no-pools', loading: !!loading, refetch };
  }

  const pool = bestPool;
  const poolId = bestPoolId;

  // Parse fight data
  let fight: ArenaFight | null = null;
  if (fightData) {
    const d = fightData as any;
    fight = {
      poolId: d[0] ?? d.poolId,
      fighter1Id: d[1] ?? d.fighter1Id,
      fighter2Id: d[2] ?? d.fighter2Id,
      status: Number(d[5] ?? d.status),
      result: {
        winnerId: d[6]?.winnerId ?? d[6]?.[0] ?? BigInt(0),
        loserId: d[6]?.loserId ?? d[6]?.[1] ?? BigInt(0),
        totalTurns: Number(d[6]?.totalTurns ?? d[6]?.[2] ?? 0),
        outcome: Number(d[6]?.outcome ?? d[6]?.[3] ?? 0),
      },
    };
  }

  const fighter1 = pool ? mapFighter(pool.fighter1Id) : undefined;
  const fighter2 = pool ? mapFighter(pool.fighter2Id) : undefined;

  let status: ArenaState['status'] = 'no-pools';
  if (pool) {
    switch (pool.status) {
      case PoolStatus.Open: status = 'open'; break;
      case PoolStatus.Closed: status = 'closed'; break;
      case PoolStatus.Resolved: status = 'resolved'; break;
      case PoolStatus.Cancelled: status = 'cancelled'; break;
    }
  }

  return { pool, fight, fighter1, fighter2, poolId, fightId: latestFightId, status, loading: !!loading, refetch };
}
