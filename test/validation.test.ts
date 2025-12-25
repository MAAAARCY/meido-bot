import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationModel } from '../src/validation';
import { CommandInteraction } from 'discord.js';

describe('ValidationModel', () => {
    let validation: ValidationModel;
    let mockInteraction: any;

    beforeEach(() => {
        validation = new ValidationModel();
        mockInteraction = {
            reply: vi.fn().mockResolvedValue(undefined),
            guild: {
                members: {
                    cache: new Map()
                }
            },
            user: {
                id: 'test-user-id'
            }
        };
    });

    describe('checkVoiceChannel', () => {
        it('ユーザーがボイスチャンネルに参加している場合、trueを返す', async () => {
            const mockMember = {
                voice: {
                    channel: {
                        id: 'test-channel-id',
                        name: 'test-channel'
                    }
                }
            };

            mockInteraction.guild.members.cache.set('test-user-id', mockMember);

            const result = await validation.checkVoiceChannel(mockInteraction);

            expect(result).toBe(true);
            expect(mockInteraction.reply).not.toHaveBeenCalled();
        });

        it('ユーザーがボイスチャンネルに参加していない場合、falseを返してメッセージを送信', async () => {
            const mockMember = {
                voice: {
                    channel: null
                }
            };

            mockInteraction.guild.members.cache.set('test-user-id', mockMember);

            const result = await validation.checkVoiceChannel(mockInteraction);

            expect(result).toBe(false);
            expect(mockInteraction.reply).toHaveBeenCalledWith('先にボイスチャンネルに参加してください！');
        });

        it('メンバー情報が取得できない場合、falseを返してメッセージを送信', async () => {
            const result = await validation.checkVoiceChannel(mockInteraction);

            expect(result).toBe(false);
            expect(mockInteraction.reply).toHaveBeenCalledWith('先にボイスチャンネルに参加してください！');
        });
    });
});
