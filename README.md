# メイドBOT
## これは何？
- Discordでメイド(Gemini)とお喋りできるボット
- 利用可能コマンド
    - `/speak` : 指定したテキストの読み上げるコマンド
    - `/chat` : テキストベースで会話するコマンド
    - `/voice_chat` : ボイスチャンネル内で会話ができるコマンド
## セットアップ
### Dockerの設定（直接VOICEVOXを立ち上げる場合は必要なし）
- Dockerの環境構築（[公式ドキュメント](https://docs.docker.com/engine/install/ubuntu/)）
- ※WSL版のDockerでgpuを使用する場合は[Nvidia Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)の設定も実施
    - [Configure Docker](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#:~:text=NVIDIA%20Container%20Toolkit.-,Configuring%20Docker,-%23)に詳しい設定方法が記載されている
    - この設定を行わないと下記のようなエラーがでる可能性がある
```shell
Error response from daemon: could not select device driver "" with capabilities: [[gpu]].
```

- voicevox_engineを`docker pull`して`docker run`を実行
```shell
# CPU版
docker pull voicevox/voicevox_engine:cpu-ubuntu20.04-latest
docker run --rm -it -p '127.0.0.1:50021:50021' voicevox/voicevox_engine:cpu-ubuntu20.04-latest
# GPU版
docker pull voicevox/voicevox_engine:nvidia-ubuntu20.04-latest
docker run --rm --gpus all -p '127.0.0.1:50021:50021' voicevox/voicevox_engine:nvidia-ubuntu20.04-latest
```
- ここまで何もエラーが無ければ、[VOICEVOX API](http://localhost:50021)が起動する

### Discord BOTの設定
- [Node.js](https://nodejs.org/ja/download)をダウンロード
- [DiscordDeveloperPortal](https://discord.com/developers/docs/quick-start/getting-started)の`Create App`から`meido-bot`を作成
- 作成した`meido-bot`をサーバーに招待

- .envファイルを以下の構成で設定
    - DISCORD_TOKENは[DiscordDeveloperPortal](https://discord.com/developers/docs/quick-start/getting-started)から取得
        - YOUR_BOT_TOKENのみ設定(YOUR_APP_ID, YOUR_PUBLIC_KEYは不要)
        - DISCORD_TOKENはYOUR_BOT_TOKENの事を指す

    - GEMINI_API_KEYは[ここ](https://aistudio.google.com/prompts/new_chat)から取得
```
DISCORD_TOKEN = 'トークンを入力'
DISCORD_SERVER_ID = 'Botを導入したいサーバーのID(ローカル環境のみ使用)'
GEMINI_API_KEY = 'GEMINIのAPIキーを入力'
VOICEVOX_API_URL = 'VOICEVOXのサーバーURL(デフォルトはhttp://localhost:50021)'
```
- 作成した.envファイルを`src`フォルダより上の階層(ルート)に配置
- 下記のコマンドを実行
```shell
npm init
npm install
npm run compile
npm run start
```
- `meido-bot`がオンラインになれば成功

## 注意点
- VOICEVOX APIが立ち上がっていない状態で`/voice_chat`または`/speak`を使用すると音声合成のタイミングでエラーになる

[使用音声]
&copy; VOICEVOX：冥鳴ひまり
