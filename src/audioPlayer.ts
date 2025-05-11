import { VoiceVoxModel } from "./voicevox";
import { createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnection } from '@discordjs/voice';


export class AudioPlayerModel {
    private readonly voiceVoxModel: VoiceVoxModel;

    constructor() {
        this.voiceVoxModel = new VoiceVoxModel();
    }

    public async textToSpeech(text: string, connection: VoiceConnection): Promise<void> {
        // 音声プレイヤーの作成
        const player = createAudioPlayer();
        connection.subscribe(player);

        const audioPath = await this.getAudioFilePath(text);
        const resource = createAudioResource(audioPath);

        player.play(resource);

        // 再生終了時の処理
        player.on(AudioPlayerStatus.Idle, async () => {
            console.log('音声再生が終了しました');
            await this.cleanup(audioPath);
        });
    }

    private async getAudioFilePath(text: string): Promise<string> {
        return await this.voiceVoxModel.getAudioFilePath(text);
    }

    private async cleanup(filePath: string): Promise<void> {
        await this.voiceVoxModel.cleanup(filePath);
    }
}