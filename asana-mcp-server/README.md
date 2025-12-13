# Asana MCP Server

An MCP server to interact with Asana.

## Configuration

You need an Asana Personal Access Token (PAT).

## ローカル環境の構築と実行 (Running Locally)

開発やテストのためにローカル環境を構築する手順は以下の通りです。

### 1. 仮想環境の作成と有効化

Pythonの仮想環境（venv）を作成し、プロジェクトごとの依存関係を管理することを推奨します。

```bash
# 仮想環境(.venv)の作成
python -m venv .venv
```

作成した仮想環境を有効化します。

**macOS / Linux:**
```bash
source .venv/bin/activate
```

**Windows:**
```bash
.venv\Scripts\activate
```

### 2. 依存関係のインストール

仮想環境が有効になった状態で、パッケージをインストールします。
開発用に変更を即座に反映させるため、`-e` (editable) オプション付きでインストールします。

```bash
pip install -e .
```

### 3. サーバーの実行

AsanaのPersonal Access Token (PAT) を環境変数に設定してサーバーを起動します。

```bash
ASANA_ACCESS_TOKEN=your_asana_pat_here python -m asana_mcp_server
```

## MCP Inspector を使ったデバッグ (Debugging with MCP Inspector)

MCP Inspector (Webインターフェース) を使ってサーバーをテストする場合も、**事前にPythonの仮想環境を有効化**する必要があります。

```bash
# 仮想環境を有効化した状態で実行してください
ASANA_ACCESS_TOKEN=your_asana_pat_here npx @modelcontextprotocol/inspector python -m asana_mcp_server
```

## Usage

Add this to your `claude_desktop_config.json`:

```json
TBD
```
