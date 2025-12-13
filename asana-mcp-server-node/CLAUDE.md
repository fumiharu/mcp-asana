# CLAUDE.md

このファイルは、このリポジトリのコードを扱う際のClaude Code (claude.ai/code) へのガイダンスを提供します。

## プロジェクト概要

Asanaのタスク管理APIとの統合を提供するMCP（Model Context Protocol）サーバーのNode.js/TypeScript実装です。MCPリソースとツールを通じてAsanaの機能を公開し、AIアシスタントがAsanaのタスク、プロジェクト、ワークスペースと対話できるようにします。

**注**: このプロジェクトはPython版と並行して存在しています。Python版は `../asana-mcp-server/` にあります。

## アーキテクチャ

### コアコンポーネント

- **src/index.ts**: エントリーポイント
  - serve()関数を実行
  - エラーハンドリングとプロセス終了処理
  - 公開APIのエクスポート

- **src/client.ts**: Asana APIクライアントラッパー
  - AsanaClient クラス（シングルトンパターン）
  - 公式Asana Node.js SDKのラッパー
  - 5つのAPIクライアントを初期化（UsersApi、TasksApi、ProjectsApi、WorkspacesApi、StoriesApi）
  - ワークスペース解決の処理（指定がない場合は最初のワークスペースをデフォルトとする）
  - ASANA_ACCESS_TOKEN環境変数によるAPI認証の管理

- **src/server.ts**: MCPサーバーの実装
  - Resources: ワークスペースとタスク用の発見可能なURIを提供
    - `asana://workspaces/{id}/tasks`
    - `asana://tasks/{id}`
    - `asana://projects/{id}/tasks`
  - Tools: タスク管理用の6つのツールを公開
    - get_my_tasks, search_tasks, create_task, update_task, get_task_details, add_comment
  - Handlers: MCPプロトコルハンドラーを実装
    - ListResourcesRequestSchema, ReadResourceRequestSchema
    - ListToolsRequestSchema, CallToolRequestSchema

- **src/types.ts**: TypeScript型定義
  - Asanaエンティティのインターフェース（User、Workspace、Task、Project、Story）
  - ツール入力スキーマの型定義

### 主要な設計パターン

- **シングルトンパターン**: AsanaClient.getInstance()で単一インスタンスを保証
- **遅延初期化**: getClient()関数は初回使用時にAsanaClientを作成
- **URIベースのリソース**: AsanaエンティティをMCPリソースとして表現するカスタムURIスキーム（`asana://`）
- **ワークスペースのデフォルト設定**: workspace_idが指定されていない場合、クライアントは自動的にユーザーの最初の利用可能なワークスペースを使用
- **条件付きフィールド**: フィールドが存在する場合のみAPI呼び出しに含める（例：create_taskのnotes）
- **ES Modules**: TypeScriptをES2020モジュールとしてコンパイル（package.jsonで"type": "module"を指定）

## 開発コマンド

### インストール

開発環境のセットアップ:
```bash
cd asana-mcp-server-node
npm install
```

### ビルド

TypeScriptをJavaScriptにコンパイル:
```bash
npm run build
```

これにより、`dist/`ディレクトリにJavaScriptファイルが生成されます。

### サーバーの実行

`ASANA_ACCESS_TOKEN`環境変数が必要です。

本番モード（コンパイル済み）:
```bash
ASANA_ACCESS_TOKEN=your_token npm start
```

開発モード（ts-nodeを使用）:
```bash
ASANA_ACCESS_TOKEN=your_token npm run dev
```

### MCP Inspectorでのテスト

MCP InspectorはMCPサーバーをテストするためのWeb UIを提供します:
```bash
ASANA_ACCESS_TOKEN=your_token npx @modelcontextprotocol/inspector node dist/index.js
```

### テストの実行

Jest を使用したユニットテスト:
```bash
npm test
```

ウォッチモードでテストを実行:
```bash
npm run test:watch
```

## 重要な実装の詳細

### Asana APIの注意点

1. **notesフィールドを含むタスク作成**: `notes`フィールドは値がある場合のみAPI呼び出しに含める必要があります。空のnotesはAPIエラーを引き起こします。
   ```typescript
   // client.ts の createTask メソッドを参照
   if (notes) {
     data.notes = notes;  // notesが存在する場合のみ追加
   }
   ```

2. **ワークスペースの推論**: project_idを指定してタスクを作成する場合、ワークスペースはプロジェクトから推論されます。プロジェクトなしでタスクを作成する場合のみ、ワークスペースを明示的に指定してください。

3. **SearchとTypeahead**: `searchTasks`関数は、完全な検索APIではなく、AsanaのTypeahead APIを使用してシンプルなテキストベースの検索を行います。

4. **完了タスクフィルター**: `getMyTasks`は`completed_since: 'now'`を使用しており、デフォルトで未完了のタスクのみを返します。

