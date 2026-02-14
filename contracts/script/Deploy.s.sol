// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/FighterRegistry.sol";
import "../src/FightResolver.sol";
import "../src/BettingPool.sol";
import "../src/Tournament.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        address deployer = msg.sender;

        if (deployerPrivateKey != 0) {
            vm.startBroadcast(deployerPrivateKey);
        } else {
            vm.startBroadcast();
        }

        // 1. Deploy FighterRegistry (no deps)
        FighterRegistry registry = new FighterRegistry();
        console.log("FighterRegistry:", address(registry));

        // 2. Deploy BettingPool (needs registry + treasury)
        //    Treasury = deployer for now
        BettingPool bettingPool = new BettingPool(address(registry), deployer);
        console.log("BettingPool:", address(bettingPool));

        // 3. Deploy FightResolver (needs registry + bettingPool)
        FightResolver resolver = new FightResolver(address(registry), address(bettingPool));
        console.log("FightResolver:", address(resolver));

        // 4. Deploy Tournament (needs registry + bettingPool)
        Tournament tournament = new Tournament(address(registry), address(bettingPool));
        console.log("Tournament:", address(tournament));

        // 5. Wire permissions
        registry.setAuthorizedUpdater(address(resolver), true);
        bettingPool.setAuthorizedResolver(address(resolver), true);
        tournament.setAuthorizedResolver(address(resolver), true);
        resolver.setExecutor(deployer, true);

        // 6. Register all 8 initial fighters
        _registerFighters(registry);

        vm.stopBroadcast();

        console.log("--- Deployment Complete ---");
        console.log("FighterRegistry:", address(registry));
        console.log("BettingPool:    ", address(bettingPool));
        console.log("FightResolver:  ", address(resolver));
        console.log("Tournament:     ", address(tournament));
    }

    function _registerFighters(FighterRegistry registry) internal {
        // Fighter 1: Bear
        _register(registry, "Kodiak", "Bear", 10,
            "Thick Hide: 10% damage reduction",
            _moves("Bear Swipe", 14, 20, "Maul", 18, 25, "Ground Slam", 10, 16, "Hibernation Fury", 22, 32));

        // Fighter 2: Wolf
        _register(registry, "Fang", "Wolf", 10,
            "Pack Tactics: +10% damage after consecutive hits",
            _moves("Fang Strike", 12, 18, "Pack Rush", 15, 22, "Howl", 8, 14, "Alpha Bite", 20, 28));

        // Fighter 3: Eagle
        _register(registry, "Talon", "Eagle", 10,
            "Aerial Advantage: 15% dodge chance",
            _moves("Talon Slash", 10, 16, "Dive Bomb", 16, 24, "Wing Gust", 8, 14, "Sky Fury", 18, 26));

        // Fighter 4: Crocodile
        _register(registry, "Jaws", "Crocodile", 10,
            "Death Roll: Counter-attacks deal 1.5x damage",
            _moves("Jaw Snap", 14, 20, "Tail Whip", 10, 16, "Death Roll", 18, 26, "Swamp Lunge", 16, 24));

        // Fighter 5: Lion
        _register(registry, "Mane", "Lion", 10,
            "King's Roar: First attack each round deals +20% damage",
            _moves("Lion Swipe", 13, 19, "Majestic Roar", 8, 14, "Pounce", 16, 24, "King's Fury", 20, 30));

        // Fighter 6: Snake
        _register(registry, "Venom", "Snake", 10,
            "Neurotoxin: 20% chance to reduce enemy damage next turn",
            _moves("Venomous Bite", 12, 18, "Constrict", 14, 20, "Cobra Strike", 16, 24, "Toxic Spray", 10, 16));

        // Fighter 7: Gorilla
        _register(registry, "Kong", "Gorilla", 10,
            "Rage Mode: +20% damage below 30% HP",
            _moves("Chest Pound", 12, 18, "Thunderclap", 15, 22, "Ground Smash", 10, 16, "Primal Roar", 20, 30));

        // Fighter 8: Shark
        _register(registry, "Razor", "Shark", 10,
            "Blood Frenzy: +15% damage vs wounded targets",
            _moves("Bite", 15, 22, "Fin Slash", 10, 16, "Feeding Frenzy", 18, 26, "Ocean Fury", 14, 20));
    }

    function _register(
        FighterRegistry registry,
        string memory name,
        string memory animalType,
        uint8 critChance,
        string memory specialTrait,
        IFighterRegistry.Move[] memory moves
    ) internal {
        registry.registerFighter(
            name,
            animalType,
            address(0), // token address TBD
            "",         // image URI TBD
            critChance,
            specialTrait,
            moves
        );
    }

    function _moves(
        string memory n1, uint8 min1, uint8 max1,
        string memory n2, uint8 min2, uint8 max2,
        string memory n3, uint8 min3, uint8 max3,
        string memory n4, uint8 min4, uint8 max4
    ) internal pure returns (IFighterRegistry.Move[] memory m) {
        m = new IFighterRegistry.Move[](4);
        m[0] = IFighterRegistry.Move(n1, min1, max1);
        m[1] = IFighterRegistry.Move(n2, min2, max2);
        m[2] = IFighterRegistry.Move(n3, min3, max3);
        m[3] = IFighterRegistry.Move(n4, min4, max4);
    }
}
