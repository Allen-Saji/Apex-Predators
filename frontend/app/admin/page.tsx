'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { fighters } from '@/lib/fighters';
import { useOwner } from '@/hooks/useContracts';
import { useLiveFights } from '@/hooks/useLiveFight';
import FightStageStepper from '@/components/arena/FightStageStepper';
import { AGENT_API_URL as API } from '@/lib/agent-api';

type FightResult = {
  winner: string;
  loser: string;
  outcome: string;
  totalTurns: number;
  reactions: Record<string, string>;
  turnLog: { turn: number; attacker: string; move: string; damage: number; remainingHp: Record<string, number> }[];
};

type ArenaStatus = {
  activeFight: { fighter1Id: string; fighter2Id: string; poolId: string; stage: string } | null;
  autoModeEnabled: boolean;
  totalEvents: number;
};

type ArenaEvent = {
  type: string;
  timestamp: number;
  data: Record<string, any>;
};

/** Map on-chain fighter ID (e.g. "5") to display name */
function getFighterDisplayName(idOrName: string): string {
  // Try as on-chain 1-indexed ID
  const num = parseInt(idOrName, 10);
  if (!isNaN(num) && num >= 1 && num <= fighters.length) {
    return fighters[num - 1].name;
  }
  // Try as personality ID
  const match = fighters.find((f) => f.id === idOrName);
  if (match) return match.name;
  return idOrName;
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { data: owner, isLoading: ownerLoading } = useOwner();

  // All hooks must be called before any early returns
  const [fighter1, setFighter1] = useState(fighters[0].id);
  const [fighter2, setFighter2] = useState(fighters[1].id);
  const [duration, setDuration] = useState('0');
  const [fighting, setFighting] = useState(false);
  const [fightStage, setFightStage] = useState('');
  const [fightResult, setFightResult] = useState<FightResult | null>(null);
  const [fightError, setFightError] = useState('');

  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoInterval, setAutoInterval] = useState('5');
  const [autoLoading, setAutoLoading] = useState(false);
  const autoSyncedRef = useRef(false);

  const [status, setStatus] = useState<ArenaStatus | null>(null);
  const [events, setEvents] = useState<ArenaEvent[]>([]);
  const liveFights = useLiveFights();

  // Poll status
  useEffect(() => {
    const poll = () => {
      fetch(`${API}/api/arena/status`)
        .then((r) => r.json())
        .then((data: ArenaStatus) => {
          setStatus(data);
          // Sync auto mode state from server on first successful poll
          if (!autoSyncedRef.current) {
            autoSyncedRef.current = true;
            setAutoEnabled(data.autoModeEnabled);
          }
        })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, []);

  // Poll events
  useEffect(() => {
    const poll = () => {
      fetch(`${API}/api/arena/events?count=30`)
        .then((r) => r.json())
        .then((data) => setEvents(data.arenaEvents || []))
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  const startFight = useCallback(async () => {
    setFighting(true);
    setFightResult(null);
    setFightError('');
    setFightStage('Submitting fight...');
    try {
      setFightStage('Fight in progress...');
      const res = await fetch(`${API}/api/arena/run-fight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fighter1, fighter2, durationMinutes: parseInt(duration) || 0 }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Fight failed');
      }
      setFightStage('Fight complete!');
      const data = await res.json();
      setFightResult(data);
    } catch (e: unknown) {
      setFightError(e instanceof Error ? e.message : 'Unknown error');
      setFightStage('');
    } finally {
      setFighting(false);
    }
  }, [fighter1, fighter2, duration]);

  const toggleAutoMode = useCallback(async () => {
    setAutoLoading(true);
    try {
      const res = await fetch(`${API}/api/arena/auto-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !autoEnabled, intervalMinutes: parseInt(autoInterval) || 5 }),
      });
      if (res.ok) setAutoEnabled(!autoEnabled);
    } catch {
      // ignore
    } finally {
      setAutoLoading(false);
    }
  }, [autoEnabled, autoInterval]);

  // Early returns AFTER all hooks
  if (ownerLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="inline-block w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-black uppercase text-white">Connect Wallet</h1>
        <p className="text-gray-400">Connect your wallet to access the admin panel.</p>
      </div>
    );
  }

  if (address?.toLowerCase() !== owner?.toLowerCase()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-black uppercase text-red-500">Unauthorized</h1>
        <p className="text-gray-400">Only the contract owner can access this page.</p>
      </div>
    );
  }

  // Format active fight display
  const activeFightDisplay = (() => {
    if (!status?.activeFight) return 'None';
    const af = status.activeFight;
    const f1 = getFighterDisplayName(af.fighter1Id);
    const f2 = getFighterDisplayName(af.fighter2Id);
    const stageLabel = af.stage.replace(/_/g, ' ');
    return `${f1} vs ${f2} (${stageLabel})`;
  })();

  // Format event display
  const getEventSummary = (event: ArenaEvent): string | null => {
    const d = event.data;
    switch (event.type) {
      case 'pool_created':
        return `${d.f1 || ''} vs ${d.f2 || ''} — Pool #${d.poolId || ''}`;
      case 'pool_closed':
        return `Pool #${d.poolId || ''} closed`;
      case 'fight_created':
        return `Fight #${d.fightId || ''} created for pool #${d.poolId || ''}`;
      case 'seed_committed':
        return `Seed committed for fight #${d.fightId || ''}`;
      case 'fight_resolved': {
        const winner = getFighterDisplayName(d.winnerId || '');
        return `${winner} wins by ${d.outcome || '?'} (${d.totalTurns || '?'} turns)`;
      }
      case 'trash_talk':
        return `${getFighterDisplayName(d.fighter || '')}: "${(d.text || '').slice(0, 80)}${(d.text || '').length > 80 ? '...' : ''}"`;
      case 'reaction':
        return `${getFighterDisplayName(d.fighter || '')} ${d.won ? '(winner)' : '(loser)'}: "${(d.text || '').slice(0, 80)}..."`;
      case 'auto_mode':
        return d.enabled ? `Started (${d.intervalMinutes}m interval)` : 'Stopped';
      case 'error':
        return d.error || 'Unknown error';
      default:
        return JSON.stringify(d).slice(0, 100);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white">
          <span className="text-red-500">Admin</span> Panel
        </h1>
        <p className="text-gray-400 mt-2">Control the arena. Start fights. Watch the carnage.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Start Fight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-xs uppercase tracking-[0.2em] text-red-500 font-bold mb-4">Start Fight</h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-500 block mb-1">Fighter 1</label>
              <select
                value={fighter1}
                onChange={(e) => setFighter1(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50"
              >
                {fighters.map((f) => (
                  <option key={f.id} value={f.id} className="bg-[#111]">
                    {f.name} ({f.animal})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-gray-500 block mb-1">Fighter 2</label>
              <select
                value={fighter2}
                onChange={(e) => setFighter2(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50"
              >
                {fighters.map((f) => (
                  <option key={f.id} value={f.id} className="bg-[#111]">
                    {f.name} ({f.animal})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-gray-500 block mb-1">
                Duration (min, 0 = instant)
              </label>
              <input
                type="number"
                min={0}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50"
              />
            </div>

            <button
              onClick={startFight}
              disabled={fighting || fighter1 === fighter2}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-600/30 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02]"
            >
              {fighting ? 'Fighting...' : 'Start Fight'}
            </button>

            {fighter1 === fighter2 && (
              <p className="text-xs text-amber-400">Select two different fighters</p>
            )}
          </div>

          {/* Stage / loading */}
          {fighting && (() => {
            const liveFight = status?.activeFight?.poolId
              ? liveFights.get(status.activeFight.poolId)
              : undefined;
            const sseStage = liveFight?.stage ?? status?.activeFight?.stage ?? null;
            return sseStage ? (
              <div className="mt-4">
                <FightStageStepper currentStage={sseStage} eta={liveFight?.eta ?? null} variant="compact" />
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                <span className="inline-block w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                {fightStage}
              </div>
            );
          })()}
          {!fighting && fightStage && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {fightStage}
            </div>
          )}

          {/* Error */}
          {fightError && (
            <div className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {fightError}
            </div>
          )}

          {/* Result */}
          {fightResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-3"
            >
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-gray-500">Winner</span>
                  <span className="font-black text-green-400 uppercase">{getFighterDisplayName(fightResult.winner)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-gray-500">Loser</span>
                  <span className="font-bold text-red-400 uppercase">{getFighterDisplayName(fightResult.loser)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-gray-500">Method</span>
                  <span className="font-bold text-amber-400">{fightResult.outcome}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-gray-500">Turns</span>
                  <span className="font-mono text-white">{fightResult.totalTurns}</span>
                </div>
              </div>

              {/* LLM Reactions */}
              {fightResult.reactions && Object.keys(fightResult.reactions).length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-wider text-gray-500">Reactions</span>
                  {Object.entries(fightResult.reactions).map(([fighter, reaction]) => (
                    <div key={fighter} className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <span className="text-xs font-bold text-red-400 uppercase">{getFighterDisplayName(fighter)}</span>
                      <p className="text-sm text-gray-300 mt-1">{reaction}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        <div className="space-y-6">
          {/* Auto Mode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-xs uppercase tracking-[0.2em] text-red-500 font-bold mb-4">Auto Mode</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-500 block mb-1">
                  Interval (minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  value={autoInterval}
                  onChange={(e) => setAutoInterval(e.target.value)}
                  disabled={autoEnabled}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50 disabled:opacity-50"
                />
              </div>
              <button
                onClick={toggleAutoMode}
                disabled={autoLoading}
                className={`w-full py-3 font-bold uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] ${
                  autoEnabled
                    ? 'bg-amber-500 hover:bg-amber-600 text-black'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {autoLoading ? '...' : autoEnabled ? 'Stop Auto Mode' : 'Start Auto Mode'}
              </button>
            </div>
          </motion.div>

          {/* Live Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-xs uppercase tracking-[0.2em] text-red-500 font-bold mb-4">
              <span className="relative inline-flex mr-2 h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Live Status
            </h2>
            {status ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Active Fight</span>
                  <span className="text-white font-mono text-right max-w-[60%]">
                    {activeFightDisplay}
                  </span>
                </div>
                {status.activeFight && (() => {
                  const lf = liveFights.get(status.activeFight.poolId);
                  const sseStage = lf?.stage ?? status.activeFight.stage;
                  return (
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <FightStageStepper currentStage={sseStage} eta={lf?.eta ?? null} variant="compact" />
                    </div>
                  );
                })()}
                <div className="flex justify-between">
                  <span className="text-gray-500">Auto Mode</span>
                  <span className={status.autoModeEnabled ? 'text-green-400' : 'text-gray-500'}>
                    {status.autoModeEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Events</span>
                  <span className="text-white font-mono">{status.totalEvents}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Connecting...</p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Events Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-xs uppercase tracking-[0.2em] text-red-500 font-bold mb-4">Events Feed</h2>
        <div className="max-h-96 overflow-y-auto space-y-2 scrollbar-thin">
          {events.length === 0 ? (
            <p className="text-sm text-gray-500">No events yet. Start a fight to see activity.</p>
          ) : (
            events.map((event, i) => (
              <div
                key={`${event.timestamp}-${i}`}
                className="bg-white/5 border border-white/5 rounded-lg px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-red-400 uppercase">{event.type.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-gray-600 font-mono">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <span className="text-gray-300">{getEventSummary(event)}</span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