### MCPプロトコル実装

- サーバーはStdioServerTransportを使用して実行
- すべてのツールハンドラーは`{ content: [{ type: 'text', text: string }] }`形式を返す
- エラーハンドリングは例外をラップしてTextContentとして返し、MCPプロトコルの中断を回避
- リソースURIは階層パスをサポート: workspaces → tasks、projects → tasks

### TypeScript/Node.js固有の考慮事項

1. **ES Modules**: package.jsonで`"type": "module"`を設定し、tsconfig.jsonで`"module": "ES2020"`を指定
2. **Import拡張子**: TypeScriptファイル内で`.js`拡張子を使用（TypeScriptからJavaScriptへの変換後に正しく解決される）
3. **非同期処理**: すべてのAsana API呼び出しはPromiseベースで、async/awaitを使用
4. **型安全性**: TypeScriptの厳格モードで完全な型チェック

## クライアントメソッド一覧

AsanaClientクラスは以下の10個のメソッドを提供します:

1. `getMe()` - 現在のユーザー情報とワークスペースを取得
2. `getWorkspaces()` - ワークスペース一覧を取得
3. `getMyTasks(workspaceId?, limit?)` - 自分に割り当てられたタスクを取得
4. `searchTasks(query, workspaceId?)` - タスクをキーワード検索
5. `createTask(name, projectId?, workspaceId?, dueOn?, notes?)` - 新しいタスクを作成
6. `updateTask(taskId, data)` - タスクを更新
7. `getTask(taskId)` - タスクの詳細情報を取得
8. `getProjectTasks(projectId)` - プロジェクト内のタスク一覧を取得
9. `addComment(taskId, text)` - タスクにコメントを追加
10. `markTaskComplete(taskId)` / `markTaskIncomplete(taskId)` - タスクの完了状態を変更

## サーバーハンドラー

MCPサーバーは4つのハンドラーを実装します:

### 1. ListResourcesRequestSchema
ユーザーのワークスペース一覧をリソースとして返します。
```typescript
{
  resources: [
    {
      uri: "asana://workspaces/{gid}/tasks",
      name: "Tasks in {workspace_name}",
      ...
    }
  ]
}
```

### 2. ReadResourceRequestSchema
URIパターンに基づいてリソースの内容を返します:
- `asana://tasks/{task_id}` → タスク詳細（JSON）
- `asana://projects/{project_id}/tasks` → プロジェクトのタスク一覧（JSON）
- `asana://workspaces/{workspace_id}/tasks` → ワークスペースのタスク一覧（JSON）

### 3. ListToolsRequestSchema
利用可能な6つのツールとそのスキーマを返します。

### 4. CallToolRequestSchema
ツール名とパラメータに基づいて対応するクライアントメソッドを実行し、結果をJSON形式で返します。エラーが発生した場合は、`isError: true`フラグ付きでエラーメッセージを返します。

## 設定

サーバーは`claude_desktop_config.json`を通じてClaude Desktop用に設定されます:
```json
{
  "mcpServers": {
    "asana": {
      "command": "node",
      "args": ["/absolute/path/to/asana-mcp-server-node/dist/index.js"],
      "env": {
        "ASANA_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

## 依存関係

### 本番依存関係
- **@modelcontextprotocol/sdk**: Model Context Protocol SDK
- **asana**: 公式Asana Node.js SDK
- **dotenv**: 環境変数管理（オプション）

### 開発依存関係
- **typescript**: TypeScriptコンパイラ
- **@types/node**: Node.jsの型定義
- **jest**: テストフレームワーク
- **ts-jest**: JestのTypeScriptサポート
- **ts-node**: TypeScriptの直接実行

Node.js >=16.0.0が必要です。

## テスト

テストは`tests/`ディレクトリにあり、Jestを使用します:
- **client.test.ts**: AsanaClientクラスのユニットテスト
  - シングルトンパターンのテスト
  - 各APIメソッドのモックテスト
  - ワークスペースのデフォルト設定の検証
  - notesフィールドの条件付き含有の検証

## Python版との比較

| 項目 | Python版 | Node.js/TypeScript版 |
|------|---------|---------------------|
| エントリーポイント | `__main__.py` | `src/index.ts` |
| クライアント | `client.py` (AsanaClient) | `src/client.ts` (AsanaClient) |
| サーバー | `server.py` (デコレーター) | `src/server.ts` (setRequestHandler) |
| 型システム | Type hints (Optional) | TypeScript (完全な型安全性) |
| モジュールシステム | Python modules | ES Modules |
| テストフレームワーク | pytest + unittest.mock | Jest + ts-jest |
| ビルド | 不要（直接実行） | TypeScriptコンパイルが必要 |

どちらの実装も同じ機能を提供し、同じMCPプロトコルを実装しています。
