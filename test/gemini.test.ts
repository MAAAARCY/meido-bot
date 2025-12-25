import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiModel } from '../src/gemini';

const mockGenerateContent = vi.fn();

vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: class {
        getGenerativeModel() {
            return {
                generateContent: mockGenerateContent,
            };
        }
    },
}));

describe('GeminiModel', () => {
    let geminiModel: GeminiModel;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.GEMINI_API_KEY = 'test-api-key';
        geminiModel = new GeminiModel();
    });

    describe('getGeminiResponse', () => {
        it('正常なレスポンスを返す', async () => {
            const mockResponse = {
                response: {
                    text: () => JSON.stringify({ response: 'ご主人様、こんにちは！' })
                }
            };

            mockGenerateContent.mockResolvedValue(mockResponse);

            const result = await geminiModel.getGeminiResponse('こんにちは');

            expect(result).toBe('ご主人様、こんにちは！');
            expect(mockGenerateContent).toHaveBeenCalledWith([
                'あなたは親切なメイドAIです。以下の会話に日本語で返答してください。二人称は常にご主人様でお願いします。会話内容:こんにちは'
            ]);
        });

        it('responseがnullの場合、エラーメッセージを返す', async () => {
            const mockResponse = {
                response: {
                    text: () => JSON.stringify({ response: null })
                }
            };

            mockGenerateContent.mockResolvedValue(mockResponse);

            const result = await geminiModel.getGeminiResponse('テスト');

            expect(result).toBe('エラーが発生しました。');
        });

        it('JSONパースエラーが発生した場合、例外をスローする', async () => {
            const mockResponse = {
                response: {
                    text: () => 'invalid json'
                }
            };

            mockGenerateContent.mockResolvedValue(mockResponse);

            await expect(geminiModel.getGeminiResponse('テスト')).rejects.toThrow();
        });

        it('API呼び出しが失敗した場合、例外をスローする', async () => {
            mockGenerateContent.mockRejectedValue(new Error('API Error'));

            await expect(geminiModel.getGeminiResponse('テスト')).rejects.toThrow('API Error');
        });
    });
});
