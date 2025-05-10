//必要なパッケージをインポートする
import { GatewayIntentBits, Client, Partials, Message, CommandInteraction, ApplicationCommandOptionType } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState } from '@discordjs/voice';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { VoiceVoxModel } from './voicevox';
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

const voiceVox = new VoiceVoxModel();

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
            name: 'chat',
            description: '可愛いメイドと会話することができます',
            options: [{
                name: 'text',
                type: ApplicationCommandOptionType.String,
                description: '会話内容',
                required: true
            }]
        },
        {
            name: 'voice_chat',
            description: '可愛いメイドとボイスチャンネル内で会話することができます',
            options: [{
                name: 'text',
                type: ApplicationCommandOptionType.String,
                description: '会話内容',
                required: true
            }]
        },
        {
            name: 'join',
            description: 'メイドをボイスチャンネルに参加させます'
        },
        {
            name: 'leave',
            description: 'メイドをボイスチャンネルから退出させます'
        }
    ], process.env.DISCORD_SERVER_ID!); //TODO: 開発版とリリース版で設定を変更する
})

// スラッシュコマンドの処理
client.on('interactionCreate', async (interaction) => {
    console.log(interaction);
    if (!interaction.isCommand()) return;
    
    const { commandName } = interaction;

    // コマンド処理
    switch (commandName) {
        case 'chat':
            await handleChatCommand(interaction);
            break;
        case 'voice_chat':
            await handleVoiceChatCommand(interaction);
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

// chatコマンドの処理
async function handleChatCommand(interaction: CommandInteraction) {
    const content = interaction.options.get('text')?.value as string;
    const result = await model.generateContent([
        `あなたは親切なメイドAIです。以下の会話に日本語で返答してください。二人称は常にご主人様でお願いします。会話内容:${content}`
    ]);
    const json = JSON.parse(result.response.text());

    if (json["response"] == null) {
        await interaction.reply('エラーが発生しました。');
        return;
    }

    const response = json["response"];
    await interaction.reply(response);
}

// voice_chatコマンドの処理
async function handleVoiceChatCommand(interaction: CommandInteraction) {
    // ユーザーがボイスチャンネルにいるか確認
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const voiceChannel = member?.voice.channel;

    if (!voiceChannel) {
        await interaction.reply('先にボイスチャンネルに参加してください！');
        return;
    }

    const content = interaction.options.get('text')?.value as string;
    const result = await model.generateContent([
        `あなたは親切なメイドAIです。以下の質問に日本語で答えてください。二人称は常にご主人様でお願いします。${content}`
    ]);
    const json = JSON.parse(result.response.text());

    if (json["response"] == null) {
        await interaction.reply('エラーが発生しました。');
        return;
    }

    const response = json["response"];

    try {
        await interaction.reply('返答中...');

        // ボイスチャンネルに参加
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guildId!,
            adapterCreator: interaction.guild!.voiceAdapterCreator
        });

        // 音声プレイヤーの作成
        const player = createAudioPlayer();
        connection.subscribe(player);

        const audioPath = await voiceVox.getAudioFilePath(response);
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

// speakコマンドの処理
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
        const audioPath = await voiceVox.getAudioFilePath(text);
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
