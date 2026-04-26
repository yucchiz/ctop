# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run dev              # Vite dev server (PWA enabled in dev via VitePWA devOptions)
npm run build            # Production build into dist/
npm run preview          # Serve the built dist/
npm run test             # Vitest in watch mode
npm run test:run         # Vitest single run (used by CI)
npm run typecheck        # tsc --noEmit (strict)
npm run format           # Prettier on the whole repo
npm run generate-icons   # Regenerate PWA icons from public/pwa-icon.svg
```

Run a single test file: `npx vitest run src/features/autosave.test.ts`
Run a single test by name: `npx vitest run -t "appendWithNewline"`

CI (`.github/workflows/deploy.yml`) runs `typecheck` → `test:run` → `build` on push to `main`/`master` and deploys `dist/` to GitHub Pages. A failing typecheck or test blocks deploy.

## Architecture

CtoP is a single-page PWA written in plain TypeScript + Vite (no UI framework). The runtime model is intentionally tiny: one IndexedDB object store, hash-based routing between two screens, and direct DOM rendering from `innerHTML` templates.

### Data model — folders are notes

There is **no nested note structure**. A `Folder` (`src/types.ts`) carries a single `content` string; the editor screen edits that string directly. The folder list is just `listFolders()` sorted by `updatedAt` desc. Adding "notes inside folders" would be a model change, not just a UI change.

### Storage layer (`src/db/storage.ts`)

- `idb`-wrapped IndexedDB, DB name `ctop-db`, single store `folders`, index `by-updatedAt`.
- `dbPromise` is module-level and lazy. Tests must call `_resetDBForTests()` and reassign `globalThis.indexedDB` (see `storage.test.ts`) — `vitest.config.ts`'s setup file does **not** install `fake-indexeddb` globally; only `localStorage` is shimmed there. Each storage test imports `fake-indexeddb/auto` itself.
- `requestPersistence()` is fired once on boot from `main.ts`; failure is swallowed.

### Routing (`src/ui/router.ts` + `src/main.ts`)

Hash routes only: `#/` → folder list, `#/folders/:id` → editor. `main.ts` keeps a single `activeEditor` handle and calls `dispose()` on every route change so editor-bound listeners (input, beforeunload, visualViewport) are cleaned up. When adding a new screen, follow the same `EditorHandle { dispose }` pattern.

### Editor screen (`src/ui/editor.ts`)

The editor wires together three independent concerns:

1. **Autosave** (`src/features/autosave.ts`): 500ms debounce, status state machine `idle → pending → saving → saved | error`. `flush()` is called on back navigation, export, `beforeunload`, and `dispose()` to guarantee no lost edits. The `inflight` promise is awaited so a flush during a save resolves only after the save completes.
2. **Clipboard paste** (`src/features/paste.ts`): `readClipboard()` returns a tagged result (`ok | empty | denied | unsupported | error`) so the UI can show the right toast. `appendWithNewline` is the only place that owns the "insert `\n` between existing and incoming" rule.
3. **Keyboard inset tracker** (`src/ui/keyboardInset.ts`): writes `--kb-inset` and `--kb-extra` CSS variables from `visualViewport`. The FAB `bottom` formula in `styles.css` (`.fab-paste`) consumes both vars to sit above the iOS keyboard accessory bar. If you change the FAB position, keep both vars in the calc — the accessory bar height is **not** included in `visualViewport.height` on iOS Safari, hence `--kb-extra`.

### Export (`src/features/exportMd.ts`)

Builds Markdown with a YAML frontmatter (title/createdAt/updatedAt) and tries Web Share API with files first; falls back to a synthesized `<a download>` click. AbortError from share is treated as user cancel (no fallback download). `sanitizeFilename` is the canonical filename rule — reuse it for any new export path.

## Conventions

- **Version is duplicated in three places** and must be kept in sync: `src/version.ts` (`APP_VERSION`, shown in the header badge), `package.json` (`version`), and `index.html` `<title>`. Bumping any one alone is a bug.
- **PWA theme color is also duplicated** across `index.html` `<meta name="theme-color">`, `vite.config.ts` `manifest.theme_color` / `background_color`, and the `--bg` / `--bg-elev` CSS variables in `src/styles.css`. A theme change touches all four.
- **Vite `base: '/ctop/'`** (`vite.config.ts`) — the app is served under that path on GitHub Pages. Don't hardcode absolute URLs that assume `/`.
- **Strict TS**: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`. Unused imports/params will fail `npm run typecheck` and break CI.
- **Prettier**: no semicolons, single quotes, trailing commas all, 100-col, always-parens arrows. Don't reformat against this style.
- **No frontend framework**: rendering is `root.innerHTML = …` template strings followed by `querySelector` event wiring (see `folderList.ts` / `editor.ts`). User-supplied strings must be escaped — `escapeHtml` in `folderList.ts` is the existing helper.
- Comments and commit messages in this repo are in Japanese; user-facing strings are Japanese.
