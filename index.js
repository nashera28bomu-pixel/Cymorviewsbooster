// ─── index.js ────────────────────────────────────────────────────────────────
import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import path from 'path';

import { generateCards, formatOutput, detectNetwork, PRESET_BINS } from './src/generator.js';
import { lookupBin, formatBinBasic, formatBinFull } from './src/binlookup.js';
import {
  getUser, saveUserInfo, isPremium, setPremium,
  getDailyUsage, incrementDailyUsage, logGeneration,
  getBotStats, getTotalUsers, getPremiumCount,
  getAllUsers, getUserStats, addStarsPaid,
} from './src/database.js';
import {
  mainMenuKeyboard, freeGenerateKeyboard, generateKeyboard,
  formatKeyboard, presetBinKeyboard, qtyKeyboardFree,
  qtyKeyboardPremium, premiumKeyboard, afterGenKeyboard,
  WELCOME_MSG, HELP_MSG,
} from './src/keyboards.js';

// ─── Config ───────────────────────────────────────────────────────────────────
const BOT_TOKEN    = process.env.BOT_TOKEN;
const OWNER_ID     = parseInt(process.env.OWNER_ID);
const BOT_NAME     = process.env.BOT_NAME     || 'Cymor CC Generator';
const OWNER_NAME   = process.env.OWNER_NAME   || 'Legendary Smiley Cymor';
const STARS_PRICE  = parseInt(process.env.PREMIUM_STARS_PRICE) || 150;
const FREE_LIMIT   = parseInt(process.env.FREE_DAILY_LIMIT)    || 15;
const BTC_WALLET   = process.env.BTC_WALLET   || null;
const ETH_WALLET   = process.env.ETH_WALLET   || null;
const USDT_WALLET  = process.env.USDT_WALLET  || null;

if (!BOT_TOKEN) { console.error('❌ BOT_TOKEN not set in .env'); process.exit(1); }

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ─── Per-user conversation state ─────────────────────────────────────────────
const userState = new Map();

function getState(userId) {
  if (!userState.has(userId)) userState.set(userId, {});
  return userState.get(userId);
}

function setState(userId, fields) {
  const s = getState(userId);
  Object.assign(s, fields);
}

function clearState(userId) {
  userState.set(userId, {});
}

// ─── Helper: send with retry ──────────────────────────────────────────────────
async function send(chatId, text, opts = {}) {
  try {
    return await bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...opts });
  } catch (err) {
    console.error('Send error:', err.message);
  }
}

async function edit(chatId, msgId, text, opts = {}) {
  try {
    return await bot.editMessageText(text, { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', ...opts });
  } catch {}
}

// ─── Build generation result message ─────────────────────────────────────────
function buildGenMessage(cards, network, bin, qty, format = 'full') {
  const output = formatOutput(cards, network, format);
  const header = [
    `✅ *Generated ${qty} Test Cards*`,
    ``,
    `💳 Network : \`${network}\``,
    `🔢 BIN     : \`${bin}\``,
    `📋 Format  : \`${format.toUpperCase()}\``,
    ``,
    `\`\`\``,
    output,
    `\`\`\``,
    ``,
    `⚠ _TEST CARDS ONLY — ZERO REAL VALUE_`,
    `_Powered by Cymor Tech Services_`,
  ].join('\n');
  return header;
}

// ─── /start ───────────────────────────────────────────────────────────────────
bot.onText(/\/start/, async (msg) => {
  const { id: userId, first_name, username } = msg.from;
  saveUserInfo(userId, username, first_name);
  clearState(userId);
  await send(userId, WELCOME_MSG(first_name), { reply_markup: mainMenuKeyboard });
});

// ─── /help ────────────────────────────────────────────────────────────────────
bot.onText(/\/help/, async (msg) => {
  await send(msg.from.id, HELP_MSG, {
    reply_markup: { inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'cmd_menu' }]] },
  });
});

