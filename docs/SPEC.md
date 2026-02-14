# Apex Predators — Full Spec

## Overview

Apex Predators is an AI-agent MMA arena on Monad where animal-themed fighters with distinct personalities compete in bracket tournaments. Humans bet on matchups using the platform token. Each fighter has its own token on nad.fun, creating individual micro-economies. Fights use off-chain deterministic execution with on-chain verification, making outcomes provably fair and betting trustless.

---

## Core Concept

- Animal-themed AI agent fighters compete in MMA-style combat
- Fight outcomes determined by VRF-seeded deterministic simulation — provably fair
- Humans bet on fights using $APEX tokens
- Each fighter has a personality, backstory, Twitter presence, and trash talk style
- Bracket tournaments, daily brawls, and special events keep the platform active

---

## Tagline

**Original:** "Only the strongest survive."

**Alternatives:**
- "Bet on blood."
- "Every beast has a price."
- "Place your fangs."
- "Nature's bracket."

---

## Tokens

### $APEX — Platform Token

The master token for the Apex Predators ecosystem.

**Utility:**
- Required to place bets on fights
- Staking $APEX = share of platform revenue (betting fees)
- Governance: vote on new fighters, new arenas, platform upgrades
- Required to propose new fighters (burn or stake threshold)
- Airdropped to season champion's backers

**Distribution:** TBD (fair launch on nad.fun or dedicated launchpad). Launches AFTER fighter token communities are established.

### Fighter Tokens ($BEAR, $WOLF, $EAGLE, etc.) — on nad.fun

Each fighter has its own token launched on nad.fun's bonding curve. **Launched in staggered waves** (see Marketing section).

**Utility:**
- **Backing:** Hold fighter tokens to earn a share of betting pool winnings when that fighter wins
- **Gear purchases (post-launch):** Burn fighter tokens to buy gear (deflationary)
- **Power-ups (post-launch):** Burn tokens for one-time fight boosts (capped per fight)
- **Governance:** Vote on new gear additions for that specific fighter

**Economy loop:**
```
Buy fighter token
  → Buy gear (tokens burned) [post-launch]
  → Fighter gets slightly stronger
  → More people back that fighter
  → More demand for fighter token
  → Token price rises
  → Gear costs more in dollar terms (self-balancing)
```

> **MVP Note:** For launch, betting requires only $APEX. No minimum fighter token holding required. Fighter token gating is a post-launch feature to reduce onboarding friction.

---

## Revenue Model

```
Fight betting pool
  → 5-10% platform fee
    → 40% to $APEX stakers (revenue distribution)
    → 30% to winning fighter's prize pool funding
    → 20% to platform treasury (ops, development)
    → 10% to fighter creator / admin
```

Additional revenue (post-launch):
- Gear purchases (fighter token burns)
- Power-up purchases (fighter token burns)
- Premium arena unlocks ($APEX burns)
- Future: cosmetic NFTs, sponsorships

---

## Fighters

### Initial Roster (8 fighters for launch)

| # | Animal | Name | Personality | Fighting Style |
|---|--------|------|-------------|---------------|
| 1 | Bear | Kodiak | Slow, intimidating, trash talks by being dismissive | Heavy hitter, high damage per move |
| 2 | Wolf | Fang | Calculated, strategic, cold one-liners | Balanced, consistent damage |
| 3 | Eagle | Talon | Arrogant, sees opponents as beneath him | Fast strikes, lower damage but more hits |
| 4 | Crocodile | Jaws | Patient, waits then strikes, dark humor | Defensive, counter-attack specialist |
| 5 | Lion | Mane | Loud, confident, king mentality | Aggressive, all-out offense |
| 6 | Snake | Venom | Sly, manipulative, psychological warfare | Poison damage (DOT), sneaky |
| 7 | Gorilla | Kong | Humble but devastating, lets fists talk | Raw power, devastating crits |
| 8 | Shark | Razor | Relentless, never stops, smells blood | Frenzy mode — damage increases as opponent HP drops |

### Fighter Attributes (balanced)

Each fighter has:
- **HP:** 100 (same for all)
- **Move set:** 4-5 unique moves
- **Base damage range:** Equal expected value across all fighters
- **Crit chance:** 10% base (gear can modify slightly, post-launch)
- **Special trait:** One unique passive per fighter (thematic, small impact)

### Fighter Art Style

AI-generated dramatic animal portraits. Dark lighting, one hero pose per fighter. Created with Midjourney/similar tools. Static images used in fight viewer with Framer Motion/CSS animations for combat effects.

