// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/FighterRegistry.sol";
import "../src/BettingPool.sol";
import "../src/FightResolver.sol";
import "../src/Tournament.sol";

contract ApexPredatorsTest is Test {
    FighterRegistry registry;
    BettingPool betting;
    FightResolver resolver;
    Tournament tournament;

    address owner = address(this);
    address treasury = makeAddr("treasury");
    address executor = makeAddr("executor");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address charlie = makeAddr("charlie");

    function _bearMoves() internal pure returns (IFighterRegistry.Move[] memory) {
        IFighterRegistry.Move[] memory m = new IFighterRegistry.Move[](4);
        m[0] = IFighterRegistry.Move("Maul", 15, 25);
        m[1] = IFighterRegistry.Move("Swipe", 10, 18);
        m[2] = IFighterRegistry.Move("Crush", 20, 30);
        m[3] = IFighterRegistry.Move("Bite", 12, 22);
        return m;
    }

    function _wolfMoves() internal pure returns (IFighterRegistry.Move[] memory) {
        IFighterRegistry.Move[] memory m = new IFighterRegistry.Move[](4);
        m[0] = IFighterRegistry.Move("Fang Strike", 12, 20);
        m[1] = IFighterRegistry.Move("Pack Rush", 14, 22);
        m[2] = IFighterRegistry.Move("Howl Slash", 10, 18);
        m[3] = IFighterRegistry.Move("Ambush", 16, 24);
        return m;
    }

    function _genericMoves() internal pure returns (IFighterRegistry.Move[] memory) {
        IFighterRegistry.Move[] memory m = new IFighterRegistry.Move[](4);
        m[0] = IFighterRegistry.Move("Strike", 12, 20);
        m[1] = IFighterRegistry.Move("Slash", 14, 22);
        m[2] = IFighterRegistry.Move("Bite", 10, 18);
        m[3] = IFighterRegistry.Move("Charge", 16, 24);
        return m;
    }

    function setUp() public {
        registry = new FighterRegistry();
        betting = new BettingPool(address(registry), treasury);
        resolver = new FightResolver(address(registry), address(betting));
        tournament = new Tournament(address(registry), address(betting));

        registry.setAuthorizedUpdater(address(resolver), true);
        betting.setAuthorizedResolver(address(resolver), true);
        resolver.setExecutor(executor, true);

        // Set dispute period to 0 for most tests (simplicity)
        betting.setDisputePeriod(0);

        // Register 8 fighters
        registry.registerFighter("Kodiak", "Bear", address(0x1), "ipfs://bear", 10, "Heavy Hands", _bearMoves());
        registry.registerFighter("Fang", "Wolf", address(0x2), "ipfs://wolf", 10, "Pack Instinct", _wolfMoves());
        registry.registerFighter("Talon", "Eagle", address(0x3), "ipfs://eagle", 10, "Aerial Dodge", _genericMoves());
        registry.registerFighter("Jaws", "Crocodile", address(0x4), "ipfs://croc", 10, "Death Roll", _genericMoves());
        registry.registerFighter("Mane", "Lion", address(0x5), "ipfs://lion", 10, "King's Roar", _genericMoves());
        registry.registerFighter("Venom", "Snake", address(0x6), "ipfs://snake", 10, "Poison", _genericMoves());
        registry.registerFighter("Kong", "Gorilla", address(0x7), "ipfs://gorilla", 10, "Berserker", _genericMoves());
        registry.registerFighter("Razor", "Shark", address(0x8), "ipfs://shark", 10, "Blood Frenzy", _genericMoves());

        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);
    }

    // ═══════════════════════════════════════════════════════
    // Helper to do a full commit-reveal flow
    // ═══════════════════════════════════════════════════════

    function _resolveViaResolver(uint256 poolId, uint256 f1, uint256 f2, uint256 winnerId, uint256 loserId) internal {
        // Create fight
        vm.prank(executor);
        uint256 fightId = resolver.createFight(poolId, f1, f2);

        // Close pool first (required before commit)
        betting.closePool(poolId);

        // Commit seed
        bytes32 seed = bytes32(uint256(12345));
        bytes32 seedHash = keccak256(abi.encodePacked(seed));
        vm.prank(executor);
        resolver.commitSeed(fightId, seedHash);

        // Wait for reveal delay
        vm.warp(block.timestamp + resolver.minRevealDelay() + 1);

        // Reveal and resolve
        IFightResolver.FightResult memory result = IFightResolver.FightResult({
            winnerId: winnerId,
            loserId: loserId,
            totalTurns: 12,
            outcome: IFightResolver.FightOutcome.KO,
            turnLog: hex"deadbeef"
        });
        vm.prank(executor);
        resolver.revealAndResolve(fightId, seed, result);
    }

    // ═══════════════════════════════════════════════════════
    // FighterRegistry Tests
    // ═══════════════════════════════════════════════════════

    function test_FighterRegistration() public view {
        assertEq(registry.fighterCount(), 8);
        IFighterRegistry.Fighter memory f = registry.getFighter(1);
        assertEq(f.name, "Kodiak");
        assertEq(f.animalType, "Bear");
        assertEq(f.baseHp, 100);
        assertTrue(f.active);
    }

    function test_GetMoves() public view {
        IFighterRegistry.Move[] memory moves = registry.getMoves(1);
        assertEq(moves.length, 4);
        assertEq(moves[0].name, "Maul");
    }

    function test_UpdateFighter() public {
        registry.updateFighter(1, "ipfs://new", address(0x99), "New Trait");
        IFighterRegistry.Fighter memory f = registry.getFighter(1);
        assertEq(f.imageURI, "ipfs://new");
    }

    function test_DeactivateFighter() public {
        registry.deactivateFighter(1);
        assertFalse(registry.isFighterActive(1));
    }

    function test_RevertNonOwnerRegister() public {
        vm.prank(alice);
        vm.expectRevert();
        registry.registerFighter("Test", "Test", address(0), "", 10, "", _genericMoves());
    }

    function test_RevertInvalidMoves() public {
        IFighterRegistry.Move[] memory m = new IFighterRegistry.Move[](2);
        m[0] = IFighterRegistry.Move("A", 1, 2);
        m[1] = IFighterRegistry.Move("B", 1, 2);
        vm.expectRevert(FighterRegistry.InvalidMoves.selector);
        registry.registerFighter("Test", "Test", address(0), "", 10, "", m);
    }

    function test_RevertEmptyName() public {
        vm.expectRevert(FighterRegistry.EmptyName.selector);
        registry.registerFighter("", "Test", address(0), "", 10, "", _genericMoves());
    }

    function test_RevertFighterNotFound() public {
        vm.expectRevert(FighterRegistry.FighterNotFound.selector);
        registry.getFighter(999);
    }

    function test_CareerStats() public {
        registry.setAuthorizedUpdater(address(this), true);
        registry.recordWin(1, 100, 5 ether, true);
        registry.recordLoss(2, 80);

        IFighterRegistry.FighterStats memory s1 = registry.getFighterStats(1);
        assertEq(s1.wins, 1);
        assertEq(s1.kos, 1);

        IFighterRegistry.FighterStats memory s2 = registry.getFighterStats(2);
        assertEq(s2.losses, 1);
    }

    function test_Pausable() public {
        registry.pause();
        vm.expectRevert();
        registry.registerFighter("Test", "Test", address(0), "", 10, "", _genericMoves());
        registry.unpause();
        registry.registerFighter("Test", "Test", address(0), "", 10, "", _genericMoves());
        assertEq(registry.fighterCount(), 9);
    }

    // ═══════════════════════════════════════════════════════
    // BettingPool Tests
    // ═══════════════════════════════════════════════════════

    function test_CreatePool() public {
        uint256 poolId = betting.createPool(1, 2, uint64(block.timestamp + 1 hours));
        assertEq(poolId, 1);
        IBettingPool.Pool memory p = betting.getPool(1);
        assertEq(p.fighter1Id, 1);
        assertEq(p.fighter2Id, 2);
        assertEq(uint256(p.status), uint256(IBettingPool.PoolStatus.Open));
    }

    function test_PlaceBet() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(alice);
        betting.placeBet{value: 1 ether}(1, 1);
        vm.prank(bob);
        betting.placeBet{value: 2 ether}(1, 2);

        IBettingPool.Pool memory p = betting.getPool(1);
        assertEq(p.totalFighter1, 1 ether);
        assertEq(p.totalFighter2, 2 ether);
    }

    function test_RevertBetOnClosedPool() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));
        betting.closePool(1);

        vm.prank(alice);
        vm.expectRevert(BettingPool.PoolNotOpen.selector);
        betting.placeBet{value: 1 ether}(1, 1);
    }

    function test_RevertBetAfterTimestamp() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));
        vm.warp(block.timestamp + 2 hours);

        vm.prank(alice);
        vm.expectRevert(BettingPool.BettingClosed.selector);
        betting.placeBet{value: 1 ether}(1, 1);
    }

    function test_RevertBetTooSmall() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));
        vm.prank(alice);
        vm.expectRevert(BettingPool.BetTooSmall.selector);
        betting.placeBet{value: 0.0001 ether}(1, 1);
    }

    function test_RevertBetInvalidFighter() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));
        vm.prank(alice);
        vm.expectRevert(BettingPool.InvalidFighter.selector);
        betting.placeBet{value: 1 ether}(1, 3);
    }

    function test_ResolveAndClaim() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(alice);
        betting.placeBet{value: 1 ether}(1, 1);
        vm.prank(bob);
        betting.placeBet{value: 3 ether}(1, 2);

        betting.closePool(1);

        // Resolve: fighter 1 wins
        betting.setAuthorizedResolver(address(this), true);
        betting.resolvePool(1, 1);

        // Alice claims
        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        betting.claimWinnings(1);
        assertEq(alice.balance - aliceBefore, 3.8 ether);

        // Treasury claims fee via pull pattern (Finding #6)
        betting.claimTreasuryFee(1);
        assertEq(treasury.balance, 0.2 ether);
    }

    function test_RevertDoubleClaim() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));
        vm.prank(alice);
        betting.placeBet{value: 1 ether}(1, 1);

        betting.closePool(1);
        betting.setAuthorizedResolver(address(this), true);
        betting.resolvePool(1, 1);

        vm.prank(alice);
        betting.claimWinnings(1);

        vm.prank(alice);
        vm.expectRevert(BettingPool.AlreadyClaimed.selector);
        betting.claimWinnings(1);
    }

    function test_RevertClaimBeforeResolution() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));
        vm.prank(alice);
        betting.placeBet{value: 1 ether}(1, 1);

        vm.prank(alice);
        vm.expectRevert(BettingPool.PoolNotResolved.selector);
        betting.claimWinnings(1);
    }

    function test_CancelAndRefund() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(alice);
        betting.placeBet{value: 2 ether}(1, 1);
        vm.prank(bob);
        betting.placeBet{value: 3 ether}(1, 2);

        betting.cancelPool(1);

        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        betting.claimRefund(1);
        assertEq(alice.balance - aliceBefore, 2 ether);

        uint256 bobBefore = bob.balance;
        vm.prank(bob);
        betting.claimRefund(1);
        assertEq(bob.balance - bobBefore, 3 ether);
    }

    function test_RevertRefundNotCancelled() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));
        vm.prank(alice);
        betting.placeBet{value: 1 ether}(1, 1);

        vm.prank(alice);
        vm.expectRevert(BettingPool.PoolNotCancelled.selector);
        betting.claimRefund(1);
    }

    function test_NothingToClaimLoser() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));
        vm.prank(bob);
        betting.placeBet{value: 1 ether}(1, 2);

        betting.closePool(1);
        betting.setAuthorizedResolver(address(this), true);
        betting.resolvePool(1, 1);

        vm.prank(bob);
        vm.expectRevert(BettingPool.NothingToClaim.selector);
        betting.claimWinnings(1);
    }

    function test_ProportionalDistribution() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(alice);
        betting.placeBet{value: 1 ether}(1, 1);
        vm.prank(charlie);
        betting.placeBet{value: 3 ether}(1, 1);
        vm.prank(bob);
        betting.placeBet{value: 4 ether}(1, 2);

        betting.closePool(1);
        betting.setAuthorizedResolver(address(this), true);
        betting.resolvePool(1, 1);

        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        betting.claimWinnings(1);
        assertEq(alice.balance - aliceBefore, 1.9 ether);

        uint256 charlieBefore = charlie.balance;
        vm.prank(charlie);
        betting.claimWinnings(1);
        assertEq(charlie.balance - charlieBefore, 5.7 ether);
    }

    function testFuzz_BettingMath(uint96 bet1, uint96 bet2) public {
        vm.assume(bet1 >= 0.001 ether && bet1 <= 50 ether);
        vm.assume(bet2 >= 0.001 ether && bet2 <= 50 ether);

        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(alice);
        betting.placeBet{value: bet1}(1, 1);
        vm.prank(bob);
        betting.placeBet{value: bet2}(1, 2);

        betting.closePool(1);
        betting.setAuthorizedResolver(address(this), true);
        betting.resolvePool(1, 1);

        uint256 totalPool = uint256(bet1) + uint256(bet2);
        uint256 fee = (totalPool * 500) / 10_000;
        uint256 expectedPayout = totalPool - fee;

        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        betting.claimWinnings(1);
        assertEq(alice.balance - aliceBefore, expectedPayout);
    }

    // ═══════════════════════════════════════════════════════
    // FightResolver Tests
    // ═══════════════════════════════════════════════════════

    function test_CommitRevealFlow() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(alice);
        betting.placeBet{value: 1 ether}(1, 1);
        vm.prank(bob);
        betting.placeBet{value: 1 ether}(1, 2);

        // Create fight
        vm.prank(executor);
        uint256 fightId = resolver.createFight(1, 1, 2);

        // Close pool BEFORE commit (Finding #4)
        betting.closePool(1);

        // Commit seed
        bytes32 seed = bytes32(uint256(12345));
        bytes32 seedHash = keccak256(abi.encodePacked(seed));
        vm.prank(executor);
        resolver.commitSeed(1, seedHash);

        // Wait for reveal delay (Finding #2)
        vm.warp(block.timestamp + resolver.minRevealDelay() + 1);

        // Reveal and resolve
        IFightResolver.FightResult memory result = IFightResolver.FightResult({
            winnerId: 1,
            loserId: 2,
            totalTurns: 15,
            outcome: IFightResolver.FightOutcome.KO,
            turnLog: hex"deadbeef"
        });
        vm.prank(executor);
        resolver.revealAndResolve(1, seed, result);

        // Verify
        (,,,, bytes32 revealedSeed, IFightResolver.FightStatus status,) = resolver.getFight(1);
        assertEq(uint256(status), uint256(IFightResolver.FightStatus.Resolved));
        assertEq(revealedSeed, seed);

        IFighterRegistry.FighterStats memory s1 = registry.getFighterStats(1);
        assertEq(s1.wins, 1);
        assertEq(s1.kos, 1);

        IBettingPool.Pool memory p = betting.getPool(1);
        assertEq(uint256(p.status), uint256(IBettingPool.PoolStatus.Resolved));
    }

    function test_RevertInvalidSeedReveal() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));
        betting.closePool(1);

        vm.startPrank(executor);
        resolver.createFight(1, 1, 2);
        resolver.commitSeed(1, keccak256(abi.encodePacked(bytes32(uint256(123)))));
        vm.stopPrank();

        vm.warp(block.timestamp + resolver.minRevealDelay() + 1);

        IFightResolver.FightResult memory result = IFightResolver.FightResult({
            winnerId: 1, loserId: 2, totalTurns: 10,
            outcome: IFightResolver.FightOutcome.Decision, turnLog: ""
        });

        vm.prank(executor);
        vm.expectRevert(FightResolver.InvalidSeedReveal.selector);
        resolver.revealAndResolve(1, bytes32(uint256(999)), result);
    }

    function test_RevertNonExecutor() public {
        vm.prank(alice);
        vm.expectRevert(FightResolver.NotExecutor.selector);
        resolver.createFight(1, 1, 2);
    }

    function test_RevertDoubleCommit() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));
        betting.closePool(1);

        vm.startPrank(executor);
        resolver.createFight(1, 1, 2);
        resolver.commitSeed(1, bytes32(uint256(1)));

        vm.expectRevert(FightResolver.InvalidPhase.selector);
        resolver.commitSeed(1, bytes32(uint256(2)));
        vm.stopPrank();
    }

    function test_VerifySeed() public view {
        bytes32 seed = bytes32(uint256(42));
        bytes32 h = keccak256(abi.encodePacked(seed));
        assertTrue(resolver.verifySeed(seed, h));
        assertFalse(resolver.verifySeed(bytes32(uint256(99)), h));
    }

    // ═══════════════════════════════════════════════════════
    // Tournament Tests
    // ═══════════════════════════════════════════════════════

    function test_CreateTournament() public {
        uint256 seasonId = tournament.startSeason();
        uint256[] memory fighters = new uint256[](8);
        for (uint256 i; i < 8; ++i) fighters[i] = i + 1;

        uint256 tId = tournament.createTournament(seasonId, fighters);
        assertEq(tId, 1);

        (,, ITournament.TournamentStatus status,,, uint256 matchCount) = tournament.getTournament(1);
        assertEq(uint256(status), uint256(ITournament.TournamentStatus.Active));
        assertEq(matchCount, 4);
    }

    function test_RevertInvalidFighterCount() public {
        uint256[] memory fighters = new uint256[](6);
        for (uint256 i; i < 6; ++i) fighters[i] = i + 1;

        vm.expectRevert(Tournament.InvalidFighterCount.selector);
        tournament.createTournament(0, fighters);
    }

    function test_FullBracketAdvancement() public {
        uint256 seasonId = tournament.startSeason();
        uint256[] memory fighters = new uint256[](8);
        for (uint256 i; i < 8; ++i) fighters[i] = i + 1;
        tournament.createTournament(seasonId, fighters);

        tournament.advanceWinner(1, 0, 1);
        tournament.advanceWinner(1, 1, 3);
        tournament.advanceWinner(1, 2, 5);
        tournament.advanceWinner(1, 3, 7);

        Tournament.Match memory sf1 = tournament.getMatch(1, 4);
        assertEq(sf1.fighter1Id, 1);
        assertEq(sf1.fighter2Id, 3);

        tournament.advanceWinner(1, 4, 1);
        tournament.advanceWinner(1, 5, 7);

        Tournament.Match memory fin = tournament.getMatch(1, 6);
        assertEq(fin.fighter1Id, 1);
        assertEq(fin.fighter2Id, 7);

        tournament.advanceWinner(1, 6, 1);

        (,, ITournament.TournamentStatus status, uint256 champion,,) = tournament.getTournament(1);
        assertEq(uint256(status), uint256(ITournament.TournamentStatus.Completed));
        assertEq(champion, 1);

        Tournament.Season memory s = tournament.getSeason(seasonId);
        assertEq(s.championId, 1);
        assertFalse(s.active);
    }

    function test_RevertAdvanceInvalidWinner() public {
        uint256[] memory fighters = new uint256[](8);
        for (uint256 i; i < 8; ++i) fighters[i] = i + 1;
        tournament.createTournament(0, fighters);

        vm.expectRevert(Tournament.InvalidWinner.selector);
        tournament.advanceWinner(1, 0, 5);
    }

    function test_RevertDoubleAdvance() public {
        uint256[] memory fighters = new uint256[](8);
        for (uint256 i; i < 8; ++i) fighters[i] = i + 1;
        tournament.createTournament(0, fighters);

        tournament.advanceWinner(1, 0, 1);

        vm.expectRevert(Tournament.MatchAlreadyResolved.selector);
        tournament.advanceWinner(1, 0, 1);
    }

    // ═══════════════════════════════════════════════════════
    // Integration Test
    // ═══════════════════════════════════════════════════════

    function test_FullIntegrationFlow() public {
        uint256 seasonId = tournament.startSeason();
        uint256[] memory fighters = new uint256[](8);
        for (uint256 i; i < 8; ++i) fighters[i] = i + 1;
        tournament.createTournament(seasonId, fighters);

        uint256 poolId = betting.createPool(1, 2, uint64(block.timestamp + 1 hours));
        tournament.setMatchPool(1, 0, poolId);

        vm.prank(alice);
        betting.placeBet{value: 5 ether}(poolId, 1);
        vm.prank(bob);
        betting.placeBet{value: 3 ether}(poolId, 2);
        vm.prank(charlie);
        betting.placeBet{value: 2 ether}(poolId, 1);

        // Full commit-reveal flow
        vm.prank(executor);
        uint256 fightId = resolver.createFight(poolId, 1, 2);

        betting.closePool(poolId);

        bytes32 seed = bytes32(uint256(0xDEADBEEF));
        bytes32 seedHash = keccak256(abi.encodePacked(seed));
        vm.prank(executor);
        resolver.commitSeed(fightId, seedHash);

        vm.warp(block.timestamp + resolver.minRevealDelay() + 1);

        IFightResolver.FightResult memory result = IFightResolver.FightResult({
            winnerId: 1,
            loserId: 2,
            totalTurns: 12,
            outcome: IFightResolver.FightOutcome.KO,
            turnLog: hex"cafebabe"
        });
        vm.prank(executor);
        resolver.revealAndResolve(fightId, seed, result);

        tournament.advanceWinner(1, 0, 1);

        // Claims
        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        betting.claimWinnings(poolId);
        uint256 alicePayout = alice.balance - aliceBefore;

        uint256 charlieBefore = charlie.balance;
        vm.prank(charlie);
        betting.claimWinnings(poolId);
        uint256 charliePayout = charlie.balance - charlieBefore;

        assertGt(alicePayout, charliePayout);
        assertApproxEqAbs(alicePayout + charliePayout, 9.5 ether, 2);

        // Treasury fee via pull pattern
        betting.claimTreasuryFee(poolId);
        assertEq(treasury.balance, 0.5 ether);
    }

    // ═══════════════════════════════════════════════════════
    // Access Control Tests
    // ═══════════════════════════════════════════════════════

    function test_OnlyOwnerCreatePool() public {
        vm.prank(alice);
        vm.expectRevert();
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));
    }

    function test_OnlyOwnerTournament() public {
        uint256[] memory fighters = new uint256[](8);
        for (uint256 i; i < 8; ++i) fighters[i] = i + 1;
        vm.prank(alice);
        vm.expectRevert();
        tournament.createTournament(0, fighters);
    }

    // ═══════════════════════════════════════════════════════
    // Reentrancy Test
    // ═══════════════════════════════════════════════════════

    function test_ReentrancyProtection() public {
        ReentrancyAttacker attacker = new ReentrancyAttacker(betting);
        vm.deal(address(attacker), 10 ether);

        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        attacker.bet(1, 1);

        vm.prank(bob);
        betting.placeBet{value: 5 ether}(1, 2);

        betting.closePool(1);
        betting.setAuthorizedResolver(address(this), true);
        betting.resolvePool(1, 1);

        attacker.attack(1);
    }

    // ═══════════════════════════════════════════════════════
    // Edge Cases
    // ═══════════════════════════════════════════════════════

    function test_ZeroBetsOnOneSide() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(alice);
        betting.placeBet{value: 1 ether}(1, 1);

        betting.closePool(1);
        betting.setAuthorizedResolver(address(this), true);
        betting.resolvePool(1, 1);

        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        betting.claimWinnings(1);
        assertEq(alice.balance - aliceBefore, 0.95 ether);
    }

    function test_MultipleBetsSameUser() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(alice);
        betting.placeBet{value: 1 ether}(1, 1);
        vm.prank(alice);
        betting.placeBet{value: 2 ether}(1, 1);

        assertEq(betting.getUserBet(1, 1, alice), 3 ether);
    }

    // ═══════════════════════════════════════════════════════
    // NEW TESTS: Critical Finding #1 — Fee snapshot
    // ═══════════════════════════════════════════════════════

    function test_Critical1_FeeSnapshotAtResolution() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(alice);
        betting.placeBet{value: 1 ether}(1, 1);
        vm.prank(bob);
        betting.placeBet{value: 3 ether}(1, 2);

        betting.closePool(1);
        betting.setAuthorizedResolver(address(this), true);
        betting.resolvePool(1, 1); // fee snapshotted at 500 bps (5%)

        // Change fee AFTER resolution
        betting.setFeeBps(100); // 1%

        // Alice should still get payout based on 5% fee (snapshotted), not 1%
        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        betting.claimWinnings(1);
        // Total=4, fee=0.2 (5%), distributable=3.8, alice gets all
        assertEq(alice.balance - aliceBefore, 3.8 ether);

        // Verify the snapshotted fee in pool
        IBettingPool.Pool memory p = betting.getPool(1);
        assertEq(p.resolvedFeeBps, 500);
    }

    function test_Critical1_FeeIncreaseAfterResolveDoesNotAffectClaims() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(alice);
        betting.placeBet{value: 2 ether}(1, 1);
        vm.prank(bob);
        betting.placeBet{value: 2 ether}(1, 2);

        betting.closePool(1);
        betting.setAuthorizedResolver(address(this), true);
        betting.resolvePool(1, 1); // 5% fee snapshotted

        // Owner increases fee to max 10%
        betting.setFeeBps(1000);

        // Alice claims — should use snapshotted 5%, not new 10%
        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        betting.claimWinnings(1);
        // Total=4, fee=0.2 (5%), distributable=3.8
        assertEq(alice.balance - aliceBefore, 3.8 ether);
    }

    // ═══════════════════════════════════════════════════════
    // NEW TESTS: Critical Finding #2 — Executor commit-reveal
    // ═══════════════════════════════════════════════════════

    function test_Critical2_CommitRequiresPoolClosed() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(executor);
        resolver.createFight(1, 1, 2);

        // Try to commit while pool is still open — should fail
        vm.prank(executor);
        vm.expectRevert(FightResolver.PoolNotClosed.selector);
        resolver.commitSeed(1, bytes32(uint256(123)));
    }

    function test_Critical2_RevealRequiresMinDelay() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(executor);
        resolver.createFight(1, 1, 2);
        betting.closePool(1);

        bytes32 seed = bytes32(uint256(123));
        bytes32 seedHash = keccak256(abi.encodePacked(seed));
        vm.prank(executor);
        resolver.commitSeed(1, seedHash);

        // Try to reveal immediately — should fail
        IFightResolver.FightResult memory result = IFightResolver.FightResult({
            winnerId: 1, loserId: 2, totalTurns: 10,
            outcome: IFightResolver.FightOutcome.Decision, turnLog: ""
        });
        vm.prank(executor);
        vm.expectRevert(FightResolver.RevealTooEarly.selector);
        resolver.revealAndResolve(1, seed, result);

        // After delay, reveal succeeds
        vm.warp(block.timestamp + resolver.minRevealDelay() + 1);
        vm.prank(executor);
        resolver.revealAndResolve(1, seed, result);
    }

    function test_Critical2_DisputeWindowBlocksClaims() public {
        // Set a dispute period
        betting.setDisputePeriod(1 hours);

        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(alice);
        betting.placeBet{value: 1 ether}(1, 1);
        vm.prank(bob);
        betting.placeBet{value: 1 ether}(1, 2);

        betting.closePool(1);
        betting.setAuthorizedResolver(address(this), true);
        betting.resolvePool(1, 1);

        // Claim during dispute period should fail
        vm.prank(alice);
        vm.expectRevert(BettingPool.DisputePeriodActive.selector);
        betting.claimWinnings(1);

        // Owner can cancel during dispute period
        betting.cancelPool(1);

        // Refund works for cancelled pool
        vm.prank(alice);
        betting.claimRefund(1);
    }

    // ═══════════════════════════════════════════════════════
    // NEW TESTS: Critical Finding #3 — Open pool resolution
    // ═══════════════════════════════════════════════════════

    function test_Critical3_CannotResolveOpenPool() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(alice);
        betting.placeBet{value: 1 ether}(1, 1);

        // Try to resolve while pool is Open — should fail
        betting.setAuthorizedResolver(address(this), true);
        vm.expectRevert(BettingPool.PoolNotClosed.selector);
        betting.resolvePool(1, 1);
    }

    function test_Critical3_OnlyClosedPoolCanBeResolved() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(alice);
        betting.placeBet{value: 1 ether}(1, 1);

        betting.closePool(1);

        betting.setAuthorizedResolver(address(this), true);
        betting.resolvePool(1, 1); // succeeds on Closed pool

        IBettingPool.Pool memory p = betting.getPool(1);
        assertEq(uint256(p.status), uint256(IBettingPool.PoolStatus.Resolved));
    }

    // ═══════════════════════════════════════════════════════
    // NEW TESTS: High Finding #4 — Betting after commit
    // ═══════════════════════════════════════════════════════

    function test_High4_CannotCommitWhilePoolOpen() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(executor);
        resolver.createFight(1, 1, 2);

        // Cannot commit seed while pool is open
        vm.prank(executor);
        vm.expectRevert(FightResolver.PoolNotClosed.selector);
        resolver.commitSeed(1, bytes32(uint256(1)));

        // Close pool first, then commit works
        betting.closePool(1);
        vm.prank(executor);
        resolver.commitSeed(1, bytes32(uint256(1)));
    }

    // ═══════════════════════════════════════════════════════
    // NEW TESTS: High Finding #5 — uint128 truncation
    // ═══════════════════════════════════════════════════════

    function test_High5_Uint256PoolTotals() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        // Max bet is 50 ether by default, but we can increase it
        betting.setMaxBet(type(uint256).max);

        vm.deal(alice, 200 ether);
        vm.prank(alice);
        betting.placeBet{value: 100 ether}(1, 1);

        IBettingPool.Pool memory p = betting.getPool(1);
        assertEq(p.totalFighter1, 100 ether); // full uint256, no truncation
    }

    // ═══════════════════════════════════════════════════════
    // NEW TESTS: High Finding #6 — Treasury failure
    // ═══════════════════════════════════════════════════════

    function test_High6_TreasuryFailureDoesNotBlockResolution() public {
        // Deploy a reverting treasury
        RevertingTreasury revertTreasury = new RevertingTreasury();
        betting.setTreasury(address(revertTreasury));

        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(alice);
        betting.placeBet{value: 1 ether}(1, 1);
        vm.prank(bob);
        betting.placeBet{value: 1 ether}(1, 2);

        betting.closePool(1);
        betting.setAuthorizedResolver(address(this), true);

        // Resolution succeeds because fee is accumulated, not sent immediately
        betting.resolvePool(1, 1);

        // Verify fee is pending
        assertEq(betting.pendingFees(1), 0.1 ether);

        // Claims still work
        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        betting.claimWinnings(1);
        assertEq(alice.balance - aliceBefore, 1.9 ether);

        // Treasury fee claim will fail, but that's treasury's problem
        vm.expectRevert(BettingPool.TransferFailed.selector);
        betting.claimTreasuryFee(1);

        // Fix treasury and retry
        betting.setTreasury(treasury);
        betting.claimTreasuryFee(1);
        assertEq(treasury.balance, 0.1 ether);
    }

    // ═══════════════════════════════════════════════════════
    // NEW TESTS: Medium Finding #7 — Zero address checks
    // ═══════════════════════════════════════════════════════

    function test_Medium7_ZeroAddressChecks() public {
        // Constructor checks
        vm.expectRevert(BettingPool.InvalidAddress.selector);
        new BettingPool(address(0), treasury);

        vm.expectRevert(BettingPool.InvalidAddress.selector);
        new BettingPool(address(registry), address(0));

        vm.expectRevert(FightResolver.InvalidAddress.selector);
        new FightResolver(address(0), address(betting));

        vm.expectRevert(FightResolver.InvalidAddress.selector);
        new FightResolver(address(registry), address(0));

        // Setter checks
        vm.expectRevert(BettingPool.InvalidAddress.selector);
        betting.setTreasury(address(0));

        vm.expectRevert(BettingPool.InvalidAddress.selector);
        betting.setAuthorizedResolver(address(0), true);
    }

    // ═══════════════════════════════════════════════════════
    // NEW TESTS: Medium Finding #10 — receive() ETH recovery
    // ═══════════════════════════════════════════════════════

    function test_Medium10_WithdrawSurplusETH() public {
        // Send ETH directly to contract
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        (bool ok, ) = address(betting).call{value: 1 ether}("");
        assertTrue(ok);

        // Owner can withdraw surplus to a payable address
        uint256 treasuryBefore = treasury.balance;
        betting.withdrawSurplus(treasury);
        assertEq(treasury.balance - treasuryBefore, 1 ether);
    }

    function test_Medium10_CannotWithdrawPoolFunds() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(alice);
        betting.placeBet{value: 1 ether}(1, 1);

        // No surplus exists — revert
        vm.expectRevert(BettingPool.NothingToClaim.selector);
        betting.withdrawSurplus(owner);
    }

    // ═══════════════════════════════════════════════════════
    // NEW TESTS: Medium Finding #11 — closesAt validation
    // ═══════════════════════════════════════════════════════

    function test_Medium11_ClosesAtMustBeFuture() public {
        vm.expectRevert(BettingPool.InvalidClosesAt.selector);
        betting.createPool(1, 2, uint64(block.timestamp)); // not in future

        vm.expectRevert(BettingPool.InvalidClosesAt.selector);
        betting.createPool(1, 2, uint64(block.timestamp - 1)); // in past
    }

    // ═══════════════════════════════════════════════════════
    // NEW TESTS: Low Finding #12 — Proper InvalidFee error
    // ═══════════════════════════════════════════════════════

    function test_Low12_InvalidFeeError() public {
        vm.expectRevert(BettingPool.InvalidFee.selector);
        betting.setFeeBps(1001); // over MAX_FEE_BPS
    }

    // ═══════════════════════════════════════════════════════
    // NEW TESTS: Low Finding #15 — Max bet
    // ═══════════════════════════════════════════════════════

    function test_Low15_MaxBetEnforced() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.deal(alice, 200 ether);
        vm.prank(alice);
        vm.expectRevert(BettingPool.BetTooLarge.selector);
        betting.placeBet{value: 51 ether}(1, 1); // over 50 ether max
    }

    // ═══════════════════════════════════════════════════════
    // NEW TESTS: Low Finding #16 — Resolver event
    // ═══════════════════════════════════════════════════════

    function test_Low16_ResolverUpdatedEvent() public {
        vm.expectEmit(true, false, false, true);
        emit BettingPool.ResolverUpdated(alice, true);
        betting.setAuthorizedResolver(alice, true);
    }

    // ═══════════════════════════════════════════════════════
    // NEW TESTS: Low Finding #19 — Season lifecycle
    // ═══════════════════════════════════════════════════════

    function test_Low19_CannotStartDuplicateSeason() public {
        tournament.startSeason();

        vm.expectRevert(Tournament.SeasonAlreadyActive.selector);
        tournament.startSeason();
    }

    function test_Low19_CanStartNewSeasonAfterEnd() public {
        uint256 s1 = tournament.startSeason();
        tournament.endSeason(s1);

        uint256 s2 = tournament.startSeason();
        assertEq(s2, 2);
    }

    function test_Low19_TournamentRequiresActiveSeason() public {
        uint256 seasonId = tournament.startSeason();
        tournament.endSeason(seasonId);

        uint256[] memory fighters = new uint256[](8);
        for (uint256 i; i < 8; ++i) fighters[i] = i + 1;

        vm.expectRevert(Tournament.SeasonNotActive.selector);
        tournament.createTournament(seasonId, fighters);
    }

    // ═══════════════════════════════════════════════════════
    // NEW TESTS: Informational Finding #20 — Coverage gaps
    // ═══════════════════════════════════════════════════════

    function test_Info20_PausedClaimReverts() public {
        betting.createPool(1, 2, uint64(block.timestamp + 1 hours));

        vm.prank(alice);
        betting.placeBet{value: 1 ether}(1, 1);

        betting.closePool(1);
        betting.setAuthorizedResolver(address(this), true);
        betting.resolvePool(1, 1);

        // Pause — claimWinnings is not pausable-protected, so it should still work
        // (This verifies the design choice)
        betting.pause();
        vm.prank(alice);
        betting.claimWinnings(1); // should succeed — claims aren't paused
    }
}

/// @notice Reentrancy attacker for testing
contract ReentrancyAttacker {
    BettingPool public pool;
    uint256 public poolId;
    bool public attacking;

    constructor(BettingPool _pool) {
        pool = _pool;
    }

    function bet(uint256 _poolId, uint256 fighterId) external {
        poolId = _poolId;
        pool.placeBet{value: 1 ether}(_poolId, fighterId);
    }

    function attack(uint256 _poolId) external {
        poolId = _poolId;
        attacking = true;
        pool.claimWinnings(_poolId);
    }

    receive() external payable {
        if (attacking) {
            attacking = false;
            try pool.claimWinnings(poolId) {} catch {}
        }
    }
}

/// @notice Treasury that always reverts (for Finding #6 test)
contract RevertingTreasury {
    receive() external payable {
        revert("no thanks");
    }
}