// ─── /gen — quick generation command ─────────────────────────────────────────
// Usage: /gen [BIN] [qty] [MM] [YYYY]
bot.onText(/\/gen(.*)/, async (msg, match) => {
  const userId = msg.from.id;
  saveUserInfo(userId, msg.from.username, msg.from.first_name);
  const premium = isPremium(userId);
  const args    = (match[1] || '').trim().split(/\s+/).filter(Boolean);

  if (!args.length) {
    // No args — show generate menu
    await send(userId, `💳 *Generate Test Cards*\n\nChoose your generation method:`, {
      reply_markup: premium ? generateKeyboard : freeGenerateKeyboard,
    });
    return;
  }

  const bin   = args[0] || '4';
  const qty   = Math.min(parseInt(args[1]) || 10, premium ? 1000 : FREE_LIMIT);
  const month = args[2] || 'rnd';
  const year  = args[3] || 'rnd';

  // Free tier limit
  if (!premium) {
    const used = getDailyUsage(userId);
    if (used + qty > FREE_LIMIT) {
      await send(userId,
        `⚠ *Daily limit reached!*\n\nFree tier: *${FREE_LIMIT} cards/day*\nUsed today: *${used}*\nRemaining: *${FREE_LIMIT - used}*\n\n💎 Upgrade to Premium for unlimited generation!`,
        { reply_markup: { inline_keyboard: [[{ text: '💎 Go Premium', callback_data: 'cmd_premium' }]] } }
      );
      return;
    }
  }

  try {
    const { cards, network } = generateCards({ bin, qty, month, year });
    incrementDailyUsage(userId, qty);
    logGeneration(userId, bin, qty, premium ? 'premium' : 'free');
    const msg2 = buildGenMessage(cards, network, bin, qty, 'full');

    if (msg2.length > 4000) {
      // Too long — send as file
      const content = formatOutput(cards, network, 'txt');
      const buf     = Buffer.from(content, 'utf8');
      await bot.sendDocument(userId, buf, {
        caption: `✅ *${qty} test cards generated*\n⚠ _TEST ONLY — NO REAL VALUE_\n_Powered by Cymor Tech Services_`,
        parse_mode: 'Markdown',
      }, { filename: `cymor_cards_${bin}_${Date.now()}.txt`, contentType: 'text/plain' });
    } else {
      await send(userId, msg2, { reply_markup: afterGenKeyboard });
    }
  } catch (err) {
    await send(userId, `❌ Error: ${err.message}`);
  }
});

// ─── /bin — BIN lookup ────────────────────────────────────────────────────────
bot.onText(/\/bin(.*)/, async (msg, match) => {
  const userId = msg.from.id;
  const bin    = (match[1] || '').trim();
  if (!bin) {
    setState(userId, { awaitingBin: true, binAction: 'lookup' });
    await send(userId, `🔍 *BIN Lookup*\n\nSend me a BIN number (6-8 digits):`);
    return;
  }
  await performBinLookup(userId, bin);
});

async function performBinLookup(userId, bin) {
  const premium = isPremium(userId);
  try {
    await bot.sendChatAction(userId, 'typing');
    const info = await lookupBin(bin);
    const text = premium ? formatBinFull(info) : formatBinBasic(info);
    await send(userId, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💳 Generate with this BIN', callback_data: `genbin_${info.bin}` }],
          [{ text: '🏠 Main Menu', callback_data: 'cmd_menu' }],
        ],
      },
    });
  } catch (err) {
    await send(userId, `❌ BIN lookup failed: ${err.message}`);
  }
}

// ─── /stats ───────────────────────────────────────────────────────────────────
bot.onText(/\/stats/, async (msg) => {
  const userId  = msg.from.id;
  const premium = isPremium(userId);
  const s       = getUserStats(userId);
  const used    = getDailyUsage(userId);

  await send(userId, [
    `📊 *Your Stats*`,
    ``,
    `💎 Tier      : \`${premium ? 'PREMIUM' : 'FREE'}\``,
    `🎯 Generations: \`${s.gens}\``,
    `💳 Total Cards: \`${s.totalCards || 0}\``,
    `📅 Today Used : \`${used}${!premium ? ` / ${FREE_LIMIT}` : ' (unlimited)'}\``,
    ``,
    premium
      ? `✨ _You have unlimited generation power!_`
      : `_Upgrade to Premium for unlimited cards!_`,
    ``,
    `_Powered by Cymor Tech Services_`,
  ].join('\n'), {
    reply_markup: {
      inline_keyboard: [
        [{ text: premium ? '✅ Already Premium' : '💎 Go Premium', callback_data: 'cmd_premium' }],
        [{ text: '🏠 Main Menu', callback_data: 'cmd_menu' }],
      ],
    },
  });
});

// ─── /premium ────────────────────────────────────────────────────────────────
bot.onText(/\/premium/, async (msg) => {
  await showPremium(msg.from.id);
});

async function showPremium(userId) {
  if (isPremium(userId)) {
    await send(userId, `✅ *You already have Premium!*\n\nEnjoy unlimited card generation! 💎\n\n_Powered by Cymor Tech Services_`, {
      reply_markup: { inline_keyboard: [[{ text: '💳 Generate Cards', callback_data: 'cmd_generate' }]] },
    });
    return;
  }

  await send(userId, [
    `💎 *Cymor CC Generator — Premium*`,
    ``,
    `Upgrade once, enjoy forever:`,
    ``,
    `✅ Unlimited cards per generation`,
    `✅ Custom BIN + custom expiry`,
    `✅ Bulk export: CSV, JSON, TXT`,
    `✅ Full BIN lookup (bank, country, type)`,
    `✅ All output formats`,
    `✅ Priority generation speed`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `⭐ *${STARS_PRICE} Telegram Stars* (one-time)`,
    `₿ Bitcoin / 💎 USDT (on request)`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `_Powered by Cymor Tech Services_`,
    `_Always a winner 🏆_`,
  ].join('\n'), { reply_markup: premiumKeyboard(STARS_PRICE) });
}

// ─── /broadcast (owner only) ──────────────────────────────────────────────────
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
  if (msg.from.id !== OWNER_ID) return;
  const text  = match[1];
  const users = getAllUsers();
  let   sent  = 0;
  for (const uid of users) {
    try { await bot.sendMessage(uid, `📢 *Broadcast from ${OWNER_NAME}*\n\n${text}`, { parse_mode: 'Markdown' }); sent++; } catch {}
    await new Promise(r => setTimeout(r, 50));
  }
  await send(OWNER_ID, `✅ Broadcast sent to ${sent}/${users.length} users.`);
});

// ─── /addpremium (owner only) ─────────────────────────────────────────────────
bot.onText(/\/addpremium (\d+)/, async (msg, match) => {
  if (msg.from.id !== OWNER_ID) return;
  const target = parseInt(match[1]);
  setPremium(target, 365);
  await send(OWNER_ID, `✅ Premium granted to \`${target}\` (365 days)`);
  try { await send(target, `🎉 *You've been given Premium access!*\n\nEnjoy unlimited card generation! 💎`); } catch {}
});

// ─── /botstats (owner only) ───────────────────────────────────────────────────
bot.onText(/\/botstats/, async (msg) => {
  if (msg.from.id !== OWNER_ID) return;
  const s = getBotStats();
  await send(OWNER_ID, [
    `📊 *Bot Statistics*`,
    ``,
    `👥 Total Users   : \`${getTotalUsers()}\``,
    `💎 Premium Users : \`${getPremiumCount()}\``,
    `🎯 Total Gens    : \`${s?.total_gens || 0}\``,
    `💳 Cards Generated: \`${s?.total_cards_gen || 0}\``,
    `⭐ Stars Earned  : \`${s?.total_stars || 0}\``,
    ``,
    `_Powered by Cymor Tech Services_`,
  ].join('\n'));
});

// ─── Callback query handler ───────────────────────────────────────────────────
bot.on('callback_query', async (query) => {
  const userId  = query.from.id;
  const chatId  = query.message.chat.id;
  const msgId   = query.message.message_id;
  const data    = query.data;
  const premium = isPremium(userId);

  await bot.answerCallbackQuery(query.id);
  saveUserInfo(userId, query.from.username, query.from.first_name);

  // ── Main menu ──────────────────────────────────────────────────────────────
  if (data === 'cmd_menu') {
    clearState(userId);
    await edit(chatId, msgId, WELCOME_MSG(query.from.first_name), { reply_markup: mainMenuKeyboard });
    return;
  }

  // ── Help ───────────────────────────────────────────────────────────────────
  if (data === 'cmd_help') {
    await edit(chatId, msgId, HELP_MSG, {
      reply_markup: { inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'cmd_menu' }]] },
    });
    return;
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  if (data === 'cmd_stats') {
    const s    = getUserStats(userId);
    const used = getDailyUsage(userId);
    await edit(chatId, msgId, [
      `📊 *Your Stats*`,
      ``,
      `💎 Tier       : \`${premium ? 'PREMIUM ✅' : 'FREE'}\``,
      `🎯 Generations : \`${s.gens}\``,
      `💳 Total Cards : \`${s.totalCards || 0}\``,
      `📅 Today       : \`${used}${!premium ? `/${FREE_LIMIT}` : ' (unlimited)'}\``,
      ``,
      `_Powered by Cymor Tech Services_`,
    ].join('\n'), {
      reply_markup: {
        inline_keyboard: [
          [{ text: premium ? '✅ Premium Active' : '💎 Upgrade', callback_data: 'cmd_premium' }],
          [{ text: '🏠 Main Menu', callback_data: 'cmd_menu' }],
        ],
      },
    });
    return;
  }

  // ── Premium screen ─────────────────────────────────────────────────────────
  if (data === 'cmd_premium') {
    if (premium) {
      await edit(chatId, msgId, `✅ *You already have Premium!*\n\nEnjoy unlimited card generation! 💎`, {
        reply_markup: { inline_keyboard: [[{ text: '💳 Generate Cards', callback_data: 'cmd_generate' }], [{ text: '🏠 Main Menu', callback_data: 'cmd_menu' }]] },
      });
      return;
    }
    await edit(chatId, msgId, [
      `💎 *Premium — One-Time Upgrade*`,
      ``,
      `✅ Unlimited cards per generation`,
      `✅ Custom BIN + custom expiry`,
      `✅ Bulk export: CSV, JSON, TXT`,
      `✅ Full BIN lookup`,
      `✅ All output formats`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      `⭐ \`${STARS_PRICE} Telegram Stars\``,
      `₿ BTC / 💎 USDT also accepted`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `_Always a winner 🏆_`,
    ].join('\n'), { reply_markup: premiumKeyboard(STARS_PRICE) });
    return;
  }

  // ── Pay with Telegram Stars ────────────────────────────────────────────────
  if (data === 'pay_stars') {
    try {
      await bot.sendInvoice(
        chatId,
        `💎 Cymor CC Generator — Premium`,
        `Unlock unlimited card generation, custom BINs, bulk export, full BIN lookup and all formats. One-time payment — lifetime access.`,
        'premium_upgrade',
        '',            // provider_token empty for Stars
        'XTR',         // currency code for Telegram Stars
        [{ label: 'Premium Lifetime Access', amount: STARS_PRICE }]
      );
    } catch (err) {
      await send(chatId, `❌ Could not create invoice: ${err.message}\n\nPlease contact @${OWNER_NAME} directly.`);
    }
    return;
  }

  // ── Pay with crypto ────────────────────────────────────────────────────────
  if (data === 'pay_btc') {
    const addr = BTC_WALLET || 'Contact owner for BTC address';
    await send(chatId, [
      `₿ *Pay with Bitcoin*`,
      ``,
      `Send any amount to:`,
      `\`${addr}\``,
      ``,
      `After payment, send proof to the owner and your account will be upgraded within 1 hour.`,
      ``,
      `👑 Owner: @${OWNER_NAME}`,
      `_Powered by Cymor Tech Services_`,
    ].join('\n'), {
      reply_markup: { inline_keyboard: [[{ text: '⬅ Back', callback_data: 'cmd_premium' }]] },
    });
    return;
  }

  if (data === 'pay_usdt') {
    const addr = USDT_WALLET || 'Contact owner for USDT address';
    await send(chatId, [
      `💎 *Pay with USDT (TRC20)*`,
      ``,
      `Send any amount to:`,
      `\`${addr}\``,
      ``,
      `After payment, send proof to the owner and your account will be upgraded within 1 hour.`,
      ``,
      `👑 Owner: @${OWNER_NAME}`,
      `_Powered by Cymor Tech Services_`,
    ].join('\n'), {
      reply_markup: { inline_keyboard: [[{ text: '⬅ Back', callback_data: 'cmd_premium' }]] },
    });
    return;
  }

  // ── Generate menu ──────────────────────────────────────────────────────────
  if (data === 'cmd_generate') {
    clearState(userId);
    await edit(chatId, msgId, `💳 *Generate Test Cards*\n\nChoose your method:`, {
      reply_markup: premium ? generateKeyboard : freeGenerateKeyboard,
    });
    return;
  }

  // ── Quick gen (random BIN) ─────────────────────────────────────────────────
  if (data === 'cmd_quickgen' || data === 'gen_random') {
    const randomBins = ['4', '5', '34', '6011'];
    const bin  = randomBins[Math.floor(Math.random() * randomBins.length)];
    const qty  = premium ? 25 : FREE_LIMIT;

    if (!premium) {
      const used = getDailyUsage(userId);
      if (used >= FREE_LIMIT) {
        await edit(chatId, msgId, `⚠ *Daily limit reached (${FREE_LIMIT} cards/day)*\n\n💎 Upgrade to Premium for unlimited!`, {
          reply_markup: premiumKeyboard(STARS_PRICE),
        });
        return;
      }
    }

    const { cards, network } = generateCards({ bin, qty });
    incrementDailyUsage(userId, qty);
    logGeneration(userId, bin, qty, premium ? 'premium' : 'free');
    const text = buildGenMessage(cards, network, bin, qty, 'full');

    if (text.length > 4000) {
      await bot.sendDocument(chatId, Buffer.from(formatOutput(cards, network, 'txt'), 'utf8'), {
        caption: `✅ *${qty} test cards*\n⚠ TEST ONLY\n_Cymor Tech Services_`,
        parse_mode: 'Markdown',
      }, { filename: `cymor_${bin}_${qty}.txt`, contentType: 'text/plain' });
    } else {
      await edit(chatId, msgId, text, { reply_markup: afterGenKeyboard });
    }
    return;
  }

  // ── Custom BIN ─────────────────────────────────────────────────────────────
  if (data === 'gen_custom') {
    setState(userId, { awaitingBin: true, binAction: 'generate' });
    await edit(chatId, msgId,
      `📌 *Enter your BIN*\n\nSend a BIN prefix (6-8 digits):\n\nExample: \`457173\` or \`424242\`\n\n_Powered by Cymor Tech Services_`,
      { reply_markup: { inline_keyboard: [[{ text: '⬅ Back', callback_data: 'cmd_generate' }]] } }
    );
    return;
  }

  // ── Preset BINs ────────────────────────────────────────────────────────────
  if (data === 'gen_preset') {
    await edit(chatId, msgId, `🏦 *Select a Preset BIN*\n\nChoose a bank or network:`, {
      reply_markup: presetBinKeyboard,
    });
    return;
  }

  // ── Preset BIN selected ────────────────────────────────────────────────────
  if (data.startsWith('preset_')) {
    const bin = data.replace('preset_', '');
    setState(userId, { selectedBin: bin });
    await edit(chatId, msgId, `✅ *BIN Selected: \`${bin}\`*\n\nNetwork: \`${detectNetwork(bin)}\`\n\nHow many cards?`, {
      reply_markup: premium ? qtyKeyboardPremium : qtyKeyboardFree,
    });
    return;
  }

  // ── Generate from BIN lookup result ───────────────────────────────────────
  if (data.startsWith('genbin_')) {
    const bin = data.replace('genbin_', '');
    setState(userId, { selectedBin: bin });
    await send(chatId, `✅ *BIN: \`${bin}\`*\n\nHow many cards do you want?`, {
      reply_markup: premium ? qtyKeyboardPremium : qtyKeyboardFree,
    });
    return;
  }

  // ── Bulk export menu ───────────────────────────────────────────────────────
  if (data === 'gen_bulk') {
    if (!premium) {
      await edit(chatId, msgId, `🔒 *Bulk Export is Premium only*\n\nUpgrade to export CSV, JSON & TXT files with unlimited cards!`, {
        reply_markup: premiumKeyboard(STARS_PRICE),
      });
      return;
    }
    setState(userId, { awaitingBin: true, binAction: 'bulk' });
    await edit(chatId, msgId,
      `📦 *Bulk Export*\n\nSend a BIN prefix to generate a bulk file:\n\nExample: \`457173\``,
      { reply_markup: { inline_keyboard: [[{ text: '⬅ Back', callback_data: 'cmd_generate' }]] } }
    );
    return;
  }

  // ── Quantity selected ──────────────────────────────────────────────────────
  if (data.startsWith('qty_')) {
    const qtyStr = data.replace('qty_', '');

    if (qtyStr === 'custom') {
      setState(userId, { awaitingQty: true });
      await send(chatId, `✏ *Enter custom quantity* (max 1000):`);
      return;
    }

    const qty = parseInt(qtyStr);
    const state = getState(userId);
    const bin   = state.selectedBin || '4';

    if (!premium) {
      const used = getDailyUsage(userId);
      const allowed = Math.min(qty, FREE_LIMIT - used);
      if (allowed <= 0) {
        await edit(chatId, msgId, `⚠ *Daily limit reached!*\n\nFree: ${FREE_LIMIT}/day | Used: ${used}\n\n💎 Upgrade for unlimited!`, {
          reply_markup: premiumKeyboard(STARS_PRICE),
        });
        return;
      }
    }

    // Check if expiry was set
    const expMonth = state.expMonth || 'rnd';
    const expYear  = state.expYear  || 'rnd';

    // Show format choice for premium, or generate directly for free
    if (premium && state.binAction !== 'generate') {
      setState(userId, { selectedBin: bin, selectedQty: qty });
      await edit(chatId, msgId, `📋 *Choose output format:*`, { reply_markup: formatKeyboard });
    } else {
      await runGeneration(chatId, msgId, userId, bin, qty, 'full', expMonth, expYear);
    }
    return;
  }

  // ── Format selected ────────────────────────────────────────────────────────
  if (data.startsWith('fmt_')) {
    const format = data.replace('fmt_', '');
    const state  = getState(userId);
    const bin    = state.selectedBin || '4';
    const qty    = state.selectedQty || 10;
    const expMonth = state.expMonth  || 'rnd';
    const expYear  = state.expYear   || 'rnd';
    await runGeneration(chatId, msgId, userId, bin, qty, format, expMonth, expYear);
    return;
  }

  // ── BIN lookup ─────────────────────────────────────────────────────────────
  if (data === 'cmd_binlookup') {
    setState(userId, { awaitingBin: true, binAction: 'lookup' });
    await edit(chatId, msgId, `🔍 *BIN Lookup*\n\nSend a BIN number (6-8 digits):\n\nExample: \`424242\``, {
      reply_markup: { inline_keyboard: [[{ text: '⬅ Back', callback_data: 'cmd_menu' }]] },
    });
    return;
  }
});

