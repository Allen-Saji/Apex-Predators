// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IBettingPool — Interface for Apex Predators betting pools
interface IBettingPool {
    enum PoolStatus { Open, Closed, Resolved, Cancelled }

    struct Pool {
        uint256 fighter1Id;
        uint256 fighter2Id;
        uint256 totalFighter1;    // Finding #5: uint256 instead of uint128
        uint256 totalFighter2;    // Finding #5: uint256 instead of uint128
        uint256 winnerId;
        PoolStatus status;
        uint64 closesAt;
        uint256 resolvedFeeBps;   // Finding #1/#8: snapshot fee at resolution
        uint64 resolvedAt;        // Finding #2: timestamp for dispute window
    }

    function createPool(uint256 fighter1Id, uint256 fighter2Id, uint64 closesAt) external returns (uint256 poolId);
    function placeBet(uint256 poolId, uint256 fighterId) external payable;
    function closePool(uint256 poolId) external;
    function resolvePool(uint256 poolId, uint256 winnerId) external;
    function cancelPool(uint256 poolId) external;
    function claimWinnings(uint256 poolId) external;
    function claimRefund(uint256 poolId) external;
    function getPool(uint256 poolId) external view returns (Pool memory);
}
