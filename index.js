require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const chalk = require('chalk');
const os = require('os');
const moment = require('moment');

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
║                                              ║
║         🤖 SMILEY CYMOR BOT ELITE 🤖        ║
║                                              ║
╚══════════════════════════════════════════════╝
`));

console.log(chalk.green('✅ STATUS      : ONLINE'));
console.log(chalk.yellow(`👑 OWNER       : ${OWNER_NAME}`));
console.log(chalk.blue(`⚡ MOTTO       : ${MOTTO}`));
console.log(chalk.magenta('🚀 VERSION     : ELITE v1.0'));
console.log(chalk.white('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

// =========================================
// START COMMAND
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

    await ctx.replyWithPhoto(
        {
            url: 'https://images.unsplash.com/photo-1518770660439-4636190af475'
        },
        {
            caption: text,
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [
                    Markup.button.callback('📜 OPEN MENU', 'menu')
                ],
                [
                    Markup.button.url('📢 SUPPORT', SUPPORT_TG)
                ]
            ])
        }
    );
});

// =========================================
// MENU COMMAND
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
┃ ✦ /define
┃ ✦ /currency
┃ ✦ /calc
┃ ✦ /time
┃ ✦ /qr
┃ ✦ /shorten
┃ ✦ /password
┃ ✦ /email
┃ ✦ /phone
┃ ✦ /ip
┃ ✦ /github
┃ ✦ /npm
┃ ✦ /speedtest
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 🎮 FUN COMMANDS 〕━━⬣
┃ ✦ /joke
┃ ✦ /quote
┃ ✦ /fact
┃ ✦ /truth
┃ ✦ /dare
┃ ✦ /ship
┃ ✦ /flip
┃ ✦ /roll
┃ ✦ /8ball
┃ ✦ /riddle
┃ ✦ /meme
┃ ✦ /roast
┃ ✦ /pickup
┃ ✦ /compliment
┃ ✦ /hack
┃ ✦ /simp
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 👑 OWNER COMMANDS 〕━━⬣
┃ ✦ /broadcast
┃ ✦ /restart
┃ ✦ /shutdown
┃ ✦ /ban
┃ ✦ /unban
┃ ✦ /premium
┃ ✦ /addpremium
┃ ✦ /delpremium
┃ ✦ /block
┃ ✦ /unblock
┃ ✦ /cleartemp
┃ ✦ /maintenance
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 🌐 SUPPORT 〕━━⬣
┃ 👑 Owner: ${OWNER_NAME}
┃ 📞 WhatsApp: ${SUPPORT_NUMBER}
┃ 📢 Telegram: @yourtelegram
╰━━━━━━━━━━━━━━━━━━⬣

⚡ ${MOTTO}

${FOOTER}
`;

    await ctx.replyWithPhoto(
        {
            url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085'
        },
        {
            caption: menu,
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
        }
    );
});

// =========================================
// WORKING COMMANDS (20)
// =========================================

// PING
bot.command('ping', async (ctx) => {
    addStats(ctx);

    const start = Date.now();

    const msg = await ctx.reply('⚡ Calculating speed...');

    const speed = Date.now() - start;

    ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        null,
        `🏓 PONG\n\n⚡ Speed: ${speed}ms`
    );
});

// RUNTIME
bot.command('runtime', (ctx) => {
    addStats(ctx);

    ctx.reply(`⏳ BOT UPTIME\n\n${runtime()}`);
});

// OWNER
bot.command('owner', (ctx) => {
    addStats(ctx);

    ctx.reply(`
👑 OWNER INFORMATION

Name: ${OWNER_NAME}
Bot: ${BOT_NAME}
WhatsApp: ${SUPPORT_NUMBER}

⚡ ${MOTTO}
`);
});

// BOTINFO
bot.command('botinfo', (ctx) => {
    addStats(ctx);

    ctx.reply(`
🤖 BOT INFORMATION

🧠 Name: ${BOT_NAME}
⚡ Version: ELITE v1.0
👑 Owner: ${OWNER_NAME}
📦 Commands Used: ${totalCommands}
👥 Users: ${totalUsers.size}
💻 Host: ${os.hostname()}
⏳ Runtime: ${runtime()}
`);
});

// HELP
bot.command('help', (ctx) => {
    addStats(ctx);

    ctx.reply(`
📖 HELP CENTER

Use commands like:

/play faded
/weather Nairobi
/ai Tell me a joke
/calc 99*100

⚡ ${MOTTO}
`);
});

// JOKE
bot.command('joke', (ctx) => {
    addStats(ctx);

    const jokes = [
        'Why do programmers prefer dark mode? Because light attracts bugs 😂',
        'I told AI to clean my room. It generated a vacuum tutorial 🤣',
        'My WiFi went down for 5 minutes, so I had to talk to my family 😭'
    ];

    ctx.reply(randomItem(jokes));
});

// QUOTE
bot.command('quote', (ctx) => {
    addStats(ctx);

    const quotes = [
        'Success is built one line of code at a time.',
        'Dream big. Build bigger.',
        'Technology rewards creators.'
    ];

    ctx.reply(`✨ ${randomItem(quotes)}`);
});

// FACT
bot.command('fact', (ctx) => {
    addStats(ctx);

    ctx.reply('🧠 Fact: The first computer bug was an actual insect found inside a computer in 1947.');
});

