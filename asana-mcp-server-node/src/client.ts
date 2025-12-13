/**
 * Asana API Client Wrapper
 * Provides a singleton client for interacting with the Asana API
 */

import * as Asana from 'asana';
import { User, Workspace, Task, Story, TaskUpdateData } from './types.js';

export class AsanaClient {
  private static instance: AsanaClient | null = null;
  private client: Asana.ApiClientInstance;
  private accessToken: string;

  /**
   * Private constructor - use getInstance() instead
   */
  private constructor(accessToken?: string) {
    this.accessToken = accessToken || process.env.ASANA_ACCESS_TOKEN || '';
    if (!this.accessToken) {
      throw new Error('ASANA_ACCESS_TOKEN environment variable is required');
    }

    // Initialize Asana API client
    this.client = Asana.ApiClient.instance;
    const token = this.client.authentications['token'];
    token.accessToken = this.accessToken;
  }

  /**
   * Get the singleton instance of AsanaClient
   */
  public static getInstance(accessToken?: string): AsanaClient {
    if (!AsanaClient.instance) {
      AsanaClient.instance = new AsanaClient(accessToken);
    }
    return AsanaClient.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    AsanaClient.instance = null;
  }

  /**
   * Get the current user's information
   */
  public async getMe(): Promise<User> {
    const usersApi = new Asana.UsersApi();
    const result = await usersApi.getUser('me', {
      opt_fields: 'gid,name,email,workspaces'
    });
    return result.data as User;
  }

  /**
   * Get a list of workspaces accessible to the user
   */
  public async getWorkspaces(): Promise<Workspace[]> {
    const workspacesApi = new Asana.WorkspacesApi();
    const result = await workspacesApi.getWorkspaces({
      opt_fields: 'gid,name'
    });
    return result.data as Workspace[];
  }

  /**
   * Get tasks assigned to the current user
   * @param workspaceId - Optional workspace ID (defaults to first workspace)
   * @param limit - Maximum number of tasks to return (default 50)
   */
  public async getMyTasks(workspaceId?: string, limit: number = 50): Promise<Task[]> {
    let workspace = workspaceId;

    // If workspace_id is not provided, get the first workspace
    if (!workspace) {
      const me = await this.getMe();
      if (me.workspaces && me.workspaces.length > 0) {
        workspace = me.workspaces[0].gid;
      } else {
        throw new Error('No workspace found for user');
      }
    }

    const tasksApi = new Asana.TasksApi();
    const result = await tasksApi.getTasks({
      workspace: workspace,
      assignee: 'me',
      completed_since: 'now', // Returns only incomplete tasks
      limit: limit,
      opt_fields: 'gid,name,due_on,completed,projects.name'
    });

    return result.data as Task[];
  }

  /**
   * Search for tasks using typeahead
   * @param query - Search query string
   * @param workspaceId - Optional workspace ID (defaults to first workspace)
   */
  public async searchTasks(query: string, workspaceId?: string): Promise<Task[]> {
    let workspace = workspaceId;

    // If workspace_id is not provided, get the first workspace
    if (!workspace) {
      const me = await this.getMe();
      if (me.workspaces && me.workspaces.length > 0) {
        workspace = me.workspaces[0].gid;
      } else {
        throw new Error('No workspace found for user');
      }
    }

    const typeaheadApi = new Asana.TypeaheadApi();
    const result = await typeaheadApi.typeaheadForWorkspace(workspace, {
      resource_type: Asana.TypeaheadApi.ResourceTypeEnum.Task,
      query: query,
      opt_fields: 'gid,name,completed,due_on,projects.name'
    });

    return result.data as Task[];
  }

  /**
   * Create a new task
   * @param name - Task name (required)
   * @param projectId - Optional project ID
   * @param workspaceId - Optional workspace ID (defaults to first workspace if no project)
   * @param dueOn - Optional due date (YYYY-MM-DD format)
   * @param notes - Optional task notes
   */
  public async createTask(
    name: string,
    projectId?: string,
    workspaceId?: string,
    dueOn?: string,
    notes?: string
  ): Promise<Task> {
    const data: any = { name };

    // Only include notes if provided (Asana API requirement)
    if (notes) {
      data.notes = notes;
    }

    if (dueOn) {
      data.due_on = dueOn;
    }

    if (projectId) {
      data.projects = [projectId];
    }

    // Handle workspace: only set if no project, or if explicitly provided
    if (workspaceId && !projectId) {
      data.workspace = workspaceId;
    } else if (!workspaceId && !projectId) {
      // Default to first workspace
      const me = await this.getMe();
      if (me.workspaces && me.workspaces.length > 0) {
        data.workspace = me.workspaces[0].gid;
      }
    }
    // If project_id is set, workspace is inferred from project

    const tasksApi = new Asana.TasksApi();
    const result = await tasksApi.createTask({
      data: data
    }, {
      opt_fields: 'gid,name,permalink_url'
    });

    return result.data as Task;
  }

  /**
   * Update an existing task
   * @param taskId - Task ID
   * @param data - Fields to update
   */
  public async updateTask(taskId: string, data: TaskUpdateData): Promise<Task> {
    const tasksApi = new Asana.TasksApi();
    const result = await tasksApi.updateTask({
      data: data
    }, taskId, {
      opt_fields: 'gid,name,completed'
    });

    return result.data as Task;
  }

  /**
   * Get full details of a task
   * @param taskId - Task ID
   */
  public async getTask(taskId: string): Promise<Task> {
    const tasksApi = new Asana.TasksApi();
    const result = await tasksApi.getTask(taskId, {
      opt_fields: 'gid,name,notes,completed,due_on,projects.name,permalink_url,assignee.name'
    });

    return result.data as Task;
  }

  /**
   * Get tasks in a project
   * @param projectId - Project ID
   */
  public async getProjectTasks(projectId: string): Promise<Task[]> {
    const tasksApi = new Asana.TasksApi();
    const result = await tasksApi.getTasks({
      project: projectId,
      opt_fields: 'gid,name,completed,due_on,assignee.name'
    });

    return result.data as Task[];
  }

  /**
   * Add a comment to a task
   * @param taskId - Task ID
   * @param text - Comment text
   */
  public async addComment(taskId: string, text: string): Promise<Story> {
    const storiesApi = new Asana.StoriesApi();
    const result = await storiesApi.createStoryForTask({
      data: { text }
    }, taskId, {
      opt_fields: 'gid,text'
    });

    return result.data as Story;
  }

  /**
   * Mark a task as complete
   * @param taskId - Task ID
   */
  public async markTaskComplete(taskId: string): Promise<Task> {
    return this.updateTask(taskId, { completed: true });
  }

  /**
   * Mark a task as incomplete
   * @param taskId - Task ID
   */
  public async markTaskIncomplete(taskId: string): Promise<Task> {
    return this.updateTask(taskId, { completed: false });
  }
}

/**
 * Get the singleton AsanaClient instance
 * This function matches the Python pattern: get_client()
 */
export function getClient(): AsanaClient {
  return AsanaClient.getInstance();
}
