require('dotenv').config();

const express = require('express');
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const chalk = require('chalk');
const os = require('os');
const moment = require('moment');

// =========================================
// EXPRESS SERVER FOR RENDER
// =========================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('🤖 Smiley Cymor Bot is running successfully!');
});

app.listen(PORT, () => {
    console.log(`🌐 Web server running on port ${PORT}`);
});

// =========================================
// BOT CONFIGURATION
// =========================================
const bot = new Telegraf(process.env.BOT_TOKEN);

const OWNER_ID = process.env.OWNER_ID;
const BOT_NAME = 'Smiley Cymor Bot';
const OWNER_NAME = 'Legendary Smiley Cymor';
const MOTTO = 'Engineering the future with limitless digital power ⚡';
const FOOTER = 'Powered by CymorTechServices';
const SUPPORT_TG = 'https://t.me/yourtelegram';
const SUPPORT_NUMBER = '0113821327';

const startTime = Date.now();
let totalCommands = 0;
let totalUsers = new Set();

// =========================================
// UTILITIES
// =========================================
function addStats(ctx) {
    totalCommands++;
    totalUsers.add(ctx.from.id);
}

function runtime() {
    const ms = Date.now() - startTime;

    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const seconds = Math.floor((ms / 1000) % 60);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function isOwner(ctx) {
    return ctx.from.id.toString() === OWNER_ID;
}

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// =========================================
// TERMINAL STARTUP
// =========================================
console.clear();

console.log(chalk.cyan(`
╔══════════════════════════════════════════════╗
║         🤖 SMILEY CYMOR BOT ELITE 🤖        ║
╚══════════════════════════════════════════════╝
`));

console.log(chalk.green('✅ STATUS      : ONLINE'));
console.log(chalk.yellow(`👑 OWNER       : ${OWNER_NAME}`));
console.log(chalk.blue(`⚡ MOTTO       : ${MOTTO}`));
console.log(chalk.magenta('🚀 VERSION     : ELITE v1.0'));
console.log(chalk.white('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

// =========================================
// START COMMAND (FIXED - NO IMAGE)
// =========================================
bot.start(async (ctx) => {

    addStats(ctx);

    const user = ctx.from.first_name;

    const text = `
╭━━━〔 🌟 ${BOT_NAME.toUpperCase()} 🌟 〕━━⬣

👋 Welcome ${user}

⚡ ${MOTTO}

🤖 Your ultimate AI, media & utility bot.

🔥 Use /menu to explore elite features.

📞 WhatsApp Support:
${SUPPORT_NUMBER}

${FOOTER}
`;

    await ctx.reply(text, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [
                Markup.button.callback('📜 OPEN MENU', 'menu')
            ],
            [
                Markup.button.url('📢 SUPPORT', SUPPORT_TG)
            ]
        ])
    });
});

// =========================================
// MENU COMMAND (FIXED)
// =========================================
bot.command('menu', async (ctx) => {

    addStats(ctx);

    const username = ctx.from.first_name;

    const menu = `
╔══════════════════════════════╗
║      🌟 SMILEY CYMOR BOT 🌟      ║
╚══════════════════════════════╝

👋 USER: ${username}
⚡ STATUS: ONLINE
🧠 VERSION: ELITE

╭━━〔 🤖 SYSTEM COMMANDS 〕━━⬣
┃ ✦ /menu
┃ ✦ /ping
┃ ✦ /runtime
┃ ✦ /owner
┃ ✦ /botinfo
┃ ✦ /help
┃ ✦ /stats
┃ ✦ /alive
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 🎵 MEDIA COMMANDS 〕━━⬣
┃ ✦ /play
┃ ✦ /video
┃ ✦ /ytmp3
┃ ✦ /ytmp4
┃ ✦ /spotify
┃ ✦ /lyrics
┃ ✦ /tiktok
┃ ✦ /ig
┃ ✦ /fb
┃ ✦ /twitter
┃ ✦ /anime
┃ ✦ /movie
┃ ✦ /series
┃ ✦ /apk
┃ ✦ /wallpaper
┃ ✦ /ringtone
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 🧠 AI COMMANDS 〕━━⬣
┃ ✦ /ai
┃ ✦ /gpt
┃ ✦ /imagine
┃ ✦ /summarize
┃ ✦ /translate
┃ ✦ /fix
┃ ✦ /code
┃ ✦ /review
┃ ✦ /explain
┃ ✦ /essay
┃ ✦ /caption
┃ ✦ /enhance
┃ ✦ /removebg
┃ ✦ /generate
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 🌍 UTILITY COMMANDS 〕━━⬣
┃ ✦ /weather
┃ ✦ /news
┃ ✦ /wiki
┃ ✦ /calc
┃ ✦ /time
┃ ✦ /qr
┃ ✦ /github
┃ ✦ /speedtest
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 🎮 FUN COMMANDS 〕━━⬣
┃ ✦ /joke
┃ ✦ /quote
┃ ✦ /fact
┃ ✦ /flip
┃ ✦ /roll
┃ ✦ /8ball
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 👑 OWNER COMMANDS 〕━━⬣
┃ ✦ /broadcast
┃ ✦ /restart
┃ ✦ /shutdown
┃ ✦ /stats
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 🌐 SUPPORT 〕━━⬣
┃ 👑 Owner: ${OWNER_NAME}
┃ 📞 WhatsApp: ${SUPPORT_NUMBER}
┃ 📢 Telegram: @yourtelegram
╰━━━━━━━━━━━━━━━━━━⬣

⚡ ${MOTTO}

${FOOTER}
`;

    await ctx.reply(menu, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [
                Markup.button.callback('⚡ PING', 'ping'),
                Markup.button.callback('📊 BOTINFO', 'botinfo')
            ],
            [
                Markup.button.callback('🎮 FUN', 'fun'),
                Markup.button.callback('🧠 AI', 'ai_menu')
            ],
            [
                Markup.button.url('💬 SUPPORT', SUPPORT_TG)
            ]
        ])
    });
});

