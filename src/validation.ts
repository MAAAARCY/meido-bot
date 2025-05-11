import { CommandInteraction } from 'discord.js';

export class ValidationModel {
    public isVoiceChannelAvailable(interaction: CommandInteraction) : boolean {
        const member = interaction.guild?.members.cache.get(interaction.user.id);
        const voiceChannel = member?.voice.channel;
        if (!voiceChannel) {
            return false;
        }

        return true;
    }
}