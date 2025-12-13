/**
 * TypeScript type definitions for Asana MCP Server
 */

// Asana entity types
export interface Workspace {
  gid: string;
  name: string;
  resource_type?: string;
}

export interface User {
  gid: string;
  name: string;
  email?: string;
  workspaces?: Workspace[];
  resource_type?: string;
}

export interface Project {
  gid: string;
  name: string;
  workspace?: Workspace;
  resource_type?: string;
}

export interface Task {
  gid: string;
  name: string;
  notes?: string;
  completed?: boolean;
  due_on?: string;
  projects?: { gid: string; name: string }[];
  permalink_url?: string;
  assignee?: { gid: string; name: string };
  workspace?: Workspace;
  resource_type?: string;
}

export interface Story {
  gid: string;
  text: string;
  created_at?: string;
  created_by?: { gid: string; name: string };
  resource_type?: string;
}

// Tool input schemas
export interface GetMyTasksInput {
  workspace_id?: string;
  limit?: number;
}

export interface SearchTasksInput {
  query: string;
  workspace_id?: string;
}

export interface CreateTaskInput {
  name: string;
  notes?: string;
  due_on?: string;
  project_id?: string;
  workspace_id?: string;
}

export interface UpdateTaskInput {
  task_id: string;
  name?: string;
  notes?: string;
  completed?: boolean;
  due_on?: string;
}

export interface GetTaskDetailsInput {
  task_id: string;
}

export interface AddCommentInput {
  task_id: string;
  text: string;
}

// Partial type for updating tasks
export interface TaskUpdateData {
  name?: string;
  notes?: string;
  completed?: boolean;
  due_on?: string;
}
