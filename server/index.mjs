import express from 'express';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import {
  createUser, findUserByName, createSession, deleteSession, findUserBySession,
  addScore, listScores,
} from './db.mjs';

const PORT = Number(process.env.API_PORT) || 3001;
const COOKIE = 'sid';
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scryptAsync(password, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [salt, hex] = stored.split(':');
  const expected = Buffer.from(hex, 'hex');
  const actual = await scryptAsync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

function readCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

function startSession(res, userId) {
  const token = randomBytes(32).toString('hex');
  createSession(token, userId);
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/' });
}

function requireUser(req, res, next) {
  const token = readCookie(req, COOKIE);
  const user = token && findUserBySession(token);
  if (!user) return res.status(401).json({ error: 'Not logged in' });
  req.user = user;
  next();
}

function validateCredentials(body) {
  const { username, password } = body || {};
  if (typeof username !== 'string' || !/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    return 'Username must be 3-20 letters, digits or _';
  }
  if (typeof password !== 'string' || password.length < 6 || password.length > 100) {
    return 'Password must be 6-100 characters';
  }
  return null;
}

const app = express();
app.use(express.json());

app.post('/api/register', async (req, res) => {
  const error = validateCredentials(req.body);
  if (error) return res.status(400).json({ error });
  const { username, password } = req.body;
  if (findUserByName(username)) return res.status(409).json({ error: 'Username already taken' });
  const userId = createUser(username, await hashPassword(password));
  startSession(res, userId);
  res.status(201).json({ username });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  const user = typeof username === 'string' && findUserByName(username);
  if (!user || typeof password !== 'string' || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: 'Wrong username or password' });
  }
  startSession(res, user.id);
  res.json({ username: user.username });
});

app.post('/api/logout', (req, res) => {
  const token = readCookie(req, COOKIE);
  if (token) deleteSession(token);
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/me', requireUser, (req, res) => {
  res.json({ username: req.user.username });
});

app.get('/api/scores', requireUser, (req, res) => {
  res.json(listScores(req.user.id));
});

app.post('/api/scores', requireUser, (req, res) => {
  const { score } = req.body || {};
  if (!Number.isInteger(score) || Math.abs(score) > 1000) {
    return res.status(400).json({ error: 'Invalid score' });
  }
  const result = score > 0 ? 'win' : score < 0 ? 'loss' : 'tie';
  addScore(req.user.id, score, result);
  res.status(201).json({ score, result });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, (err) => {
  if (err) {
    console.error(`API server failed to start on port ${PORT}: ${err.message}`);
    process.exit(1);
  }
  console.log(`API server listening on http://localhost:${PORT}`);
});
