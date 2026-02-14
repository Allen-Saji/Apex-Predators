export interface Move {
  name: string;
  minDamage: number;
  maxDamage: number;
}

export interface Fighter {
  id: string;
  name: string;
  animal: string;
  image: string;
  backstory: string;
  catchphrase: string;
  color: string;
  hp: number;
  wins: number;
  losses: number;
  kos: number;
  damageDealt: number;
  moves: Move[];
  specialTrait: { name: string; description: string };
  focalPoint?: string; // CSS object-position value e.g. 'center 30%'
}

export interface Turn {
  attacker: 'left' | 'right';
  defender: 'left' | 'right';
  moveName: string;
  damage: number;
  isCrit: boolean;
  hpLeft: number;
  hpRight: number;
  text: string;
}

export interface Fight {
  id: string;
  fighter1Id: string;
  fighter2Id: string;
  winnerId?: string;
  turns: Turn[];
  arena: string;
  status: 'upcoming' | 'live' | 'completed';
}

export interface TournamentMatch {
  id: string;
  round: 'quarterfinal' | 'semifinal' | 'final';
  fighter1Id: string;
  fighter2Id: string;
  winnerId?: string;
  fightId?: string;
}

export interface Bet {
  id: string;
  fightId: string;
  fighterId: string;
  amount: number;
  bettor: string;
  claimed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  profit: number;
  streak: number;
  totalBets: number;
  volume: number;
}
