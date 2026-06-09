const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const axios = require("axios");
const path = require("path");

const TOKEN = "7805124868:AAFZtImH0qfvyddaX2ba4NwXEPy55k6n04I";
const ADMIN_ID = 2027479396;

const bot = new TelegramBot(TOKEN, { polling: true });

let plugins = [];
let pluginState = {};

// LOAD PLUGINS
function loadPlugins() {
    plugins = [];
    pluginState = {};

    fs.readdirSync("./plugin").forEach(file => {
        const plugin = require("./plugin/" + file);

        if (plugin.meta) {
            plugins.push(plugin.meta);
            pluginState[plugin.meta.cmd] = true;

            if (typeof plugin === "function") {
                plugin(bot, pluginState);
            }
        }
    });
}

loadPlugins();

// MENU
function mainMenu(chatId) {

    let text = "📌 MENU BOT DOWNLOADER\n\n🧾 FITUR:\n";

    plugins.forEach(p => {
        text += `• ${p.cmd} - ${p.desc}\n`;
    });

    bot.sendPhoto(chatId, "image/menu.jpg", {
        caption: text,
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "👑 Owner",
                        url: "https://t.me/ReyCloudDev"
                    }
                ]
            ]
        }
    });
}

// START
bot.onText(/\/start/, (msg) => {
    mainMenu(msg.chat.id);
});

// ADMIN PANEL
bot.onText(/\/admin/, (msg) => {
    if (msg.from.id !== ADMIN_ID) {
        return bot.sendMessage(msg.chat.id, "❌ Akses ditolak");
    }

    let text = "⚙️ ADMIN PANEL\n\n";

    plugins.forEach(p => {
        text += `• ${p.cmd} [${pluginState[p.cmd] ? "ON" : "OFF"}]\n`;
    });

    text += "\n/reload <cmd>\n/toggle <cmd>\n/addplugin name.js|code";

    bot.sendMessage(msg.chat.id, text);
});

// RELOAD PLUGIN
bot.onText(/\/reload (.+)/, (msg, match) => {
    if (msg.from.id !== ADMIN_ID) return;

    try {
        Object.keys(require.cache).forEach(k => {
            if (k.includes("/plugin/")) delete require.cache[k];
        });

        loadPlugins();

        bot.sendMessage(msg.chat.id, "♻️ Plugin di-reload");
    } catch (e) {
        bot.sendMessage(msg.chat.id, "❌ Gagal reload");
    }
});

// TOGGLE PLUGIN
bot.onText(/\/toggle (.+)/, (msg, match) => {
    if (msg.from.id !== ADMIN_ID) return;

    const cmd = match[1];

    if (pluginState[cmd] === undefined) {
        return bot.sendMessage(msg.chat.id, "❌ Plugin tidak ditemukan");
    }

    pluginState[cmd] = !pluginState[cmd];

    bot.sendMessage(msg.chat.id, `${cmd} => ${pluginState[cmd] ? "ON" : "OFF"}`);
});

// ADD PLUGIN
bot.onText(/\/addplugin (.+)/, (msg, match) => {
    if (msg.from.id !== ADMIN_ID) {
        return bot.sendMessage(msg.chat.id, "❌ Akses ditolak");
    }

    try {
        const input = match[1];
        const split = input.split("|");

        if (split.length < 2) {
            return bot.sendMessage(
                msg.chat.id,
                "Format: /addplugin name.js|code"
            );
        }

        const fileName = split[0].trim();
        const code = split.slice(1).join("|");

        const filePath = path.join(__dirname, "plugin", fileName);

        fs.writeFileSync(filePath, code);

        bot.sendMessage(msg.chat.id, `✅ Plugin dibuat: ${fileName}`);

        loadPlugins();

        bot.sendMessage(msg.chat.id, "♻️ Plugin auto-reload sukses");

    } catch (e) {
        bot.sendMessage(msg.chat.id, "❌ Gagal membuat plugin");
    }
});

console.log("Bot running...");