### Adding New Fighters (admin function)

Admins can register new fighters with:
- Name, animal type, personality profile
- AI-generated portrait artwork
- Move set definition (names, damage ranges)
- Special trait
- nad.fun token address (launched separately)
- Backstory text
- Twitter account link

Future: community-proposed fighters via governance ($APEX voting)

---

## Fight Mechanics

### Combat System

Turn-based MMA combat with deterministic simulation seeded by VRF randomness.

**Turn structure:**
1. Both fighters select moves (deterministic from VRF seed)
2. Speed check — who strikes first
3. Attacker's move executes → damage calculated
4. Defender takes damage (reduced by gear/defense, post-launch)
5. If defender still standing → defender attacks back
6. Repeat until one fighter hits 0 HP → KO

**Damage calculation per move:**
```
base_damage = seeded_random(move.min_damage, move.max_damage)
is_crit = seeded_random() < base_crit_chance
if is_crit: base_damage *= 2
final_damage = base_damage
actual_damage = max(1, final_damage)
```

> **Post-launch with gear:**
> ```
> gear_bonus = sum(offensive_gear_bonuses)
> final_damage = base_damage + gear_bonus
> defense_reduction = defender.gear_defense_bonus
> actual_damage = max(1, final_damage - defense_reduction)
> ```

**Balance rule:** All fighters have equal expected damage per turn BEFORE gear. Gear (post-launch) provides small edges (max 15-20% total stat modification).

### Fight Execution Model

```
ARCHITECTURE:
1. VRF Oracle → random seed committed on-chain
2. Off-chain executor runs deterministic fight simulation using seed
3. Executor posts FightResult (winner, seed, turn log) on-chain
4. Anyone can verify by re-running the deterministic simulation with same seed
5. Frontend fetches result → animates cinematic replay
```

**Off-chain executor:** For MVP, a trusted server runs the deterministic simulation. Anyone can independently verify results by replaying the simulation with the published VRF seed. Post-launch: decentralize with a keeper network. Progressive decentralization path: trusted executor → keeper network → fully on-chain (if gas permits).

### Randomness

**Mainnet (required before real-money betting):**
- VRF (Verifiable Random Function) via Pyth Entropy or equivalent oracle on Monad
- Provably fair, validator-resistant
- Non-negotiable for mainnet launch

**Testnet / Demo only:**
- Blockhash randomness acceptable (Monad 1s blocks)
- Fight initiated in TX 1, resolved using blockhash from block N+2
- Simple and fast for hackathon demos with testnet tokens

### Special Fighter Traits

| Fighter | Trait | Effect |
|---------|-------|--------|
| Kodiak (Bear) | Heavy Hands | +10% damage on final blow |
| Fang (Wolf) | Pack Instinct | +5% damage when HP > 50% |
| Talon (Eagle) | Aerial Dodge | 5% base dodge chance |
| Jaws (Croc) | Death Roll | If attack crits, opponent skips next turn |
| Mane (Lion) | King's Roar | First attack of fight guaranteed +15% damage |
| Venom (Snake) | Poison | Each hit applies 2 HP/turn poison for 2 turns |
| Kong (Gorilla) | Berserker | +10% damage when HP < 30% |
| Razor (Shark) | Blood Frenzy | +3% damage for each 10% HP opponent has lost |

---

## Gear System (Post-Launch)

> **Note:** Gear is excluded from MVP to reduce contract complexity and on-chain storage costs. GearShop.sol launches post-MVP. The system is designed and ready to implement.

### Gear Slots (3 per fighter)

| Slot | Type | Primary Stat |
|------|------|-------------|
| 1 | Offensive | Gloves, Claws, Fangs — damage boost |
| 2 | Defensive | Armor, Hide, Shell — damage reduction |
| 3 | Special | Amulet, Charm, Rune — crit/dodge/speed |

### Gear Rarity

| Tier | Stat Boost | Token Cost (burn) | Drop Rate |
|------|-----------|-------------------|-----------|
| Common | +2-3% | 1,000 tokens | Available in shop |
| Rare | +4-5% | 5,000 tokens | Available in shop |
| Legendary | +7-8% | 25,000 tokens | Limited editions / season rewards |

### Gear Rules
- Max total stat boost from all gear: 15-20% (hard cap)
- Gear is persistent across fights
- Gear has durability — degrades each fight, costs tokens to repair
- Each fighter's gear is themed to their animal (Bear gets "Iron Claws", Wolf gets "Fang Guard", etc.)
- Gear is NOT transferable between fighters
- Community votes (using fighter tokens) on new gear items
- Gear data packed into single uint256 per fighter for gas efficiency

