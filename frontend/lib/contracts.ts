// Placeholder contract addresses and ABIs for Monad testnet
export const CONTRACTS = {
  fighterRegistry: '0x0000000000000000000000000000000000000001',
  bettingPool: '0x0000000000000000000000000000000000000002',
  fightResolver: '0x0000000000000000000000000000000000000003',
  tournament: '0x0000000000000000000000000000000000000004',
} as const;

// Minimal ABIs - to be replaced with real ones after deployment
export const BETTING_POOL_ABI = [
  {
    name: 'placeBet',
    type: 'function',
    inputs: [
      { name: 'fightId', type: 'uint256' },
      { name: 'fighterId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    name: 'claimWinnings',
    type: 'function',
    inputs: [{ name: 'fightId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;
