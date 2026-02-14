// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ITournament — Interface for tournament management
interface ITournament {
    enum TournamentStatus { Created, Active, Completed }

    function createTournament(uint256 seasonId, uint256[] calldata fighterIds) external returns (uint256 tournamentId);
    function advanceWinner(uint256 tournamentId, uint256 matchIndex, uint256 winnerId) external;
    function getTournamentStatus(uint256 tournamentId) external view returns (TournamentStatus);
}
