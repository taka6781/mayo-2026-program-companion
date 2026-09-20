# Mayo 2026 GitHub Pages 公開手順

## 現在の構成
- Frontend: GitHub Pages
- Backend/Auth/Realtime: Supabase
- Production URL: 最初は `https://<GitHubユーザー名>.github.io/<Repository名>/`
- 最終的には独自サブドメインへ切替予定

## 1. GitHub Repository
GitHub FreeでGitHub Pagesを使う場合、RepositoryをPublicにします。
Public化する前に、この公開用フォルダ以外の秘密情報を入れないでください。

この公開ビルドには次だけが含まれます。
- index.html
- styles.css
- app.js
- cloud.js
- config.js
- manifest.json
- icon.svg
- service-worker.js
- .nojekyll

SupabaseのPublishable Keyはブラウザ向け公開キーなので含めて問題ありません。
`service_role` / `sb_secret_...` / Database Password は絶対に入れないでください。

## 2. ファイルをRepository rootへアップロード
GitHub Repository → Add file → Upload files で、このフォルダ内のファイルをアップロードします。
`.nojekyll` は隠しファイルのため、ZIP展開後に見えない場合がありますが含まれています。

Commit message例:
`Deploy Mayo 2026 beta frontend`

## 3. GitHub Pagesを有効化
Repository → Settings → Pages
- Source: Deploy from a branch
- Branch: main
- Folder: / (root)
- Save

公開URLが表示されるまで数分待ちます。
例:
`https://username.github.io/mayo-2026-program-companion/`

## 4. Supabase Redirect URLを追加
Supabase → Authentication → URL Configuration → Redirect URLs → Add URL

GitHub Pagesの実URLに `**` を付けて追加します。
例:
`https://username.github.io/mayo-2026-program-companion/**`

この時点では Site URL は localhost のままでも構いません。
GitHub Pages上でMagic Linkを本番テストする段階でSite URLをGitHub Pages URLへ変更します。

## 5. 外部β確認
GitHub Pages URLをシークレットウィンドウで開き、以下を確認します。
- Sign In画面表示
- Email + Password Login
- Schedule / Missions / Points
- People
- DM / Team Chat
- Announcements
- Poll
- Admin権限

## 6. 独自ドメインはGitHub Pages確認後
GitHub Pagesの標準URLで動作確認が終わってから、独自サブドメインを設定します。
会社HPのBluehostは変更せず、Mayo用サブドメインだけGitHub PagesへCNAMEで向けます。
