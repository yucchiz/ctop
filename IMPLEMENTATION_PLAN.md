# CtoP (Collect to Personal) 実装計画

## プロジェクト概要

紙ベースのテキスト（ノート、書籍、書類）を iPhone 経由で OCR して集積し、将来の個人コンテキスト資産として活用するためのシンプルな PWA メモアプリ。iOS のホーム画面に追加してローカルアプリのように動作する。

### コンセプト
- **入力**: iPhone のカメラ + OS ネイティブ OCR（Apple Vision / ライブテキスト）経由で取得したテキスト
- **保存**: 端末内ローカルのみ（IndexedDB）
- **構造**: フォルダ単位の 1 大テキスト文書（フラット、案 A）
- **出力**: Markdown ファイルエクスポート

### 採用した方針 (v1)
- **OCR 戦略**: アプリ内で OCR は行わない。iOS 純正ライブテキストと iOS ショートカットを経由し、クリップボード/URL でテキストを受け取る
- **徹底的にシンプル**: フォルダ・編集・自動保存・Markdown エクスポート・クリップボード追記・ショートカット連携のみ

### 非目標 (v1 では作らない)
- アプリ内カメラ・画像 OCR（Tesseract.js 等）
- マルチデバイス同期・クラウド保存
- フォルダ内の複数ページ階層
- タグ・検索・ダークモード切替・フォント設定・画像保存

---

## 技術スタック

| 項目 | 採用 | 理由 |
|---|---|---|
| 言語 | TypeScript（strict） | 型安全、保守性 |
| ビルド | Vite | 高速、設定最小、PWA プラグインが強い |
| PWA | vite-plugin-pwa | manifest / SW 自動生成、Workbox ベース |
| ストレージ | IndexedDB（`idb`） | 大容量テキスト、永続化 |
| UI | バニラ TS + DOM API | 2 画面のみ、フレームワーク不要 |
| テスト | Vitest + fake-indexeddb | Vite ネイティブ、高速 |
| フォーマッタ | Prettier | 余計な議論を避ける |
| デプロイ | GitHub Pages + GitHub Actions | 自動 HTTPS、追加サービス不要、リポジトリと一体管理 |

---

## データモデル

```ts
interface Folder {
  id: string;          // crypto.randomUUID()
  name: string;        // ユーザー入力
  content: string;     // 大きなテキスト本体
  createdAt: number;   // Date.now()
  updatedAt: number;   // 自動保存時に更新
}
```

**IndexedDB**: `ctop-db` / store `folders` / keyPath `id` / index `updatedAt` (降順)
**localStorage**: `lastOpenedFolderId` （ショートカット経由追記時の既定フォルダ）

---

## ファイル構成（目標）

```
CtoP/
├── IMPLEMENTATION_PLAN.md
├── index.html
├── package.json / tsconfig.json / vite.config.ts
├── public/icons/                # PWA アイコン
├── src/
│   ├── main.ts                  # エントリ・ルーター
│   ├── types.ts
│   ├── styles.css
│   ├── db/storage.ts            # IndexedDB 操作
│   ├── ui/
│   │   ├── folderList.ts
│   │   ├── editor.ts
│   │   └── toast.ts
│   └── features/
│       ├── autosave.ts
│       ├── paste.ts
│       ├── shortcut.ts
│       └── exportMd.ts
├── shortcut/
│   └── install-guide.md         # iOS ショートカット配布手順・iCloud リンク
└── README.md
```

---

## ルーティング

ハッシュベース（`location.hash`）で画面遷移：
- `#/` → フォルダ一覧
- `#/folders/:id` → エディタ

起動時クエリ（解釈後に `history.replaceState` で削除）：
- `?from=shortcut` → ショートカット経由起動。クリップボード追記プロンプトを自動表示

---

## 既知のリスクと対策

| リスク | 対策 |
|---|---|
| iOS が PWA ストレージを eviction | `navigator.storage.persist()` 要求、最終エクスポートからの経過日数を UI で警告 |
| クリップボード API の許可拒否 | トーストで長押しペーストへフォールバックを案内 |
| 大容量 content での textarea 性能 | まずはネイティブ textarea で様子見、限界が見えたら仮想化を検討 |
| ショートカット配布物の管理 | `shortcut/install-guide.md` に作成手順と iCloud リンクを記載 |
| GitHub Pages のサブパス配信 | Vite `base: '/<repo>/'`、manifest `start_url`/`scope` を相対化、SW スコープも揃える |

---

## ステージ 1: プロジェクト初期化と PWA 骨組み

