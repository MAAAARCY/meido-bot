# メイドBOT
## これは何？
- Discordでメイド(Gemini)とお喋りできるボットです
- こんなことができます
    - `/speak` : 指定したテキストを読み上げてくれます
    - `/chat` : テキストベースで会話ができます
    - `/voice_chat` : ボイスチャンネル内で会話ができます
## セットアップ
### Dockerの設定（直接VOICEVOXを立ち上げる場合は必要なし）
- Dockerの環境構築をします（[公式ドキュメント](https://docs.docker.com/engine/install/ubuntu/)）
- ※WSL版のDockerでgpuを使用する場合は[Nvidia Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)の設定も行います
    - [Configure Docker](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#:~:text=NVIDIA%20Container%20Toolkit.-,Configuring%20Docker,-%23)に詳しい設定方法が書いてあります
    - この設定を行わないと下記のようなエラーがでる可能性があります
```shell
Error response from daemon: could not select device driver "" with capabilities: [[gpu]].
```

- voicevox_engineを`docker pull`して`docker run`してください
```shell
# CPU版
docker pull voicevox/voicevox_engine:cpu-ubuntu20.04-latest
docker run --rm -it -p '127.0.0.1:50021:50021' voicevox/voicevox_engine:cpu-ubuntu20.04-latest
# GPU版
docker pull voicevox/voicevox_engine:nvidia-ubuntu20.04-latest
docker run --rm --gpus all -p '127.0.0.1:50021:50021' voicevox/voicevox_engine:nvidia-ubuntu20.04-latest
```
- ここまで何もエラーが無ければ、[VOICEVOX API](http://localhost:50021)が起動します！

### Discord BOTの設定
- [Node.js](https://nodejs.org/ja/download)をダウンロードします
- [DiscordDeveloperPortal](https://discord.com/developers/docs/quick-start/getting-started)の`Create App`から`meido-bot`を作成します
- 作成した`meido-bot`をサーバーに招待します

- .envファイルを作成する
    - DISCORD_TOKENは[DiscordDeveloperPortal](https://discord.com/developers/docs/quick-start/getting-started)から取得できます
        - YOUR_BOT_TOKENの設定のみ行ってください(YOUR_APP_ID, YOUR_PUBLIC_KEYは不要です)
        - DISCORD_TOKENはYOUR_BOT_TOKENの事を指しています

    - GEMINI_API_KEYは[ここ](https://aistudio.google.com/prompts/new_chat)から取得できます
```
DISCORD_TOKEN = 'トークンを入力'
DISCORD_SERVER_ID = 'Botを導入したいサーバーのID(ローカル環境のみ使用)'
GEMINI_API_KEY = 'GEMINIのAPIキーを入力'
VOICEVOX_API_URL = 'VOICEVOXのサーバーURL(デフォルトはhttp://localhost:50021)'
```
- 作成した.envファイルを`src`フォルダより上の階層(ルート)に配置します
- 下記のコマンドを実行します
```shell
npm init
npm install
npm run compile
npm run start
```
- `meido-bot`がオンラインになれば成功です！

## 注意点
- VOICEVOX APIが立ち上がっていない状態で`/voice_chat`または`/speak`を使用すると音声合成のタイミングでエラーになります

[使用音声]
&copy; VOICEVOX：冥鳴ひまり
