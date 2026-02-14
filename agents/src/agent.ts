import OpenAI from 'openai';
import { getPersonality, type FighterPersonality } from './personalities.js';

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY || 'sk-dummy',
  baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
});

const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

async function generate(systemPrompt: string, userPrompt: string, maxTokens = 200): Promise<string> {
  const resp = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.9,
  });
  return resp.choices[0]?.message?.content?.trim() || '';
}

function buildFewShot(p: FighterPersonality): string {
  return p.systemPrompt + '\n\nHere are examples of how you talk:\n' +
    p.exampleLines.map(l => `- "${l}"`).join('\n') +
    '\n\nYour catchphrase: "' + p.catchphrase + '"' +
    '\n\nIMPORTANT: Stay completely in character. No emojis. No hashtags. Raw MMA fighter energy.';
}

export async function generateTrashTalk(fighterId: string, opponentId: string): Promise<string> {
  const fighter = getPersonality(fighterId);
  const opponent = getPersonality(opponentId);
  if (!fighter || !opponent) throw new Error(`Unknown fighter: ${fighterId} or ${opponentId}`);

  const system = buildFewShot(fighter);
  const user = `You're about to fight ${opponent.name} the ${opponent.animal} in the Apex Predators arena. Give a short, in-character trash talk line (1-3 sentences). Address your opponent directly. Be raw, competitive, and intimidating.`;
  return generate(system, user);
}

export async function generateFightReaction(fighterId: string, opponentId: string, won: boolean, method: string): Promise<string> {
  const fighter = getPersonality(fighterId);
  const opponent = getPersonality(opponentId);
  if (!fighter || !opponent) throw new Error(`Unknown fighter: ${fighterId} or ${opponentId}`);

  const system = buildFewShot(fighter);
  const outcome = won
    ? `You just DEFEATED ${opponent.name} the ${opponent.animal} by ${method}.`
    : `You just LOST to ${opponent.name} the ${opponent.animal} by ${method}.`;
  const user = `${outcome} Give a short, in-character post-fight reaction (1-3 sentences). ${won ? 'Be victorious but stay in character.' : 'React to the loss in character — are you angry, dismissive, plotting revenge?'}`;
  return generate(system, user);
}

export async function generatePressConference(fighterId: string, opponentId: string, won: boolean, stats: Record<string, unknown>): Promise<string> {
  const fighter = getPersonality(fighterId);
  const opponent = getPersonality(opponentId);
  if (!fighter || !opponent) throw new Error(`Unknown fighter: ${fighterId} or ${opponentId}`);

  const system = buildFewShot(fighter);
  const outcome = won ? `You WON against ${opponent.name}` : `You LOST to ${opponent.name}`;
  const statsStr = JSON.stringify(stats);
  const user = `Post-fight press conference. ${outcome}. Fight stats: ${statsStr}. Give a longer in-character press conference statement (3-5 sentences). Address the media, your opponent, and what's next.`;
  return generate(system, user, 400);
}

export async function generateTrainingUpdate(fighterId: string): Promise<string> {
  const fighter = getPersonality(fighterId);
  if (!fighter) throw new Error(`Unknown fighter: ${fighterId}`);

  const system = buildFewShot(fighter);
  const user = `You're in training camp preparing for your next fight. Give a short in-character training update for your fans (2-3 sentences). What are you working on? How are you feeling?`;
  return generate(system, user);
}

export async function generateCommentary(fighter1Id: string, fighter2Id: string, event: string): Promise<string> {
  const f1 = getPersonality(fighter1Id);
  const f2 = getPersonality(fighter2Id);
  if (!f1 || !f2) throw new Error(`Unknown fighter: ${fighter1Id} or ${fighter2Id}`);

  const system = `You are the lead announcer for Apex Predators, an underground MMA arena where animal-themed AI fighters compete. You are dramatic, knowledgeable, and hype. You know each fighter's personality and history. Think Joe Rogan meets a nature documentary narrator. No emojis. Keep it raw and exciting.`;
  const user = `Call this moment: ${f1.name} the ${f1.animal} vs ${f2.name} the ${f2.animal}. Event: ${event}. Give 1-2 sentences of live commentary. Be vivid and exciting.`;
  return generate(system, user, 150);
}
