// ─── src/keyboards.js ────────────────────────────────────────────────────────
// All Telegram inline keyboards and message templates

// ─── Main menu keyboard ───────────────────────────────────────────────────────
export const mainMenuKeyboard = {
  inline_keyboard: [
    [
      { text: '💳 Generate Cards', callback_data: 'cmd_generate' },
      { text: '🔍 BIN Lookup',     callback_data: 'cmd_binlookup' },
    ],
    [
      { text: '💎 Go Premium',  callback_data: 'cmd_premium'  },
      { text: '📊 My Stats',    callback_data: 'cmd_stats'    },
    ],
    [
      { text: '📖 How to Use',  callback_data: 'cmd_help'     },
      { text: '⚡ Quick Gen',   callback_data: 'cmd_quickgen' },
    ],
  ],
};

// ─── Generate options keyboard (premium) ─────────────────────────────────────
export const generateKeyboard = {
  inline_keyboard: [
    [
      { text: '🎲 Random BIN',      callback_data: 'gen_random'   },
      { text: '📌 Enter BIN',       callback_data: 'gen_custom'   },
    ],
    [
      { text: '🏦 Preset BINs',     callback_data: 'gen_preset'   },
      { text: '📦 Bulk Export',     callback_data: 'gen_bulk'     },
    ],
    [{ text: '🏠 Main Menu',        callback_data: 'cmd_menu'     }],
  ],
};

// ─── Free generate keyboard ───────────────────────────────────────────────────
export const freeGenerateKeyboard = {
  inline_keyboard: [
    [
      { text: '🎲 Random BIN', callback_data: 'gen_random'  },
      { text: '📌 Enter BIN',  callback_data: 'gen_custom'  },
    ],
    [
      { text: '💎 Unlock Premium', callback_data: 'cmd_premium' },
    ],
    [{ text: '🏠 Main Menu', callback_data: 'cmd_menu' }],
  ],
};

// ─── Format selection keyboard (premium) ─────────────────────────────────────
export const formatKeyboard = {
  inline_keyboard: [
    [
      { text: '📋 Full Format',  callback_data: 'fmt_full'  },
      { text: '🔗 Pipe Format',  callback_data: 'fmt_pipe'  },
    ],
    [
      { text: '📄 JSON',         callback_data: 'fmt_json'  },
      { text: '📊 CSV',          callback_data: 'fmt_csv'   },
    ],
    [
      { text: '📝 TXT File',     callback_data: 'fmt_txt'   },
      { text: '🔤 Plain',        callback_data: 'fmt_plain' },
    ],
    [{ text: '⬅ Back',          callback_data: 'cmd_generate' }],
  ],
};

// ─── Preset BIN keyboard ─────────────────────────────────────────────────────
export const presetBinKeyboard = {
  inline_keyboard: [
    [
      { text: '🟦 Visa Generic',     callback_data: 'preset_400000' },
      { text: '🟥 Mastercard',       callback_data: 'preset_520000' },
    ],
    [
      { text: '🟩 Amex',             callback_data: 'preset_371449' },
      { text: '🟧 Discover',         callback_data: 'preset_601100' },
    ],
    [
      { text: '🔷 Stripe Visa',      callback_data: 'preset_424242' },
      { text: '🔶 Stripe MC',        callback_data: 'preset_555555' },
    ],
    [
      { text: '🇰🇪 KCB Kenya',       callback_data: 'preset_457173' },
      { text: '🇰🇪 Equity Kenya',    callback_data: 'preset_454313' },
    ],
    [
      { text: '🇳🇬 GTBank Nigeria',  callback_data: 'preset_539983' },
      { text: '🇬🇭 GCB Ghana',       callback_data: 'preset_512345' },
    ],
    [{ text: '⬅ Back', callback_data: 'cmd_generate' }],
  ],
};

// ─── Quantity keyboard ────────────────────────────────────────────────────────
export const qtyKeyboardFree = {
  inline_keyboard: [
    [
      { text: '5 cards',  callback_data: 'qty_5'  },
      { text: '10 cards', callback_data: 'qty_10' },
      { text: '15 cards', callback_data: 'qty_15' },
    ],
    [{ text: '⬅ Back', callback_data: 'cmd_generate' }],
  ],
};

