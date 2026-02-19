---
name: sensitive-check
description: センシティブ情報の漏洩をチェック（APIキー、パスワード、トークン、環境変数など）
disable-model-invocation: false
---

プロジェクト内のセンシティブ情報漏洩をチェックしてください。

## チェック項目

### 1. ハードコードされた認証情報

以下のパターンを検索してください：

- **APIキー・トークン**
  - `api_key`, `apiKey`, `API_KEY`
  - `token`, `access_token`, `auth_token`
  - `bearer`, `jwt`
  - AWS アクセスキー: `AKIA[0-9A-Z]{16}`
  - GitHub トークン: `ghp_[a-zA-Z0-9]{36}`
  - Stripe キー: `sk_live_`, `pk_live_`

- **パスワード**
  - `password =`, `pwd =`
  - `secret =`, `SECRET =`
  - データベース接続文字列内のパスワード

- **秘密鍵**
  - `-----BEGIN PRIVATE KEY-----`
  - `-----BEGIN RSA PRIVATE KEY-----`
  - `.pem`, `.key` ファイル

### 2. 環境変数ファイルのGit管理チェック

以下のファイルがGit管理されていないか確認：

- `.env`
- `.env.local`
- `.env.production`
- `.env.*.local`
- `secrets.json`
- `credentials.json`

**確認コマンド:**
```bash
git ls-files | grep -E '\.env|secrets|credentials'
```

### 3. コミット履歴のチェック

過去のコミットにセンシティブ情報が含まれていないか確認：

```bash
git log -p | grep -iE 'password|api_key|secret|token'
```

### 4. AWS認証情報

- `~/.aws/credentials` の誤コミット
- IAMアクセスキーのハードコード
- Secrets Manager の参照が正しく設定されているか

### 5. データベース接続情報

- 接続文字列にパスワードが含まれていないか
- `DATABASE_URL` が環境変数経由か

## チェック対象ディレクトリ

- `apps/api/src/`
- `apps/web/src/`
- `packages/`
- 設定ファイル（`*.json`, `*.yaml`, `*.yml`, `*.ts`, `*.js`）

## 除外するディレクトリ

- `node_modules/`
- `.git/`
- `dist/`, `build/`
- `coverage/`
- `*.test.ts`, `*.spec.ts`（テストファイルのモックデータは許容）

## 出力形式

### 問題が見つかった場合

```markdown
## ⚠️ センシティブ情報が見つかりました

### 🔴 重大: ハードコードされたAPIキー
- **ファイル**: `apps/api/src/config/api.ts:12`
- **内容**: `apiKey = "sk_live_xxxxxxxxxxxx"`
- **対処**: 環境変数 `API_KEY` に移動し、AWS Secrets Manager で管理

### 🟡 警告: .envファイルがGit管理されている
- **ファイル**: `.env.local`
- **対処**: `git rm --cached .env.local` で削除し、`.gitignore` に追加

### ✅ 推奨: Secrets Manager参照の追加
- JWE暗号化キーは `encryption_key` として Secrets Manager に保存済み
- Performance Media Network の `client_id` も Secrets Manager 管理
```

### 問題がない場合

```markdown
## ✅ センシティブ情報チェック完了

チェックした項目:
- ✅ ハードコードされた認証情報: なし
- ✅ .envファイルのGit管理: なし
- ✅ コミット履歴の漏洩: なし
- ✅ AWS認証情報: 適切に管理されている
- ✅ データベース接続情報: 環境変数経由

すべてのセンシティブ情報が適切に管理されています。
```

## 注意事項

- `.gitignore` に以下が含まれているか確認:
  ```
  .env
  .env.local
  .env.*.local
  secrets.json
  credentials.json
  *.pem
  *.key
  ```

- AWS Secrets Manager 使用推奨ファイル:
  - `ARCHITECTURE.md` - Secrets Manager の設計を参照
  - `CLAUDE.md` - JWE暗号化の注意点を参照

- テストファイルのモックデータは許容（`*.test.ts`, `*.spec.ts`）

## 次のアクション

問題が見つかった場合の対処手順を提示してください：

1. 環境変数への移動
2. `.gitignore` の更新
3. Git履歴からの削除（必要な場合）
4. AWS Secrets Manager への移行
