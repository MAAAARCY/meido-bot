import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let clientInstance: any;
const botMocks = {
    handleChatCommand: vi.fn(),
    handleVoiceChatCommand: vi.fn(),
    handleJoinCommand: vi.fn(),
    handleSpeakCommand: vi.fn(),
    handleLeaveCommand: vi.fn(),
};

const originalEnv = { ...process.env };

beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv, DISCORD_TOKEN: 'test-token', DISCORD_SERVER_ID: 'test-server-id' };
    clientInstance = undefined;

    vi.doMock('discord.js', () => {
        return {
            Client: class MockClient {
                once = vi.fn();
                on = vi.fn();
                login = vi.fn().mockResolvedValue('logged');
                user = { tag: 'TestBot#0000' };
                application = { commands: { set: vi.fn().mockResolvedValue(undefined) } };

                constructor() {
                    // eslint-disable-next-line @typescript-eslint/no-this-alias
                    clientInstance = this;
                }
            },
            GatewayIntentBits: {
                DirectMessages: 1,
                Guilds: 2,
                GuildMembers: 4,
                GuildMessages: 8,
                MessageContent: 16,
                GuildVoiceStates: 32,
            },
            Partials: { Message: 1, Channel: 2 },
            ApplicationCommandOptionType: { String: 3 },
        };
    });

    vi.doMock('../src/discordBot', () => ({
        DiscordBot: class MockDiscordBot {
            handleChatCommand = botMocks.handleChatCommand;
            handleVoiceChatCommand = botMocks.handleVoiceChatCommand;
            handleJoinCommand = botMocks.handleJoinCommand;
            handleSpeakCommand = botMocks.handleSpeakCommand;
            handleLeaveCommand = botMocks.handleLeaveCommand;
        },
    }));
});

afterEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
});

describe('main.ts', () => {
    it('readyハンドラでloginとコマンド登録が実行される', async () => {
        await import('../src/main');

        const readyCallback = clientInstance?.once.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
        expect(readyCallback).toBeDefined();

        await readyCallback?.();

        expect(clientInstance?.login).toHaveBeenCalledWith('test-token');
        expect(clientInstance?.application.commands.set).toHaveBeenCalled();
    });

    it('interactionCreateで各コマンドに委譲される', async () => {
        await import('../src/main');

        const interactionCallback = clientInstance?.on.mock.calls.find((call: any) => call[0] === 'interactionCreate')?.[1];
        expect(interactionCallback).toBeDefined();

        const makeInteraction = (commandName: string) => ({
            isChatInputCommand: () => true,
            commandName,
        });

        await interactionCallback?.(makeInteraction('chat'));
        await interactionCallback?.(makeInteraction('voice_chat'));
        await interactionCallback?.(makeInteraction('join'));
        await interactionCallback?.(makeInteraction('speak'));
        await interactionCallback?.(makeInteraction('leave'));

        // 非ChatInputCommandの分岐も踏む
        await interactionCallback?.({ isChatInputCommand: () => false });

        expect(botMocks.handleChatCommand).toHaveBeenCalledTimes(1);
        expect(botMocks.handleVoiceChatCommand).toHaveBeenCalledTimes(1);
        expect(botMocks.handleJoinCommand).toHaveBeenCalledTimes(1);
        expect(botMocks.handleSpeakCommand).toHaveBeenCalledTimes(1);
        expect(botMocks.handleLeaveCommand).toHaveBeenCalledTimes(1);
    });
});