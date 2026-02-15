'use client';

import { fighters } from '@/lib/fighters';
import { Fighter } from '@/lib/types';
import { usePoolCount, usePool, useFightCount, useFight as useFightOnChain } from './useContracts';
import { formatEther } from 'viem';

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

export function useArenaState(refetchInterval = 5000): ArenaState {
  const { data: poolCount, isLoading: poolCountLoading, refetch: refetchPoolCount } = usePoolCount();

  const hasPool = poolCount !== undefined && poolCount > BigInt(0);
  const latestPoolId = hasPool ? poolCount - BigInt(1) : undefined;

  const { data: poolData, isLoading: poolLoading, refetch: refetchPool } = usePool(latestPoolId);

  const { data: fightCount, refetch: refetchFightCount } = useFightCount();
  const hasFight = fightCount !== undefined && fightCount > BigInt(0);
  const latestFightId = hasFight ? fightCount - BigInt(1) : undefined;

  const { data: fightData, refetch: refetchFight } = useFightOnChain(latestFightId);

  const loading = poolCountLoading || (hasPool && poolLoading);

  const refetch = () => {
    refetchPoolCount();
    refetchPool();
    refetchFightCount();
    refetchFight();
  };

  if (!hasPool) {
    return { pool: null, fight: null, fighter1: undefined, fighter2: undefined, poolId: undefined, fightId: undefined, status: 'no-pools', loading: !!loading, refetch };
  }

  // Parse pool data - wagmi returns as array/tuple
  let pool: ArenaPool | null = null;
  if (poolData) {
    const d = poolData as any;
    pool = {
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

  // Parse fight data
  let fight: ArenaFight | null = null;
  if (fightData) {
    const d = fightData as any;
    // getFight returns: poolId, fighter1Id, fighter2Id, seedHash, seed, status, result
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

  return { pool, fight, fighter1, fighter2, poolId: latestPoolId, fightId: latestFightId, status, loading: !!loading, refetch };
}
