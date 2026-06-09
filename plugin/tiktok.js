const axios = require("axios");
const fs = require("fs");

module.exports.meta = {
    name: "TikTok Downloader",
    cmd: "/tiktok",
    desc: "Download video + info TikTok"
};

module.exports = function(bot, state) {

    async function getTikTok(url) {
        const api = `https://www.tikwm.com/api/?url=${url}`;
        const res = await axios.get(api);

        if (res.data.code !== 0) return null;

        return res.data.data;
    }

    bot.onText(/\/tiktok (.+)/, async (msg, match) => {

        if (!state["/tiktok"]) return;

        const chatId = msg.chat.id;
        const url = match[1];

        bot.sendMessage(chatId, "🔄 Processing...");

        const data = await getTikTok(url);

        if (!data) {
            return bot.sendMessage(chatId, "❌ Gagal ambil data");
        }

        const videoUrl = data.play;

        const info =
`📌 TIKTOK INFO

👤 Username: ${data.author?.unique_id || "-"}
📝 Nickname: ${data.author?.nickname || "-"}
❤️ Likes: ${data.digg_count || 0}
👁 Views: ${data.play_count || 0}
💬 Comments: ${data.comment_count || 0}
🔁 Shares: ${data.share_count || 0}

📝 Desc:
${data.title || "-"}`;

        const file = "tiktok.mp4";

        const res = await axios({
            url: videoUrl,
            method: "GET",
            responseType: "stream"
        });

        const writer = fs.createWriteStream(file);
        res.data.pipe(writer);

        writer.on("finish", async () => {

            await bot.sendVideo(chatId, file, {
                caption: info
            });

            fs.unlinkSync(file);
        });

        writer.on("error", () => {
            bot.sendMessage(chatId, "❌ Download error");
        });
    });

};