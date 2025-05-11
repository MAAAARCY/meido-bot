import * as fs from 'node:fs/promises';
import { resolve } from 'node:path';
import 'dotenv/config'

// VoiceVoxのモデル
export class VoiceVoxModel {
    private readonly baseUrl: string;
    private readonly speakerId: number;
    private readonly audioDir: string;

    // コンストラクタ
    constructor(baseUrl: string = 'http://localhost:50021', speakerId: number = 14) {
        this.baseUrl = baseUrl;
        this.speakerId = speakerId;
        this.audioDir = './audio';
        this.ensureAudioDirExists();
    }

    // 音声ディレクトリの作成
    private async ensureAudioDirExists(): Promise<void> {
        try {
            await fs.mkdir(this.audioDir, { recursive: true });
        } catch (error) {
            console.error('音声ディレクトリの作成に失敗しました:', error);
        }
    }

    // テキストを音声クエリに変換
    private async createAudioQuery(text: string): Promise<Record<string, unknown>> {
        const queryResponse = await fetch(
            `${this.baseUrl}/audio_query?speaker=${this.speakerId}&text=${encodeURIComponent(text)}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )

        if (!queryResponse.ok) {
            throw new Error('音声クエリの取得に失敗しました');
        }

        return queryResponse.json();
    }

    // 音声クエリから音声を生成
    private async synthesizeAudio(query: Record<string, unknown>): Promise<ArrayBuffer> {
        const synthesisResponse = await fetch(
            `${this.baseUrl}/synthesis?speaker=${this.speakerId}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(query),
            }
        )

        if (!synthesisResponse.ok) {
            throw new Error('音声合成に失敗しました');
        }

        return synthesisResponse.arrayBuffer();
    }

    // 音声をファイルに保存
    private async saveAudioToFile(audioBuffer: ArrayBuffer): Promise<string> {
        const buffer = Buffer.from(audioBuffer);
        const absoluteOutputPath = resolve(this.audioDir, `voice_${Date.now()}.wav`);
        await fs.writeFile(absoluteOutputPath, buffer);
        return absoluteOutputPath;
    }

    // 音声ファイルのパスを取得
    public async getAudioFilePath(text: string): Promise<string> {
        try {
            // テキストを音声クエリに変換
            const queryResponse = await this.createAudioQuery(text);

            // 音声クエリから音声を生成
            const synthesisResponse = await this.synthesizeAudio(queryResponse);

            // 音声ファイルを保存
            const filePath = await this.saveAudioToFile(synthesisResponse);

            console.log(`音声ファイルを保存しました: ${filePath}`);
            return filePath;
        } catch (error) {
            console.error('音声合成エラー:', error);
            throw error;
        }
    }

    // 音声ファイルの削除
    public async cleanup(filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error('ファイル削除エラー:', error);
        }
    }
} 