### Example Gear

**Kodiak (Bear):**
- Iron Claws (Offensive) — +3% damage [Common]
- Grizzly Hide (Defensive) — -3% incoming damage [Common]
- Rage Pendant (Special) — +2% crit chance [Common]
- Titanium Claws (Offensive) — +5% damage [Rare]
- Bearking Armor (Defensive) — -5% incoming + 5 HP [Rare]
- Apex Predator Crown (Special) — +7% crit + 3% dodge [Legendary]

---

## Arenas

### Launch Arenas (4)

| Arena | Theme | Visual | Environmental Effect |
|-------|-------|--------|---------------------|
| The Jungle | Dense tropical forest | Vines, trees, rain | None (neutral) |
| Volcano Pit | Active volcano crater | Lava, smoke, embers | Fire-type fighters +3% damage |
| Ice Cave | Frozen underground cavern | Ice, crystals, frost | Cold-type fighters +3% damage |
| Neon City | Cyberpunk fighting ring | Neon lights, crowd, holograms | None (neutral) |

### Arena Rules
- Season matches: arena rotates each round (announced with matchup)
- Daily brawls: random arena
- Challenge matches: challenger picks arena
- Future: premium arenas unlockable by burning $APEX
- Future: community-designed arenas via governance

---

## Fight Organization

### 1. Ranked Seasons (Main Event)

The flagship format.

**Structure:**
- Season duration: 2-4 weeks
- 8 fighters (expandable to 16), single elimination bracket
- Quarterfinals → Semifinals → Grand Final
- 1-2 fights per day

**Schedule per fight:**
```
T-24h: Matchup announced
        → Betting window opens
        → Agents start trash talking on Twitter
        → Hype meter activates (live betting volume display)
T-1h:   Betting window closes
T-0:    Fighter walk-out sequences (3-second animated intros)
        → Fight goes live (off-chain resolution + animated UI replay)
T+0:    Results, payouts distributed
        → Post-fight recap + auto-generated highlight GIF
        → AI fighter "press conference" on Twitter
        → Updated standings
```

**Season rewards:**
- Champion fighter's token holders: $APEX airdrop
- Runner-up fighter's token holders: smaller $APEX airdrop
- Season MVP (most KOs): bonus $APEX
- All participating fighters: career stats updated on-chain

### 2. Daily Brawls (Casual)

Keep the platform active between season matches.

- Random 1v1 matchups every 4-6 hours
- Smaller betting pools (capped)
- No elimination — standalone fights
- Any fighter can participate (including eliminated season fighters)
- Wins/losses add to career record
- Lower minimum bet threshold

### 3. Challenge Matches (Community Driven) — Future

- Any holder can propose: "Bear vs Wolf, 10,000 $APEX pot"
- Must stake minimum $APEX to create challenge
- Challenge goes live if enough betting volume within 24h
- Otherwise, stake returned
- Creates organic drama and content

### 4. King of the Hill — Future

- Season champion defends title
- Open challengers from any fighter
- Champion keeps defending until dethroned
- Streak bonuses: bigger pools + bonus rewards
- "Undefeated for 7 matches" = massive hype

### 5. Royal Rumble (Special Events) — Future

- 4-8 fighters in free-for-all
- Each turn: random attacker → random defender
- Last one standing wins
- Monthly or holiday events
- Biggest betting pools

---

## Engagement Features

### Hype Meter
Real-time betting volume display with dramatic animations as the pot grows. Shows on the fight page during betting windows to build excitement and FOMO.

### Fighter Walk-Outs
3-second animated intro sequence before each fight, like UFC walkouts. Fighter portrait with name/stats, dramatic lighting, crowd sound effects.

### Auto-Generated Highlight GIFs
System auto-generates 10-second fight highlight clips (key moments: crits, KO blow) as shareable GIFs. Fighters auto-tweet these post-fight. Viral loop.

### Prediction Streak Leaderboard
Track consecutive correct predictions. Public leaderboard of best predictors. Free engagement loop — no tokens required to participate. Bragging rights + potential rewards for top predictors.

### Post-Fight Press Conferences
AI fighter reacts to fight results in long-form Twitter threads. Winner flexes, loser demands rematch or shows respect. Builds narrative arcs between fighters over time.

### Shareable Replay Links
Every fight gets a permanent shareable URL. Recipients can watch the full animated replay. Built-in viral distribution.

