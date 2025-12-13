import json
import logging
from typing import Any, List, Optional
from mcp.server import Server
from mcp.types import (
    Resource,
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
)
from .client import AsanaClient
import os

# Asanaクライアントを初期化
# 遅延初期化を行うか、起動時に環境変数を確認します
asana_client = None

def get_client():
    global asana_client
    if not asana_client:
        asana_client = AsanaClient()
    return asana_client

async def serve():
    server = Server("asana-mcp-server")

    @server.list_resources()
    async def handle_list_resources() -> List[Resource]:
        """
        利用可能なリソースを一覧表示します。
        すべてのタスクを事前に把握することはできないため、ワークスペースやトッププロジェクトを一覧表示する可能性があります。
        現時点では、ユーザーのアクティブなワークスペース/プロジェクトを「ルート」として一覧表示します。
        ただし、`asana://tasks/{id}`のような動的リソースは、「発見可能」である必要がない限り、
        list_resourcesで返す必要はありません。
        出発点としてユーザーのワークスペースを一覧表示しましょう。
        """
        client = get_client()
        workspaces = client.get_workspaces()
        resources = []
        for w in workspaces:
            resources.append(
                Resource(
                    uri=f"asana://workspaces/{w['gid']}/tasks",
                    name=f"Tasks in {w['name']}",
                    description=f"List of tasks in workspace {w['name']}",
                    mimeType="application/json",
                )
            )
        return resources

    @server.read_resource()
    async def handle_read_resource(uri: str) -> str:
        """
        特定のリソースを読み込みます。
        サポートされているスキーム:
        - asana://tasks/{task_id} -> タスクの詳細テキストを返します
        - asana://projects/{project_id}/tasks -> プロジェクト内のタスク一覧を返します
        - asana://workspaces/{workspace_id}/tasks -> ワークスペース内のタスク一覧（自分に割り当てられたもの？）を返します
        """
        client = get_client()
        parsed_uri = str(uri)

        if "asana://tasks/" in parsed_uri:
            task_id = parsed_uri.split("asana://tasks/")[-1]
            task = client.get_task(task_id)
            return json.dumps(task, indent=2)

        elif "asana://projects/" in parsed_uri and parsed_uri.endswith("/tasks"):
            project_id = parsed_uri.split("asana://projects/")[-1].replace("/tasks", "")
            tasks = client.get_project_tasks(project_id)
            return json.dumps(tasks, indent=2)

        elif "asana://workspaces/" in parsed_uri and parsed_uri.endswith("/tasks"):
            workspace_id = parsed_uri.split("asana://workspaces/")[-1].replace("/tasks", "")
            tasks = client.get_my_tasks(workspace_id=workspace_id)
            return json.dumps(tasks, indent=2)

        raise ValueError(f"Unsupported URI: {uri}")

    @server.list_tools()
    async def handle_list_tools() -> List[Tool]:
        return [
            Tool(
                name="get_my_tasks",
                description="Get tasks assigned to the current user. Optionally filter by workspace.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "workspace_id": {"type": "string", "description": "Workspace ID (optional)"},
                        "limit": {"type": "integer", "description": "Max number of tasks to return (default 50)"}
                    }
                }
            ),
            Tool(
                name="search_tasks",
                description="Search for tasks using keywords.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search keyword"},
                        "workspace_id": {"type": "string", "description": "Workspace ID (optional)"}
                    },
                    "required": ["query"]
                }
            ),
            Tool(
                name="create_task",
                description="Create a new task.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Task name"},
                        "notes": {"type": "string", "description": "Task description/notes"},
                        "due_on": {"type": "string", "description": "Due date (YYYY-MM-DD)"},
                        "project_id": {"type": "string", "description": "Project ID to add task to"},
                        "workspace_id": {"type": "string", "description": "Workspace ID (optional, defaults to first available)"}
                    },
                    "required": ["name"]
                }
            ),
            Tool(
                name="update_task",
                description="Update an existing task.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "task_id": {"type": "string", "description": "ID of the task to update"},
                        "name": {"type": "string", "description": "New task name"},
                        "notes": {"type": "string", "description": "New task notes"},
                        "completed": {"type": "boolean", "description": "Mark as completed (true) or incomplete (false)"},
                        "due_on": {"type": "string", "description": "New due date"}
                    },
                    "required": ["task_id"]
                }
            ),
            Tool(
                name="get_task_details",
                description="Get full details of a specific task.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "task_id": {"type": "string", "description": "Task ID"}
                    },
                    "required": ["task_id"]
                }
            ),
            Tool(
                name="add_comment",
                description="Add a comment to a task.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "task_id": {"type": "string", "description": "Task ID"},
                        "text": {"type": "string", "description": "Comment text"}
                    },
                    "required": ["task_id", "text"]
                }
            )
        ]

    @server.call_tool()
    async def handle_call_tool(name: str, arguments: dict) -> List[TextContent | ImageContent | EmbeddedResource]:
        client = get_client()

        try:
            if name == "get_my_tasks":
                tasks = client.get_my_tasks(
                    workspace_id=arguments.get("workspace_id"),
                    limit=arguments.get("limit", 50)
                )
                return [TextContent(type="text", text=json.dumps(tasks, indent=2))]

            elif name == "search_tasks":
                tasks = client.search_tasks(
                    query=arguments["query"],
                    workspace_id=arguments.get("workspace_id")
                )
                return [TextContent(type="text", text=json.dumps(tasks, indent=2))]

            elif name == "create_task":
                task = client.create_task(
                    name=arguments["name"],
                    notes=arguments.get("notes"),
                    due_on=arguments.get("due_on"),
                    project_id=arguments.get("project_id"),
                    workspace_id=arguments.get("workspace_id")
                )
                return [TextContent(type="text", text=json.dumps(task, indent=2))]

            elif name == "update_task":
                data = {}
                if "name" in arguments: data["name"] = arguments["name"]
                if "notes" in arguments: data["notes"] = arguments["notes"]
                if "completed" in arguments: data["completed"] = arguments["completed"]
                if "due_on" in arguments: data["due_on"] = arguments["due_on"]

                task = client.update_task(arguments["task_id"], data)
                return [TextContent(type="text", text=json.dumps(task, indent=2))]

            elif name == "get_task_details":
                task = client.get_task(arguments["task_id"])
                return [TextContent(type="text", text=json.dumps(task, indent=2))]

            elif name == "add_comment":
                story = client.add_comment(arguments["task_id"], arguments["text"])
                return [TextContent(type="text", text=json.dumps(story, indent=2))]

            else:
                raise ValueError(f"Unknown tool: {name}")

        except Exception as e:
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    # stdioを使用してサーバーを実行
    from mcp.server.stdio import stdio_server

    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )
