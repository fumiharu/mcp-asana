/**
 * Type definitions for asana npm package
 * The official asana npm package doesn't include TypeScript definitions
 */

declare module 'asana' {
  export interface ApiClientAuthentication {
    accessToken: string;
  }

  export interface ApiClientInstance {
    authentications: {
      token: ApiClientAuthentication;
    };
  }

  export class ApiClient {
    static instance: ApiClientInstance;
  }

  export class UsersApi {
    getUser(userGid: string, opts?: any): Promise<any>;
  }

  export class TasksApi {
    getTasks(opts?: any): Promise<any>;
    getTask(taskGid: string, opts?: any): Promise<any>;
    createTask(body: any, opts?: any): Promise<any>;
    updateTask(body: any, taskGid: string, opts?: any): Promise<any>;
  }

  export class ProjectsApi {
    getProjects(opts?: any): Promise<any>;
    getProject(projectGid: string, opts?: any): Promise<any>;
  }

  export class WorkspacesApi {
    getWorkspaces(opts?: any): Promise<any>;
    getWorkspace(workspaceGid: string, opts?: any): Promise<any>;
  }

  export class StoriesApi {
    createStoryForTask(body: any, taskGid: string, opts?: any): Promise<any>;
    getStoriesForTask(taskGid: string, opts?: any): Promise<any>;
  }

  export class TypeaheadApi {
    static ResourceTypeEnum: {
      Task: 'task';
      Project: 'project';
      User: 'user';
      Tag: 'tag';
    };
    typeaheadForWorkspace(workspaceGid: string, opts?: any): Promise<any>;
  }
}
