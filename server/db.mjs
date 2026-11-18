import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
mkdirSync(dataDir, { recursive: true });

export const MAX_SCORES_PER_USER = 100;

export const db = new DatabaseSync(path.join(dataDir, 'game.db'));

db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS scores (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score     INTEGER NOT NULL,
    result    TEXT    NOT NULL CHECK (result IN ('win', 'tie', 'loss')),
    played_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id, id);
`);

const stmt = {
  insertUser: db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)'),
  userByName: db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?'),
  insertSession: db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)'),
  deleteSession: db.prepare('DELETE FROM sessions WHERE token = ?'),
  userBySession: db.prepare(
    'SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?'
  ),
  insertScore: db.prepare('INSERT INTO scores (user_id, score, result) VALUES (?, ?, ?)'),
  trimScores: db.prepare(`
    DELETE FROM scores
    WHERE user_id = ?
      AND id NOT IN (SELECT id FROM scores WHERE user_id = ? ORDER BY id DESC LIMIT ?)
  `),
  listScores: db.prepare(
    'SELECT id, score, result, played_at FROM scores WHERE user_id = ? ORDER BY id DESC LIMIT ?'
  ),
};

export function createUser(username, passwordHash) {
  return Number(stmt.insertUser.run(username, passwordHash).lastInsertRowid);
}

export function findUserByName(username) {
  return stmt.userByName.get(username);
}

export function createSession(token, userId) {
  stmt.insertSession.run(token, userId);
}

export function deleteSession(token) {
  stmt.deleteSession.run(token);
}

export function findUserBySession(token) {
  return stmt.userBySession.get(token);
}

/* Insert a score and keep only the latest MAX_SCORES_PER_USER rows for that user. */
export function addScore(userId, score, result) {
  db.exec('BEGIN');
  try {
    stmt.insertScore.run(userId, score, result);
    stmt.trimScores.run(userId, userId, MAX_SCORES_PER_USER);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function listScores(userId) {
  return stmt.listScores.all(userId, MAX_SCORES_PER_USER);
}
