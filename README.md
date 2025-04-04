# ProductHunt Japan RSS 翻訳システム

## 概要
ProductHuntのRSSフィードを取得し、OpenAI APIを使用して日本語に翻訳し、Slackに投稿する自動化システムです。

## 技術スタック
- Google Apps Script (GAS)
- clasp (GASの開発・デプロイツール)
- OpenAI API
- Slack API

## 機能要件

### 1. RSSフィード取得機能
- ProductHuntのRSSフィードを定期的に取得
- 取得間隔: 1日1回（午前9時）
- 取得する情報:
  - プロダクト名
  - 説明文
  - 投稿日時
  - リンクURL
  - タグ情報

### 2. 翻訳機能
- OpenAI APIを使用して英語から日本語への翻訳
- 翻訳対象:
  - プロダクト名
  - 説明文
- 翻訳品質の維持のため、プロンプトエンジニアリングを実施

### 3. Slack投稿機能
- 翻訳済みの情報をSlackチャンネルに投稿
- 投稿フォーマット:
  ```
  🚀 新着プロダクト: [翻訳済みプロダクト名]
  
  [翻訳済み説明文]
  
  🔗 リンク: [元のURL]
  📅 投稿日時: [投稿日時]
  🏷️ タグ: [タグ情報]
  ```

## 非機能要件

### 1. セキュリティ
- APIキーはスクリプトプロパティで管理
- エラーハンドリングの実装
- レート制限への対応

### 2. 運用
- ログ機能の実装
- エラー通知の設定
- 定期実行の監視

### 3. 保守性
- コードのモジュール化
- コメントの充実
- 設定値の外部化

## 開発環境
- claspを使用したローカル開発
- テスト環境の構築
- デプロイメントプロセスの確立

## 今後の拡張性
- 翻訳品質の改善
- 投稿フォーマットのカスタマイズ
- 複数言語対応
- ユーザー設定機能の追加

