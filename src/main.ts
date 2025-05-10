//必要なパッケージをインポートする
import { GatewayIntentBits, Client, Partials, Message, CommandInteraction, ApplicationCommandOptionType } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState } from '@discordjs/voice';
import { setTimeout } from "node:timers/promises";
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
    GatewayIntentBits.GuildVoiceStates
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

    // スラッシュコマンドを登録
    client.application?.commands.set([
        {
            name: 'speak',
            description: '指定したテキストを音声で読み上げます',
            options: [{
                name: 'text',
                type: ApplicationCommandOptionType.String,
                description: '読み上げるテキスト',
                required: true
            }]
        },
        {
            name: 'question',
            description: '可愛いメイドがあなたの質問に答えてくれます',
            options: [{
                name: 'text',
                type: ApplicationCommandOptionType.String,
                description: '質問内容',
                required: true
            }]
        },
        {
            name: 'join',
            description: 'ボイスチャンネルに参加します'
        },
        {
            name: 'leave',
            description: 'ボイスチャンネルから退出します'
        }
    ], process.env.DISCORD_GUILD_ID!);
})

// //!timeと入力すると現在時刻を返信するように
// client.on('messageCreate', async (message: Message) => {
//     // console.log(message.content);
//     if (message.author.bot) return

//     // /q [質問]でGeminiからのレスポンスを受け取る
//     if (message.content.startsWith('/chat ')) {
//         const content = message.content.slice(3);
//         const result = await model.generateContent([
//             `あなたは親切なメイドAIです。以下の質問に日本語で答えてください。二人称は常にご主人様でお願いします。${content}`
//         ]);
//         const json = JSON.parse(result.response.text());

//         if (json["response"] != null) {
//             const response = json["response"];
//             message.reply(response);

//             // try {
//             //     const audioPath = await voiceVox.getAudioFilePath(response);
//             //     console.log(audioPath);
//             //     // await voiceVox.playAudio(audioPath);
//             //     // await voiceVox.cleanup(audioPath);
//             // } catch (error) {
//             //     console.error('音声再生エラー:');
//             // }

//         }
//     }
// })

// スラッシュコマンドの処理
client.on('interactionCreate', async (interaction) => {
    console.log(interaction);
    if (!interaction.isCommand()) return;
    
    const { commandName } = interaction;

    // コマンド処理
    switch (commandName) {
        case 'question':
            await handleQuestionCommand(interaction);
            break;
        case 'join':
            await handleJoinCommand(interaction);
            break;
        case 'speak':
            await handleSpeakCommand(interaction);
            break;
        case 'leave':
            await handleLeaveCommand(interaction);
            break;
    }
});

// questionコマンドの処理
async function handleQuestionCommand(interaction: CommandInteraction) {
    const content = interaction.options.get('text')?.value as string;

    const result = await model.generateContent([
        `あなたは親切なメイドAIです。以下の質問に日本語で答えてください。二人称は常にご主人様でお願いします。${content}`
    ]);

    const json = JSON.parse(result.response.text());

    if (json["response"] != null) {
        const response = json["response"];
        await interaction.reply(response);
    } else {
        await interaction.reply('エラーが発生しました。');
    }
}

// joinコマンドの処理
async function handleJoinCommand(interaction: CommandInteraction) {
    // ユーザーがボイスチャンネルにいるか確認
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const voiceChannel = member?.voice.channel;
  
    if (!voiceChannel) {
        await interaction.reply('先にボイスチャンネルに参加してください！');
        return;
    }
  
    try {
        // ボイスチャンネルに参加
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guildId!,
            adapterCreator: interaction.guild!.voiceAdapterCreator,
        });

        // 接続状態を確認
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
        await interaction.reply(`${voiceChannel.name} に参加しました！`);

    } catch (error) {
      console.error(error);
      await interaction.reply('ボイスチャンネルへの参加中にエラーが発生しました。');
    }
}

async function handleSpeakCommand(interaction: CommandInteraction) {
    const text = interaction.options.get('text')?.value as string;
    
    // ユーザーがボイスチャンネルにいるか確認
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const voiceChannel = member?.voice.channel;
  
    if (!voiceChannel) {
        await interaction.reply('先にボイスチャンネルに参加してください！');
        return;
    }
  
    try {
        await interaction.reply(`「${text}」を読み上げています...`);

        // ボイスチャンネルに参加
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guildId!,
            adapterCreator: interaction.guild!.voiceAdapterCreator
        });

        // 音声プレイヤーの作成
        const player = createAudioPlayer();
        connection.subscribe(player);

        // ここで実際にはテキストを音声に変換する処理が必要
        // 例として、音声ファイルを再生する方法:
        const audioPath = await voiceVox.getAudioFilePath(text);
        
        // await setTimeout(3000);

        const resource = createAudioResource(audioPath);
        player.play(resource);

        // 再生終了時の処理
        player.on(AudioPlayerStatus.Idle, async () => {
            console.log('音声再生が終了しました');
            await voiceVox.cleanup(audioPath);
        });
  
    } catch (error) {
        console.error(error);
        await interaction.reply('音声再生中にエラーが発生しました。');
    }
}

// leaveコマンドの処理
async function handleLeaveCommand(interaction: CommandInteraction) {
    const guild = interaction.guild;
    if (!guild) {
        await interaction.reply('サーバー内でのみ使用できるコマンドです。');
        return;
    }
  
    // 現在の接続を確認
    const connection = joinVoiceChannel({
        channelId: '0', // ダミーID
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
    });
  
    connection.destroy();
    await interaction.reply('ボイスチャンネルから退出しました。');
}


//ボット作成時のトークンでDiscordと接続
client.login(process.env.DISCORD_TOKEN);