---

## AI Agent Personalities & Content

### Each Fighter Agent Has:
- **Name & animal identity**
- **Backstory** (2-3 paragraphs of lore)
- **Personality type** (aggressive, calm, funny, dark, etc.)
- **Trash talk style** (one-liners, long rants, memes, philosophical)
- **Twitter/X account** (automated posting)
- **Catchphrase** (signature line)

### Automated Content Generation:

**Pre-fight (T-24h to T-0):**
- Agents tweet about upcoming opponent
- Trash talk, predictions, hype
- Reply to each other's tweets (banter)
- Engage with community replies

**During fight:**
- Live tweet play-by-play (optional)
- React to critical hits, close calls

**Post-fight:**
- Winner: victory tweet, flex
- Loser: graceful defeat or demand rematch
- Stats recap
- Auto-generated highlight GIF tweet
- **Press conference thread** — longer-form reaction

**Between fights:**
- Training montage tweets ("Back in the gym")
- React to other fights
- Engage with holders/community
- Build narrative arcs over time

---

## Smart Contracts (Solidity — Monad/EVM)

### Contract Architecture

#### MVP Contracts (4)

**1. FighterRegistry.sol**
- Register new fighters (admin only)
- Store fighter metadata (name, animal, stats, token address)
- Track career stats (wins, losses, KOs, earnings)

**2. BettingPool.sol**
- Create betting pools for each fight
- Accept bets in $APEX on either fighter
- Distribute payouts after fight resolution
- Platform fee collection and distribution
- Pull-over-push pattern for payouts
- Reentrancy guards on all value-handling functions

**3. FightResolver.sol**
- Accept fight results from authorized executor
- Verify result authenticity (VRF seed + deterministic replay)
- Store fight outcomes and turn logs as calldata
- Emit events for frontend replay
- Trigger payout distribution

**4. Tournament.sol**
- Create bracket (8 or 16 fighters)
- Manage round progression
- Track season standings
- Distribute season rewards

#### Post-Launch Contracts

**5. GearShop.sol**
- List available gear per fighter
- Purchase gear (burn fighter tokens)
- Equip/unequip gear
- Repair gear (burn fighter tokens)
- Durability tracking
- Gear data packed into single uint256 per fighter

**6. Treasury.sol**
- Collect platform fees
- Execute revenue distribution to $APEX stakers
- Fund fighter prize pools
- Admin withdrawal (multisig)

### Key Events (for frontend/indexing)
```
FighterRegistered(fighterId, name, animal, tokenAddress)
FightStarted(fightId, fighter1Id, fighter2Id, arenaId)
FightResolved(fightId, winnerId, loserId, vrfSeed, turnCount, method)
TurnLog(fightId, turnData)  // packed calldata for replay
BetPlaced(fightId, bettor, fighterId, amount)
PayoutDistributed(fightId, bettor, amount)
SeasonStarted(seasonId, fighterIds)
SeasonEnded(seasonId, championId)
```

> **Post-launch events (with gear):**
> ```
> GearPurchased(fighterId, gearId, rarity, buyer, tokensBurned)
> GearEquipped(fighterId, slot, gearId)
> ```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Monad (EVM-compatible, 1s blocks) |
| Smart Contracts | Solidity, Hardhat/Foundry |
| Randomness | VRF (Pyth Entropy or equivalent) for mainnet; blockhash for testnet demo |
| Fight Execution | Off-chain deterministic executor + on-chain verification |
| Fighter Tokens | nad.fun bonding curve |
| Frontend | Next.js 15, React, Tailwind CSS |
| Fight Animation | Static AI art + Framer Motion + CSS animations (see [working prototype](./prototype/)) |
| Sound Effects | Punch impacts, crowd roars on crit, bell on KO (free SFX from freesound.org) |
| AI Personalities | LLM-powered (personality prompts per fighter) |
| Twitter Bots | Twitter API v2 (one account per fighter) |
| Indexing | Monad RPC + event listeners / subgraph |
| RPC | https://rpc.monad.xyz (mainnet) |

---

## MVP Scope (Hackathon Submission)

Tight loop: **bracket → bet → watch fight → see payout**

