# CtoP

紙ベースのテキストを iPhone に貯めていくためのシンプルな PWA メモアプリ。

- **公開 URL**: https://yucchiz.github.io/ctop/
- **使い方**:
  1. iOS 純正のライブテキストで紙面からテキストをコピー
  2. CtoP を開き、📋 ボタンでクリップボードから追記
  3. フォルダ単位でひたすら貯めていく
- **データ**: 端末内ローカル（IndexedDB）のみ。クラウド同期なし。
- **エクスポート**: ヘッダー右上の ⬇ から Markdown で書き出し可能

## 開発

```sh
npm install
npm run dev
```

## ビルド

```sh
npm run build
npm run preview
```

## テスト

```sh
npm run test
```

## アイコン再生成

`public/pwa-icon.svg` を編集後:

```sh
npm run generate-icons
```