// ─── Run generation (shared logic) ───────────────────────────────────────────
async function runGeneration(chatId, msgId, userId, bin, qty, format, month, year) {
  const premium = isPremium(userId);

  // Apply free limit
  if (!premium) {
    const used    = getDailyUsage(userId);
    const allowed = Math.min(qty, FREE_LIMIT - used);
    if (allowed <= 0) {
      await send(chatId, `⚠ *Daily limit reached!*\n\nFree: ${FREE_LIMIT}/day\n\n💎 Upgrade for unlimited!`, {
        reply_markup: premiumKeyboard(STARS_PRICE),
      });
      return;
    }
    qty = allowed;
  }

  try {
    await bot.sendChatAction(chatId, 'typing');
    const { cards, network } = generateCards({ bin, qty, month, year });
    incrementDailyUsage(userId, qty);
    logGeneration(userId, bin, qty, premium ? 'premium' : 'free');
    clearState(userId);

    // File formats → send as document
    if (['csv', 'json', 'txt'].includes(format)) {
      const content = formatOutput(cards, network, format);
      const ext     = format;
      const buf     = Buffer.from(content, 'utf8');
      const caption = [
        `✅ *${qty} Test Cards — ${format.toUpperCase()}*`,
        `💳 Network : \`${network}\``,
        `🔢 BIN     : \`${bin}\``,
        ``,
        `⚠ _TEST ONLY — NO REAL VALUE_`,
        `_Cymor Tech Services_`,
      ].join('\n');

      await bot.sendDocument(chatId, buf, { caption, parse_mode: 'Markdown' },
        { filename: `cymor_${bin}_${qty}.${ext}`, contentType: ext === 'json' ? 'application/json' : 'text/plain' }
      );
    } else {
      const text = buildGenMessage(cards, network, bin, qty, format);
      if (text.length > 4000) {
        // Auto-fallback to txt file if too long
        const content = formatOutput(cards, network, 'txt');
        await bot.sendDocument(chatId, Buffer.from(content, 'utf8'), {
          caption: `✅ *${qty} Test Cards*\n_Too many to display inline — sending as file_\n⚠ TEST ONLY\n_Cymor Tech Services_`,
          parse_mode: 'Markdown',
        }, { filename: `cymor_${bin}_${qty}.txt`, contentType: 'text/plain' });
      } else {
        try {
          await edit(chatId, msgId, text, { reply_markup: afterGenKeyboard });
        } catch {
          await send(chatId, text, { reply_markup: afterGenKeyboard });
        }
      }
    }
  } catch (err) {
    await send(chatId, `❌ Generation failed: ${err.message}`);
  }
}

