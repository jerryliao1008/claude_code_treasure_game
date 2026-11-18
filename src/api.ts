export interface ScoreRecord {
  id: number;
  score: number;
  result: 'win' | 'tie' | 'loss';
  played_at: string;
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  me: () => request<{ username: string }>('GET', '/api/me'),
  register: (username: string, password: string) =>
    request<{ username: string }>('POST', '/api/register', { username, password }),
  login: (username: string, password: string) =>
    request<{ username: string }>('POST', '/api/login', { username, password }),
  logout: () => request<{ ok: boolean }>('POST', '/api/logout'),
  getScores: () => request<ScoreRecord[]>('GET', '/api/scores'),
  saveScore: (score: number) => request<{ score: number }>('POST', '/api/scores', { score }),
};
