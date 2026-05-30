# 💳 Cymor CC Generator Bot
### *Developer Test Card Generator — by Cymor Tech Services*
> **"Always a winner"** — Legendary Smiley Cymor

---

## ⚠ IMPORTANT DISCLAIMER

> This tool generates **Luhn-valid test card numbers** for **developer use only**.
> All generated cards have **zero real monetary value** and **only work in sandbox/test environments**.
> Use only for legitimate payment gateway testing, API integration, and sandbox development.
> Any attempt to use generated numbers for real transactions is illegal.

---

## ✨ Features

### 🆓 Free Tier
- 15 cards per generation per day
- Full format output (card number | expiry | CVV)
- Basic BIN lookup (network, type, country)
- Random BIN or custom BIN entry

### 💎 Premium Tier (Telegram Stars)
- Unlimited cards per generation
- Custom BIN + custom expiry month & year
- Bulk export in CSV, JSON, TXT formats
- Full BIN lookup (bank name, country, currency, prepaid status)
- All output formats (full, pipe, plain, json, csv, txt)
- Priority generation speed

---

## 📁 Project Structure

```
cymor-cc-bot/
├── index.js              ← Main bot logic (all commands, payments, state)
├── src/
│   ├── generator.js      ← Luhn algorithm + card generation engine
│   ├── binlookup.js      ← BIN lookup via binlist.net API
│   ├── keyboards.js      ← All inline keyboards + message templates
│   └── database.js       ← SQLite (users, usage, stats, sessions)
├── data/                 ← Auto-created (SQLite DB + exports)
├── .env.example          ← Environment template
├── package.json
└── README.md
```

---

## 🛠 Setup

### 1. Create your Telegram Bot
1. Open Telegram → search **@BotFather**
2. Send `/newbot`
3. Choose a name: `Cymor CC Generator`
4. Choose a username: `cymorcc_bot` (or anything ending in `bot`)
5. Copy the **Bot Token**

### 2. Get your Telegram ID
1. Open Telegram → search **@userinfobot**
2. Send `/start`
3. Copy your **User ID**

### 3. Install & Configure
```bash
cd cymor-cc-bot
npm install
cp .env.example .env
```

Edit `.env`:
```env
BOT_TOKEN=1234567890:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OWNER_ID=your_telegram_id
PREMIUM_STARS_PRICE=150
FREE_DAILY_LIMIT=15
BTC_WALLET=your_btc_address
USDT_WALLET=your_usdt_trc20_address
```

### 4. Run
```bash
npm start
```

Open Telegram → your bot → `/start`

---

## ☁ Deploy on Render (Free)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Cymor CC Bot"
git remote add origin https://github.com/YOU/cymor-cc-bot.git
git push -u origin main
```

### Step 2 — Create Render Web Service
1. [render.com](https://render.com) → **New → Web Service**
2. Connect GitHub repo
3. Settings:
   | Field | Value |
   |-------|-------|
   | Environment | Node |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Plan | Free |

### Step 3 — Add Environment Variables
In Render dashboard → **Environment**:
- `BOT_TOKEN`
- `OWNER_ID`
- `PREMIUM_STARS_PRICE` → `150`
- `FREE_DAILY_LIMIT` → `15`
- `BTC_WALLET`
- `USDT_WALLET`

### Step 4 — Keep Alive
Render free tier sleeps after 15 mins. Add a UptimeRobot monitor:
- URL: `https://your-app.onrender.com`
- Interval: every 5 minutes

---

## 💬 Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Main menu |
| `/gen` | Generate cards (interactive) |
| `/gen [BIN] [qty]` | Quick generate |
| `/gen [BIN] [qty] [MM] [YYYY]` | Generate with custom expiry |
| `/bin [BIN]` | BIN lookup |
| `/stats` | Your usage stats |
| `/premium` | Upgrade to premium |
| `/help` | Command reference |

### Owner Only
| Command | Description |
|---------|-------------|
| `/botstats` | Full bot statistics |
| `/addpremium [userid]` | Give premium to a user |
| `/broadcast [message]` | Message all users |

---

## 🖨 Output Formats

| Format | Example |
|--------|---------|
| `full` | `4242 4242 4242 4242 \| 08/2027 \| 123` |
| `pipe` | `4242424242424242\|08\|2027\|123` |
| `plain` | `4242424242424242\|08/27\|123` |
| `json` | Full JSON array with metadata |
| `csv` | Spreadsheet with headers |
| `txt` | Formatted text file with header |

---

## 💰 Monetisation

### Telegram Stars (built-in)
- Users pay Stars directly in Telegram
- No external payment gateway needed
- You cash out Stars to real money via Telegram's Fragment platform

### Crypto (manual)
- Users pay BTC or USDT to your wallet
- Send payment proof to you
- You manually grant premium via `/addpremium [userid]`

### Revenue Estimate
| Users | Free | Premium @ 150 Stars | Monthly Est. |
|-------|------|---------------------|--------------|
| 100 | 80 | 20 × 150 = 3,000 stars | ~$15 |
| 500 | 400 | 100 × 150 = 15,000 stars | ~$75 |
| 2,000 | 1,600 | 400 × 150 = 60,000 stars | ~$300 |

*Telegram Stars value: ~$0.005 per star*

---

## 🧠 How the Luhn Algorithm Works

Every real (and test) card number passes the **Luhn check**:

```
Card: 4242 4242 4242 4242
Step 1: Double every second digit from right
Step 2: If result > 9, subtract 9
Step 3: Sum all digits
Step 4: If sum % 10 === 0 → VALID ✅
```

The generator fills random digits then calculates the correct check digit automatically — every card generated is Luhn-valid.

---

## ⚠ Legal & Ethical Notes

1. This tool is for **legitimate developer testing only**
2. All cards are clearly marked `TEST_USE_ONLY`
3. Generated numbers **do not work on live payment systems**
4. Do not use for fraud, carding, or any illegal activity
5. The developer/owner assumes no responsibility for misuse

---

*Powered by Cymor Tech Services* | *Always a winner* 🏆