// ─── Handle incoming text (state machine for awaiting inputs) ─────────────────
bot.on('message', async (msg) => {
  if (!msg.text) return;
  if (msg.text.startsWith('/')) return; // already handled above

  const userId  = msg.from.id;
  const text    = msg.text.trim();
  const premium = isPremium(userId);
  const state   = getState(userId);

  saveUserInfo(userId, msg.from.username, msg.from.first_name);

  // ── Awaiting BIN input ──────────────────────────────────────────────────────
  if (state.awaitingBin) {
    const bin = text.replace(/\D/g, '').slice(0, 8);
    if (bin.length < 6) {
      await send(userId, `⚠ BIN must be at least 6 digits. Try again:`);
      return;
    }

    if (state.binAction === 'lookup') {
      clearState(userId);
      await performBinLookup(userId, bin);
      return;
    }

    // Generate action — ask for expiry if premium
    setState(userId, { awaitingBin: false, selectedBin: bin });

    if (premium) {
      setState(userId, { awaitingExpiry: true });
      await send(userId, [
        `✅ *BIN: \`${bin}\`* (${detectNetwork(bin)})`,
        ``,
        `🗓 *Enter expiry (or skip)*`,
        `Format: \`MM YYYY\` — Example: \`08 2027\``,
        `Or type \`skip\` for random expiry`,
      ].join('\n'), {
        reply_markup: { inline_keyboard: [[{ text: '🎲 Random Expiry', callback_data: 'expiry_skip' }]] },
      });
    } else {
      await send(userId, `✅ *BIN: \`${bin}\`*\n\nHow many cards?`, {
        reply_markup: qtyKeyboardFree,
      });
    }
    return;
  }

  // ── Awaiting expiry input ───────────────────────────────────────────────────
  if (state.awaitingExpiry) {
    let month = 'rnd', year = 'rnd';

    if (text.toLowerCase() !== 'skip') {
      const parts = text.split(/[\s\/\-]+/);
      if (parts.length >= 2) {
        month = parts[0].padStart(2, '0');
        year  = parts[1].length === 2 ? '20' + parts[1] : parts[1];
      }
    }

    setState(userId, { awaitingExpiry: false, expMonth: month, expYear: year });
    await send(userId, `✅ Expiry: \`${month === 'rnd' ? 'Random' : month + '/' + year}\`\n\nHow many cards?`, {
      reply_markup: qtyKeyboardPremium,
    });
    return;
  }

  // ── Awaiting custom quantity ────────────────────────────────────────────────
  if (state.awaitingQty) {
    const qty = Math.min(parseInt(text) || 10, premium ? 1000 : FREE_LIMIT);
    const bin = state.selectedBin || '4';
    setState(userId, { awaitingQty: false, selectedQty: qty });

    if (premium) {
      await send(userId, `✅ Quantity: *${qty}*\n\nChoose output format:`, { reply_markup: formatKeyboard });
    } else {
      await runGeneration(userId, null, userId, bin, qty, 'full', 'rnd', 'rnd');
    }
    return;
  }

  // ── Default — just show menu ────────────────────────────────────────────────
  await send(userId, `👋 Use /start to open the menu or /help for commands.`);
});

