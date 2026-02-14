// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IFightResolver — Interface for fight resolution
interface IFightResolver {
    enum FightStatus { Pending, CommitPhase, Resolved }
    enum FightOutcome { Decision, KO }

    struct FightResult {
        uint256 winnerId;
        uint256 loserId;
        uint16 totalTurns;
        FightOutcome outcome;
        bytes turnLog;
    }

    function createFight(uint256 poolId, uint256 fighter1Id, uint256 fighter2Id) external returns (uint256 fightId);
    function commitSeed(uint256 fightId, bytes32 seedHash) external;
    function revealAndResolve(uint256 fightId, bytes32 seed, FightResult calldata result) external;
    function getFight(uint256 fightId) external view returns (
        uint256 poolId, uint256 fighter1Id, uint256 fighter2Id,
        bytes32 seedHash, bytes32 seed, FightStatus status, FightResult memory result
    );
}
