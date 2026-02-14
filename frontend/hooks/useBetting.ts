'use client';

import { useState } from 'react';

export function useBetting() {
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  const placeBet = async (fightId: string, fighterId: string, amount: number) => {
    setIsPlacingBet(true);
    // Simulated delay
    await new Promise((r) => setTimeout(r, 1500));
    setIsPlacingBet(false);
    return true;
  };

  const claimWinnings = async (fightId: string) => {
    await new Promise((r) => setTimeout(r, 1500));
    return true;
  };

  return { placeBet, claimWinnings, isPlacingBet };
}
