'use client';

import { useMemo } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACTS, BETTING_POOL_ABI } from '@/lib/contracts';
import { fighters } from '@/lib/fighters';
import { Fighter } from '@/lib/types';
import { PoolStatus, type ArenaPool } from './useArenaState';

export interface PoolWithId extends ArenaPool {
  poolId: bigint;
  fighter1: Fighter | undefined;
  fighter2: Fighter | undefined;
}

const MAX_POOLS = 10;

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

function mapFighter(onChainId: bigint): Fighter | undefined {
  return fighters[Number(onChainId) - 1];
}

export function useAllPools(refetchInterval = 5000) {
  const { data: poolCount, isLoading: poolCountLoading, refetch: refetchPoolCount } = useReadContract({
    address: CONTRACTS.bettingPool as `0x${string}`,
    abi: BETTING_POOL_ABI,
    functionName: 'poolCount',
    query: { refetchInterval },
  });

  const hasPool = poolCount !== undefined && poolCount > BigInt(0);
  // Pools are 1-indexed: valid IDs are 1..poolCount
  const latestPoolId = hasPool ? poolCount : undefined;

  const poolContracts = useMemo(() => {
    if (latestPoolId === undefined) return [];
    const contracts = [];
    const fetchCount = Math.min(Number(latestPoolId), MAX_POOLS);
    for (let i = 0; i < fetchCount; i++) {
      contracts.push({
        address: CONTRACTS.bettingPool as `0x${string}`,
        abi: BETTING_POOL_ABI,
        functionName: 'getPool' as const,
        args: [latestPoolId - BigInt(i)] as const,
      });
    }
    return contracts;
  }, [latestPoolId]);

  const { data: poolResults, isLoading: poolsLoading, refetch: refetchPools } = useReadContracts({
    contracts: poolContracts,
    query: { enabled: poolContracts.length > 0, refetchInterval },
  });

  const loading = poolCountLoading || (hasPool && poolsLoading);

  const refetch = () => {
    refetchPoolCount();
    refetchPools();
  };

  const { pools, openPools, stalePools, closedPools, resolvedPools } = useMemo(() => {
    if (!poolResults || latestPoolId === undefined) {
      return { pools: [], openPools: [], stalePools: [], closedPools: [], resolvedPools: [] };
    }

    const all: PoolWithId[] = [];
    for (let i = 0; i < poolResults.length; i++) {
      const result = poolResults[i];
      if (result.status !== 'success' || !result.result) continue;
      const parsed = parsePoolData(result.result);
      // Skip cancelled pools
      if (parsed.status === PoolStatus.Cancelled) continue;
      all.push({
        ...parsed,
        poolId: latestPoolId - BigInt(i),
        fighter1: mapFighter(parsed.fighter1Id),
        fighter2: mapFighter(parsed.fighter2Id),
      });
    }

    // Filter out old resolved pools — keep only latest 3 resolved
    const resolved = all.filter(p => p.status === PoolStatus.Resolved);
    const resolvedToHide = new Set(resolved.slice(3).map(p => p.poolId));
    const filtered = all.filter(p => !resolvedToHide.has(p.poolId));

    const now = Math.floor(Date.now() / 1000);
    // Open pools with expired timers are stale (agent likely died before closing)
    const bettablePools = filtered.filter(
      p => p.status === PoolStatus.Open && p.closesAt > 0 && now < p.closesAt,
    );
    const stalePools = filtered.filter(
      p => p.status === PoolStatus.Open && p.closesAt > 0 && now >= p.closesAt,
    );

    return {
      pools: filtered,
      openPools: bettablePools,
      stalePools,
      closedPools: filtered.filter(p => p.status === PoolStatus.Closed),
      resolvedPools: filtered.filter(p => p.status === PoolStatus.Resolved),
    };
  }, [poolResults, latestPoolId]);

  return { pools, openPools, stalePools, closedPools, resolvedPools, loading: !!loading, refetch };
}
