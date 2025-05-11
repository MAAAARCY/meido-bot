import { CommandInteraction } from 'discord.js';

// バリデーションを行うモデル
export class ValidationModel {
    // ユーザーがボイスチャンネルに参加しているか確認する
    public async checkVoiceChannel(interaction: CommandInteraction): Promise<boolean> {
        const member = interaction.guild?.members.cache.get(interaction.user.id);
        const voiceChannel = member?.voice.channel;

        if (!voiceChannel) {
            await interaction.reply('先にボイスチャンネルに参加してください！');
            return false;
        }
        return true;
    }
}