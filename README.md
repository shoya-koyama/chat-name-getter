# Google Chat Name Getter

Google Chat スペースのメッセージから `span class="nzVtF"` の `data-name` 属性を抽出するChrome拡張機能です。

## 機能

- 🔍 Google Chat の最新10件のメッセージをスキャン
- 📋 `span class="nzVtF"` 要素から `data-name` 属性を抽出
- 📌 ポップアップに一覧表示
- 📋 抽出したデータをクリップボードにコピー
- 🔄 更新ボタンで再スキャン

## インストール方法

### Chrome/Edge

1. このフォルダを開く
2. Chrome（または Edge）で `chrome://extensions/` を開く
3. 「デベロッパー モード」をONにする（右上）
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. このフォルダを選択

### インストール後

1. Google Chat（https://chat.google.com）を開く
2. 拡張機能アイコンをクリック
3. 抽出されたデータがポップアップに表示されます

## 使い方

1. **自動取得**: ポップアップを開くと自動的に最新10件のメッセージをスキャン
2. **更新**: 「更新」ボタンをクリックして再スキャン
3. **コピー**: 「コピー」ボタンですべてのデータをコピー

## ファイル構成

- `manifest.json` - 拡張機能の設定
- `popup.html` - ポップアップのUI
- `popup.js` - ポップアップのロジック
- `content.js` - Google Chat ページで実行されるスクリプト

## トラブルシューティング

### データが表示されない場合

1. Google Chat ページをリロード
2. ポップアップの「更新」ボタンをクリック
3. ブラウザの開発者ツール（F12）→ Console でエラーを確認

### 拡張機能が反応しない場合

1. `chrome://extensions/` で拡張機能が有効か確認
2. Google Chat ページをリロード
3. 拡張機能を無効にしてから再度有効に

## 注意事項

- この拡張機能は Google Chat の DOM 構造に依存しています
- Google Chat の UI 更新により、セレクタが変わる可能性があります
- その場合は `content.js` の `span.nzVtF` セレクタを更新してください

## 技術詳細

- **Manifest Version**: 3（最新）
- **対応ブラウザ**: Chrome, Edge, その他Chromium系ブラウザ
- **権限**: スクリプト実行（content script）、アクティブタブの読取
# chat-name-getter
