# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Asanaのタスク管理APIとの統合を提供するMCP（Model Context Protocol）サーバーです。MCPリソースとツールを通じてAsanaの機能を公開し、AIアシスタントがAsanaのタスク、プロジェクト、ワークスペースと対話できるようにします。

## アーキテクチャ

### コアコンポーネント

- **server.py**: リソース、ツール、ハンドラーを定義するMCPサーバーの実装
  - Resources: ワークスペースとタスク用の発見可能なURIを提供（`asana://workspaces/{id}/tasks`、`asana://tasks/{id}`など）
  - Tools: タスク管理用の6つのツールを公開（get_my_tasks、search_tasks、create_task、update_task、get_task_details、add_comment）
  - Handlers: MCPプロトコルハンドラーを実装（list_resources、read_resource、list_tools、call_tool）

- **client.py**: 公式Asana Python SDKの薄いラッパー
  - Asana APIクライアントの初期化（TasksApi、ProjectsApi、WorkspacesApi、StoriesApi、UsersApi）
  - ワークスペース解決の処理（指定がない場合は最初のワークスペースをデフォルトとする）
  - ASANA_ACCESS_TOKEN環境変数によるAPI認証の管理

- **__main__.py**: asyncioを使用してasyncサーバーを実行するエントリーポイント

### 主要な設計パターン

- **遅延クライアント初期化**: `get_client()`関数は初回使用時にAsanaClientを作成
- **URIベースのリソース**: AsanaエンティティをMCPリソースとして表現するカスタムURIスキーム（`asana://`）
- **ワークスペースのデフォルト設定**: workspace_idが指定されていない場合、クライアントは自動的にユーザーの最初の利用可能なワークスペースを使用
- **条件付きフィールド**: フィールドが存在する場合のみAPI呼び出しに含める（例：create_taskのnotes）

## 開発コマンド

### インストール

開発モード（推奨）:
```bash
cd asana-mcp-server
pip install -e .
```

本番モード:
```bash
cd asana-mcp-server
pip install .
```

### サーバーの実行

`ASANA_ACCESS_TOKEN`環境変数が必要です。

ローカル実行:
```bash
ASANA_ACCESS_TOKEN=your_token python -m asana_mcp_server
```

### MCP Inspectorでのテスト

MCP InspectorはMCPサーバーをテストするためのWeb UIを提供します:
```bash
ASANA_ACCESS_TOKEN=your_token npx @modelcontextprotocol/inspector python -m asana_mcp_server
```

### テストの実行

```bash
cd asana-mcp-server
python -m pytest tests/
```

特定のテストファイルを実行:
```bash
python -m pytest tests/test_client.py
```

特定のテストを実行:
```bash
python -m pytest tests/test_client.py::TestAsanaClient::test_get_me
```

## 重要な実装の詳細

### Asana APIの注意点

1. **notesフィールドを含むタスク作成**: `notes`フィールドは値がある場合のみAPI呼び出しに含める必要があります。空のnotesはAPIエラーを引き起こします。

2. **ワークスペースの推論**: project_idを指定してタスクを作成する場合、ワークスペースはプロジェクトから推論されます。プロジェクトなしでタスクを作成する場合のみ、ワークスペースを明示的に指定してください。

3. **SearchとTypeahead**: `search_tasks`関数は、完全な検索APIではなく、AsanaのTypeahead APIを使用してシンプルなテキストベースの検索を行います。

4. **完了タスクフィルター**: `get_my_tasks`は`completed_since='now'`を使用しており、デフォルトで未完了のタスクのみを返します。

### MCPプロトコル実装

- サーバーはstdioトランスポート（`stdio_server`）を使用して実行
- すべてのツールハンドラーは`List[TextContent | ImageContent | EmbeddedResource]`を返す
- エラーハンドリングは例外をラップしてTextContentとして返し、MCPプロトコルの中断を回避
- リソースURIは階層パスをサポート: workspaces → tasks、projects → tasks

## コードコメント

コードベースには日本語のコメントが含まれています（特にserver.py）。これらのコメントは以下を説明しています:
- リソース一覧の動作と検出パターン
- URIスキームのサポートと解析ロジック
- ワークスペース/プロジェクトの関係処理

## 設定

サーバーは`claude_desktop_config.json`を通じてClaude Desktop用に設定されます:
```json
{
  "mcpServers": {
    "asana": {
      "command": "python",
      "args": ["-m", "asana_mcp_server"],
      "env": {
        "ASANA_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

## 依存関係

- **mcp**: Model Context Protocol SDK
- **asana**: 公式Asana Python SDK
- Python >=3.10が必要