**目標**:
- Vite + TypeScript + vite-plugin-pwa + Prettier + Vitest のスキャフォールド
- manifest.webmanifest、Service Worker、iOS 用アイコン／メタタグを整備
- GitHub Pages のサブパス配信に対応（`vite.config.ts` の `base: '/<repo>/'`、manifest の `start_url`/`scope` を相対化）
- `npm run dev` / `npm run build` が通る最小画面

**成功基準**:
- `npm run build` が警告なしで成功
- `npm run dev` → ブラウザで PWA インストール候補として検出
- iOS Safari で「ホーム画面に追加」→ スタンドアロン起動
- 機内モードでも PWA が起動できる（SW キャッシュ）
- Lighthouse PWA 監査で致命的警告なし
- `dist/` 内のアセットが相対パスで参照され、サブパスでホストしても読み込める

**テスト**:
- `npm run build` 終了コード 0
- `dist/manifest.webmanifest` に `name`, `icons`, `start_url`, `display: standalone`
- `dist/index.html` に `apple-touch-icon`, `viewport-fit=cover`, `apple-mobile-web-app-capable`
- DevTools で SW 登録済みを確認

**ステータス**: 完了

### 確定した定数
- GitHub ユーザー名: `yucchiz`
- リポジトリ名: `ctop`
- 公開 URL: `https://yucchiz.github.io/ctop/`
- Vite `base`: `/ctop/`

### 完了時の注記
- Vite 6 と Vitest 2 の内部 Vite バージョン不一致を回避するため、Vitest 設定は `vitest.config.ts` に分離
- アイコンは `public/pwa-icon.svg` (C 文字) から `@vite-pwa/assets-generator` の minimal-2023 preset で生成

---

## ステージ 2: データレイヤー（IndexedDB + 自動保存）

**目標**:
- `src/db/storage.ts` に Folder CRUD
- `src/features/autosave.ts` に 500ms デバウンス自動保存
- `navigator.storage.persist()` で永続ストレージ要求
- 初回起動時にデフォルトフォルダ「メモ」を自動作成
- Vitest ユニットテスト

**成功基準**:
- `createFolder / getFolder / listFolders / updateFolder / deleteFolder` 動作
- `listFolders` は `updatedAt` 降順
- 自動保存が入力停止から 500ms 後に 1 回だけ走る
- リロード後に内容復元

**テスト**:
- `storage.test.ts`: CRUD 期待値（fake-indexeddb）
- `autosave.test.ts`: デバウンス挙動（vi.useFakeTimers）
- 手動: DevTools → IndexedDB で永続化確認

**ステータス**: 完了（11 テスト通過）

---

## ステージ 3: UI（フォルダ一覧 + エディタ）

**目標**:
- フォルダ一覧画面: 表示・作成・削除・名前変更
- エディタ画面: 大きな textarea、フォルダ名インライン編集、戻るボタン、保存インジケータ
- ハッシュルーティング
- iOS セーフエリア対応 CSS（`env(safe-area-inset-*)`）
- システムフォントスタック（日本語優先）

**成功基準**:
- 「新規フォルダ」作成で一覧に追加
- 項目タップで `#/folders/:id` へ遷移、textarea に content 読込
- textarea 入力 → 500ms 後自動保存、保存済みインジケータ表示
- 戻るで一覧へ、削除は確認ダイアログ経由
- iPhone 実機でホームインジケータと UI が重ならない
- 縦横どちらでも崩れない

**テスト**:
- Safari dev tools の iPhone シミュレートで全遷移
- 100,000 文字入力 → リロード → 完全復元
- 複数フォルダ → 更新日時降順で並ぶ

**ステータス**: 完了（ルーターのユニットテスト含め 15 テスト通過）

---

## ステージ 4: 📋 ペーストボタン

**目標**:
- エディタ画面右下に固定位置の「📋 ペースト」ボタン
- タップで `navigator.clipboard.readText()` → 末尾に追記 → 自動保存
- 既存末尾が改行でなければ改行を 1 つ挿入してから追記
- 成功／失敗／空クリップボードをトースト通知

**成功基準**:
- iOS Safari 初回タップで許可ダイアログ → 許可後に追記
- 拒否時: 「長押しペーストをご利用ください」トースト
- 空: 「クリップボードが空です」トースト
- 成功: 「N 文字を追記しました」トースト、`updatedAt` 更新

**テスト**:
- 実機: ライブテキストコピー → PWA 戻る → ボタンタップ → 追記
- ユニット: `paste.ts` の結合ロジック（改行挿入ルール）を純粋関数テスト
- 負: 空クリップボード、許可拒否のエラーパス

**ステータス**: 完了（paste.test.ts 6 テスト含め 21 テスト通過）

---

