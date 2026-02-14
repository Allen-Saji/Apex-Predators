// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IFightResolver.sol";
import "./interfaces/IFighterRegistry.sol";
import "./interfaces/IBettingPool.sol";

/// @title FightResolver — Off-chain deterministic fight execution with on-chain verification
/// @notice Commit-reveal randomness with enforced ordering: commit → close betting → reveal
contract FightResolver is IFightResolver, Ownable, Pausable {
    // ── Errors ──────────────────────────────────────────────
    error FightNotFound();
    error NotExecutor();
    error InvalidPhase();
    error SeedAlreadyCommitted();
    error InvalidSeedReveal();
    error InvalidResult();
    error FighterNotInFight();
    error InvalidAddress();           // Finding #7
    error PoolNotClosed();            // Finding #4
    error RevealTooEarly();           // Finding #2: min delay

    // ── Events ──────────────────────────────────────────────
    event FightCreated(uint256 indexed fightId, uint256 poolId, uint256 fighter1Id, uint256 fighter2Id);
    event SeedCommitted(uint256 indexed fightId, bytes32 seedHash);
    event FightResolved(
        uint256 indexed fightId, uint256 winnerId, uint256 loserId,
        uint16 totalTurns, FightOutcome outcome, bytes32 seed
    );
    event ExecutorUpdated(address indexed executor, bool authorized);
    event MinRevealDelayUpdated(uint256 newDelay);

    // ── Structs ─────────────────────────────────────────────
    struct Fight {
        uint256 poolId;
        uint256 fighter1Id;
        uint256 fighter2Id;
        bytes32 seedHash;
        bytes32 seed;
        FightStatus status;
        FightResult result;
        uint64 commitTimestamp;    // Finding #2: track when seed was committed
    }

    // ── State ───────────────────────────────────────────────
    uint256 private _nextFightId = 1;
    mapping(uint256 => Fight) private _fights;
    mapping(address => bool) public executors;

    IFighterRegistry public fighterRegistry;
    IBettingPool public bettingPool;

    /// @notice Minimum delay between commit and reveal (Finding #2)
    uint256 public minRevealDelay = 5 minutes;

    // ── Constructor ─────────────────────────────────────────
    /// @param _registry FighterRegistry address
    /// @param _bettingPool BettingPool address
    constructor(address _registry, address _bettingPool) Ownable(msg.sender) {
        if (_registry == address(0)) revert InvalidAddress();   // Finding #7
        if (_bettingPool == address(0)) revert InvalidAddress(); // Finding #7
        fighterRegistry = IFighterRegistry(_registry);
        bettingPool = IBettingPool(_bettingPool);
    }

    // ── Modifiers ───────────────────────────────────────────
    modifier onlyExecutor() {
        if (!executors[msg.sender] && msg.sender != owner()) revert NotExecutor();
        _;
    }

    modifier fightExists(uint256 fightId) {
        if (fightId == 0 || fightId >= _nextFightId) revert FightNotFound();
        _;
    }

    // ── Admin ───────────────────────────────────────────────

    /// @notice Set executor authorization
    /// @param executor Address to authorize
    /// @param authorized Whether to authorize
    function setExecutor(address executor, bool authorized) external onlyOwner {
        if (executor == address(0)) revert InvalidAddress(); // Finding #7
        executors[executor] = authorized;
        emit ExecutorUpdated(executor, authorized);
    }

    /// @notice Set minimum delay between commit and reveal
    /// @param _delay Delay in seconds
    function setMinRevealDelay(uint256 _delay) external onlyOwner {
        minRevealDelay = _delay;
        emit MinRevealDelayUpdated(_delay);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ── Fight Lifecycle ─────────────────────────────────────

    /// @notice Create a fight linked to a betting pool
    /// @param poolId Betting pool ID
    /// @param fighter1Id First fighter
    /// @param fighter2Id Second fighter
    /// @return fightId The new fight's ID
    function createFight(uint256 poolId, uint256 fighter1Id, uint256 fighter2Id)
        external onlyExecutor whenNotPaused returns (uint256 fightId)
    {
        if (!fighterRegistry.isFighterActive(fighter1Id)) revert InvalidResult();
        if (!fighterRegistry.isFighterActive(fighter2Id)) revert InvalidResult();

        fightId = _nextFightId++;
        Fight storage f = _fights[fightId];
        f.poolId = poolId;
        f.fighter1Id = fighter1Id;
        f.fighter2Id = fighter2Id;
        f.status = FightStatus.Pending;

        emit FightCreated(fightId, poolId, fighter1Id, fighter2Id);
    }

    /// @notice Phase 1: Executor commits hash(seed) before fight
    /// @dev Pool must be closed before seed commit (Finding #4)
    /// @param fightId Fight ID
    /// @param seedHash keccak256(seed)
    function commitSeed(uint256 fightId, bytes32 seedHash)
        external onlyExecutor fightExists(fightId) whenNotPaused
    {
        Fight storage f = _fights[fightId];
        if (f.status != FightStatus.Pending) revert InvalidPhase();
        if (f.seedHash != bytes32(0)) revert SeedAlreadyCommitted();

        // Finding #4: Require pool to be closed before commit
        IBettingPool.Pool memory pool = bettingPool.getPool(f.poolId);
        if (pool.status != IBettingPool.PoolStatus.Closed) revert PoolNotClosed();

        f.seedHash = seedHash;
        f.status = FightStatus.CommitPhase;
        f.commitTimestamp = uint64(block.timestamp);

        emit SeedCommitted(fightId, seedHash);
    }

    /// @notice Phase 2: Reveal seed and submit fight result
    /// @dev Requires minimum delay since commit (Finding #2)
    /// @param fightId Fight ID
    /// @param seed The random seed (must hash to committed seedHash)
    /// @param result Fight result data
    function revealAndResolve(uint256 fightId, bytes32 seed, FightResult calldata result)
        external onlyExecutor fightExists(fightId) whenNotPaused
    {
        Fight storage f = _fights[fightId];
        if (f.status != FightStatus.CommitPhase) revert InvalidPhase();

        // Finding #2: enforce minimum delay between commit and reveal
        if (block.timestamp < uint256(f.commitTimestamp) + minRevealDelay) revert RevealTooEarly();

        // Finding #3/#4: Verify pool is still closed (not cancelled)
        IBettingPool.Pool memory pool = bettingPool.getPool(f.poolId);
        if (pool.status != IBettingPool.PoolStatus.Closed) revert PoolNotClosed();

        // Verify seed matches commitment
        if (keccak256(abi.encodePacked(seed)) != f.seedHash) revert InvalidSeedReveal();

        // Validate result
        if (result.winnerId != f.fighter1Id && result.winnerId != f.fighter2Id) revert FighterNotInFight();
        if (result.loserId != f.fighter1Id && result.loserId != f.fighter2Id) revert FighterNotInFight();
        if (result.winnerId == result.loserId) revert InvalidResult();

        f.seed = seed;
        f.status = FightStatus.Resolved;
        f.result = result;

        // Update fighter stats
        bool isKo = result.outcome == FightOutcome.KO;
        fighterRegistry.recordWin(result.winnerId, 0, 0, isKo);
        fighterRegistry.recordLoss(result.loserId, 0);

        // Resolve betting pool
        bettingPool.resolvePool(f.poolId, result.winnerId);

        emit FightResolved(fightId, result.winnerId, result.loserId, result.totalTurns, result.outcome, seed);
    }

    // ── View Functions ──────────────────────────────────────

    /// @notice Get fight details
    /// @param fightId Fight ID to query
    function getFight(uint256 fightId) external view fightExists(fightId) returns (
        uint256 poolId, uint256 fighter1Id, uint256 fighter2Id,
        bytes32 seedHash, bytes32 seed, FightStatus status, FightResult memory result
    ) {
        Fight storage f = _fights[fightId];
        return (f.poolId, f.fighter1Id, f.fighter2Id, f.seedHash, f.seed, f.status, f.result);
    }

    /// @notice Get total fight count
    /// @return Number of fights created
    function fightCount() external view returns (uint256) {
        return _nextFightId - 1;
    }

    /// @notice Verify a seed against a committed hash
    /// @param seed Seed to verify
    /// @param seedHash Hash to verify against
    /// @return Whether the seed matches
    function verifySeed(bytes32 seed, bytes32 seedHash) external pure returns (bool) {
        return keccak256(abi.encodePacked(seed)) == seedHash;
    }
}