// ─── Pre-checkout handler (Telegram Stars payment) ───────────────────────────
bot.on('pre_checkout_query', async (query) => {
  await bot.answerPreCheckoutQuery(query.id, true);
});

// ─── Successful payment handler ───────────────────────────────────────────────
bot.on('successful_payment', async (msg) => {
  const userId = msg.from.id;
  const stars  = msg.successful_payment.total_amount;

  setPremium(userId, 365);
  addStarsPaid(userId, stars);

  await send(userId, [
    `🎉 *Payment Successful!*`,
    ``,
    `⭐ Stars paid: *${stars}*`,
    `💎 Premium activated: *Lifetime*`,
    ``,
    `You now have:`,
    `✅ Unlimited card generation`,
    `✅ Custom BIN + expiry`,
    `✅ Bulk export (CSV, JSON, TXT)`,
    `✅ Full BIN lookup`,
    `✅ All output formats`,
    ``,
    `_Thank you! Always a winner 🏆_`,
    `_Powered by Cymor Tech Services_`,
  ].join('\n'), {
    reply_markup: { inline_keyboard: [[{ text: '💳 Generate Cards Now!', callback_data: 'cmd_generate' }]] },
  });

  // Notify owner
  try {
    await send(OWNER_ID, `💰 *New Premium Purchase!*\n\nUser: \`${userId}\`\nStars: *${stars}*`);
  } catch {}
});

// ─── Handle expiry skip callback ─────────────────────────────────────────────
bot.on('callback_query', async (query) => {
  if (query.data !== 'expiry_skip') return;
  const userId = query.from.id;
  await bot.answerCallbackQuery(query.id);
  setState(userId, { awaitingExpiry: false, expMonth: 'rnd', expYear: 'rnd' });
  await send(userId, `✅ *Random expiry selected*\n\nHow many cards?`, {
    reply_markup: qtyKeyboardPremium,
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────
bot.on('polling_error', (err) => console.error('Polling error:', err.message));
process.on('unhandledRejection', (err) => console.error('Unhandled:', err?.message));

// ─── Start ────────────────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════╗');
console.log(`║   💳 ${BOT_NAME.padEnd(36)} ║`);
console.log(`║   👑 ${OWNER_NAME.padEnd(36)} ║`);
console.log(`║   ⭐ Stars Price: ${String(STARS_PRICE + ' Stars').padEnd(24)} ║`);
console.log(`║   🆓 Free Limit: ${String(FREE_LIMIT + ' cards/day').padEnd(24)} ║`);
console.log('╚══════════════════════════════════════════╝\n');
console.log('✅ Cymor CC Generator Bot is running!\n');
