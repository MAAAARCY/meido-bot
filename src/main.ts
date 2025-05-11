//必要なパッケージをインポートする
import { GatewayIntentBits, Client, Partials, CommandInteraction, ApplicationCommandOptionType } from 'discord.js';
import { joinVoiceChannel, VoiceConnectionStatus, entersState } from '@discordjs/voice';

import { AudioPlayerModel } from './audioPlayer';
import { GeminiModel } from './gemini';
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

const audioPlayer = new AudioPlayerModel();
const gemini = new GeminiModel();

// ボイスチャンネルの確認を行う共通関数
async function checkVoiceChannel(interaction: CommandInteraction): Promise<boolean> {
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const voiceChannel = member?.voice.channel;

    if (!voiceChannel) {
        await interaction.reply('先にボイスチャンネルに参加してください！');
        return false;
    }
    return true;
}

// ボイスチャンネルへの接続を行う共通関数
function createVoiceConnection(interaction: CommandInteraction) {
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const voiceChannel = member?.voice.channel;

    return joinVoiceChannel({
        channelId: voiceChannel!.id,
        guildId: interaction.guildId!,
        adapterCreator: interaction.guild!.voiceAdapterCreator
    });
}

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
    ], process.env.DISCORD_SERVER_ID!);
});

// スラッシュコマンドの処理
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    
    const { commandName } = interaction;

    try {
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
    } catch (error) {
        console.error('コマンド実行中にエラーが発生しました:', error);
        await interaction.reply('コマンドの実行中にエラーが発生しました。');
    }
});

// chatコマンドの処理
async function handleChatCommand(interaction: CommandInteraction): Promise<void> {
    const content = interaction.options.get('text')?.value as string;
    const response = await gemini.getGeminiResponse(content);
    await interaction.reply(response);
}

// voice_chatコマンドの処理
async function handleVoiceChatCommand(interaction: CommandInteraction): Promise<void> {
    if (!await checkVoiceChannel(interaction)) return;

    const content = interaction.options.get('text')?.value as string;
    const response = await gemini.getGeminiResponse(content);

    try {
        await interaction.reply('返答中...');
        const connection = createVoiceConnection(interaction);
        await audioPlayer.textToSpeech(response, connection);
    } catch (error) {
        console.error('音声チャット中にエラーが発生しました:', error);
        await interaction.reply('音声再生中にエラーが発生しました。');
    }
}

// joinコマンドの処理
async function handleJoinCommand(interaction: CommandInteraction): Promise<void> {
    if (!await checkVoiceChannel(interaction)) return;

    try {
        const connection = createVoiceConnection(interaction);
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
        const member = interaction.guild?.members.cache.get(interaction.user.id);
        await interaction.reply(`${member?.voice.channel?.name} に参加しました！`);
    } catch (error) {
        console.error('ボイスチャンネル参加中にエラーが発生しました:', error);
        await interaction.reply('ボイスチャンネルへの参加中にエラーが発生しました。');
    }
}

// speakコマンドの処理
async function handleSpeakCommand(interaction: CommandInteraction): Promise<void> {
    if (!await checkVoiceChannel(interaction)) return;

    const text = interaction.options.get('text')?.value as string;

    try {
        await interaction.reply(`「${text}」を読み上げています...`);
        const connection = createVoiceConnection(interaction);
        await audioPlayer.textToSpeech(text, connection);
    } catch (error) {
        console.error('音声再生中にエラーが発生しました:', error);
        await interaction.reply('音声再生中にエラーが発生しました。');
    }
}

// leaveコマンドの処理
async function handleLeaveCommand(interaction: CommandInteraction): Promise<void> {
    const guild = interaction.guild;
    if (!guild) {
        await interaction.reply('サーバー内でのみ使用できるコマンドです。');
        return;
    }
  
    const connection = joinVoiceChannel({
        channelId: '0',
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
    });
  
    connection.destroy();
    await interaction.reply('ボイスチャンネルから退出しました。');
}

// ボット作成時のトークンでDiscordと接続
client.login(process.env.DISCORD_TOKEN);
