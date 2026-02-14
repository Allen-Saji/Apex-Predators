<div align="center">

# 🥊 Apex Predators

**AI Agent MMA Arena on Monad**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Monad](https://img.shields.io/badge/Chain-Monad-8B5CF6)](https://monad.xyz/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-FFDB1C)](https://book.getfoundry.sh/)

*Bracket tournaments, on-chain betting, and epic AI-driven fights.*

[Overview](#overview) · [Architecture](#architecture) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [Contributing](#contributing)

</div>

---

## Overview

Apex Predators is a fully on-chain MMA arena where AI-powered fighter agents battle in bracket-style tournaments. Users register fighters, place bets, and watch real-time combat unfold — all settled trustlessly on **Monad**.

### Key Features

- **🏟️ Fight Arena** — Real-time animated combat with health bars, damage numbers, and fight logs
- **🏆 Bracket Tournaments** — 8-fighter single-elimination tournaments with automated progression
- **💰 On-Chain Betting** — Proportional payout betting pools with per-fight wagering
- **🤖 AI Fighters** — Each fighter has unique stats (attack, defense, speed, stamina) that determine combat outcomes
- **📊 Leaderboard** — Track win/loss records and fighter rankings

## Architecture

```
apex-predators/
├── contracts/          # Foundry project — Solidity smart contracts
│   ├── src/
│   │   ├── FighterRegistry.sol    # Fighter registration & stats
│   │   ├── FightResolver.sol      # Combat resolution logic
│   │   ├── BettingPool.sol        # Wagering & payout pools
│   │   ├── Tournament.sol         # Bracket tournament management
│   │   └── interfaces/            # Contract interfaces
│   └── test/                      # Comprehensive test suite
├── frontend/           # Next.js 15 app
│   ├── app/            # App router pages
│   ├── components/     # React components (arena, betting, fighters, tournament)
│   ├── hooks/          # Custom React hooks for contract interaction
│   ├── lib/            # Utilities, types, contract ABIs
│   └── public/         # Static assets & fighter images
└── docs/               # Project specification & documentation
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Blockchain** | [Monad](https://monad.xyz/) (EVM-compatible L1) |
| **Smart Contracts** | Solidity 0.8.24, OpenZeppelin |
| **Development** | Foundry (Forge, Cast, Anvil) |
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Styling** | Tailwind CSS 4, Framer Motion |
| **Web3** | wagmi, viem |

## Getting Started

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for contracts)
- [Node.js](https://nodejs.org/) ≥ 18 (for frontend)
- [pnpm](https://pnpm.io/) or npm

### Smart Contracts

```bash
cd contracts

# Install dependencies
forge install

# Build
forge build

# Run tests
forge test -vvv

# Deploy (local)
anvil &
forge script script/Deploy.s.sol --broadcast --rpc-url http://localhost:8545
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your RPC URL and contract addresses

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the arena.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built for the Monad ecosystem** 💜

</div>
