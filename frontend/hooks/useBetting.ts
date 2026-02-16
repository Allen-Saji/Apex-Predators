'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { usePlaceBet as usePlaceBetContract, useClaimWinnings as useClaimWinningsContract } from './useContracts';

export function useBetting() {
  const { isConnected } = useAccount();
  const { placeBet: placeBetOnChain, isPending: isBetPending } = usePlaceBetContract();
  const { claim: claimOnChain, isPending: isClaimPending } = useClaimWinningsContract();
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  const placeBet = async (fightId: string, fighterId: string, amount: number) => {
    if (isConnected) {
      // Use real contract — poolId and fighterId as bigints
      // Note: wagmi's writeContract is async but result is tracked via isPending/isSuccess
      placeBetOnChain(BigInt(fightId), BigInt(fighterId), amount.toString());
      return;
    }
    // Fallback mock
    setIsPlacingBet(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsPlacingBet(false);
  };

  const claimWinnings = async (fightId: string) => {
    if (isConnected) {
      claimOnChain(BigInt(fightId));
      return;
    }
    await new Promise((r) => setTimeout(r, 1500));
  };

  return { placeBet, claimWinnings, isPlacingBet: isPlacingBet || isBetPending };
}
