# CtoP

紙ベースのテキストを iPhone 経由で集積するためのシンプルな PWA メモアプリ。

- **公開 URL**: https://yucchiz.github.io/ctop/
- **コンセプト**: iOS 純正ライブテキスト + iOS ショートカットで OCR、PWA はフォルダ管理と編集に専念
- **データ**: 端末内ローカル（IndexedDB）のみ

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

## 実装計画

`IMPLEMENTATION_PLAN.md` を参照。
