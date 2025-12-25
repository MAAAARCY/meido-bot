import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioPlayerModel } from '../src/audioPlayer';
import type { VoiceConnection } from '@discordjs/voice';

// VoiceVoxModelをモック
const mockGetAudioFilePath = vi.fn();
const mockCleanup = vi.fn();

vi.mock('../src/voicevox', () => ({
  VoiceVoxModel: class {
    getAudioFilePath = mockGetAudioFilePath;
    cleanup = mockCleanup;
  },
}));

// @discordjs/voiceをモック
const mockPlay = vi.fn();
const mockOn = vi.fn();
const mockSubscribe = vi.fn();

vi.mock('@discordjs/voice', () => ({
  createAudioPlayer: vi.fn(() => ({
    play: mockPlay,
    on: mockOn,
  })),
  createAudioResource: vi.fn((path) => ({ path })),
  AudioPlayerStatus: {
    Idle: 'Idle',
  },
}));

describe('AudioPlayerModel', () => {
    let audioPlayer: AudioPlayerModel;
    let mockConnection: VoiceConnection;
    let consoleLogSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // console.logをモック化
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        
        mockGetAudioFilePath.mockResolvedValue('/tmp/test.wav');
        mockCleanup.mockResolvedValue(undefined);
        
        audioPlayer = new AudioPlayerModel();
        mockConnection = {
            subscribe: mockSubscribe,
        } as any;
    });

    describe('textToSpeech', () => {
        it('テキストを音声に変換して再生する', async () => {
            await audioPlayer.textToSpeech('こんにちは', mockConnection);

            expect(mockGetAudioFilePath).toHaveBeenCalledWith('こんにちは');
            expect(mockSubscribe).toHaveBeenCalled();
            expect(mockPlay).toHaveBeenCalled();
        });

        it('再生終了時にクリーンアップが実行される', async () => {
            mockOn.mockImplementation((event, callback) => {
                if (event === 'Idle') {
                    setTimeout(() => callback(), 0);
                }
            });

            await audioPlayer.textToSpeech('こんにちは', mockConnection);
            
            await new Promise(resolve => setTimeout(resolve, 10));
            
            expect(mockCleanup).toHaveBeenCalledWith('/tmp/test.wav');
            expect(consoleLogSpy).toHaveBeenCalledWith('音声再生が終了しました');
        });

        it('音声ファイルの取得に失敗した場合、エラーがスローされる', async () => {
            mockGetAudioFilePath.mockRejectedValue(new Error('VoiceVox API error'));

            await expect(audioPlayer.textToSpeech('こんにちは', mockConnection))
                .rejects.toThrow('VoiceVox API error');
        });
    });
});
