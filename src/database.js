// ─── src/database.js ─────────────────────────────────────────────────────────
import Database from 'better-sqlite3';
import fs from 'fs';

if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });

const db = new Database('./data/cymor_cc.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id       INTEGER PRIMARY KEY,
    username      TEXT,
    first_name    TEXT,
    is_premium    INTEGER DEFAULT 0,
    premium_until TEXT DEFAULT NULL,
    stars_paid    INTEGER DEFAULT 0,
    joined_at     TEXT DEFAULT (datetime('now')),
    last_seen     TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS daily_usage (
    user_id    INTEGER,
    date       TEXT,
    count      INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, date)
  );

  CREATE TABLE IF NOT EXISTS generations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER,
    bin        TEXT,
    qty        INTEGER,
    tier       TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bot_stats (
    id              INTEGER PRIMARY KEY DEFAULT 1,
    total_users     INTEGER DEFAULT 0,
    total_gens      INTEGER DEFAULT 0,
    total_cards_gen INTEGER DEFAULT 0,
    total_stars     INTEGER DEFAULT 0
  );

  INSERT OR IGNORE INTO bot_stats (id) VALUES (1);
`);

// ── User helpers ──────────────────────────────────────────────────────────────
export function getUser(userId) {
  let u = db.prepare('SELECT * FROM users WHERE user_id=?').get(userId);
  if (!u) {
    db.prepare('INSERT OR IGNORE INTO users (user_id) VALUES (?)').run(userId);
    db.prepare('UPDATE bot_stats SET total_users=total_users+1 WHERE id=1').run();
    u = db.prepare('SELECT * FROM users WHERE user_id=?').get(userId);
  }
  db.prepare("UPDATE users SET last_seen=datetime('now') WHERE user_id=?").run(userId);
  return u;
}

export function updateUser(userId, fields) {
  getUser(userId);
  const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
  db.prepare(`UPDATE users SET ${sets} WHERE user_id=?`).run(...Object.values(fields), userId);
}

export function saveUserInfo(userId, username, firstName) {
  getUser(userId);
  db.prepare('UPDATE users SET username=?, first_name=? WHERE user_id=?').run(username || null, firstName || null, userId);
}

export function isPremium(userId) {
  const u = db.prepare('SELECT is_premium, premium_until FROM users WHERE user_id=?').get(userId);
  if (!u?.is_premium) return false;
  if (!u.premium_until) return true;
  return new Date(u.premium_until) > new Date();
}

export function setPremium(userId, days = 30) {
  const until = new Date();
  until.setDate(until.getDate() + days);
  db.prepare('UPDATE users SET is_premium=1, premium_until=? WHERE user_id=?')
    .run(until.toISOString(), userId);
}

export function addStarsPaid(userId, stars) {
  db.prepare('UPDATE users SET stars_paid=stars_paid+? WHERE user_id=?').run(stars, userId);
  db.prepare('UPDATE bot_stats SET total_stars=total_stars+? WHERE id=1').run(stars);
}

// ── Daily usage ───────────────────────────────────────────────────────────────
export function getDailyUsage(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const row = db.prepare('SELECT count FROM daily_usage WHERE user_id=? AND date=?').get(userId, today);
  return row?.count || 0;
}

export function incrementDailyUsage(userId, qty) {
  const today = new Date().toISOString().slice(0, 10);
  db.prepare(`
    INSERT INTO daily_usage (user_id, date, count) VALUES (?,?,?)
    ON CONFLICT(user_id, date) DO UPDATE SET count=count+?
  `).run(userId, today, qty, qty);
}

// ── Generation logging ────────────────────────────────────────────────────────
export function logGeneration(userId, bin, qty, tier) {
  db.prepare('INSERT INTO generations (user_id, bin, qty, tier) VALUES (?,?,?,?)').run(userId, bin, qty, tier);
  db.prepare('UPDATE bot_stats SET total_gens=total_gens+1, total_cards_gen=total_cards_gen+? WHERE id=1').run(qty);
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export function getBotStats() {
  return db.prepare('SELECT * FROM bot_stats WHERE id=1').get();
}

export function getTotalUsers() {
  return db.prepare('SELECT COUNT(*) as c FROM users').get()?.c || 0;
}

export function getPremiumCount() {
  return db.prepare("SELECT COUNT(*) as c FROM users WHERE is_premium=1").get()?.c || 0;
}

export function getAllUsers() {
  return db.prepare('SELECT user_id FROM users').all().map(r => r.user_id);
}

export function getUserStats(userId) {
  const gens = db.prepare('SELECT COUNT(*) as c, SUM(qty) as total FROM generations WHERE user_id=?').get(userId);
  const u    = db.prepare('SELECT * FROM users WHERE user_id=?').get(userId);
  return { gens: gens?.c || 0, totalCards: gens?.total || 0, user: u };
}
