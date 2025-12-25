import { describe, it, expect, vi } from 'vitest';

// Discord.jsクライアントをモック
vi.mock('discord.js', () => ({
    Client: class {
        once = vi.fn();
        on = vi.fn();
        login = vi.fn().mockResolvedValue('mock-token');
        user = null;
        application = null;
    },
    GatewayIntentBits: {
        DirectMessages: 1,
        Guilds: 2,
        GuildMembers: 4,
        GuildMessages: 8,
        MessageContent: 16,
        GuildVoiceStates: 32,
    },
    Partials: {
        Message: 1,
        Channel: 2,
    },
    ApplicationCommandOptionType: {
        String: 3,
    },
}));

// DiscordBotをモック
vi.mock('../src/discordBot', () => ({
    DiscordBot: class {
        handleChatCommand = vi.fn();
        handleVoiceChatCommand = vi.fn();
        handleJoinCommand = vi.fn();
        handleSpeakCommand = vi.fn();
        handleLeaveCommand = vi.fn();
    },
}));

describe('main.ts', () => {
    it('モジュールが正常にインポートできる', async () => {
        // main.tsをインポートしてもエラーが発生しないことを確認
        await expect(import('../src/main')).resolves.toBeDefined();
    });
});