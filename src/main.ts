//必要なパッケージをインポートする
import { GatewayIntentBits, Client, Partials, Message } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState } from '@discordjs/voice';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { VoiceVoxManager } from './voicevox';
import 'dotenv/config';

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: { responseMimeType: "application/json" }
});

const voiceVox = new VoiceVoxManager();

//Botがきちんと起動したか確認
client.once('ready', () => {
    console.log('Ready!');
    if(client.user){
        console.log(client.user.tag);
    }
})

//!timeと入力すると現在時刻を返信するように
client.on('messageCreate', async (message: Message) => {
    // console.log(message.content);
    if (message.author.bot) return

    // /q [質問]でGeminiからのレスポンスを受け取る
    if (message.content.startsWith('/chat ')) {
        const content = message.content.slice(3);
        const result = await model.generateContent([
            `あなたは親切なメイドAIです。以下の質問に日本語で答えてください。二人称は常にご主人様でお願いします。${content}`
        ]);
        const json = JSON.parse(result.response.text());

        if (json["response"] != null) {
            const response = json["response"];
            message.reply(response);

            // try {
            //     const audioPath = await voiceVox.getAudioFilePath(response);
            //     console.log(audioPath);
            //     // await voiceVox.playAudio(audioPath);
            //     // await voiceVox.cleanup(audioPath);
            // } catch (error) {
            //     console.error('音声再生エラー:');
            // }
        }
    }
})

//ボット作成時のトークンでDiscordと接続
client.login(process.env.DISCORD_TOKEN);
