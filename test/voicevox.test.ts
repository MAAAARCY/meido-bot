import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VoiceVoxModel } from '../src/voicevox';
import * as fs from 'node:fs/promises';

// fsモジュールをモック
vi.mock('node:fs/promises');

// global fetchをモック
global.fetch = vi.fn();

describe('VoiceVoxModel', () => {
    let voiceVox: VoiceVoxModel;
    const mockBaseUrl = 'http://localhost:50021';
    const mockSpeakerId = 14;
    let consoleLogSpy: any;
    let consoleErrorSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // console出力をモック化
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        vi.mocked(fs.mkdir).mockResolvedValue(undefined);
        voiceVox = new VoiceVoxModel(mockBaseUrl, mockSpeakerId);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('デフォルトパラメータで初期化できる', () => {
            const defaultVoiceVox = new VoiceVoxModel();
            expect(defaultVoiceVox).toBeInstanceOf(VoiceVoxModel);
        });

        it('音声ディレクトリの作成を試みる', () => {
            expect(fs.mkdir).toHaveBeenCalledWith('./audio', { recursive: true });
        });
    });

    describe('getAudioFilePath', () => {
        it('正常に音声ファイルパスを取得できる', async () => {
            const mockText = 'こんにちは';
            const mockQuery = { accent_phrases: [], speedScale: 1.0 };
            const mockAudioBuffer = new ArrayBuffer(1024);

            // audio_query APIのモック
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => mockQuery
            } as Response);

            // synthesis APIのモック
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => mockAudioBuffer
            } as Response);

            // ファイル書き込みのモック
            vi.mocked(fs.writeFile).mockResolvedValue(undefined);

            const result = await voiceVox.getAudioFilePath(mockText);

            expect(result).toMatch(/^.*\/audio\/voice_\d+\.wav$/);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('音声ファイルを保存しました'));
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(fetch).toHaveBeenNthCalledWith(
                1,
                `${mockBaseUrl}/audio_query?speaker=${mockSpeakerId}&text=${encodeURIComponent(mockText)}`,
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
            );
            expect(fetch).toHaveBeenNthCalledWith(
                2,
                `${mockBaseUrl}/synthesis?speaker=${mockSpeakerId}`,
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(mockQuery)
                })
            );
        });

        it('音声クエリの取得に失敗した場合、エラーをスローする', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 500
            } as Response);

            await expect(voiceVox.getAudioFilePath('テスト')).rejects.toThrow('音声クエリの取得に失敗しました');
            expect(consoleErrorSpy).toHaveBeenCalledWith('音声合成エラー:', expect.any(Error));
        });

        it('音声合成に失敗した場合、エラーをスローする', async () => {
            const mockQuery = { accent_phrases: [] };

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => mockQuery
            } as Response);

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 500
            } as Response);

            await expect(voiceVox.getAudioFilePath('テスト')).rejects.toThrow('音声合成に失敗しました');
            expect(consoleErrorSpy).toHaveBeenCalledWith('音声合成エラー:', expect.any(Error));
        });
    });

    describe('cleanup', () => {
        it('音声ファイルを削除できる', async () => {
            const filePath = '/path/to/audio/voice_123.wav';
            vi.mocked(fs.unlink).mockResolvedValue(undefined);

            await voiceVox.cleanup(filePath);

            expect(fs.unlink).toHaveBeenCalledWith(filePath);
        });

        it('ファイル削除に失敗してもエラーをスローしない', async () => {
            const filePath = '/path/to/audio/voice_123.wav';
            vi.mocked(fs.unlink).mockRejectedValue(new Error('File not found'));

            await expect(voiceVox.cleanup(filePath)).resolves.not.toThrow();
            expect(consoleErrorSpy).toHaveBeenCalledWith('ファイル削除エラー:', expect.any(Error));
        });
    });
});
