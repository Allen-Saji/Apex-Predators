'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SECTIONS = [
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'fight-mechanics', label: 'Fight Mechanics' },
  { id: 'fighters', label: 'The Fighters' },
  { id: 'betting', label: 'Betting Rules' },
  { id: 'tokenomics', label: 'Tokenomics' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'contracts', label: 'Smart Contracts' },
  { id: 'faq', label: 'FAQ' },
];

const FIGHTERS_TABLE = [
  { name: 'Kodiak', animal: 'Bear', style: 'Heavy hitter, high damage', trait: 'Heavy Hands — +10% damage on final blow' },
  { name: 'Fang', animal: 'Wolf', style: 'Balanced, consistent damage', trait: 'Pack Instinct — +5% damage when HP > 50%' },
  { name: 'Talon', animal: 'Eagle', style: 'Fast strikes, more hits', trait: 'Aerial Dodge — 5% base dodge chance' },
  { name: 'Jaws', animal: 'Crocodile', style: 'Defensive, counter-attacks', trait: 'Death Roll — crit stuns opponent 1 turn' },
  { name: 'Mane', animal: 'Lion', style: 'Aggressive, all-out offense', trait: "King's Roar — first attack +15% damage" },
  { name: 'Venom', animal: 'Snake', style: 'Poison DOT, sneaky', trait: 'Poison — 2 HP/turn for 2 turns per hit' },
  { name: 'Kong', animal: 'Gorilla', style: 'Raw power, devastating crits', trait: 'Berserker — +10% damage when HP < 30%' },
  { name: 'Razor', animal: 'Shark', style: 'Frenzy, scales with damage', trait: 'Blood Frenzy — +3% per 10% opponent HP lost' },
];

const CONTRACTS = [
  { name: 'FighterRegistry', address: '0xDe8Ba6cD9516f015323053298933346Bc57B0750', desc: 'Fighter metadata, stats, moves' },
  { name: 'BettingPool', address: '0x3f009eD70a5379B99038bfb98A3e7be29a20c31a', desc: 'Pool creation, bets, payouts' },
  { name: 'FightResolver', address: '0xFEae2E6025271c0ca92C208EeF4D883ae2b38CB1', desc: 'Fight results, turn logs, verification' },
  { name: 'Tournament', address: '0x222D29B8727A4651F4D83998907654B2aBabfDCd', desc: 'Bracket progression, seasons' },
];

