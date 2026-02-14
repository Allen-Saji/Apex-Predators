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

app.listen(PORT, () => {
  console.log(`Apex Agents API running on port ${PORT}`);
});
