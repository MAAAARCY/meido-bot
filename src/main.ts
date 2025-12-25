import { GatewayIntentBits, Client, Partials, ApplicationCommandOptionType } from 'discord.js';

import { DiscordBot } from './discordBot';

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

const discordBot = new DiscordBot();

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
    if (!interaction.isChatInputCommand()) return;
    
    const { commandName } = interaction;

    try {
        switch (commandName) {
            case 'chat':
                await discordBot.handleChatCommand(interaction);
                break;
            case 'voice_chat':
                await discordBot.handleVoiceChatCommand(interaction);
                break;
            case 'join':
                await discordBot.handleJoinCommand(interaction);
                break;
            case 'speak':
                await discordBot.handleSpeakCommand(interaction);
                break;
            case 'leave':
                await discordBot.handleLeaveCommand(interaction);
                break;
        }
    } catch (error) {
        console.error('コマンド実行中にエラーが発生しました:', error);
        await interaction.reply('コマンドの実行中にエラーが発生しました。');
    }
});

// ボット作成時のトークンでDiscordと接続
client.login(process.env.DISCORD_TOKEN);
