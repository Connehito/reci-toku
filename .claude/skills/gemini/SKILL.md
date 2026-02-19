---
name: gemini
description: Gemini CLIを使ってコードレビューやセカンドオピニオンを取得
disable-model-invocation: false
---

Gemini CLIを使って、別の視点からのコードレビューやセカンドオピニオンを取得してください。

## 使用目的

このスキルは以下の用途で使用されます：

1. **コードレビュー** - Claude Codeとは異なる視点でのレビュー
2. **セカンドオピニオン** - Claude Codeの提案に対する別の意見

## 実行方法

### 1. Gemini CLIが利用可能か確認

```bash
which gemini
```

もし存在しない場合は、ユーザーに以下を伝えてください：

```markdown
## ⚠️ Gemini CLIが見つかりません

Gemini CLIをインストールしてください：

### インストール方法

**オプション1: npm経由（推奨）**
```bash
npm install -g @google/generative-ai-cli
```

**オプション2: Homebrewの場合（将来実装される可能性）**
```bash
brew install gemini-cli
```

### APIキーの設定

1. Google AI StudioでAPIキーを取得: https://aistudio.google.com/app/apikey
2. 環境変数に設定:
```bash
export GEMINI_API_KEY="your-api-key-here"
```

### 動作確認

```bash
gemini --version
```
```

### 2. Gemini CLIでコードレビューを実行

ユーザーが指定したファイルやコードスニペットをGeminiに送信してレビューを依頼します。

**使用例:**

```bash
# ファイル全体をレビュー
gemini review apps/api/src/usecase/auth/generate-jwe-token.usecase.ts

# 特定のコード部分をレビュー
gemini chat "以下のコードをレビューしてください：
$(cat apps/api/src/usecase/auth/generate-jwe-token.usecase.ts)
"

# diff をレビュー
git diff | gemini chat "この変更をレビューしてください"
```

### 3. セカンドオピニオンの取得

Claude Codeの提案に対してGeminiの意見を聞きます。

**使用例:**

```bash
gemini chat "以下の技術選定について意見をください：

## Claude Codeの提案
- ORMにTypeORMを採用
- 理由: NestJSとの統合が良好、マイグレーション不使用で別リポジトリ管理

## 質問
1. TypeORMは適切な選択か？
2. Prismaと比較した際の優位性は？
3. 懸念点はあるか？
"
```

## 実行フロー

このスキルが呼ばれた場合、以下の手順で実行してください：

1. **Gemini CLIの存在確認**
   - `which gemini` で確認
   - 存在しない場合はインストール方法を提示して終了

2. **ユーザーの意図を確認**
   - コードレビュー対象のファイルパスを特定
   - または、セカンドオピニオンの対象となるトピックを確認

3. **Geminiに問い合わせ**
   - 適切なコマンドでGemini CLIを実行
   - レスポンスを取得

4. **結果の整形と提示**
   - Geminiの回答を読みやすく整形
   - Claude Codeの見解と比較（必要な場合）
   - 推奨アクションを提示

## 出力形式

### コードレビューの場合

```markdown
## 🤖 Gemini CLIによるコードレビュー

**対象ファイル**: `apps/api/src/usecase/auth/generate-jwe-token.usecase.ts`

### Geminiの指摘

#### 🟢 良い点
- [Geminiが指摘した良い点]

#### 🟡 改善提案
- [Geminiが提案した改善点]

#### 🔴 問題点
- [Geminiが指摘した問題点]

### Claude Codeの見解

[Geminiの指摘に対するClaude Codeの意見]

### 推奨アクション

1. [実施すべきこと]
2. [検討すべきこと]
```

### セカンドオピニオンの場合

```markdown
## 🤖 Gemini CLIによるセカンドオピニオン

**トピック**: [議論の対象]

### Claude Codeの提案
- [Claudeの提案内容]

### Geminiの意見
- [Geminiの意見]

### 比較分析

| 観点 | Claude Code | Gemini |
|------|-------------|--------|
| 技術選定 | [Claudeの選定] | [Geminiの選定] |
| 理由 | [Claudeの理由] | [Geminiの理由] |
| 懸念点 | [Claudeの懸念] | [Geminiの懸念] |

### 推奨アクション

[2つのAIの意見を踏まえた推奨事項]
```

## 注意事項

- Gemini CLIはGoogle AIのAPIを使用するため、API使用量に注意
- 大量のコードを一度に送信する場合はトークン制限に注意
- センシティブ情報（APIキー、パスワード等）を含むコードは送信しない
- Geminiの回答はあくまで参考情報として扱う

## 使用例

### 例1: 新機能のコードレビュー

```bash
/gemini
# → 「apps/api/src/usecase/coin/create-receipt.use-case.ts をレビューしてください」
```

### 例2: 技術選定のセカンドオピニオン

```bash
/gemini
# → 「TypeORMとPrismaの選定について、Claudeの提案に対する意見をください」
```

### 例3: バグ分析

```bash
/gemini
# → 「以下のエラーログを分析してください: [エラー内容]」
```

## トラブルシューティング

### Gemini CLIが応答しない

- APIキーが正しく設定されているか確認: `echo $GEMINI_API_KEY`
- ネットワーク接続を確認
- API制限に達していないか確認

### コマンドが見つからない

- Gemini CLIのインストールパスを確認
- グローバルインストールが必要な場合は `npm install -g` を使用

### レスポンスが不適切

- 質問を具体的に再構成
- コンテキストを追加で提供
- 別の質問方法を試す
