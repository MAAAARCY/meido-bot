import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiscordBot } from '../src/discordBot';

const mockCheckVoiceChannel = vi.fn();
const mockTextToSpeech = vi.fn();
const mockGetGeminiResponse = vi.fn();

vi.mock('../src/validation', () => ({
    ValidationModel: class {
        checkVoiceChannel = mockCheckVoiceChannel;
    },
}));

vi.mock('../src/audioPlayer', () => ({
    AudioPlayerModel: class {
        textToSpeech = mockTextToSpeech;
    },
}));

vi.mock('../src/gemini', () => ({
    GeminiModel: class {
        getGeminiResponse = mockGetGeminiResponse;
    },
}));

vi.mock('@discordjs/voice', () => ({
    joinVoiceChannel: vi.fn(() => ({
        destroy: vi.fn(),
        subscribe: vi.fn(),
    })),
    entersState: vi.fn(),
    VoiceConnectionStatus: {
        Ready: 'Ready',
    },
}));

describe('DiscordBot', () => {
    let discordBot: DiscordBot;
    let mockInteraction: any;
    let consoleErrorSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // console.errorをモック化してテスト出力を抑制
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        discordBot = new DiscordBot();
        
        mockInteraction = {
            options: {
                get: vi.fn((_key: string) => ({ value: 'テストテキスト' })),
                getString: vi.fn((_key: string) => 'テストテキスト'),
            },
            reply: vi.fn(),
            user: { id: 'user123' },
            guildId: 'guild123',
            guild: {
                members: {
                    cache: {
                        get: vi.fn(() => ({
                            voice: {
                                channel: { id: 'voice123', name: 'テストチャンネル' },
                            },
                        })),
                    },
                },
                voiceAdapterCreator: vi.fn(),
            },
        };
    });

    describe('handleChatCommand', () => {
        it('チャットコマンドを正常に処理する', async () => {
            mockGetGeminiResponse.mockResolvedValue('こんにちは！');

            await discordBot.handleChatCommand(mockInteraction);

            expect(mockGetGeminiResponse).toHaveBeenCalledWith('テストテキスト');
            expect(mockInteraction.reply).toHaveBeenCalledWith('こんにちは！');
        });
    });

    describe('handleVoiceChatCommand', () => {
        it('ボイスチャットコマンドを正常に処理する', async () => {
            mockCheckVoiceChannel.mockResolvedValue(true);
            mockGetGeminiResponse.mockResolvedValue('こんにちは！');
            mockTextToSpeech.mockResolvedValue(undefined);

            await discordBot.handleVoiceChatCommand(mockInteraction);

            expect(mockCheckVoiceChannel).toHaveBeenCalledWith(mockInteraction);
            expect(mockGetGeminiResponse).toHaveBeenCalledWith('テストテキスト');
            expect(mockTextToSpeech).toHaveBeenCalledWith('こんにちは！', expect.anything());
        });

        it('ボイスチャンネルに参加していない場合、処理を中断する', async () => {
            mockCheckVoiceChannel.mockResolvedValue(false);

            await discordBot.handleVoiceChatCommand(mockInteraction);

            expect(mockGetGeminiResponse).not.toHaveBeenCalled();
        });

        it('エラーが発生した場合、エラーメッセージを返す', async () => {
            mockCheckVoiceChannel.mockResolvedValue(true);
            mockGetGeminiResponse.mockResolvedValue('こんにちは！');
            mockTextToSpeech.mockRejectedValue(new Error('Audio error'));

            await discordBot.handleVoiceChatCommand(mockInteraction);

            expect(mockInteraction.reply).toHaveBeenCalledWith('音声再生中にエラーが発生しました。');
            expect(consoleErrorSpy).toHaveBeenCalledWith('音声チャット中にエラーが発生しました:', expect.any(Error));
        });
    });

    describe('handleJoinCommand', () => {
        it('ボイスチャンネルに正常に参加する', async () => {
            mockCheckVoiceChannel.mockResolvedValue(true);

            await discordBot.handleJoinCommand(mockInteraction);

            expect(mockInteraction.reply).toHaveBeenCalledWith('テストチャンネル に参加しました！');
        });

        it('ボイスチャンネルに参加していない場合、処理を中断する', async () => {
            mockCheckVoiceChannel.mockResolvedValue(false);

            await discordBot.handleJoinCommand(mockInteraction);

            expect(mockCheckVoiceChannel).toHaveBeenCalled();
        });

        it('参加中にエラーが発生した場合、エラーメッセージを返す', async () => {
            mockCheckVoiceChannel.mockResolvedValue(true);
            // guildをnullにしてエラーを発生させる
            const errorInteraction = { ...mockInteraction, guild: null };

            await discordBot.handleJoinCommand(errorInteraction);

            expect(errorInteraction.reply).toHaveBeenCalledWith('ボイスチャンネルへの参加中にエラーが発生しました。');
            expect(consoleErrorSpy).toHaveBeenCalledWith('ボイスチャンネル参加中にエラーが発生しました:', expect.any(Error));
        });
    });

    describe('handleSpeakCommand', () => {
        it('テキストを正常に読み上げる', async () => {
            mockCheckVoiceChannel.mockResolvedValue(true);
            mockTextToSpeech.mockResolvedValue(undefined);

            await discordBot.handleSpeakCommand(mockInteraction);

            expect(mockTextToSpeech).toHaveBeenCalledWith('テストテキスト', expect.anything());
        });

        it('ボイスチャンネルに参加していない場合、処理を中断する', async () => {
            mockCheckVoiceChannel.mockResolvedValue(false);

            await discordBot.handleSpeakCommand(mockInteraction);

            expect(mockTextToSpeech).not.toHaveBeenCalled();
        });

        it('エラーが発生した場合、エラーメッセージを返す', async () => {
            mockCheckVoiceChannel.mockResolvedValue(true);
            mockTextToSpeech.mockRejectedValue(new Error('Audio error'));

            await discordBot.handleSpeakCommand(mockInteraction);

            expect(mockInteraction.reply).toHaveBeenCalledWith('音声再生中にエラーが発生しました。');
            expect(consoleErrorSpy).toHaveBeenCalledWith('音声再生中にエラーが発生しました:', expect.any(Error));
        });
    });

    describe('handleLeaveCommand', () => {
        it('ボイスチャンネルから正常に退出する', async () => {
            await discordBot.handleLeaveCommand(mockInteraction);

            expect(mockInteraction.reply).toHaveBeenCalledWith('ボイスチャンネルから退出しました。');
        });

        it('サーバー内でない場合、エラーメッセージを返す', async () => {
            const mockInteractionWithoutGuild = { ...mockInteraction, guild: null };

            await discordBot.handleLeaveCommand(mockInteractionWithoutGuild);

            expect(mockInteractionWithoutGuild.reply).toHaveBeenCalledWith('サーバー内でのみ使用できるコマンドです。');
        });
    });

    describe('createVoiceConnection', () => {
        it('ボイス接続を作成する', () => {
            const connection = discordBot.createVoiceConnection(mockInteraction);

            expect(connection).toBeDefined();
        });
    });
});
