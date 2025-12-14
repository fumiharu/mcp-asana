# Asana MCP Server (Python)

Asanaのタスク管理機能をModel Context Protocol (MCP)を通じて提供するサーバー実装です。Pythonで構築されており、AIアシスタントがAsanaのタスク、プロジェクト、ワークスペースと対話できるようにします。

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

- Python >= 3.10
- pip（Pythonに同梱）
- AsanaアカウントとAPIアクセストークン

## セットアップ手順

### 1. Asanaアクセストークンの取得

[Asana Developer Console](https://app.asana.com/0/developer-console)にアクセスし、Personal Access Token (PAT)を作成してください。

### 2. インストール

```bash
cd asana-mcp-server
pip install -e .
```

開発用に変更を即座に反映させるため、`-e`（editable）オプション付きでインストールすることを推奨します。

### 3. クライアントごとの設定

#### Claude Desktop / Claude Code CLI

- Claude Desktop - `~/Library/Application Support/Claude/claude_desktop_config.json`に以下を追加:
- Claude Code CLI - `~/.claude/config.json`に以下を追加:
```json
{
  "mcpServers": {
    "asana": {
      "command": "python",
      "args": ["-m", "asana_mcp_server"],
      "env": {
        "ASANA_ACCESS_TOKEN": "your_asana_access_token_here"
      }
    }
  }
}
```

#### VSCode（Claude Code拡張機能）

`.vscode/settings.json`に以下を追加:

```json
{
  "mcp.servers": {
    "asana": {
      "command": "python",
      "args": ["-m", "asana_mcp_server"],
      "env": {
        "ASANA_ACCESS_TOKEN": "your_asana_access_token_here"
      }
    }
  }
}
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

## 開発・デバッグ

### ローカルでの実行

```bash
ASANA_ACCESS_TOKEN=your_token_here python -m asana_mcp_server
```

### MCP Inspectorを使ったデバッグ

MCP Inspector（Webインターフェース）を使ってサーバーをテストできます：

```bash
ASANA_ACCESS_TOKEN=your_token_here npx @modelcontextprotocol/inspector python -m asana_mcp_server
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