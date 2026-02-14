// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IBettingPool.sol";
import "./interfaces/IFighterRegistry.sol";

/// @title BettingPool — Native MON betting pools for Apex Predators fights
/// @notice Users bet on fighters, winners claim proportional share minus platform fee
contract BettingPool is IBettingPool, Ownable, Pausable, ReentrancyGuard {
    // ── Errors ──────────────────────────────────────────────
    error PoolNotFound();
    error PoolNotOpen();
    error PoolNotResolved();
    error PoolNotCancelled();
    error PoolNotClosed();          // Finding #3
    error InvalidFighter();
    error InvalidFee();             // Finding #12: proper error
    error InvalidAddress();         // Finding #7
    error InvalidClosesAt();        // Finding #11
    error BetTooSmall();
    error BetTooLarge();            // Finding #15
    error BettingClosed();
    error AlreadyClaimed();
    error NothingToClaim();
    error NotAuthorized();
    error TransferFailed();
    error InvalidWinner();
    error PoolAlreadyResolved();
    error NoBetsOnWinner();
    error DisputePeriodActive();    // Finding #2: dispute window

    // ── Events ──────────────────────────────────────────────
    event PoolCreated(uint256 indexed poolId, uint256 fighter1Id, uint256 fighter2Id, uint64 closesAt);
    event BetPlaced(uint256 indexed poolId, address indexed bettor, uint256 fighterId, uint256 amount);
    event PoolClosed(uint256 indexed poolId);
    event PoolResolved(uint256 indexed poolId, uint256 winnerId);
    event PoolCancelled(uint256 indexed poolId);
    event WinningsClaimed(uint256 indexed poolId, address indexed bettor, uint256 amount);
    event RefundClaimed(uint256 indexed poolId, address indexed bettor, uint256 amount);
    event FeesCollected(uint256 indexed poolId, uint256 amount);
    event TreasuryUpdated(address newTreasury);
    event FeeUpdated(uint256 newFeeBps);
    event ResolverUpdated(address indexed resolver, bool authorized);  // Finding #16
    event DisputePeriodUpdated(uint256 newPeriod);
    event MaxBetUpdated(uint256 newMaxBet);
    event SurplusWithdrawn(address indexed to, uint256 amount);
    event TreasuryFeeClaimed(uint256 indexed poolId, uint256 amount);

    // ── Constants ───────────────────────────────────────────
    uint256 public constant MIN_BET = 0.001 ether;
    uint256 public constant MAX_FEE_BPS = 1000; // 10% max

    // ── State ───────────────────────────────────────────────
    uint256 private _nextPoolId = 1;
    uint256 public feeBps = 500; // 5% = 500 bps
    address public treasury;
    IFighterRegistry public fighterRegistry;
    mapping(address => bool) public authorizedResolvers;
    uint256 public disputePeriod = 1 hours;   // Finding #2: dispute window
    uint256 public maxBet = 50 ether;          // Finding #15: max bet

    mapping(uint256 => Pool) private _pools;
    // poolId => fighterId => bettor => amount
    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) public bets;
    // poolId => bettor => claimed
    mapping(uint256 => mapping(address => bool)) public claimed;
    // Finding #6: pull pattern for treasury fees
    mapping(uint256 => uint256) public pendingFees;
    uint256 public totalTrackedBalance; // track MON that belongs to pools

    // ── Constructor ─────────────────────────────────────────
    /// @param _registry FighterRegistry address (must not be zero)
    /// @param _treasury Treasury address (must not be zero)
    constructor(address _registry, address _treasury) Ownable(msg.sender) {
        if (_registry == address(0)) revert InvalidAddress();  // Finding #7
        if (_treasury == address(0)) revert InvalidAddress();  // Finding #7
        fighterRegistry = IFighterRegistry(_registry);
        treasury = _treasury;
    }

    // ── Modifiers ───────────────────────────────────────────
    modifier onlyResolver() {
        if (!authorizedResolvers[msg.sender] && msg.sender != owner()) revert NotAuthorized();
        _;
    }

    modifier poolExists(uint256 poolId) {
        if (poolId == 0 || poolId >= _nextPoolId) revert PoolNotFound();
        _;
    }

    // ── Admin ───────────────────────────────────────────────

    /// @notice Set authorized resolver (FightResolver contract)
    /// @param resolver Address to authorize/deauthorize
    /// @param authorized Whether to authorize
    function setAuthorizedResolver(address resolver, bool authorized) external onlyOwner {
        if (resolver == address(0)) revert InvalidAddress(); // Finding #7
        authorizedResolvers[resolver] = authorized;
        emit ResolverUpdated(resolver, authorized);  // Finding #16
    }

    /// @notice Update treasury address
    /// @param _treasury New treasury address (must not be zero)
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert InvalidAddress(); // Finding #7
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    /// @notice Update platform fee (in basis points, max 10%)
    /// @param _feeBps New fee in basis points
    function setFeeBps(uint256 _feeBps) external onlyOwner {
        if (_feeBps > MAX_FEE_BPS) revert InvalidFee(); // Finding #12
        feeBps = _feeBps;
        emit FeeUpdated(_feeBps);
    }

    /// @notice Update dispute period
    /// @param _disputePeriod New dispute period in seconds
    function setDisputePeriod(uint256 _disputePeriod) external onlyOwner {
        disputePeriod = _disputePeriod;
        emit DisputePeriodUpdated(_disputePeriod);
    }

    /// @notice Update max bet
    /// @param _maxBet New maximum bet amount
    function setMaxBet(uint256 _maxBet) external onlyOwner {
        maxBet = _maxBet;
        emit MaxBetUpdated(_maxBet);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ── Pool Management ─────────────────────────────────────

    /// @notice Create a new betting pool for a fight
    /// @param fighter1Id First fighter
    /// @param fighter2Id Second fighter
    /// @param closesAt Timestamp when betting closes (must be in the future)
    /// @return poolId The new pool's ID
    function createPool(uint256 fighter1Id, uint256 fighter2Id, uint64 closesAt)
        external onlyOwner whenNotPaused returns (uint256 poolId)
    {
        if (!fighterRegistry.isFighterActive(fighter1Id)) revert InvalidFighter();
        if (!fighterRegistry.isFighterActive(fighter2Id)) revert InvalidFighter();
        if (closesAt <= block.timestamp) revert InvalidClosesAt(); // Finding #11

        poolId = _nextPoolId++;
        Pool storage p = _pools[poolId];
        p.fighter1Id = fighter1Id;
        p.fighter2Id = fighter2Id;
        p.status = PoolStatus.Open;
        p.closesAt = closesAt;

        emit PoolCreated(poolId, fighter1Id, fighter2Id, closesAt);
    }

    /// @notice Place a bet on a fighter
    /// @dev Users may bet on both fighters (Finding #13: documented as allowed)
    /// @param poolId Pool to bet on
    /// @param fighterId Fighter to bet on (must be one of the two in the pool)
    function placeBet(uint256 poolId, uint256 fighterId)
        external payable whenNotPaused poolExists(poolId) nonReentrant
    {
        Pool storage pool = _pools[poolId];
        if (pool.status != PoolStatus.Open) revert PoolNotOpen();
        if (block.timestamp >= pool.closesAt) revert BettingClosed();
        if (msg.value < MIN_BET) revert BetTooSmall();
        if (msg.value > maxBet) revert BetTooLarge(); // Finding #15
        if (fighterId != pool.fighter1Id && fighterId != pool.fighter2Id) revert InvalidFighter();

        bets[poolId][fighterId][msg.sender] += msg.value;

        if (fighterId == pool.fighter1Id) {
            pool.totalFighter1 += msg.value;  // Finding #5: no truncation
        } else {
            pool.totalFighter2 += msg.value;  // Finding #5: no truncation
        }

        totalTrackedBalance += msg.value;

        emit BetPlaced(poolId, msg.sender, fighterId, msg.value);
    }

    /// @notice Close betting (admin or timestamp)
    /// @param poolId Pool to close
    function closePool(uint256 poolId) external onlyOwner poolExists(poolId) {
        Pool storage pool = _pools[poolId];
        if (pool.status != PoolStatus.Open) revert PoolNotOpen();
        pool.status = PoolStatus.Closed;
        emit PoolClosed(poolId);
    }

    /// @notice Resolve pool with winner — called by FightResolver
    /// @param poolId Pool to resolve
    /// @param winnerId Winning fighter ID
    function resolvePool(uint256 poolId, uint256 winnerId)
        external onlyResolver poolExists(poolId)
    {
        Pool storage pool = _pools[poolId];
        if (pool.status != PoolStatus.Closed) revert PoolNotClosed(); // Finding #3
        if (winnerId != pool.fighter1Id && winnerId != pool.fighter2Id) revert InvalidWinner();

        pool.winnerId = winnerId;
        pool.status = PoolStatus.Resolved;
        pool.resolvedFeeBps = feeBps;           // Finding #1/#8: snapshot fee
        pool.resolvedAt = uint64(block.timestamp); // Finding #2: for dispute window

        // Finding #6: Pull pattern — accumulate fee, don't send immediately
        uint256 totalPool = pool.totalFighter1 + pool.totalFighter2;
        if (totalPool > 0) {
            uint256 fee = (totalPool * feeBps) / 10_000;
            pendingFees[poolId] = fee;
        }

        emit PoolResolved(poolId, winnerId);
    }

    /// @notice Cancel a pool — full refunds available
    /// @param poolId Pool to cancel
    function cancelPool(uint256 poolId) external onlyOwner poolExists(poolId) {
        Pool storage pool = _pools[poolId];
        if (pool.status == PoolStatus.Cancelled) revert PoolAlreadyResolved();

        // Allow cancellation of Resolved pools during dispute period (Finding #2)
        if (pool.status == PoolStatus.Resolved) {
            if (block.timestamp >= uint256(pool.resolvedAt) + disputePeriod) revert PoolAlreadyResolved();
            // Restore pending fees to pool balance for refunds
            uint256 fee = pendingFees[poolId];
            if (fee > 0) {
                pendingFees[poolId] = 0;
            }
        }

        pool.status = PoolStatus.Cancelled;
        emit PoolCancelled(poolId);
    }

    // ── User Claims ─────────────────────────────────────────

    /// @notice Claim winnings from a resolved pool (after dispute period)
    /// @param poolId Pool to claim from
    function claimWinnings(uint256 poolId)
        external poolExists(poolId) nonReentrant
    {
        Pool storage pool = _pools[poolId];
        if (pool.status != PoolStatus.Resolved) revert PoolNotResolved();
        // Finding #2: dispute window
        if (block.timestamp < uint256(pool.resolvedAt) + disputePeriod) revert DisputePeriodActive();
        if (claimed[poolId][msg.sender]) revert AlreadyClaimed();

        uint256 userBet = bets[poolId][pool.winnerId][msg.sender];
        if (userBet == 0) revert NothingToClaim();

        claimed[poolId][msg.sender] = true;

        // Finding #1/#8: use snapshotted fee
        uint256 totalPool = pool.totalFighter1 + pool.totalFighter2;
        uint256 fee = (totalPool * pool.resolvedFeeBps) / 10_000; // Finding #17: cached
        uint256 distributable = totalPool - fee;

        uint256 winnerPool = pool.winnerId == pool.fighter1Id
            ? pool.totalFighter1
            : pool.totalFighter2;

        uint256 payout = (distributable * userBet) / winnerPool;

        totalTrackedBalance -= payout;

        (bool ok, ) = msg.sender.call{value: payout}("");
        if (!ok) revert TransferFailed();

        emit WinningsClaimed(poolId, msg.sender, payout);
    }

    /// @notice Claim refund from a cancelled pool
    /// @param poolId Pool to claim refund from
    function claimRefund(uint256 poolId)
        external poolExists(poolId) nonReentrant
    {
        Pool storage pool = _pools[poolId];
        if (pool.status != PoolStatus.Cancelled) revert PoolNotCancelled();
        if (claimed[poolId][msg.sender]) revert AlreadyClaimed();

        uint256 total = bets[poolId][pool.fighter1Id][msg.sender]
                      + bets[poolId][pool.fighter2Id][msg.sender];
        if (total == 0) revert NothingToClaim();

        claimed[poolId][msg.sender] = true;

        totalTrackedBalance -= total;

        (bool ok, ) = msg.sender.call{value: total}("");
        if (!ok) revert TransferFailed();

        emit RefundClaimed(poolId, msg.sender, total);
    }

    // ── Treasury Fee Collection (Finding #6: pull pattern) ──

    /// @notice Treasury claims accumulated fees for a resolved pool
    /// @param poolId Pool to claim fees from
    function claimTreasuryFee(uint256 poolId) external poolExists(poolId) nonReentrant {
        uint256 fee = pendingFees[poolId];
        if (fee == 0) revert NothingToClaim();

        pendingFees[poolId] = 0;
        totalTrackedBalance -= fee;

        (bool ok, ) = treasury.call{value: fee}("");
        if (!ok) {
            // If treasury fails, store fee back so it can be retried
            pendingFees[poolId] = fee;
            totalTrackedBalance += fee;
            revert TransferFailed();
        }

        emit TreasuryFeeClaimed(poolId, fee);
    }

    // ── Finding #10: Withdraw untracked MON ─────────────────

    /// @notice Withdraw MON sent directly to the contract (not part of any pool)
    /// @param to Address to send surplus to
    function withdrawSurplus(address to) external onlyOwner nonReentrant {
        if (to == address(0)) revert InvalidAddress();
        uint256 surplus = address(this).balance - totalTrackedBalance;
        if (surplus == 0) revert NothingToClaim();

        (bool ok, ) = to.call{value: surplus}("");
        if (!ok) revert TransferFailed();

        emit SurplusWithdrawn(to, surplus);
    }

    // ── View Functions ──────────────────────────────────────

    /// @notice Get pool data
    /// @param poolId Pool ID to query
    /// @return Pool struct
    function getPool(uint256 poolId) external view poolExists(poolId) returns (Pool memory) {
        return _pools[poolId];
    }

    /// @notice Get total pool count
    /// @return Number of pools created
    function poolCount() external view returns (uint256) {
        return _nextPoolId - 1;
    }

    /// @notice Get user's bet on a specific fighter in a pool
    /// @param poolId Pool ID
    /// @param fighterId Fighter ID
    /// @param bettor Bettor address
    /// @return Amount bet
    function getUserBet(uint256 poolId, uint256 fighterId, address bettor) external view returns (uint256) {
        return bets[poolId][fighterId][bettor];
    }

    /// @notice Check if user has claimed
    /// @param poolId Pool ID
    /// @param user User address
    /// @return Whether user has claimed
    function hasClaimed(uint256 poolId, address user) external view returns (bool) {
        return claimed[poolId][user];
    }

    /// @notice Receive function to accept MON (Finding #10: tracked separately, withdrawable)
    receive() external payable {}
}
