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


## v3 パスワード再設定テスト
1. Sign In画面で **Forgot password?** を押します。
2. 登録済みメールアドレスを入力し、Password Reset Linkを送信します。
3. `no-reply@auth.planex-bp.com` から届くメールを開きます（Outlook/HotmailはJunk/Spamも確認）。
4. リンクからアプリに戻り、新しいPasswordを2回入力します。
5. 更新後、Sign In画面から新しいPasswordでログインします。

Supabase Authentication > URL Configuration のRedirect URLsに `https://mayo2026.planex-bp.com/**` が残っていることを確認してください。


## v4確認項目
パスワード再設定メールのリンクを開いた後、Choose New Password画面が自動でHomeへ遷移せず固定されることを確認してください。新しいパスワードを保存するとSign In画面へ戻ります。


## v5 追加確認
公開後、Create account画面で以下を確認してください。
- Magic Linkの選択肢が表示されない
- 確認メールについてJunk/Spam確認の一般的な注意が表示される
- 連続試行時は数分〜最大1時間待つ旨が表示される
- Privacy Notice / Terms of Useへのリンクと2つの同意チェックが表示される
- More画面からPrivacy Notice / Terms of Useを再確認できる

※ Privacy/Termsの文面は実務向けドラフトです。必要に応じて正式公開前に法務レビューを行ってください。

## v6で最初に必要なSQL更新（重要）
GitHubへv6をアップロードする前に、Supabaseの **SQL Editor** で
`Mayo_2026_Supabase_Poll_Privacy_v6.sql` を実行してください。

このSQLはQuick Pollを次の仕様に変更します。
- Participantは自分の投票内容だけ参照可能
- Participantは投票中の途中集計を見られない
- Adminはリアルタイム集計を確認可能
- Adminは手動で `Close & Publish Results` が可能
- Poll作成時に任意の自動締切時刻を指定可能
- 締切後はParticipantにも集計結果を表示
- 過去Pollで自分が何に投票したか確認可能

SQL実行後、ZIP内のWebファイルをGitHub repository rootへ上書きしてください。