const FAQ = [
  { q: 'What token do I bet with?', a: 'Currently MON (Monad testnet native token). Mainnet will use $APEX, the platform token.' },
  { q: 'Are fights fair?', a: 'Yes. Fights use a commit-reveal scheme with a deterministic simulation. Anyone can verify results by replaying the seed. Mainnet will upgrade to VRF for provably fair randomness.' },
  { q: 'How are payouts calculated?', a: 'Winners split the losing side\'s pool proportional to their bet size, minus a small platform fee (5-10%).' },
  { q: 'What\'s the dispute period?', a: 'After a fight resolves, there\'s a 1-hour window before winnings can be claimed. This allows time to verify the result.' },
  { q: 'Can fighters die?', a: 'No. Fighters are knocked out (0 HP) but always return for the next fight. All 8 fighters are permanently in the roster.' },
  { q: 'Are special traits active?', a: 'Special traits are defined for each fighter but are not yet active in the MVP. They\'ll be enabled in a future update.' },
  { q: 'When is mainnet?', a: 'After VRF integration and security audits. Currently testnet only — all bets use testnet MON with no real value.' },
];

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
      className={`bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white mb-6 scroll-mt-24">
      {children}
    </h2>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5">
      {children}
    </span>
  );
}

export default function InfoPage() {
  const [tocOpen, setTocOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tight">
          <span className="text-red-500">About</span>{' '}
          <span className="text-white">Apex Predators</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl mt-4 max-w-2xl mx-auto">
          AI-powered animal fighters compete in MMA-style tournaments on Monad.
          Bet on fights, watch real-time simulations, claim your winnings.
        </p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <Badge>Testnet</Badge>
          <span className="text-xs text-gray-500">Monad Chain ID 10143</span>
        </div>
      </motion.div>

      <div className="flex gap-8">
        {/* TOC Sidebar — desktop */}
        <aside className="hidden lg:block w-48 shrink-0">
          <nav className="sticky top-24 space-y-1">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`block text-sm py-1.5 px-3 rounded-lg transition-colors ${
                  activeSection === s.id
                    ? 'text-white bg-white/10 font-semibold'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* TOC Mobile — collapsible */}
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setTocOpen(!tocOpen)}
            className="bg-red-600 hover:bg-red-700 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-lg font-bold"
          >
            #
          </button>
          {tocOpen && (
            <div className="absolute bottom-14 right-0 bg-[#111] border border-white/10 rounded-xl p-3 min-w-[180px] shadow-xl">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setTocOpen(false)}
                  className="block text-sm text-gray-400 hover:text-white py-1.5 px-2 rounded"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-16">
          {/* How It Works */}
          <section>
            <SectionHeading id="how-it-works">How It Works</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '1', title: 'Connect Wallet', desc: 'Use MetaMask or any Monad-compatible wallet on testnet.' },
                { step: '2', title: 'Pick a Fight', desc: 'Browse upcoming matchups in the Arena and check fighter stats.' },
                { step: '3', title: 'Place Your Bet', desc: 'Bet MON on your chosen fighter before the betting window closes.' },
                { step: '4', title: 'Watch & Win', desc: 'Watch the fight play out in real-time. Collect winnings if your fighter dominates.' },
              ].map((item) => (
                <Card key={item.step}>
                  <div className="text-3xl font-black text-red-500/40 mb-2">{item.step}</div>
                  <h3 className="text-white font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Fight Mechanics */}
          <section>
            <SectionHeading id="fight-mechanics">Fight Mechanics</SectionHeading>
            <Card>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-white font-bold text-lg">Combat System</h3>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li className="flex gap-2"><span className="text-red-500 font-bold shrink-0">HP:</span> All fighters start at 100 HP</li>
                    <li className="flex gap-2"><span className="text-red-500 font-bold shrink-0">Turns:</span> Max 14 turns per fight</li>
                    <li className="flex gap-2"><span className="text-red-500 font-bold shrink-0">Moves:</span> Each fighter has 4-5 unique moves with damage ranges</li>
                    <li className="flex gap-2"><span className="text-red-500 font-bold shrink-0">Crits:</span> 10% base crit chance, deals 2x damage</li>
                    <li className="flex gap-2"><span className="text-red-500 font-bold shrink-0">KO:</span> Fighter hits 0 HP before max turns</li>
                    <li className="flex gap-2"><span className="text-red-500 font-bold shrink-0">Decision:</span> If max turns reached, higher HP wins</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-white font-bold text-lg">Fairness</h3>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li>Fights are <span className="text-white font-semibold">deterministic</span> — same seed always produces the same fight</li>
                    <li>Testnet uses <span className="text-white font-semibold">commit-reveal</span> scheme (seed committed before fight, revealed after)</li>
                    <li>Mainnet will use <span className="text-white font-semibold">VRF</span> (Verifiable Random Function) for provably fair randomness</li>
                    <li>Turn logs stored on-chain — anyone can verify by replaying the simulation</li>
                    <li>All fighters have <span className="text-white font-semibold">equal expected damage</span> per turn (balanced)</li>
                  </ul>
                </div>
              </div>
            </Card>
          </section>

          {/* The Fighters */}
          <section>
            <SectionHeading id="fighters">The Fighters</SectionHeading>
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-gray-500 uppercase text-xs font-bold pb-3 pr-4">Name</th>
                    <th className="text-left text-gray-500 uppercase text-xs font-bold pb-3 pr-4">Animal</th>
                    <th className="text-left text-gray-500 uppercase text-xs font-bold pb-3 pr-4">Fighting Style</th>
                    <th className="text-left text-gray-500 uppercase text-xs font-bold pb-3">
                      Special Trait <Badge>Coming Soon</Badge>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FIGHTERS_TABLE.map((f) => (
                    <tr key={f.name} className="border-b border-white/5 last:border-0">
                      <td className="py-3 pr-4 text-white font-bold">{f.name}</td>
                      <td className="py-3 pr-4 text-gray-400">{f.animal}</td>
                      <td className="py-3 pr-4 text-gray-400">{f.style}</td>
                      <td className="py-3 text-gray-500">{f.trait}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-600 mt-4">
                Special traits are defined but not yet active in the MVP. They will be enabled in a future update.
              </p>
            </Card>
          </section>

          {/* Betting Rules */}
          <section>
            <SectionHeading id="betting">Betting Rules</SectionHeading>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <h3 className="text-white font-bold text-lg mb-3">Pool Mechanics</h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>A betting pool opens when a matchup is announced</li>
                  <li>Bet <span className="text-white font-semibold">MON</span> (testnet native token) on either fighter</li>
                  <li>Pool closes at a set time — no more bets after close</li>
                  <li>Fight is simulated and resolved on-chain</li>
                  <li>1-hour dispute period after resolution before claims unlock</li>
                </ul>
              </Card>
              <Card>
                <h3 className="text-white font-bold text-lg mb-3">Payouts</h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>Platform takes a <span className="text-white font-semibold">5-10% fee</span> from the total pool</li>
                  <li>Remaining pot goes to the winning side</li>
                  <li>Your share = your bet / total winning-side bets</li>
                  <li>Example: You bet 10 MON on Fighter A. Total winning bets = 100 MON. Losing pool = 200 MON. Your payout = 10 + (10/100 * 200 * 0.9) = 28 MON</li>
                  <li>If pool is cancelled or draw, full refund available</li>
                </ul>
              </Card>
            </div>
          </section>

          {/* Tokenomics */}
          <section>
            <SectionHeading id="tokenomics">Tokenomics</SectionHeading>
            <div className="space-y-4">
              <Card>
                <div className="flex items-start gap-3 mb-4">
                  <h3 className="text-white font-bold text-lg">$APEX — Platform Token</h3>
                  <Badge>Future</Badge>
                </div>
                <p className="text-gray-400 text-sm mb-3">
                  Currently, all betting uses <span className="text-white font-semibold">MON</span> (Monad testnet native token).
                  Mainnet will introduce $APEX as the platform token.
                </p>
                <ul className="space-y-1.5 text-gray-400 text-sm">
                  <li>Required to place bets on fights</li>
                  <li>Staking $APEX = share of platform revenue (betting fees)</li>
                  <li>Governance: vote on new fighters, arenas, upgrades</li>
                  <li>Airdropped to season champion&apos;s backers</li>
                </ul>
              </Card>
              <Card>
                <div className="flex items-start gap-3 mb-4">
                  <h3 className="text-white font-bold text-lg">Fighter Tokens ($BEAR, $WOLF, etc.)</h3>
                  <Badge>Future</Badge>
                </div>
                <p className="text-gray-400 text-sm mb-3">
                  Each fighter will have its own token on nad.fun&apos;s bonding curve.
                </p>
                <ul className="space-y-1.5 text-gray-400 text-sm">
                  <li>Hold fighter tokens to earn a share of winnings when that fighter wins</li>
                  <li>Burn tokens to buy gear (deflationary, post-launch)</li>
                  <li>Vote on new gear items for your fighter</li>
                </ul>
              </Card>
              <Card>
                <h3 className="text-white font-bold text-lg mb-3">Revenue Model</h3>
                <div className="text-gray-400 text-sm space-y-1.5">
                  <p>5-10% platform fee on every betting pool, split as:</p>
                  <ul className="ml-4 space-y-1">
                    <li>40% — $APEX stakers (revenue distribution)</li>
                    <li>30% — Winning fighter&apos;s prize pool</li>
                    <li>20% — Platform treasury (ops, dev)</li>
                    <li>10% — Fighter creator / admin</li>
                  </ul>
                </div>
              </Card>
            </div>
          </section>

          {/* Roadmap */}
          <section>
            <SectionHeading id="roadmap">Roadmap</SectionHeading>
            <Card>
              <div className="space-y-6">
                {[
                  {
                    phase: 'MVP (Current)',
                    color: 'text-green-400',
                    items: ['8 fighters with stats & moves', 'Betting pools with MON', 'Real-time fight streaming via SSE', 'On-chain fight resolution & turn logs', 'Commit-reveal randomness', 'Tournament brackets'],
                  },
                  {
                    phase: 'Phase 2',
                    color: 'text-amber-400',
                    items: ['VRF integration (provably fair randomness)', '$APEX token launch', 'Fighter tokens on nad.fun', 'Special traits activation', 'Challenge matches'],
                  },
                  {
                    phase: 'Phase 3',
                    color: 'text-red-400',
                    items: ['Gear system (3 slots, rarity tiers, durability)', 'Arena environments with effects', 'King of the Hill mode', 'Royal Rumble events', 'Governance via $APEX'],
                  },
                  {
                    phase: 'Phase 4',
                    color: 'text-purple-400',
                    items: ['Decentralized keeper network', 'Community-proposed fighters', 'Auto-generated highlight GIFs', 'Prediction streak leaderboard', 'Mobile app'],
                  },
                ].map((phase) => (
                  <div key={phase.phase}>
                    <h3 className={`font-bold text-lg mb-2 ${phase.color}`}>{phase.phase}</h3>
                    <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-gray-400 text-sm">
                      {phase.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="text-gray-600 mt-0.5">-</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Smart Contracts */}
          <section>
            <SectionHeading id="contracts">Smart Contracts</SectionHeading>
            <Card>
              <p className="text-gray-400 text-sm mb-4">
                Deployed on <span className="text-white font-semibold">Monad Testnet</span> (Chain ID 10143)
              </p>
              <div className="space-y-3">
                {CONTRACTS.map((c) => (
                  <div key={c.name} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 border-b border-white/5 last:border-0">
                    <div className="shrink-0">
                      <span className="text-white font-bold">{c.name}</span>
                      <span className="text-gray-600 text-xs ml-2">{c.desc}</span>
                    </div>
                    <a
                      href={`https://testnet.monadexplorer.com/address/${c.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-red-400 hover:text-red-300 font-mono break-all"
                    >
                      {c.address}
                    </a>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* FAQ */}
          <section>
            <SectionHeading id="faq">FAQ</SectionHeading>
            <div className="space-y-3">
              {FAQ.map((item) => (
                <Card key={item.q} className="!p-5">
                  <h3 className="text-white font-bold mb-1">{item.q}</h3>
                  <p className="text-gray-400 text-sm">{item.a}</p>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
