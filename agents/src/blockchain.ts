import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  getContract,
  type Hash,
  type Address,
  type PublicClient,
  type WalletClient,
  type GetContractReturnType,
  encodeAbiParameters,
  parseAbiParameters,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// ── Monad Testnet chain definition ──────────────────────────────────
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
});

// ── Contract addresses ──────────────────────────────────────────────
export const CONTRACTS = {
  fighterRegistry: '0xDe8Ba6cD9516f015323053298933346Bc57B0750' as Address,
  bettingPool: '0x3f009eD70a5379B99038bfb98A3e7be29a20c31a' as Address,
  fightResolver: '0xFEae2E6025271c0ca92C208EeF4D883ae2b38CB1' as Address,
  tournament: '0x222D29B8727A4651F4D83998907654B2aBabfDCd' as Address,
} as const;

// ── ABIs (write functions included) ─────────────────────────────────

export const FIGHTER_REGISTRY_ABI = [
  { type: 'function', name: 'fighterCount', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'getFighter', inputs: [{ name: 'fighterId', type: 'uint256' }], outputs: [{ name: '', type: 'tuple', components: [{ name: 'name', type: 'string' }, { name: 'animalType', type: 'string' }, { name: 'tokenAddress', type: 'address' }, { name: 'imageURI', type: 'string' }, { name: 'baseHp', type: 'uint8' }, { name: 'baseCritChance', type: 'uint8' }, { name: 'specialTrait', type: 'string' }, { name: 'active', type: 'bool' }] }], stateMutability: 'view' },
  { type: 'function', name: 'getFighterStats', inputs: [{ name: 'fighterId', type: 'uint256' }], outputs: [{ name: '', type: 'tuple', components: [{ name: 'wins', type: 'uint64' }, { name: 'losses', type: 'uint64' }, { name: 'kos', type: 'uint64' }, { name: 'totalDamageDealt', type: 'uint64' }, { name: 'totalEarningsGenerated', type: 'uint128' }] }], stateMutability: 'view' },
  { type: 'function', name: 'getMoves', inputs: [{ name: 'fighterId', type: 'uint256' }], outputs: [{ name: '', type: 'tuple[]', components: [{ name: 'name', type: 'string' }, { name: 'minDamage', type: 'uint8' }, { name: 'maxDamage', type: 'uint8' }] }], stateMutability: 'view' },
  { type: 'function', name: 'isFighterActive', inputs: [{ name: 'fighterId', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'view' },
] as const;

export const BETTING_POOL_ABI = [
  // Read
  { type: 'function', name: 'poolCount', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'getPool', inputs: [{ name: 'poolId', type: 'uint256' }], outputs: [{ name: '', type: 'tuple', components: [{ name: 'fighter1Id', type: 'uint256' }, { name: 'fighter2Id', type: 'uint256' }, { name: 'totalFighter1', type: 'uint256' }, { name: 'totalFighter2', type: 'uint256' }, { name: 'winnerId', type: 'uint256' }, { name: 'status', type: 'uint8' }, { name: 'closesAt', type: 'uint64' }, { name: 'resolvedFeeBps', type: 'uint256' }, { name: 'resolvedAt', type: 'uint64' }] }], stateMutability: 'view' },
  // Write
  { type: 'function', name: 'createPool', inputs: [{ name: 'fighter1Id', type: 'uint256' }, { name: 'fighter2Id', type: 'uint256' }, { name: 'closesAt', type: 'uint64' }], outputs: [{ name: 'poolId', type: 'uint256' }], stateMutability: 'nonpayable' },
  { type: 'function', name: 'closePool', inputs: [{ name: 'poolId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'resolvePool', inputs: [{ name: 'poolId', type: 'uint256' }, { name: 'winnerId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'cancelPool', inputs: [{ name: 'poolId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  // Events
  { type: 'event', name: 'PoolCreated', inputs: [{ name: 'poolId', type: 'uint256', indexed: true }, { name: 'fighter1Id', type: 'uint256', indexed: false }, { name: 'fighter2Id', type: 'uint256', indexed: false }, { name: 'closesAt', type: 'uint64', indexed: false }] },
  { type: 'event', name: 'BetPlaced', inputs: [{ name: 'poolId', type: 'uint256', indexed: true }, { name: 'bettor', type: 'address', indexed: true }, { name: 'fighterId', type: 'uint256', indexed: false }, { name: 'amount', type: 'uint256', indexed: false }] },
  { type: 'event', name: 'PoolResolved', inputs: [{ name: 'poolId', type: 'uint256', indexed: true }, { name: 'winnerId', type: 'uint256', indexed: false }] },
  { type: 'event', name: 'PoolCancelled', inputs: [{ name: 'poolId', type: 'uint256', indexed: true }] },
] as const;

export const FIGHT_RESOLVER_ABI = [
  // Read
  { type: 'function', name: 'fightCount', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'getFight', inputs: [{ name: 'fightId', type: 'uint256' }], outputs: [{ name: 'poolId', type: 'uint256' }, { name: 'fighter1Id', type: 'uint256' }, { name: 'fighter2Id', type: 'uint256' }, { name: 'seedHash', type: 'bytes32' }, { name: 'seed', type: 'bytes32' }, { name: 'status', type: 'uint8' }, { name: 'result', type: 'tuple', components: [{ name: 'winnerId', type: 'uint256' }, { name: 'loserId', type: 'uint256' }, { name: 'totalTurns', type: 'uint16' }, { name: 'outcome', type: 'uint8' }, { name: 'turnLog', type: 'bytes' }] }], stateMutability: 'view' },
  { type: 'function', name: 'minRevealDelay', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  // Write
  { type: 'function', name: 'createFight', inputs: [{ name: 'poolId', type: 'uint256' }, { name: 'fighter1Id', type: 'uint256' }, { name: 'fighter2Id', type: 'uint256' }], outputs: [{ name: 'fightId', type: 'uint256' }], stateMutability: 'nonpayable' },
  { type: 'function', name: 'commitSeed', inputs: [{ name: 'fightId', type: 'uint256' }, { name: 'seedHash', type: 'bytes32' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'revealAndResolve', inputs: [{ name: 'fightId', type: 'uint256' }, { name: 'seed', type: 'bytes32' }, { name: 'result', type: 'tuple', components: [{ name: 'winnerId', type: 'uint256' }, { name: 'loserId', type: 'uint256' }, { name: 'totalTurns', type: 'uint16' }, { name: 'outcome', type: 'uint8' }, { name: 'turnLog', type: 'bytes' }] }], outputs: [], stateMutability: 'nonpayable' },
  // Events
  { type: 'event', name: 'FightCreated', inputs: [{ name: 'fightId', type: 'uint256', indexed: true }, { name: 'poolId', type: 'uint256', indexed: true }, { name: 'fighter1Id', type: 'uint256', indexed: false }, { name: 'fighter2Id', type: 'uint256', indexed: false }] },
  { type: 'event', name: 'SeedCommitted', inputs: [{ name: 'fightId', type: 'uint256', indexed: true }, { name: 'seedHash', type: 'bytes32', indexed: false }] },
  { type: 'event', name: 'FightResolved', inputs: [{ name: 'fightId', type: 'uint256', indexed: true }, { name: 'winnerId', type: 'uint256', indexed: false }, { name: 'loserId', type: 'uint256', indexed: false }] },
] as const;

export const TOURNAMENT_ABI = [
  // Read
  { type: 'function', name: 'activeSeasonId', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'getTournament', inputs: [{ name: 'tournamentId', type: 'uint256' }], outputs: [{ name: 'seasonId', type: 'uint256' }, { name: 'fighterIds', type: 'uint256[]' }, { name: 'status', type: 'uint8' }, { name: 'championId', type: 'uint256' }, { name: 'totalRounds', type: 'uint256' }, { name: 'matchCount', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'getMatch', inputs: [{ name: 'tournamentId', type: 'uint256' }, { name: 'matchIndex', type: 'uint256' }], outputs: [{ name: '', type: 'tuple', components: [{ name: 'fighter1Id', type: 'uint256' }, { name: 'fighter2Id', type: 'uint256' }, { name: 'winnerId', type: 'uint256' }, { name: 'poolId', type: 'uint256' }, { name: 'round', type: 'uint8' }, { name: 'resolved', type: 'bool' }] }], stateMutability: 'view' },
  { type: 'function', name: 'tournamentCount', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  // Write
  { type: 'function', name: 'createTournament', inputs: [{ name: 'seasonId', type: 'uint256' }, { name: 'fighterIds', type: 'uint256[]' }], outputs: [{ name: 'tournamentId', type: 'uint256' }], stateMutability: 'nonpayable' },
  { type: 'function', name: 'advanceWinner', inputs: [{ name: 'tournamentId', type: 'uint256' }, { name: 'matchIndex', type: 'uint256' }, { name: 'winnerId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'setMatchPool', inputs: [{ name: 'tournamentId', type: 'uint256' }, { name: 'matchIndex', type: 'uint256' }, { name: 'poolId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'startSeason', inputs: [], outputs: [{ name: 'seasonId', type: 'uint256' }], stateMutability: 'nonpayable' },
  { type: 'function', name: 'endSeason', inputs: [{ name: 'seasonId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
] as const;

// ── Clients ─────────────────────────────────────────────────────────

const rpcUrl = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';

export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(rpcUrl),
});

function getWalletClient(): WalletClient {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error('PRIVATE_KEY env var is required');
  const account = privateKeyToAccount(pk as `0x${string}`);
  return createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(rpcUrl),
  });
}

export function getAgentAddress(): Address {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error('PRIVATE_KEY env var is required');
  return privateKeyToAccount(pk as `0x${string}`).address;
}

// ── Helper: write + wait ────────────────────────────────────────────

async function writeTx(
  address: Address,
  abi: readonly any[],
  functionName: string,
  args: any[],
): Promise<Hash> {
  const wallet = getWalletClient();
  const hash = await wallet.writeContract({
    address,
    abi,
    functionName,
    args,
    chain: monadTestnet,
    account: wallet.account!,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

async function simulateAndWrite(
  address: Address,
  abi: readonly any[],
  functionName: string,
  args: any[],
): Promise<{ hash: Hash; result: any }> {
  const wallet = getWalletClient();
  const { result } = await publicClient.simulateContract({
    address,
    abi,
    functionName,
    args,
    account: wallet.account!,
  });
  const hash = await wallet.writeContract({
    address,
    abi,
    functionName,
    args,
    chain: monadTestnet,
    account: wallet.account!,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return { hash, result };
}

// ── Transaction helpers ─────────────────────────────────────────────

export async function createPool(
  fighter1Id: bigint,
  fighter2Id: bigint,
  closesAt: bigint,
): Promise<{ poolId: bigint; hash: Hash }> {
  const { hash, result } = await simulateAndWrite(
    CONTRACTS.bettingPool,
    BETTING_POOL_ABI,
    'createPool',
    [fighter1Id, fighter2Id, closesAt],
  );
  console.log(`[blockchain] createPool tx: ${hash} → poolId ${result}`);
  return { poolId: result as bigint, hash };
}

export async function closePool(poolId: bigint): Promise<Hash> {
  const hash = await writeTx(CONTRACTS.bettingPool, BETTING_POOL_ABI, 'closePool', [poolId]);
  console.log(`[blockchain] closePool tx: ${hash}`);
  return hash;
}

export async function resolvePool(poolId: bigint, winnerId: bigint): Promise<Hash> {
  const hash = await writeTx(CONTRACTS.bettingPool, BETTING_POOL_ABI, 'resolvePool', [poolId, winnerId]);
  console.log(`[blockchain] resolvePool tx: ${hash}`);
  return hash;
}

export async function createFight(
  poolId: bigint,
  fighter1Id: bigint,
  fighter2Id: bigint,
): Promise<{ fightId: bigint; hash: Hash }> {
  const { hash, result } = await simulateAndWrite(
    CONTRACTS.fightResolver,
    FIGHT_RESOLVER_ABI,
    'createFight',
    [poolId, fighter1Id, fighter2Id],
  );
  console.log(`[blockchain] createFight tx: ${hash} → fightId ${result}`);
  return { fightId: result as bigint, hash };
}

export async function commitSeed(fightId: bigint, seedHash: `0x${string}`): Promise<Hash> {
  const hash = await writeTx(CONTRACTS.fightResolver, FIGHT_RESOLVER_ABI, 'commitSeed', [fightId, seedHash]);
  console.log(`[blockchain] commitSeed tx: ${hash}`);
  return hash;
}

export async function revealAndResolve(
  fightId: bigint,
  seed: `0x${string}`,
  result: {
    winnerId: bigint;
    loserId: bigint;
    totalTurns: number;
    outcome: number; // 0 = Decision, 1 = KO
    turnLog: `0x${string}`;
  },
): Promise<Hash> {
  const hash = await writeTx(
    CONTRACTS.fightResolver,
    FIGHT_RESOLVER_ABI,
    'revealAndResolve',
    [fightId, seed, result],
  );
  console.log(`[blockchain] revealAndResolve tx: ${hash}`);
  return hash;
}

export async function getMinRevealDelay(): Promise<bigint> {
  const delay = await publicClient.readContract({
    address: CONTRACTS.fightResolver,
    abi: FIGHT_RESOLVER_ABI,
    functionName: 'minRevealDelay',
  });
  return delay as bigint;
}

export async function getPoolCount(): Promise<bigint> {
  return (await publicClient.readContract({
    address: CONTRACTS.bettingPool,
    abi: BETTING_POOL_ABI,
    functionName: 'poolCount',
  })) as bigint;
}

export async function getPool(poolId: bigint) {
  return publicClient.readContract({
    address: CONTRACTS.bettingPool,
    abi: BETTING_POOL_ABI,
    functionName: 'getPool',
    args: [poolId],
  });
}

export async function getFighterOnChain(fighterId: bigint) {
  return publicClient.readContract({
    address: CONTRACTS.fighterRegistry,
    abi: FIGHTER_REGISTRY_ABI,
    functionName: 'getFighter',
    args: [fighterId],
  });
}

export async function getFighterMoves(fighterId: bigint) {
  return publicClient.readContract({
    address: CONTRACTS.fighterRegistry,
    abi: FIGHTER_REGISTRY_ABI,
    functionName: 'getMoves',
    args: [fighterId],
  });
}