export const qtyKeyboardPremium = {
  inline_keyboard: [
    [
      { text: '10',  callback_data: 'qty_10'  },
      { text: '25',  callback_data: 'qty_25'  },
      { text: '50',  callback_data: 'qty_50'  },
    ],
    [
      { text: '100', callback_data: 'qty_100' },
      { text: '250', callback_data: 'qty_250' },
      { text: '500', callback_data: 'qty_500' },
    ],
    [
      { text: '1000', callback_data: 'qty_1000' },
      { text: '✏ Custom', callback_data: 'qty_custom' },
    ],
    [{ text: '⬅ Back', callback_data: 'cmd_generate' }],
  ],
};

// ─── Premium purchase keyboard ────────────────────────────────────────────────
export const premiumKeyboard = (price) => ({
  inline_keyboard: [
    [{ text: `⭐ Pay ${price} Telegram Stars`, callback_data: 'pay_stars' }],
    [
      { text: '₿ Pay BTC',    callback_data: 'pay_btc'  },
      { text: '💎 Pay USDT',  callback_data: 'pay_usdt' },
    ],
    [{ text: '🏠 Back to Menu', callback_data: 'cmd_menu' }],
  ],
});

// ─── After generation keyboard ────────────────────────────────────────────────
export const afterGenKeyboard = {
  inline_keyboard: [
    [
      { text: '🔄 Generate Again', callback_data: 'cmd_generate' },
      { text: '🔍 BIN Lookup',     callback_data: 'cmd_binlookup' },
    ],
    [{ text: '🏠 Main Menu', callback_data: 'cmd_menu' }],
  ],
};

// ─── Message templates ────────────────────────────────────────────────────────
export const WELCOME_MSG = (name) => `
🌟 *Welcome to Cymor CC Generator, ${name}!*
_By Legendary Smiley Cymor_

━━━━━━━━━━━━━━━━━━━━━━━━━
💳 *Developer Test Card Generator*
━━━━━━━━━━━━━━━━━━━━━━━━━

Generate Luhn-valid test cards for:
✅ Payment gateway testing
✅ Sandbox environment testing  
✅ API integration testing
✅ UI/UX development & demos

⚠ *ALL CARDS ARE TEST-ONLY*
⚠ *ZERO REAL MONETARY VALUE*
⚠ *ONLY WORK IN SANDBOX ENVIRONMENTS*

━━━━━━━━━━━━━━━━━━━━━━━━━
🆓 *FREE TIER*
• 15 cards per generation
• Full format (card | expiry | cvv)
• Basic BIN lookup

💎 *PREMIUM TIER*
• Unlimited cards per generation
• Custom BIN + expiry control
• Bulk export (CSV, JSON, TXT)
• Full BIN lookup (bank, country, type)
• All formats
• Priority speed

━━━━━━━━━━━━━━━━━━━━━━━━━
_Powered by Cymor Tech Services_
_Always a winner 🏆_
`.trim();

export const HELP_MSG = `
📖 *Cymor CC Generator — Commands*

━━━━━━━━━━━━━━━━━━━━━━━━━
*Basic Commands:*
/start  — Main menu
/gen    — Generate cards (quick)
/bin    — BIN lookup
/stats  — Your usage stats
/premium — Upgrade to premium
/help   — This message

━━━━━━━━━━━━━━━━━━━━━━━━━
*Quick Generation:*
\`/gen [BIN] [qty]\`
Example: \`/gen 424242 10\`

\`/gen [BIN] [qty] [MM] [YYYY]\`
Example: \`/gen 457173 20 08 2027\`

━━━━━━━━━━━━━━━━━━━━━━━━━
*BIN Lookup:*
\`/bin [BIN]\`
Example: \`/bin 424242\`

━━━━━━━━━━━━━━━━━━━━━━━━━
*Output formats (Premium):*
• \`full\`  — 4242 4242 4242 4242 | 08/2027 | 123
• \`pipe\`  — 4242424242424242|08|2027|123
• \`json\`  — JSON array
• \`csv\`   — CSV spreadsheet file
• \`txt\`   — Text file with header

━━━━━━━━━━━━━━━━━━━━━━━━━
⚠ *FOR TESTING PURPOSES ONLY*
_Powered by Cymor Tech Services_
`.trim();
