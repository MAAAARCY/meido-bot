# メイドBOT
## これは何？
- Discordでメイド(Gemini)とお喋りできるボットです
- こんなことができます
    - `/speak` : 指定したテキストを読み上げてくれます
    - `/chat` : テキストベースで会話ができます
    - `/voice_chat` : ボイスチャンネル内で会話ができます
## 設定
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

[使用音声]
&copy; VOICEVOX：冥鳴ひまり
