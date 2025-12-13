/**
 * MCP Server Implementation for Asana
 * Provides resources, tools, and handlers for Asana task management
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getClient } from './client.js';
import { TaskUpdateData } from './types.js';

/**
 * Main serve function that sets up and runs the MCP server
 */
export async function serve(): Promise<void> {
  const server = new Server(
    {
      name: 'asana-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  /**
   * Handler: list_resources
   * 利用可能なリソースを一覧表示します
   * ユーザーのワークスペースを「ルート」として一覧表示します
   */
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const client = getClient();
    const workspaces = await client.getWorkspaces();

    return {
      resources: workspaces.map((workspace) => ({
        uri: `asana://workspaces/${workspace.gid}/tasks`,
        name: `Tasks in ${workspace.name}`,
        description: `List of tasks in workspace ${workspace.name}`,
        mimeType: 'application/json',
      })),
    };
  });

  /**
   * Handler: read_resource
   * 特定のリソースを読み込みます
   * サポートされているスキーム:
   * - asana://tasks/{task_id} -> タスクの詳細を返します
   * - asana://projects/{project_id}/tasks -> プロジェクト内のタスク一覧を返します
   * - asana://workspaces/{workspace_id}/tasks -> ワークスペース内のタスク一覧を返します
   */
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const client = getClient();

    try {
      if (uri.includes('asana://tasks/')) {
        // Get task details
        const taskId = uri.split('asana://tasks/')[1];
        const task = await client.getTask(taskId);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(task, null, 2),
            },
          ],
        };
      } else if (uri.includes('asana://projects/') && uri.endsWith('/tasks')) {
        // Get project tasks
        const projectId = uri.split('asana://projects/')[1].replace('/tasks', '');
        const tasks = await client.getProjectTasks(projectId);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(tasks, null, 2),
            },
          ],
        };
      } else if (uri.includes('asana://workspaces/') && uri.endsWith('/tasks')) {
        // Get workspace tasks (assigned to current user)
        const workspaceId = uri.split('asana://workspaces/')[1].replace('/tasks', '');
        const tasks = await client.getMyTasks(workspaceId);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(tasks, null, 2),
            },
          ],
        };
      }

      throw new Error(`Unsupported URI: ${uri}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: `Error: ${errorMessage}`,
          },
        ],
      };
    }
  });

  /**
   * Handler: list_tools
   * 利用可能なツールを一覧表示します（6つのツール）
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'get_my_tasks',
          description: 'Get tasks assigned to the current user. Optionally filter by workspace.',
          inputSchema: {
            type: 'object',
            properties: {
              workspace_id: {
                type: 'string',
                description: 'Workspace ID (optional)',
              },
              limit: {
                type: 'integer',
                description: 'Max number of tasks to return (default 50)',
              },
            },
          },
        },
        {
          name: 'search_tasks',
          description: 'Search for tasks using keywords.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search keyword',
              },
              workspace_id: {
                type: 'string',
                description: 'Workspace ID (optional)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'create_task',
          description: 'Create a new task.',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Task name',
              },
              notes: {
                type: 'string',
                description: 'Task description/notes',
              },
              due_on: {
                type: 'string',
                description: 'Due date (YYYY-MM-DD)',
              },
              project_id: {
                type: 'string',
                description: 'Project ID to add task to',
              },
              workspace_id: {
                type: 'string',
                description: 'Workspace ID (optional, defaults to first available)',
              },
            },
            required: ['name'],
          },
        },
        {
          name: 'update_task',
          description: 'Update an existing task.',
          inputSchema: {
            type: 'object',
            properties: {
              task_id: {
                type: 'string',
                description: 'ID of the task to update',
              },
              name: {
                type: 'string',
                description: 'New task name',
              },
              notes: {
                type: 'string',
                description: 'New task notes',
              },
              completed: {
                type: 'boolean',
                description: 'Mark as completed (true) or incomplete (false)',
              },
              due_on: {
                type: 'string',
                description: 'New due date',
              },
            },
            required: ['task_id'],
          },
        },
        {
          name: 'get_task_details',
          description: 'Get full details of a specific task.',
          inputSchema: {
            type: 'object',
            properties: {
              task_id: {
                type: 'string',
                description: 'Task ID',
              },
            },
            required: ['task_id'],
          },
        },
        {
          name: 'add_comment',
          description: 'Add a comment to a task.',
          inputSchema: {
            type: 'object',
            properties: {
              task_id: {
                type: 'string',
                description: 'Task ID',
              },
              text: {
                type: 'string',
                description: 'Comment text',
              },
            },
            required: ['task_id', 'text'],
          },
        },
      ],
    };
  });

  /**
   * Handler: call_tool
   * ツールを実行します（6つのツール実装）
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const client = getClient();

    try {
      let result: any;

      switch (name) {
        case 'get_my_tasks':
          result = await client.getMyTasks(
            args?.workspace_id as string | undefined,
            (args?.limit as number) || 50
          );
          break;

        case 'search_tasks':
          if (!args?.query) {
            throw new Error('query parameter is required');
          }
          result = await client.searchTasks(
            args.query as string,
            args.workspace_id as string | undefined
          );
          break;

        case 'create_task':
          if (!args?.name) {
            throw new Error('name parameter is required');
          }
          result = await client.createTask(
            args.name as string,
            args.project_id as string | undefined,
            args.workspace_id as string | undefined,
            args.due_on as string | undefined,
            args.notes as string | undefined
          );
          break;

        case 'update_task':
          if (!args?.task_id) {
            throw new Error('task_id parameter is required');
          }
          const updateData: TaskUpdateData = {};
          if ('name' in args) updateData.name = args.name as string;
          if ('notes' in args) updateData.notes = args.notes as string;
          if ('completed' in args) updateData.completed = args.completed as boolean;
          if ('due_on' in args) updateData.due_on = args.due_on as string;

          result = await client.updateTask(args.task_id as string, updateData);
          break;

        case 'get_task_details':
          if (!args?.task_id) {
            throw new Error('task_id parameter is required');
          }
          result = await client.getTask(args.task_id as string);
          break;

        case 'add_comment':
          if (!args?.task_id || !args?.text) {
            throw new Error('task_id and text parameters are required');
          }
          result = await client.addComment(args.task_id as string, args.text as string);
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  // stdioトランスポートを使用してサーバーを実行
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
