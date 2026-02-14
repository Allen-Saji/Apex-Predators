// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IFighterRegistry.sol";

/// @title FighterRegistry — Manages Apex Predators fighter roster
/// @notice Admin-only registration and stats tracking for animal fighters
contract FighterRegistry is IFighterRegistry, Ownable, Pausable {
    // ── Errors ──────────────────────────────────────────────
    error FighterNotFound();
    error FighterNotActive();
    error NotAuthorized();
    error InvalidMoves();
    error EmptyName();

    // ── Events ──────────────────────────────────────────────
    event FighterRegistered(uint256 indexed fighterId, string name, string animalType, address tokenAddress);
    event FighterUpdated(uint256 indexed fighterId);
    event FighterDeactivated(uint256 indexed fighterId);
    event StatsUpdated(uint256 indexed fighterId, uint64 wins, uint64 losses, uint64 kos);

    // ── State ───────────────────────────────────────────────
    uint256 private _nextFighterId = 1;
    mapping(uint256 => Fighter) private _fighters;
    mapping(uint256 => Move[]) private _moves;
    mapping(uint256 => FighterStats) private _stats;
    mapping(address => bool) public authorizedUpdaters; // FightResolver can update stats

    // ── Constructor ─────────────────────────────────────────
    constructor() Ownable(msg.sender) {}

    // ── Modifiers ───────────────────────────────────────────
    modifier onlyAuthorized() {
        if (!authorizedUpdaters[msg.sender] && msg.sender != owner()) revert NotAuthorized();
        _;
    }

    modifier validFighter(uint256 fighterId) {
        if (fighterId == 0 || fighterId >= _nextFighterId) revert FighterNotFound();
        _;
    }

    // ── Admin ───────────────────────────────────────────────

    /// @notice Register a new fighter
    /// @param name Fighter name
    /// @param animalType Animal type (Bear, Wolf, etc.)
    /// @param tokenAddress nad.fun token address
    /// @param imageURI IPFS or HTTP URI for fighter art
    /// @param baseCritChance Base crit chance (out of 100)
    /// @param specialTrait Description of special passive
    /// @param moves Array of moves (4-5)
    /// @return fighterId The new fighter's ID
    function registerFighter(
        string calldata name,
        string calldata animalType,
        address tokenAddress,
        string calldata imageURI,
        uint8 baseCritChance,
        string calldata specialTrait,
        Move[] calldata moves
    ) external onlyOwner whenNotPaused returns (uint256 fighterId) {
        if (bytes(name).length == 0) revert EmptyName();
        if (moves.length < 4 || moves.length > 5) revert InvalidMoves();

        fighterId = _nextFighterId++;
        _fighters[fighterId] = Fighter({
            name: name,
            animalType: animalType,
            tokenAddress: tokenAddress,
            imageURI: imageURI,
            baseHp: 100,
            baseCritChance: baseCritChance,
            specialTrait: specialTrait,
            active: true
        });

        for (uint256 i; i < moves.length; ++i) {
            _moves[fighterId].push(moves[i]);
        }

        emit FighterRegistered(fighterId, name, animalType, tokenAddress);
    }

    /// @notice Update fighter metadata
    function updateFighter(
        uint256 fighterId,
        string calldata imageURI,
        address tokenAddress,
        string calldata specialTrait
    ) external onlyOwner validFighter(fighterId) {
        Fighter storage f = _fighters[fighterId];
        f.imageURI = imageURI;
        f.tokenAddress = tokenAddress;
        f.specialTrait = specialTrait;
        emit FighterUpdated(fighterId);
    }

    /// @notice Deactivate a fighter
    function deactivateFighter(uint256 fighterId) external onlyOwner validFighter(fighterId) {
        _fighters[fighterId].active = false;
        emit FighterDeactivated(fighterId);
    }

    /// @notice Set authorized updater (FightResolver)
    function setAuthorizedUpdater(address updater, bool authorized) external onlyOwner {
        authorizedUpdaters[updater] = authorized;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ── Stats Updates (from FightResolver) ──────────────────

    /// @notice Record a win for a fighter
    function recordWin(uint256 fighterId, uint64 damageDealt, uint128 earnings, bool isKo)
        external onlyAuthorized validFighter(fighterId)
    {
        FighterStats storage s = _stats[fighterId];
        s.wins++;
        s.totalDamageDealt += damageDealt;
        s.totalEarningsGenerated += earnings;
        if (isKo) s.kos++;
        emit StatsUpdated(fighterId, s.wins, s.losses, s.kos);
    }

    /// @notice Record a loss for a fighter
    function recordLoss(uint256 fighterId, uint64 damageDealt)
        external onlyAuthorized validFighter(fighterId)
    {
        FighterStats storage s = _stats[fighterId];
        s.losses++;
        s.totalDamageDealt += damageDealt;
        emit StatsUpdated(fighterId, s.wins, s.losses, s.kos);
    }

    // ── View Functions ──────────────────────────────────────

    /// @notice Get fighter data
    function getFighter(uint256 fighterId) external view validFighter(fighterId) returns (Fighter memory) {
        return _fighters[fighterId];
    }

    /// @notice Get fighter career stats
    function getFighterStats(uint256 fighterId) external view validFighter(fighterId) returns (FighterStats memory) {
        return _stats[fighterId];
    }

    /// @notice Get fighter move set
    function getMoves(uint256 fighterId) external view validFighter(fighterId) returns (Move[] memory) {
        return _moves[fighterId];
    }

    /// @notice Get total number of registered fighters
    function fighterCount() external view returns (uint256) {
        return _nextFighterId - 1;
    }

    /// @notice Check if fighter is active
    function isFighterActive(uint256 fighterId) external view validFighter(fighterId) returns (bool) {
        return _fighters[fighterId].active;
    }
}
