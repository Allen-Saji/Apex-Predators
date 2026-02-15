import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  generateTrashTalk,
  generateFightReaction,
  generatePressConference,
  generateTrainingUpdate,
  generateCommentary,
} from './agent.js';
import { getAllPersonalities } from './personalities.js';
import { runFight, runTournament, startAutoMode, stopAutoMode, getRecentEvents as getArenaEvents, getStatus } from './arena-manager.js';
import { watchEvents, getRecentEvents as getChainEvents } from './event-listener.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = parseInt(process.env.PORT || '3004', 10);

app.get('/api/agent/fighters', (_req, res) => {
  const fighters = getAllPersonalities().map(p => ({
    id: p.id,
    name: p.name,
    animal: p.animal,
    catchphrase: p.catchphrase,
    backstory: p.backstory,
  }));
  res.json({ fighters });
});

app.post('/api/agent/trash-talk', async (req, res) => {
  try {
    const { fighter, opponent } = req.body;
    if (!fighter || !opponent) return res.status(400).json({ error: 'fighter and opponent required' });
    const text = await generateTrashTalk(fighter, opponent);
    res.json({ fighter, opponent, text });
  } catch (e: any) {
    console.error('trash-talk error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/agent/reaction', async (req, res) => {
  try {
    const { fighter, opponent, won, method } = req.body;
    if (!fighter || !opponent || won === undefined) return res.status(400).json({ error: 'fighter, opponent, won required' });
    const text = await generateFightReaction(fighter, opponent, won, method || 'knockout');
    res.json({ fighter, opponent, won, text });
  } catch (e: any) {
    console.error('reaction error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/agent/press-conference', async (req, res) => {
  try {
    const { fighter, opponent, won, stats } = req.body;
    if (!fighter || !opponent || won === undefined) return res.status(400).json({ error: 'fighter, opponent, won required' });
    const text = await generatePressConference(fighter, opponent, won, stats || {});
    res.json({ fighter, opponent, won, text });
  } catch (e: any) {
    console.error('press-conference error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/agent/training', async (req, res) => {
  try {
    const { fighter } = req.body;
    if (!fighter) return res.status(400).json({ error: 'fighter required' });
    const text = await generateTrainingUpdate(fighter);
    res.json({ fighter, text });
  } catch (e: any) {
    console.error('training error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/agent/commentary', async (req, res) => {
  try {
    const { fighter1, fighter2, event } = req.body;
    if (!fighter1 || !fighter2 || !event) return res.status(400).json({ error: 'fighter1, fighter2, event required' });
    const text = await generateCommentary(fighter1, fighter2, event);
    res.json({ fighter1, fighter2, event, text });
  } catch (e: any) {
    console.error('commentary error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Arena endpoints ─────────────────────────────────────────────────

app.post('/api/arena/run-fight', async (req, res) => {
  try {
    const { fighter1, fighter2, durationMinutes = 0 } = req.body;
    if (!fighter1 || !fighter2) return res.status(400).json({ error: 'fighter1 and fighter2 required' });
    const result = await runFight(fighter1, fighter2, durationMinutes);
    res.json({
      poolId: result.poolId.toString(),
      fightId: result.fightId.toString(),
      winner: result.result.winnerId.toString(),
      loser: result.result.loserId.toString(),
      totalTurns: result.result.totalTurns,
      outcome: result.result.outcome === 1 ? 'KO' : 'Decision',
      reactions: result.reactions,
      turnLog: result.result.turnLog,
    });
  } catch (e: any) {
    console.error('run-fight error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/arena/run-tournament', async (req, res) => {
  try {
    const { fighterIds, durationMinutes = 1 } = req.body;
    if (!fighterIds || !Array.isArray(fighterIds) || fighterIds.length < 2) {
      return res.status(400).json({ error: 'fighterIds array (min 2) required' });
    }
    const result = await runTournament(fighterIds, durationMinutes);
    res.json({
      championName: result.championName,
      totalFights: result.results.length,
      fights: result.results.map((r) => ({
        poolId: r.poolId.toString(),
        fightId: r.fightId.toString(),
        winner: r.result.winnerId.toString(),
        loser: r.result.loserId.toString(),
        outcome: r.result.outcome === 1 ? 'KO' : 'Decision',
      })),
    });
  } catch (e: any) {
    console.error('run-tournament error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/arena/auto-mode', (req, res) => {
  const { enabled, intervalMinutes = 5 } = req.body;
  if (enabled) {
    startAutoMode(intervalMinutes);
    res.json({ status: 'auto-mode started', intervalMinutes });
  } else {
    stopAutoMode();
    res.json({ status: 'auto-mode stopped' });
  }
});

app.get('/api/arena/status', (_req, res) => {
  res.json(getStatus());
});

app.get('/api/arena/events', (req, res) => {
  const count = parseInt(req.query.count as string) || 50;
  const arenaEvents = getArenaEvents(count);
  const chainEvents = getChainEvents(count);
  res.json({ arenaEvents, chainEvents });
});

// ── Start server + event watchers ───────────────────────────────────

app.listen(PORT, () => {
  console.log(`Apex Agents API running on port ${PORT}`);

  // Start on-chain event watchers if PRIVATE_KEY is configured
  if (process.env.PRIVATE_KEY) {
    try {
      watchEvents();
      console.log('On-chain event watchers started');
    } catch (err: any) {
      console.warn('Failed to start event watchers:', err.message);
    }
  } else {
    console.warn('PRIVATE_KEY not set — on-chain features disabled');
  }
});
