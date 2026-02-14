// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/ITournament.sol";
import "./interfaces/IBettingPool.sol";
import "./interfaces/IFighterRegistry.sol";

/// @title Tournament — Single elimination bracket management for Apex Predators
/// @notice Manages 8 or 16 fighter brackets with season tracking
contract Tournament is ITournament, Ownable, Pausable {
    // ── Errors ──────────────────────────────────────────────
    error InvalidFighterCount();
    error TournamentNotFound();
    error TournamentNotActive();
    error MatchNotFound();
    error MatchAlreadyResolved();
    error InvalidWinner();
    error TournamentAlreadyCompleted();
    error FighterNotActive();
    error SeasonNotActive();          // Finding #19
    error SeasonAlreadyActive();      // Finding #19
    error InvalidAddress();           // Finding #7

    // ── Events ──────────────────────────────────────────────
    event TournamentCreated(uint256 indexed tournamentId, uint256 seasonId, uint256 fighterCount);
    event MatchCreated(uint256 indexed tournamentId, uint256 matchIndex, uint256 fighter1Id, uint256 fighter2Id, uint256 round);
    event MatchResolved(uint256 indexed tournamentId, uint256 matchIndex, uint256 winnerId);
    event TournamentCompleted(uint256 indexed tournamentId, uint256 championId);
    event SeasonStarted(uint256 indexed seasonId);
    event SeasonEnded(uint256 indexed seasonId, uint256 championId);

    // ── Structs ─────────────────────────────────────────────
    struct Match {
        uint256 fighter1Id;
        uint256 fighter2Id;
        uint256 winnerId;
        uint256 poolId; // linked betting pool
        uint8 round;    // 0=quarters, 1=semis, 2=final (for 8), etc.
        bool resolved;
    }

    struct TournamentData {
        uint256 seasonId;
        uint256[] fighterIds;
        TournamentStatus status;
        uint256 championId;
        uint256 totalRounds;
        uint256 matchCount;
    }

    struct Season {
        uint256 startTime;
        uint256 endTime;
        uint256 tournamentId;
        uint256 championId;
        bool active;
    }

    // ── State ───────────────────────────────────────────────
    uint256 private _nextTournamentId = 1;
    uint256 private _nextSeasonId = 1;
    uint256 public activeSeasonId;  // Finding #19: track active season

    mapping(uint256 => TournamentData) private _tournaments;
    mapping(uint256 => mapping(uint256 => Match)) private _matches;
    mapping(uint256 => Season) public seasons;
    mapping(address => bool) public authorizedResolvers; // Finding #14

    IBettingPool public bettingPool;
    IFighterRegistry public fighterRegistry;

    // ── Constructor ─────────────────────────────────────────
    /// @param _registry FighterRegistry address
    /// @param _bettingPool BettingPool address
    constructor(address _registry, address _bettingPool) Ownable(msg.sender) {
        if (_registry == address(0)) revert InvalidAddress();
        if (_bettingPool == address(0)) revert InvalidAddress();
        fighterRegistry = IFighterRegistry(_registry);
        bettingPool = IBettingPool(_bettingPool);
    }

    // ── Admin ───────────────────────────────────────────────

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /// @notice Set authorized resolver for advancing winners (Finding #14)
    /// @param resolver Address to authorize
    /// @param authorized Whether to authorize
    function setAuthorizedResolver(address resolver, bool authorized) external onlyOwner {
        authorizedResolvers[resolver] = authorized;
    }

    /// @notice Start a new season (Finding #19: validates no active season)
    /// @return seasonId The new season's ID
    function startSeason() external onlyOwner returns (uint256 seasonId) {
        // Finding #19: prevent starting a new season if one is active
        if (activeSeasonId != 0 && seasons[activeSeasonId].active) revert SeasonAlreadyActive();

        seasonId = _nextSeasonId++;
        seasons[seasonId] = Season({
            startTime: block.timestamp,
            endTime: 0,
            tournamentId: 0,
            championId: 0,
            active: true
        });
        activeSeasonId = seasonId;
        emit SeasonStarted(seasonId);
    }

    /// @notice End a season manually (Finding #19)
    /// @param seasonId Season to end
    function endSeason(uint256 seasonId) external onlyOwner {
        Season storage s = seasons[seasonId];
        if (!s.active) revert SeasonNotActive();
        s.active = false;
        s.endTime = block.timestamp;
        if (activeSeasonId == seasonId) activeSeasonId = 0;
        emit SeasonEnded(seasonId, s.championId);
    }

    /// @notice Create a tournament with 8 or 16 fighters
    /// @param seasonId Season this tournament belongs to
    /// @param fighterIds Array of fighter IDs (8 or 16)
    /// @return tournamentId The new tournament's ID
    function createTournament(uint256 seasonId, uint256[] calldata fighterIds)
        external onlyOwner whenNotPaused returns (uint256 tournamentId)
    {
        uint256 count = fighterIds.length;
        if (count != 8 && count != 16) revert InvalidFighterCount();

        // Finding #19: validate season if provided
        if (seasonId > 0) {
            if (!seasons[seasonId].active) revert SeasonNotActive();
        }

        for (uint256 i; i < count; ++i) {
            if (!fighterRegistry.isFighterActive(fighterIds[i])) revert FighterNotActive();
        }

        tournamentId = _nextTournamentId++;
        TournamentData storage t = _tournaments[tournamentId];
        t.seasonId = seasonId;
        t.fighterIds = fighterIds;
        t.status = TournamentStatus.Active;
        t.totalRounds = count == 8 ? 3 : 4;

        uint256 matchesInRound = count / 2;
        for (uint256 i; i < matchesInRound; ++i) {
            _matches[tournamentId][i] = Match({
                fighter1Id: fighterIds[i * 2],
                fighter2Id: fighterIds[i * 2 + 1],
                winnerId: 0,
                poolId: 0,
                round: 0,
                resolved: false
            });
            t.matchCount++;
            emit MatchCreated(tournamentId, i, fighterIds[i * 2], fighterIds[i * 2 + 1], 0);
        }

        if (seasonId > 0 && seasons[seasonId].active) {
            seasons[seasonId].tournamentId = tournamentId;
        }

        emit TournamentCreated(tournamentId, seasonId, count);
    }

    /// @notice Link a betting pool to a match
    /// @param tournamentId Tournament ID
    /// @param matchIndex Match index
    /// @param poolId Pool ID to link
    function setMatchPool(uint256 tournamentId, uint256 matchIndex, uint256 poolId) external onlyOwner {
        if (tournamentId == 0 || tournamentId >= _nextTournamentId) revert TournamentNotFound();
        Match storage m = _matches[tournamentId][matchIndex];
        if (m.fighter1Id == 0 && m.fighter2Id == 0) revert MatchNotFound();
        m.poolId = poolId;
    }

    /// @notice Advance a winner in the bracket (Finding #14: owner or authorized resolver)
    /// @param tournamentId Tournament ID
    /// @param matchIndex Index of the resolved match
    /// @param winnerId Winning fighter ID
    function advanceWinner(uint256 tournamentId, uint256 matchIndex, uint256 winnerId)
        external whenNotPaused
    {
        // Finding #14: allow both owner and authorized resolvers
        if (msg.sender != owner() && !authorizedResolvers[msg.sender]) revert InvalidWinner();

        if (tournamentId == 0 || tournamentId >= _nextTournamentId) revert TournamentNotFound();
        TournamentData storage t = _tournaments[tournamentId];
        if (t.status != TournamentStatus.Active) revert TournamentNotActive();

        Match storage m = _matches[tournamentId][matchIndex];
        if (m.fighter1Id == 0 && m.fighter2Id == 0) revert MatchNotFound();
        if (m.resolved) revert MatchAlreadyResolved();
        if (winnerId != m.fighter1Id && winnerId != m.fighter2Id) revert InvalidWinner();

        m.winnerId = winnerId;
        m.resolved = true;
        emit MatchResolved(tournamentId, matchIndex, winnerId);

        _tryAdvanceRound(tournamentId, matchIndex, m.round);
    }

    // ── Internal ────────────────────────────────────────────

    function _tryAdvanceRound(uint256 tournamentId, uint256 matchIndex, uint8 currentRound) internal {
        TournamentData storage t = _tournaments[tournamentId];

        uint256 fighterCount = t.fighterIds.length;
        uint256 matchesInFirstRound = fighterCount / 2;

        uint256 roundStart = 0;
        uint256 matchesInRound = matchesInFirstRound;
        for (uint8 r; r < currentRound; ++r) {
            roundStart += matchesInRound;
            matchesInRound /= 2;
        }

        bool allResolved = true;
        for (uint256 i = roundStart; i < roundStart + matchesInRound; ++i) {
            if (!_matches[tournamentId][i].resolved) {
                allResolved = false;
                break;
            }
        }

        if (!allResolved) return;

        if (matchesInRound == 1) {
            uint256 championId = _matches[tournamentId][matchIndex].winnerId;
            t.status = TournamentStatus.Completed;
            t.championId = championId;

            if (t.seasonId > 0 && seasons[t.seasonId].active) {
                seasons[t.seasonId].championId = championId;
                seasons[t.seasonId].endTime = block.timestamp;
                seasons[t.seasonId].active = false;
                if (activeSeasonId == t.seasonId) activeSeasonId = 0;
                emit SeasonEnded(t.seasonId, championId);
            }

            emit TournamentCompleted(tournamentId, championId);
            return;
        }

        uint256 nextRoundStart = roundStart + matchesInRound;
        uint256 nextRoundMatches = matchesInRound / 2;
        uint8 nextRound = currentRound + 1;

        for (uint256 i; i < nextRoundMatches; ++i) {
            uint256 m1Idx = roundStart + i * 2;
            uint256 m2Idx = roundStart + i * 2 + 1;
            uint256 f1 = _matches[tournamentId][m1Idx].winnerId;
            uint256 f2 = _matches[tournamentId][m2Idx].winnerId;

            uint256 newIdx = nextRoundStart + i;
            _matches[tournamentId][newIdx] = Match({
                fighter1Id: f1,
                fighter2Id: f2,
                winnerId: 0,
                poolId: 0,
                round: nextRound,
                resolved: false
            });
            t.matchCount++;
            emit MatchCreated(tournamentId, newIdx, f1, f2, nextRound);
        }
    }

    // ── View Functions ──────────────────────────────────────

    /// @notice Get tournament status
    /// @param tournamentId Tournament to query
    /// @return Tournament status enum
    function getTournamentStatus(uint256 tournamentId) external view returns (TournamentStatus) {
        if (tournamentId == 0 || tournamentId >= _nextTournamentId) revert TournamentNotFound();
        return _tournaments[tournamentId].status;
    }

    /// @notice Get tournament data
    /// @param tournamentId Tournament to query
    function getTournament(uint256 tournamentId) external view returns (
        uint256 seasonId, uint256[] memory fighterIds, TournamentStatus status,
        uint256 championId, uint256 totalRounds, uint256 matchCount
    ) {
        if (tournamentId == 0 || tournamentId >= _nextTournamentId) revert TournamentNotFound();
        TournamentData storage t = _tournaments[tournamentId];
        return (t.seasonId, t.fighterIds, t.status, t.championId, t.totalRounds, t.matchCount);
    }

    /// @notice Get match data
    /// @param tournamentId Tournament ID
    /// @param matchIndex Match index
    /// @return Match struct
    function getMatch(uint256 tournamentId, uint256 matchIndex) external view returns (Match memory) {
        if (tournamentId == 0 || tournamentId >= _nextTournamentId) revert TournamentNotFound();
        return _matches[tournamentId][matchIndex];
    }

    /// @notice Get season data
    /// @param seasonId Season to query
    /// @return Season struct
    function getSeason(uint256 seasonId) external view returns (Season memory) {
        return seasons[seasonId];
    }

    /// @notice Get total tournament count
    /// @return Number of tournaments
    function tournamentCount() external view returns (uint256) {
        return _nextTournamentId - 1;
    }
}
