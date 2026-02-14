// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IFighterRegistry — Interface for the Apex Predators fighter registry
interface IFighterRegistry {
    struct FighterStats {
        uint64 wins;
        uint64 losses;
        uint64 kos;
        uint64 totalDamageDealt;
        uint128 totalEarningsGenerated;
    }

    struct Move {
        string name;
        uint8 minDamage;
        uint8 maxDamage;
    }

    struct Fighter {
        string name;
        string animalType;
        address tokenAddress;
        string imageURI;
        uint8 baseHp;
        uint8 baseCritChance; // out of 100
        string specialTrait;
        bool active;
    }

    function getFighter(uint256 fighterId) external view returns (Fighter memory);
    function getFighterStats(uint256 fighterId) external view returns (FighterStats memory);
    function getMoves(uint256 fighterId) external view returns (Move[] memory);
    function fighterCount() external view returns (uint256);
    function isFighterActive(uint256 fighterId) external view returns (bool);
    function recordWin(uint256 fighterId, uint64 damageDealt, uint128 earnings, bool isKo) external;
    function recordLoss(uint256 fighterId, uint64 damageDealt) external;
}
