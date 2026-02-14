import { TournamentMatch, LeaderboardEntry } from './types';

export const tournamentMatches: TournamentMatch[] = [
  // Quarterfinals
  { id: 'qf1', round: 'quarterfinal', fighter1Id: 'kodiak', fighter2Id: 'venom', winnerId: 'kodiak', fightId: 'fight-1' },
  { id: 'qf2', round: 'quarterfinal', fighter1Id: 'mane', fighter2Id: 'razor', winnerId: 'mane', fightId: 'fight-2' },
  { id: 'qf3', round: 'quarterfinal', fighter1Id: 'fang', fighter2Id: 'talon', winnerId: 'fang', fightId: 'fight-3' },
  { id: 'qf4', round: 'quarterfinal', fighter1Id: 'kong', fighter2Id: 'jaws' },
  // Semifinals
  { id: 'sf1', round: 'semifinal', fighter1Id: 'kodiak', fighter2Id: 'mane', winnerId: 'kodiak', fightId: 'fight-4' },
  { id: 'sf2', round: 'semifinal', fighter1Id: 'fang', fighter2Id: '' },
  // Final
  { id: 'final', round: 'final', fighter1Id: '', fighter2Id: '' },
];

export const leaderboard: LeaderboardEntry[] = [
  { rank: 1, address: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12', profit: 42.5, streak: 7, totalBets: 23, volume: 156.2 },
  { rank: 2, address: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234', profit: 38.1, streak: 5, totalBets: 31, volume: 210.8 },
  { rank: 3, address: '0x3c4d5e6f7890abcdef1234567890abcdef123456', profit: 29.7, streak: 4, totalBets: 18, volume: 98.4 },
  { rank: 4, address: '0x4d5e6f7890abcdef1234567890abcdef12345678', profit: 22.3, streak: 3, totalBets: 27, volume: 145.0 },
  { rank: 5, address: '0x5e6f7890abcdef1234567890abcdef1234567890', profit: 18.9, streak: 6, totalBets: 15, volume: 87.3 },
  { rank: 6, address: '0x6f7890abcdef1234567890abcdef123456789012', profit: 15.2, streak: 2, totalBets: 22, volume: 120.5 },
  { rank: 7, address: '0x7890abcdef1234567890abcdef12345678901234', profit: 11.8, streak: 3, totalBets: 19, volume: 76.1 },
  { rank: 8, address: '0x890abcdef1234567890abcdef1234567890123456', profit: 8.4, streak: 1, totalBets: 12, volume: 55.2 },
  { rank: 9, address: '0x90abcdef1234567890abcdef12345678901234567', profit: 5.1, streak: 2, totalBets: 9, volume: 42.0 },
  { rank: 10, address: '0xabcdef1234567890abcdef123456789012345678', profit: 2.7, streak: 1, totalBets: 8, volume: 31.5 },
];

export const platformStats = {
  totalFights: 47,
  totalBets: 1243,
  totalVolume: 28450,
  activeFighters: 8,
};
