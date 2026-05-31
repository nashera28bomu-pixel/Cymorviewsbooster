// ─── src/database.js (lowdb — pure JS, Render-safe) ──────────────────────────
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Use absolute path — avoids Render working directory confusion
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = path.resolve(__dirname, '../../data');
const DB_FILE   = path.join(DATA_DIR, 'cymor_cc.json');

// Nuke whatever is at DATA_DIR and recreate it cleanly
try {
  const stat = fs.statSync(DATA_DIR);
  if (!stat.isDirectory()) {
    fs.rmSync(DATA_DIR, { force: true });
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch {
  // Doesn't exist yet — create it
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ─── Default DB structure ─────────────────────────────────────────────────────
const defaults = {
  users:       {},
  daily_usage: {},
  generations: [],
  bot_stats: {
    total_users:     0,
    total_gens:      0,
    total_cards_gen: 0,
    total_stars:     0,
  },
};

const adapter = new JSONFile(DB_FILE);
const db      = new Low(adapter, defaults);

await db.read();
db.data.users       ??= {};
db.data.daily_usage ??= {};
db.data.generations ??= [];
db.data.bot_stats   ??= { ...defaults.bot_stats };
await db.write();

async function save() {
  try { await db.write(); } catch (e) { console.error('DB save error:', e.message); }
}

// ─── User helpers ─────────────────────────────────────────────────────────────
export function getUser(userId) {
  const id = String(userId);
  if (!db.data.users[id]) {
    db.data.users[id] = {
      user_id:       id,
      username:      null,
      first_name:    null,
      is_premium:    false,
      premium_until: null,
      stars_paid:    0,
      joined_at:     new Date().toISOString(),
      last_seen:     new Date().toISOString(),
    };
    db.data.bot_stats.total_users++;
    save();
  }
  db.data.users[id].last_seen = new Date().toISOString();
  return db.data.users[id];
}

export function saveUserInfo(userId, username, firstName) {
  const u = getUser(userId);
  if (username)  u.username   = username;
  if (firstName) u.first_name = firstName;
  save();
}

export function isPremium(userId) {
  const u = db.data.users[String(userId)];
  if (!u?.is_premium) return false;
  if (!u.premium_until) return true;
  return new Date(u.premium_until) > new Date();
}

export function setPremium(userId, days = 365) {
  const u     = getUser(userId);
  const until = new Date();
  until.setDate(until.getDate() + days);
  u.is_premium    = true;
  u.premium_until = until.toISOString();
  save();
}

export function addStarsPaid(userId, stars) {
  const u = getUser(userId);
  u.stars_paid = (u.stars_paid || 0) + stars;
  db.data.bot_stats.total_stars = (db.data.bot_stats.total_stars || 0) + stars;
  save();
}

export function updateUser(userId, fields) {
  const u = getUser(userId);
  Object.assign(u, fields);
  save();
}

// ─── Daily usage ──────────────────────────────────────────────────────────────
export function getDailyUsage(userId) {
  const today = new Date().toISOString().slice(0, 10);
  return db.data.daily_usage[`${userId}_${today}`] || 0;
}

export function incrementDailyUsage(userId, qty) {
  const today = new Date().toISOString().slice(0, 10);
  const key   = `${userId}_${today}`;
  db.data.daily_usage[key] = (db.data.daily_usage[key] || 0) + qty;
  save();
}

// ─── Generation logging ───────────────────────────────────────────────────────
export function logGeneration(userId, bin, qty, tier) {
  db.data.generations.push({
    user_id: String(userId), bin, qty, tier,
    created_at: new Date().toISOString(),
  });
  if (db.data.generations.length > 10000) {
    db.data.generations = db.data.generations.slice(-10000);
  }
  db.data.bot_stats.total_gens       = (db.data.bot_stats.total_gens || 0) + 1;
  db.data.bot_stats.total_cards_gen  = (db.data.bot_stats.total_cards_gen || 0) + qty;
  save();
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export function getBotStats()     { return db.data.bot_stats; }
export function getTotalUsers()   { return Object.keys(db.data.users).length; }
export function getPremiumCount() { return Object.values(db.data.users).filter(u => u.is_premium).length; }
export function getAllUsers()     { return Object.keys(db.data.users).map(id => parseInt(id)); }

export function getUserStats(userId) {
  const id   = String(userId);
  const gens = db.data.generations.filter(g => g.user_id === id);
  return {
    gens:       gens.length,
    totalCards: gens.reduce((s, g) => s + (g.qty || 0), 0),
    user:       db.data.users[id],
  };
}
