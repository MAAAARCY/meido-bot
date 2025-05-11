# メイドBOT
## これは何？
- Discordでメイド(Gemini)とお喋りできるボットです
- こんなことができます
    - `/speak` : 指定したテキストを読み上げてくれます
    - `/chat` : テキストベースで会話ができます
    - `/voice_chat` : ボイスチャンネル内で会話ができます
## セットアップ
- .envファイルを作成し以下のように設定してください
```
DISCORD_TOKEN = 'トークンを入力'
DISCORD_SERVER_ID = 'Botを導入したいサーバーのID(ローカル環境のみ使用)'
GEMINI_API_KEY = 'GEMINIのAPIキーを入力'
VOICEVOX_API_URL = 'VOICEVOXのサーバーURL(デフォルトはhttp://localhost:50021)'
```

- DISCORD_TOKENを取得する手順は以下のサイトから確認できます．
    - https://discord.com/developers/docs/quick-start/getting-started
    - YOUR_BOT_TOKENの設定のみ行ってください(YOUR_APP_ID, YOUR_PUBLIC_KEYは不要です)
    - DISCORD_TOKENはYOUR_BOT_TOKENの事を指しています

- GEMINI_API_KEYは以下のサイトから取得できます．
    - https://aistudio.google.com/prompts/new_chat

- 作成した.envファイルを`meido-bot`フォルダのルートに配置
- `meido-bot`フォルダ内で以下のコマンドを実行
```
npm init

npm install

npm run compile

npm run start
```

## 注意点
- node, npmの環境構築を先に済ませてください
- VOICEVOXが立ち上がっていない状態で`/voice_chat`を使用すると音声合成のタイミングでエラーになります(将来的にDockerに移行予定)

[使用音声]
&copy; VOICEVOX：冥鳴ひまり