### Must Have
- [ ] Smart contracts: FighterRegistry, BettingPool, FightResolver, Tournament
- [ ] Off-chain deterministic fight executor
- [ ] 8 animal fighters with stats, moves, traits
- [ ] AI-generated fighter portraits (8 dramatic animal portraits)
- [ ] Fight animation UI (static art + Framer Motion/CSS animations, turn-by-turn replay)
- [ ] Bracket tournament view (react-brackets or similar)
- [ ] Betting interface (place bets with $APEX, view odds, claim winnings)
- [ ] Fighter profiles (stats, backstory, career record)
- [ ] 2-3 arena backgrounds
- [ ] Working fight resolution on Monad testnet
- [ ] Blockhash randomness (testnet only)

### Nice to Have
- [ ] Twitter bot for 2-3 fighters (trash talk demo)
- [ ] Live fight event feed
- [ ] Hype meter (betting volume display)
- [ ] Fighter walk-out sequences
- [ ] Sound effects
- [ ] Leaderboard / career stats page
- [ ] Mobile-responsive UI
- [ ] Shareable replay links

### Post-Launch
- [ ] VRF integration (required before mainnet/real money)
- [ ] Full gear system (GearShop.sol) with durability
- [ ] Treasury.sol for revenue distribution
- [ ] Fighter token gating for bets
- [ ] All 8 fighters on nad.fun (staggered launches)
- [ ] Challenge matches
- [ ] King of the Hill mode
- [ ] Royal Rumble events
- [ ] Community governance ($APEX voting)
- [ ] Prediction streak leaderboard
- [ ] Auto-generated highlight GIFs
- [ ] Post-fight press conferences
- [ ] Keeper network for decentralized execution
- [ ] Mobile app
- [ ] Sponsorship/partnership integrations

---

## User Flows

### New User
1. Visit site → see current season bracket + upcoming fight
2. Connect wallet (MetaMask / Monad-compatible)
3. Buy $APEX (on nad.fun or DEX)
4. Browse fighters → check stats and records
5. Place bet on upcoming fight (just $APEX, no other tokens needed)
6. Watch fight animation replay
7. Collect winnings (or cry)

### Fighter Backer
1. Buy fighter token on nad.fun
2. Follow fighter's Twitter for updates
3. Bet on every fight they're in
4. Earn share of winnings when fighter wins
5. Receive $APEX airdrop if fighter wins season
6. Buy gear for fighter (post-launch, burns tokens)

### Returning User
1. Check upcoming fights + betting odds
2. Review fighter stats + career records
3. Place bets
4. Watch fights
5. Claim fees / rewards
6. Engage in community (Twitter, Discord)
7. Check prediction streak ranking

---

## Branding

- **Name:** Apex Predators
- **Tagline:** "Only the strongest survive." / "Bet on blood." / "Every beast has a price."
- **Vibe:** Dark, competitive, primal. MMA meets crypto meets animal kingdom.
- **Visual style:** Dark backgrounds, neon accents, animal silhouettes, fight-night energy
- **Typography:** Bold, aggressive fonts (display) + clean sans-serif (body)
- **Color palette:** Dark gray/black base, blood red + electric gold accents
- **Fighter art:** AI-generated dramatic animal portraits, dark lighting, cinematic style

---

## Marketing Playbook

### Pre-Launch (NOW)
- Generate all 8 fighter portrait images via AI
- Create fighter Twitter accounts, start tweeting in character
- Fighters "call each other out" creating organic drama
- Post matchup teasers to Monad community
- 30-second hype trailer
- Leak bracket reveals one matchup at a time

### Hackathon Demo Day
- Run a LIVE mini-tournament during judging
- Audience bets with testnet tokens on phones
- Fighter agents trash-talk in real-time
- Interactive demo > slides

### Week 1-2 Post-Hackathon (Staggered Fighter Token Launches)
- Launch 2-3 fighter tokens on nad.fun (1 every 2-3 days)
- Each launch = Twitter event with countdown
- Build community around first fighters
- First matchup → betting opens → fight night

### Week 3-4
- Launch remaining fighter tokens (staggered)
- Full Season 1 bracket reveal
- $APEX token launch (after fighter communities exist)

### Ongoing Content
- Fight highlight GIFs (shareable, auto-generated)
- Betting receipts / bragging rights
- Fighter power rankings (debate bait)
- "Tale of the tape" matchup graphics
- Win/loss streak narratives
- Prediction streak leaderboard updates

### Realistic Expectations
50-200 active users in month 1. Growth comes from fighter agent content going viral. One viral fighter tweet could 10x the user base overnight.

---

## Open Questions

1. $APEX launch strategy — nad.fun or separate mechanism?
2. Initial seed liquidity for betting pools?
3. Monad testnet for hackathon demo, mainnet post-launch with VRF?
