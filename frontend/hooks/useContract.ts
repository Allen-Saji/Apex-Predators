'use client';

// Re-export all contract hooks from the new module
export {
  useFighterCount,
  useFighterOnChain,
  useFighterStats,
  useFighterMoves,
  usePoolCount,
  usePool,
  useUserBet,
  useMinBet,
  usePlaceBet,
  useClaimWinnings,
  useFightCount,
  useFight,
  useActiveSeasonId,
  useSeason,
  useTournament,
  useTournamentMatch,
  useTournamentCount,
} from './useContracts';