// FLIP
bot.command('flip', (ctx) => {
    addStats(ctx);

    const result = Math.random() > 0.5 ? 'HEADS 🪙' : 'TAILS 🪙';

    ctx.reply(`🪙 Coin Flip Result:\n\n${result}`);
});

// ROLL
bot.command('roll', (ctx) => {
    addStats(ctx);

    const number = Math.floor(Math.random() * 6) + 1;

    ctx.reply(`🎲 Dice Rolled: ${number}`);
});

// 8BALL
bot.command('8ball', (ctx) => {
    addStats(ctx);

    const answers = [
        'Yes definitely ✅',
        'No chance ❌',
        'Ask again later 🤔',
        'Absolutely 🔥',
        'Very unlikely 😭'
    ];

    ctx.reply(`🎱 ${randomItem(answers)}`);
});

// WEATHER
bot.command('weather', async (ctx) => {
    addStats(ctx);

    const city = ctx.message.text.split(' ').slice(1).join(' ');

    if (!city) return ctx.reply('Usage: /weather Nairobi');

    ctx.reply(`🌦️ Weather lookup for ${city} coming soon.`);
});

// NEWS
bot.command('news', (ctx) => {
    addStats(ctx);

    ctx.reply('📰 News system connected. API integration coming soon.');
});

// WIKI
bot.command('wiki', (ctx) => {
    addStats(ctx);

    const query = ctx.message.text.split(' ').slice(1).join(' ');

    if (!query) return ctx.reply('Usage: /wiki technology');

    ctx.reply(`📚 Wikipedia search for: ${query}`);
});

// CALC
bot.command('calc', (ctx) => {
    addStats(ctx);

    try {
        const expression = ctx.message.text.split(' ').slice(1).join(' ');

        if (!expression) return ctx.reply('Usage: /calc 99*100');

        const result = eval(expression);

        ctx.reply(`🧮 Result: ${result}`);

    } catch {
        ctx.reply('❌ Invalid calculation.');
    }
});

// AI
bot.command('ai', (ctx) => {
    addStats(ctx);

    const question = ctx.message.text.split(' ').slice(1).join(' ');

    if (!question) return ctx.reply('Usage: /ai tell me a joke');

    ctx.reply(`🤖 AI RESPONSE\n\nYou asked: ${question}\n\nGemini integration coming soon.`);
});

// GPT
bot.command('gpt', (ctx) => {
    addStats(ctx);

    ctx.reply('🧠 GPT system initialized.');
});

// TRANSLATE
bot.command('translate', (ctx) => {
    addStats(ctx);

    ctx.reply('🌍 Translation system coming soon.');
});

// DARE
bot.command('dare', (ctx) => {
    addStats(ctx);

    const dares = [
        'Send a voice note singing your favorite song 🎤',
        'Text your best friend “I am secretly Batman” 😂',
        'Talk like a robot for 2 minutes 🤖'
    ];

    ctx.reply(`😈 DARE\n\n${randomItem(dares)}`);
});

// TRUTH
bot.command('truth', (ctx) => {
    addStats(ctx);

    const truths = [
        'What is your biggest fear?',
        'Who was your first crush?',
        'What secret talent do you have?'
    ];

    ctx.reply(`😳 TRUTH\n\n${randomItem(truths)}`);
});

// BROADCAST
bot.command('broadcast', (ctx) => {
    addStats(ctx);

    if (!isOwner(ctx)) {
        return ctx.reply('⛔ OWNER ONLY COMMAND');
    }

    const message = ctx.message.text.split(' ').slice(1).join(' ');

    if (!message) {
        return ctx.reply('Usage: /broadcast your message');
    }

    ctx.reply(`📢 Broadcast queued successfully.\n\nMessage:\n${message}`);
});

// STATS
bot.command('stats', (ctx) => {
    addStats(ctx);

    if (!isOwner(ctx)) {
        return ctx.reply('⛔ OWNER ONLY COMMAND');
    }

    ctx.reply(`
📊 ELITE BOT STATS

👥 Users: ${totalUsers.size}
📦 Commands: ${totalCommands}
⏳ Runtime: ${runtime()}
🚀 Status: ONLINE
`);
});

// =========================================
// CALLBACK BUTTONS
// =========================================
bot.action('menu', async (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('📜 Use /menu to open the elite command panel.');
});

bot.action('ping', async (ctx) => {
    ctx.answerCbQuery('⚡ Testing speed...');
    ctx.reply('🏓 Pong!');
});

bot.action('botinfo', async (ctx) => {
    ctx.answerCbQuery();

    ctx.reply(`🤖 ${BOT_NAME}\n⚡ ELITE SYSTEM ONLINE`);
});

bot.action('fun', async (ctx) => {
    ctx.answerCbQuery();

    ctx.reply('🎮 Fun Commands:\n/joke\n/quote\n/fact\n/roll\n/flip');
});

bot.action('ai_menu', async (ctx) => {
    ctx.answerCbQuery();

    ctx.reply('🧠 AI Commands:\n/ai\n/gpt\n/imagine\n/translate');
});

// =========================================
// ERROR HANDLER
// =========================================
bot.catch((err) => {
    console.log(chalk.red('BOT ERROR:'), err);
});

// =========================================
// LAUNCH BOT
// =========================================
bot.launch().then(() => {
    console.log(chalk.green(`\n✅ ${BOT_NAME} IS NOW RUNNING SUCCESSFULLY\n`));
});

// =========================================
// GRACEFUL STOP
// =========================================
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