## ステージ 5: ショートカット受け口（`?from=shortcut`）

**目標**:
- 起動時 URL を解釈し `from=shortcut` を検出
- `lastOpenedFolderId` のフォルダを自動で開き、クリップボード追記プロンプトを即表示
- 最終フォルダが未設定／削除済みの場合は「追記先フォルダを選択」UI
- 処理後に `history.replaceState` で URL をクリーン

**成功基準**:
- `/?from=shortcut` で開くとプロンプトが自動表示
- 「追記」タップでクリップボードを末尾追記
- URL からパラメータが即消える（リロードで二重追記されない）
- 最終開フォルダが永続化される

**テスト**:
- 手動: `?from=shortcut` 付き URL で起動確認
- ユニット: URL パース関数、クリーンアップ処理
- エッジ: フォルダ 0 件での起動 → 新規作成フローに誘導

**ステータス**: 完了（shortcut.test.ts 4 テスト含め 25 テスト通過。Node 25 のネイティブ localStorage と jsdom の衝突を `src/test-setup.ts` のメモリポリフィルで回避）

---

## ステージ 6: Markdown エクスポート

**目標**:
- エディタ画面に「エクスポート」ボタン
- フォルダを `.md` としてダウンロード（または Web Share API 経由で共有シート）
- フロントマター: `title`, `createdAt`, `updatedAt`
- ファイル名: フォルダ名を安全な文字のみにサニタイズ

**成功基準**:
- 出力フォーマット:
  ```
  ---
  title: <name>
  createdAt: <ISO8601>
  updatedAt: <ISO8601>
  ---

  <content>
  ```
- ブラウザでダウンロード or iOS では共有シート
- 特殊文字（`/`, `:` など）は `-` に置換

**テスト**:
- ユニット: `exportMd.ts` が期待の文字列を返す
- 手動: 実機で実際にダウンロード／共有 → Markdown エディタで開いて確認

**ステータス**: 完了（exportMd.test.ts 7 テスト含め 32 テスト通過）

---

## ステージ 7: iOS ショートカットの作成と配布

**目標**:
- iPhone 実機で以下 4 アクションのショートカットを作成:
  1. **写真を撮る**（カメラロールに保存: **OFF**）
  2. **画像からテキストを抽出**（言語: 日本語）
  3. **クリップボードにコピー**
  4. **URL を開く**: `https://<user>.github.io/<repo>/?from=shortcut`
- iCloud 共有リンクを取得
- `shortcut/install-guide.md` に手順とリンクを記載

**成功基準**:
- 共有リンクで別端末／家族の iPhone から追加可能
- 実行 → カメラ → 撮影 → PWA 自動起動 → 追記プロンプト → 追記完了
- **写真アプリ（カメラロール）に画像が残らない**
- 5 連続実行でも安定

**テスト**:
- 実機エンドツーエンド
- 実行前後でカメラロールの枚数が変わらないことを確認
- iCloud 写真 ON でも画像が同期されないことを確認

**ステータス**: 手順書作成済（`shortcut/install-guide.md`）。実機での作成は Stage 8 デプロイ完了後にユーザーが実施

---

## ステージ 8: GitHub Pages デプロイと実機検証

**目標**:
- GitHub リポジトリをパブリックで作成（または既存リポジトリを使用）
- `.github/workflows/deploy.yml` を作成し、`main` への push で自動的に `actions/deploy-pages` を使ってデプロイ
- リポジトリの Settings → Pages で「GitHub Actions」をソースに設定
- 本番 URL で iPhone 実機にインストールし、ステージ 1–7 の全機能を E2E 確認
- Lighthouse PWA スコア確認

**成功基準**:
- `https://<user>.github.io/<repo>/` でアクセス可能（HTTPS 自動）
- 「ホーム画面に追加」でスタンドアロン起動
- 機内モードでも既存フォルダを開いて編集できる
- サブパス配下でも SW スコープと manifest が正しく動作（`start_url` に遷移できる）
- ショートカット経由で追記動作（ショートカット内 URL が本番 URL と一致）
- Markdown エクスポート動作
- Lighthouse PWA > 90

**テスト**:
- GitHub Actions のデプロイログ確認（ビルド成功、Pages への公開成功）
- 実機全機能ウォークスルー（チェックリスト方式）
- Lighthouse レポート保存

**ステータス**: ワークフローファイル作成済（`.github/workflows/deploy.yml`）。GitHub リポジトリ作成・push・Pages 有効化・実機検証はユーザー作業

---

## 完了処理

全ステージが「完了」になったら、CLAUDE.md の指示に従い本ファイル `IMPLEMENTATION_PLAN.md` を削除する（履歴は git log に残る）。
