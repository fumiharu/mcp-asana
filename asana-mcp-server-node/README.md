# Asana MCP Server (Node.js/TypeScript)

Asanaのタスク管理機能をModel Context Protocol (MCP)を通じて提供するサーバー実装です。Node.js/TypeScriptで構築されており、AIアシスタントがAsanaのタスク、プロジェクト、ワークスペースと対話できるようにします。

**注**: このプロジェクトにはPython版も存在します。Python版は `../asana-mcp-server/` ディレクトリにあります。

## 主な機能

### MCPにおける「リソース」と「ツール」とは？

MCPサーバーは、AIアシスタントに対して2種類の機能を提供します：

**リソース (Resources)**
- **概念**: 読み取り専用のデータソース。ファイルシステムのようにURIでアクセスできる情報のこと
- **使い方**: ワークスペース内のタスク一覧、特定のタスクの詳細情報など、AIアシスタントがAsanaのデータを「見る」「参照する」ときに使用
- **URIの例**: `asana://workspaces/123/tasks` でワークスペース123のタスク一覧を取得

**ツール (Tools)**
- **概念**: 実行可能な操作や関数。データの作成・更新・検索など、アクションを伴う機能
- **使い方**: タスクの作成、タスクの更新、コメントの追加など、AIアシスタントがAsanaのデータを「操作する」「変更する」ときに使用
- **実行例**: `create_task`ツールを呼び出して新しいタスクを作成

### このサーバーが提供する機能

**リソース**: ワークスペース別にタスクを参照できるURIベースのアクセス
- ワークスペース内のタスク一覧を参照
- プロジェクト内のタスク一覧を参照
- 特定のタスクの詳細情報を参照

**ツール**: 6つのタスク管理操作
- 割り当てられたタスクの取得
- キーワードによるタスク検索
- 新規タスクの作成
- 既存タスクの更新
- タスク詳細情報の取得
- タスクへのコメント追加

## 必要な環境

- Node.js >= 16.0.0
- npm（Node.jsに同梱）
- AsanaアカウントとAPIアクセストークン

## セットアップ手順

### 1. Asanaアクセストークンの取得

