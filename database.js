// ─── src/database.js (lowdb — pure JS, works on Render free tier) ─────────────
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import fs from 'fs';
import path from 'path';

if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });

// ─── Default DB structure ────────────────────────────────────────────────────
const defaults = {
  users:       {},   // keyed by user_id string
  daily_usage: {},   // keyed by "userId_date"
  generations: [],   // array of log entries
  bot_stats: {
    total_users:     0,
    total_gens:      0,
    total_cards_gen: 0,
    total_stars:     0,
  },
};

const adapter = new JSONFile('./data/cymor_cc.json');
const db      = new Low(adapter, defaults);

// Load on startup
await db.read();

// Ensure all keys exist (in case of fresh file)
db.data.users       ??= {};
db.data.daily_usage ??= {};
db.data.generations ??= [];
db.data.bot_stats   ??= { ...defaults.bot_stats };
await db.write();

// ─── Save helper ─────────────────────────────────────────────────────────────
async function save() { await db.write(); }

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
  save();
  return db.data.users[id];
}

export function saveUserInfo(userId, username, firstName) {
  const u = getUser(userId);
  u.username   = username   || u.username;
  u.first_name = firstName  || u.first_name;
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
  u.stars_paid                    = (u.stars_paid || 0) + stars;
  db.data.bot_stats.total_stars  += stars;
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
  const key   = `${userId}_${today}`;
  return db.data.daily_usage[key] || 0;
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
    user_id:    String(userId),
    bin, qty, tier,
    created_at: new Date().toISOString(),
  });
  // Keep only last 10,000 entries
  if (db.data.generations.length > 10000) {
    db.data.generations = db.data.generations.slice(-10000);
  }
  db.data.bot_stats.total_gens++;
  db.data.bot_stats.total_cards_gen += qty;
  save();
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export function getBotStats()    { return db.data.bot_stats; }
export function getTotalUsers()  { return Object.keys(db.data.users).length; }
export function getPremiumCount(){ return Object.values(db.data.users).filter(u => u.is_premium).length; }
export function getAllUsers()    { return Object.keys(db.data.users).map(id => parseInt(id)); }

export function getUserStats(userId) {
  const id   = String(userId);
  const gens = db.data.generations.filter(g => g.user_id === id);
  const totalCards = gens.reduce((s, g) => s + (g.qty || 0), 0);
  return { gens: gens.length, totalCards, user: db.data.users[id] };
}
