//必要なパッケージをインポートする
import { GatewayIntentBits, Client, Partials, Message } from 'discord.js'
import { GoogleGenAI } from '@google/genai'
import 'dotenv/config'

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
})

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})


//Botがきちんと起動したか確認
client.once('ready', () => {
    console.log('Ready!')
    if(client.user){
        console.log(client.user.tag)
    }
})

//!timeと入力すると現在時刻を返信するように
client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return
    if (message.content === '!time') {
        const date1 = new Date();
        message.reply(date1.toLocaleString());
    }

    // /q [質問]でGeminiからのレスポンスを受け取る
    if (message.content.startsWith('/q ')) {
        const content = message.content.slice(3);
        const response = await genai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: content,
        });
        // console.log(response);
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response generated";
        message.reply(text);
    }
})

//ボット作成時のトークンでDiscordと接続
client.login(process.env.DISCORD_TOKEN)