// =========================================
// BASIC COMMANDS
// =========================================
bot.command('ping', async (ctx) => {
    addStats(ctx);

    const start = Date.now();
    const msg = await ctx.reply('⚡ Calculating...');
    const speed = Date.now() - start;

    ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        null,
        `🏓 PONG\n⚡ ${speed}ms`
    );
});

bot.command('runtime', (ctx) => {
    addStats(ctx);
    ctx.reply(`⏳ Uptime:\n${runtime()}`);
});

bot.command('owner', (ctx) => {
    addStats(ctx);
    ctx.reply(`👑 ${OWNER_NAME}\n📞 ${SUPPORT_NUMBER}`);
});

bot.command('botinfo', (ctx) => {
    addStats(ctx);

    ctx.reply(`
🤖 ${BOT_NAME}
📦 Commands: ${totalCommands}
👥 Users: ${totalUsers.size}
⏳ Uptime: ${runtime()}
💻 Host: ${os.hostname()}
`);
});

// =========================================
// FUN COMMANDS
// =========================================
bot.command('joke', (ctx) => {
    addStats(ctx);

    const jokes = [
        'Why do programmers prefer dark mode? 😂',
        'AI tried cleaning my room 🤖',
        'WiFi went off = family time 😭'
    ];

    ctx.reply(randomItem(jokes));
});

bot.command('quote', (ctx) => {
    addStats(ctx);

    const quotes = [
        'Code. Build. Repeat.',
        'Dream big, deploy bigger.',
        'Future is written in code.'
    ];

    ctx.reply(randomItem(quotes));
});

bot.command('roll', (ctx) => {
    addStats(ctx);
    ctx.reply(`🎲 ${Math.floor(Math.random() * 6) + 1}`);
});

bot.command('flip', (ctx) => {
    addStats(ctx);
    ctx.reply(Math.random() > 0.5 ? 'HEADS 🪙' : 'TAILS 🪙');
});

// =========================================
// OWNER STATS
// =========================================
bot.command('stats', (ctx) => {
    addStats(ctx);

    if (!isOwner(ctx)) return ctx.reply('⛔ OWNER ONLY');

    ctx.reply(`
📊 STATS
👥 Users: ${totalUsers.size}
📦 Commands: ${totalCommands}
⏳ Runtime: ${runtime()}
`);
});

// =========================================
// CALLBACKS
// =========================================
bot.action('menu', (ctx) => ctx.answerCbQuery());
bot.action('ping', (ctx) => ctx.reply('🏓 Pong!'));
bot.action('botinfo', (ctx) => ctx.reply('🤖 Bot Online'));
bot.action('fun', (ctx) => ctx.reply('🎮 /joke /quote /roll'));
bot.action('ai_menu', (ctx) => ctx.reply('🧠 /ai /gpt /translate'));

// =========================================
// ERROR HANDLER
// =========================================
bot.catch((err) => {
    console.log('BOT ERROR:', err);
});

// =========================================
// LAUNCH BOT
// =========================================
bot.launch().then(() => {
    console.log(`✅ ${BOT_NAME} RUNNING`);
});

// =========================================
// GRACEFUL STOP
// =========================================
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
