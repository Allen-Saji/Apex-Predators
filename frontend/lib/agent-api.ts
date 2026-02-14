const BASE_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:3004';

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Agent API error: ${res.status}`);
  return res.json();
}

export async function getTrashTalk(fighter: string, opponent: string): Promise<{ text: string }> {
  return post('/api/agent/trash-talk', { fighter, opponent });
}

export async function getFightReaction(
  fighter: string,
  opponent: string,
  won: boolean,
  method: string
): Promise<{ text: string }> {
  return post('/api/agent/reaction', { fighter, opponent, won, method });
}

export async function getCommentary(
  fighter1: string,
  fighter2: string,
  event: string
): Promise<{ text: string }> {
  return post('/api/agent/commentary', { fighter1, fighter2, event });
}
