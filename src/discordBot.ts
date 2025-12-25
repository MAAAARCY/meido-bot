import { joinVoiceChannel, VoiceConnection, VoiceConnectionStatus, entersState } from "@discordjs/voice";
import { ChatInputCommandInteraction } from "discord.js";

import { ValidationModel } from './validation';
import { AudioPlayerModel } from './audioPlayer';
import { GeminiModel } from './gemini';
import 'dotenv/config';

// メイドBotで使用できるコマンドの管理，ボイスチャンネルへの接続を行う
export class DiscordBot {
    private validation: ValidationModel;
    private audioPlayer: AudioPlayerModel;
    private gemini: GeminiModel;

    // コンストラクタ
    constructor() {
        this.validation = new ValidationModel();
        this.audioPlayer = new AudioPlayerModel();
        this.gemini = new GeminiModel();
    }

    // ボイスチャンネルへの接続を行う関数
    public createVoiceConnection(interaction: ChatInputCommandInteraction) : VoiceConnection {
        const member = interaction.guild?.members.cache.get(interaction.user.id);
        const voiceChannel = member?.voice.channel;

        return joinVoiceChannel({
            channelId: voiceChannel!.id,
            guildId: interaction.guildId!,
            adapterCreator: interaction.guild!.voiceAdapterCreator
        });
    }

    // chatコマンドの処理
    public async handleChatCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        const content = interaction.options.get('text')?.value as string;
        const response = await this.gemini.getGeminiResponse(content);
        await interaction.reply(response);
    }

    // voice_chatコマンドの処理
    public async handleVoiceChatCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!await this.validation.checkVoiceChannel(interaction)) return;

        const content = interaction.options.get('text')?.value as string;
        const response = await this.gemini.getGeminiResponse(content);

        try {
            await interaction.reply('返答中...');
            const connection = this.createVoiceConnection(interaction);
            await this.audioPlayer.textToSpeech(response, connection);
        } catch (error) {
            console.error('音声チャット中にエラーが発生しました:', error);
            await interaction.reply('音声再生中にエラーが発生しました。');
        }
    }

    // joinコマンドの処理
    public async handleJoinCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!await this.validation.checkVoiceChannel(interaction)) return;

        try {
            const connection = this.createVoiceConnection(interaction);
            await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
            const member = interaction.guild?.members.cache.get(interaction.user.id);
            await interaction.reply(`${member?.voice.channel?.name} に参加しました！`);
        } catch (error) {
            console.error('ボイスチャンネル参加中にエラーが発生しました:', error);
            await interaction.reply('ボイスチャンネルへの参加中にエラーが発生しました。');
        }
    }

    // speakコマンドの処理
    public async handleSpeakCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!await this.validation.checkVoiceChannel(interaction)) return;

        const text = interaction.options.get('text')?.value as string;

        try {
            await interaction.reply(`「${text}」を読み上げています...`);
            const connection = this.createVoiceConnection(interaction);
            await this.audioPlayer.textToSpeech(text, connection);
        } catch (error) {
            console.error('音声再生中にエラーが発生しました:', error);
            await interaction.reply('音声再生中にエラーが発生しました。');
        }
    }

    // leaveコマンドの処理
    public async handleLeaveCommand(interaction: ChatInputCommandInteraction): Promise<void> {
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
}