[Asana Developer Console](https://app.asana.com/0/developer-console)にアクセスし、Personal Access Token (PAT)を作成してください。

### 2. インストールとビルド

```bash
cd asana-mcp-server-node
npm install
npm run build
```

### 3. クライアントごとの設定

#### Claude Desktop / Claude Code CLI

- Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`に以下を追加
- Claude Code CLI: `~/.claude/config.json`に以下を追加

```json
{
  "mcpServers": {
    "asana": {
      "command": "node",
      "args": [
        "/absolute/path/to/asana-mcp-server-node/dist/index.js"
      ],
      "env": {
        "ASANA_ACCESS_TOKEN": "your_asana_access_token_here"
      }
    }
  }
}
```

**重要**:
- `/absolute/path/to/asana-mcp-server-node`を実際のインストールディレクトリの絶対パスに置き換えてください
- `your_asana_access_token_here`を実際のAsanaトークンに置き換えてください
- パスの例: `/Users/yourname/dev/mcp-asana/asana-mcp-server-node/dist/index.js`

設定ファイルを更新した後、クライアントアプリケーションを再起動してください。

#### VSCode（Claude Code拡張機能）

`.vscode/settings.json`に以下を追加:

```json
{
  "claude.mcpServers": {
    "asana": {
      "command": "node",
      "args": [
        "/absolute/path/to/asana-mcp-server-node/dist/index.js"
      ],
      "env": {
        "ASANA_ACCESS_TOKEN": "your_asana_access_token_here"
      }
    }
  }
}
```

シェルで環境変数を設定:
```bash
export ASANA_ACCESS_TOKEN="your_token_here"
```

## リソースURI

以下のURIスキームでAsanaリソースにアクセスできます：

- `asana://workspaces/{workspace_id}/tasks` - ワークスペース内のタスク一覧
- `asana://tasks/{task_id}` - 特定のタスクの詳細
- `asana://projects/{project_id}/tasks` - プロジェクト内のタスク一覧

## 利用可能なツール

### 1. get_my_tasks
現在のユーザーに割り当てられたタスクを取得します。

**パラメータ:**
- `workspace_id` (オプション): ワークスペースID
- `limit` (オプション): 取得する最大タスク数（デフォルト: 50）

### 2. search_tasks
キーワードでタスクを検索します。

**パラメータ:**
- `query` (必須): 検索キーワード
- `workspace_id` (オプション): ワークスペースID

### 3. create_task
新しいタスクを作成します。

**パラメータ:**
- `name` (必須): タスク名
- `notes` (オプション): タスクの説明・メモ
- `due_on` (オプション): 期日（YYYY-MM-DD形式）
- `project_id` (オプション): タスクを追加するプロジェクトID
- `workspace_id` (オプション): ワークスペースID（未指定の場合は最初のワークスペースを使用）

### 4. update_task
既存のタスクを更新します。

**パラメータ:**
- `task_id` (必須): 更新するタスクのID
- `name` (オプション): 新しいタスク名
- `notes` (オプション): 新しいタスクメモ
- `completed` (オプション): 完了状態（true/false）
- `due_on` (オプション): 新しい期日

### 5. get_task_details
特定のタスクの詳細情報を取得します。

**パラメータ:**
- `task_id` (必須): タスクID

### 6. add_comment
タスクにコメントを追加します。

**パラメータ:**
- `task_id` (必須): タスクID
- `text` (必須): コメント本文

## 使用例

設定完了後、任意のMCP対応クライアントからAsanaを操作できます：

**例:**
- "Show me my Asana tasks" - 自分のタスクを表示
- "Create a new task called 'Review PR' in project XYZ" - 新しいタスクを作成
- "Search for tasks containing 'bug fix'" - タスクを検索
- "Update task 1234567890 to mark it as complete" - タスクを完了にする
- "Add a comment to task 1234567890: 'Working on this now'" - コメントを追加
- "Show me details for task 1234567890" - タスクの詳細を表示

## 開発・デバッグ

### ローカルでの実行

```bash
export ASANA_ACCESS_TOKEN="your_token_here"
npm start
```

開発モード（自動リロード付き）:
```bash
export ASANA_ACCESS_TOKEN="your_token_here"
npm run dev
```

### MCP Inspectorを使ったデバッグ

MCP Inspector（Webインターフェース）を使ってサーバーをテストできます：

```bash
ASANA_ACCESS_TOKEN=your_token npx @modelcontextprotocol/inspector node dist/index.js
```

### テストの実行

```bash
npm test
```

ウォッチモードでテストを実行:
```bash
npm run test:watch
```

### ログ機能

MCPサーバーのログを確認するために、ロギング機能を有効にした起動スクリプトを使用できます。

#### ロギング設定

設定ファイルで、通常のnodeコマンドの代わりに`run-with-logging.sh`を使用:

```json
{
  "mcpServers": {
    "asana": {
      "command": "/absolute/path/to/asana-mcp-server-node/run-with-logging.sh",
      "args": [],
      "env": {
        "ASANA_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

#### ログの確認

サーバーのログは`mcp-server.log`ファイルに出力されます。リアルタイムで確認:

```bash
tail -f mcp-server.log
```

**ログファイルの場所**: プロジェクトルート（例: `/Users/yourname/dev/mcp-asana/mcp-server.log`）

### 開発用コマンド

- `npm run build` - TypeScriptをJavaScriptにコンパイル
- `npm start` - コンパイル済みサーバーを実行
- `npm run dev` - 開発モードで実行（ts-node使用）
- `npm test` - Jestでテストを実行
- `npm run test:watch` - ウォッチモードでテストを実行
- `npm run clean` - コンパイル済みファイルを削除

## プロジェクト構造

```
asana-mcp-server-node/
├── src/
│   ├── index.ts        # エントリーポイント
│   ├── client.ts       # Asana APIクライアントラッパー
│   ├── server.ts       # MCPサーバー実装
│   └── types.ts        # TypeScript型定義
├── tests/
│   └── client.test.ts  # ユニットテスト
├── dist/               # コンパイル済みJavaScript（生成される）
├── package.json
├── tsconfig.json
└── jest.config.js
```

## トラブルシューティング

### アクセストークンエラー

**エラー:** `ASANA_ACCESS_TOKEN environment variable is required`

**解決方法:** 設定ファイルに`ASANA_ACCESS_TOKEN`が正しく設定されているか確認してください。

### ワークスペースが見つからない

**エラー:** `No workspace found for user`

**解決方法:** Asanaアカウントに少なくとも1つのワークスペースがあることを確認してください。

### TypeScriptコンパイルエラー

**解決方法:**
```bash
npm install
npm run build
```

### サーバーが認識されない

**解決方法:**
1. 設定ファイルのパスが絶対パスで正しいか確認
2. `npm run build`を実行してTypeScriptをコンパイル
3. 設定ファイルを変更した後、クライアントアプリケーションを再起動
4. Claude Desktopのログを確認: `~/Library/Logs/Claude/mcp*.log`

### Claude Code CLIで動作しない

**解決方法:**
```bash
# 設定ファイルの確認
cat ~/.claude/config.json

# MCPサーバー一覧を確認
claude mcp list

# 手動でサーバーをテスト
ASANA_ACCESS_TOKEN="your_token" node dist/index.js
```

### 権限エラー

**解決方法:**
```bash
chmod +x dist/index.js
```

## アーキテクチャ

### コアコンポーネント

- **client.ts**: 公式Asana Node.js SDKのシングルトンラッパー
  - 環境変数による認証処理
  - Asana APIの10個のメソッドを提供
  - ワークスペースのデフォルト設定（未指定の場合は最初のワークスペースを使用）
  - オプションフィールドの条件付き含有（例: notesが提供された場合のみ含める）

- **server.ts**: MCPサーバー実装
  - 4つのリクエストハンドラー: list_resources, read_resource, list_tools, call_tool
  - リソースアクセスのためのURIパース処理
  - プロトコル中断を防ぐエラーハンドリング
  - JSONレスポンスのフォーマット

- **types.ts**: TypeScriptインターフェース
  - Asanaエンティティの型定義（User、Workspace、Task、Project、Story）
  - ツール入力スキーマの型定義
  - コードベース全体の型安全性を保証

### 設計パターン

- **シングルトンパターン**: AsanaClientはプロセスごとに単一インスタンス
- **遅延初期化**: クライアントはモジュールロード時ではなく初回使用時に作成
- **ワークスペースのデフォルト設定**: 未指定時は自動的に最初のワークスペースを使用
- **条件付きフィールド**: 提供された場合のみオプションフィールドをAPI呼び出しに含める
- **エラーラップ**: 例外をキャッチしてテキストコンテンツとして返し、プロトコルエラーを回避

## 関連プロジェクト

- [Python Asana MCP Server](../asana-mcp-server) - 同じサーバーのPython実装
- [MCP](https://modelcontextprotocol.io) - Model Context Protocol ドキュメント
- [Asana API](https://developers.asana.com/docs) - 公式Asana API ドキュメント

## ライセンス

MIT
