'use client';

import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import {
  CONTRACTS,
  FIGHTER_REGISTRY_ABI,
  BETTING_POOL_ABI,
  FIGHT_RESOLVER_ABI,
  TOURNAMENT_ABI,
} from '@/lib/contracts';

// ─── Fighter Registry ───────────────────────────────────────────────

export function useFighterCount() {
  return useReadContract({
    address: CONTRACTS.fighterRegistry,
    abi: FIGHTER_REGISTRY_ABI,
    functionName: 'fighterCount',
  });
}

export function useFighterOnChain(fighterId: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.fighterRegistry,
    abi: FIGHTER_REGISTRY_ABI,
    functionName: 'getFighter',
    args: fighterId !== undefined ? [fighterId] : undefined,
    query: { enabled: fighterId !== undefined },
  });
}

export function useFighterStats(fighterId: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.fighterRegistry,
    abi: FIGHTER_REGISTRY_ABI,
    functionName: 'getFighterStats',
    args: fighterId !== undefined ? [fighterId] : undefined,
    query: { enabled: fighterId !== undefined },
  });
}

export function useFighterMoves(fighterId: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.fighterRegistry,
    abi: FIGHTER_REGISTRY_ABI,
    functionName: 'getMoves',
    args: fighterId !== undefined ? [fighterId] : undefined,
    query: { enabled: fighterId !== undefined },
  });
}

// ─── Betting Pool ───────────────────────────────────────────────────

export function usePoolCount() {
  return useReadContract({
    address: CONTRACTS.bettingPool,
    abi: BETTING_POOL_ABI,
    functionName: 'poolCount',
  });
}

export function usePool(poolId: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.bettingPool,
    abi: BETTING_POOL_ABI,
    functionName: 'getPool',
    args: poolId !== undefined ? [poolId] : undefined,
    query: { enabled: poolId !== undefined },
  });
}

export function useUserBet(poolId: bigint | undefined, fighterId: bigint | undefined) {
  const { address } = useAccount();
  return useReadContract({
    address: CONTRACTS.bettingPool,
    abi: BETTING_POOL_ABI,
    functionName: 'getUserBet',
    args: poolId !== undefined && fighterId !== undefined && address
      ? [poolId, fighterId, address]
      : undefined,
    query: { enabled: poolId !== undefined && fighterId !== undefined && !!address },
  });
}

export function useMinBet() {
  return useReadContract({
    address: CONTRACTS.bettingPool,
    abi: BETTING_POOL_ABI,
    functionName: 'MIN_BET',
  });
}

export function usePlaceBet() {
  const { writeContract, isPending, isSuccess, error, data } = useWriteContract();

  const placeBet = (poolId: bigint, fighterId: bigint, amountEth: string) => {
    writeContract({
      address: CONTRACTS.bettingPool,
      abi: BETTING_POOL_ABI,
      functionName: 'placeBet',
      args: [poolId, fighterId],
      value: parseEther(amountEth),
    });
  };

  return { placeBet, isPending, isSuccess, error, txHash: data };
}

export function useClaimWinnings() {
  const { writeContract, isPending, isSuccess, error, data } = useWriteContract();

  const claim = (poolId: bigint) => {
    writeContract({
      address: CONTRACTS.bettingPool,
      abi: BETTING_POOL_ABI,
      functionName: 'claimWinnings',
      args: [poolId],
    });
  };

  return { claim, isPending, isSuccess, error, txHash: data };
}

export function useHasClaimed(poolId: bigint | undefined) {
  const { address } = useAccount();
  return useReadContract({
    address: CONTRACTS.bettingPool,
    abi: BETTING_POOL_ABI,
    functionName: 'hasClaimed',
    args: poolId !== undefined && address ? [poolId, address] : undefined,
    query: { enabled: poolId !== undefined && !!address },
  });
}

export function useOwner() {
  return useReadContract({
    address: CONTRACTS.bettingPool,
    abi: BETTING_POOL_ABI,
    functionName: 'owner',
  });
}

// ─── Fight Resolver ─────────────────────────────────────────────────

export function useFightCount() {
  return useReadContract({
    address: CONTRACTS.fightResolver,
    abi: FIGHT_RESOLVER_ABI,
    functionName: 'fightCount',
  });
}

export function useFight(fightId: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.fightResolver,
    abi: FIGHT_RESOLVER_ABI,
    functionName: 'getFight',
    args: fightId !== undefined ? [fightId] : undefined,
    query: { enabled: fightId !== undefined },
  });
}

// ─── Tournament ─────────────────────────────────────────────────────

export function useActiveSeasonId() {
  return useReadContract({
    address: CONTRACTS.tournament,
    abi: TOURNAMENT_ABI,
    functionName: 'activeSeasonId',
  });
}

export function useSeason(seasonId: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.tournament,
    abi: TOURNAMENT_ABI,
    functionName: 'getSeason',
    args: seasonId !== undefined ? [seasonId] : undefined,
    query: { enabled: seasonId !== undefined },
  });
}

export function useTournament(tournamentId: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.tournament,
    abi: TOURNAMENT_ABI,
    functionName: 'getTournament',
    args: tournamentId !== undefined ? [tournamentId] : undefined,
    query: { enabled: tournamentId !== undefined },
  });
}

export function useTournamentMatch(tournamentId: bigint | undefined, matchIndex: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.tournament,
    abi: TOURNAMENT_ABI,
    functionName: 'getMatch',
    args: tournamentId !== undefined && matchIndex !== undefined
      ? [tournamentId, matchIndex]
      : undefined,
    query: { enabled: tournamentId !== undefined && matchIndex !== undefined },
  });
}

export function useTournamentCount() {
  return useReadContract({
    address: CONTRACTS.tournament,
    abi: TOURNAMENT_ABI,
    functionName: 'tournamentCount',
  });
}
