# Product Hunt 日本語RSS再配信アプリ

このアプリは、Product Huntの最新情報（RSS）を取得し、Google翻訳で日本語に翻訳した上で、独自のRSSフィードとして再配信します。

## 使い方

1. 必要なパッケージをインストール
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```
2. アプリを起動
    ```bash
    python app.py
    ```
3. ブラウザで `http://localhost:5000/rss-ja` にアクセスすると、日本語に翻訳されたProduct HuntのRSSフィードが取得できます。

## 必要なパッケージ
- Flask
- feedparser
- googletrans==4.0.0-rc1

## 注意
- Google翻訳APIの無料枠を利用しているため、翻訳回数が多いと制限される場合があります。
- 本アプリは学習・個人利用目的です。

