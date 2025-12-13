/**
 * Tests for AsanaClient
 *
 * このテストスイートは、AsanaClientクラスの主要機能を検証します。
 * Asana SDKをモック化することで、実際のAPIコールなしにクライアントの動作を確認できます。
 */

import { AsanaClient, getClient } from '../src/client.js';
import * as Asana from 'asana';

// Asanaモジュールをモック化
// 理由: 実際のAsana APIを呼び出すことなく、クライアントのロジックのみをテストするため
jest.mock('asana');

describe('AsanaClient', () => {
  beforeEach(() => {
    // 各テストの前にテスト用の環境変数を設定
    // 理由: 本番のAPIトークンを使わず、安全にテストを実行するため
    process.env.ASANA_ACCESS_TOKEN = 'test_token_12345';

    // シングルトンインスタンスをリセット
    // 理由: 各テストが独立して実行されるようにするため（テスト間の影響を防ぐ）
    AsanaClient.resetInstance();

    // すべてのモックをクリア
    // 理由: 前のテストの呼び出し履歴が残らないようにするため
    jest.clearAllMocks();
  });

  afterEach(() => {
    // 環境変数をクリーンアップ
    // 理由: テスト後に環境を元に戻し、他のテストに影響を与えないため
    delete process.env.ASANA_ACCESS_TOKEN;
  });

  describe('getInstance', () => {
    /**
     * テスト: ASANA_ACCESS_TOKENが設定されていない場合のエラー処理
     * 目的: APIトークンが必須であることを確認
     * 理由: トークンなしでAsana APIにアクセスしようとすると認証エラーになるため、
     *       早期にエラーを検出して明確なメッセージを表示することが重要
     */
    it('should throw error if ASANA_ACCESS_TOKEN is not set', () => {
      delete process.env.ASANA_ACCESS_TOKEN;
      expect(() => AsanaClient.getInstance()).toThrow('ASANA_ACCESS_TOKEN environment variable is required');
    });

    /**
     * テスト: シングルトンパターンの検証
     * 目的: getInstance()が常に同じインスタンスを返すことを確認
     * 理由: 複数のインスタンスが作成されると、認証状態や接続が無駄に複数作られ、
     *       リソースの浪費やバグの原因になる。シングルトンパターンで1つのインスタンスを保証
     */
    it('should create a singleton instance', () => {
      const instance1 = AsanaClient.getInstance();
      const instance2 = AsanaClient.getInstance();
      expect(instance1).toBe(instance2);
    });

    /**
     * テスト: カスタムアクセストークンの使用
     * 目的: 環境変数以外の方法でもトークンを指定できることを確認
     * 理由: テスト環境や特殊なユースケースで、環境変数を使わずに
     *       直接トークンを渡せると便利（柔軟性の向上）
     */
    it('should use provided access token', () => {
      const customToken = 'custom_token_67890';
      const instance = AsanaClient.getInstance(customToken);
      expect(instance).toBeDefined();
    });
  });

  describe('getClient', () => {
    /**
     * テスト: getClient()ヘルパー関数の動作確認
     * 目的: getClient()がgetInstance()と同じシングルトンを返すことを確認
     * 理由: Python版のget_client()パターンを再現するために実装したヘルパー関数が、
     *       正しくシングルトンインスタンスを返すことを保証
     */
    it('should return the singleton instance', () => {
      const client1 = getClient();
      const client2 = getClient();
      expect(client1).toBe(client2);
    });
  });

  describe('getMe', () => {
    /**
     * テスト: ユーザー情報取得
     * 目的: getMe()が正しくユーザー情報とワークスペースを取得できることを確認
     * 理由: ユーザー情報は、ワークスペースのデフォルト設定などで使用される重要なデータ。
     *       正しいopt_fieldsパラメータでAPI呼び出しができることを検証
     */
    it('should return user information', async () => {
      const mockUserData = {
        data: {
          gid: '1234567890',
          name: 'Test User',
          email: 'test@example.com',
          workspaces: [
            { gid: 'ws1', name: 'Workspace 1' },
            { gid: 'ws2', name: 'Workspace 2' }
          ]
        }
      };

      // Mock UsersApi
      const mockGetUser = jest.fn().mockResolvedValue(mockUserData);
      (Asana.UsersApi as jest.MockedClass<typeof Asana.UsersApi>).mockImplementation(() => ({
        getUser: mockGetUser,
      } as any));

      const client = AsanaClient.getInstance();
      const user = await client.getMe();

      expect(user.gid).toBe('1234567890');
      expect(user.name).toBe('Test User');
      expect(user.workspaces).toHaveLength(2);
      expect(mockGetUser).toHaveBeenCalledWith('me', {
        opt_fields: 'gid,name,email,workspaces'
      });
    });
  });

  describe('getMyTasks', () => {
    /**
     * テスト: 指定したワークスペースのタスク取得
     * 目的: workspace_idとlimitパラメータが正しくAsana APIに渡されることを確認
     * 理由: ユーザーが特定のワークスペースのタスクを取得する際、正しいパラメータで
     *       API呼び出しが行われることを保証。completed_since: 'now'により
     *       未完了タスクのみが返されることも検証
     */
    it('should get tasks for specified workspace', async () => {
      const mockTasksData = {
        data: [
          { gid: 'task1', name: 'Task 1', completed: false },
          { gid: 'task2', name: 'Task 2', completed: false }
        ]
      };

      const mockGetTasks = jest.fn().mockResolvedValue(mockTasksData);
      (Asana.TasksApi as jest.MockedClass<typeof Asana.TasksApi>).mockImplementation(() => ({
        getTasks: mockGetTasks,
      } as any));

      const client = AsanaClient.getInstance();
      const tasks = await client.getMyTasks('ws1', 20);

      expect(tasks).toHaveLength(2);
      expect(mockGetTasks).toHaveBeenCalledWith({
        workspace: 'ws1',
        assignee: 'me',
        completed_since: 'now',
        limit: 20,
        opt_fields: 'gid,name,due_on,completed,projects.name'
      });
    });

    /**
     * テスト: ワークスペース未指定時のデフォルト動作
     * 目的: workspace_idが指定されていない場合、自動的にユーザーの最初のワークスペースを使用することを確認
     * 理由: これは重要な設計パターン。ユーザーがワークスペースIDを知らなくても、
     *       直感的にタスクを取得できるようにする。Python版と同じ動作を保証
     */
    it('should default to first workspace if not provided', async () => {
      const mockUserData = {
        data: {
          gid: '1234567890',
          name: 'Test User',
          workspaces: [{ gid: 'default_ws', name: 'Default Workspace' }]
        }
      };

      const mockTasksData = {
        data: [{ gid: 'task1', name: 'Task 1' }]
      };

      const mockGetUser = jest.fn().mockResolvedValue(mockUserData);
      const mockGetTasks = jest.fn().mockResolvedValue(mockTasksData);

      (Asana.UsersApi as jest.MockedClass<typeof Asana.UsersApi>).mockImplementation(() => ({
        getUser: mockGetUser,
      } as any));

      (Asana.TasksApi as jest.MockedClass<typeof Asana.TasksApi>).mockImplementation(() => ({
        getTasks: mockGetTasks,
      } as any));

      const client = AsanaClient.getInstance();
      await client.getMyTasks();

      expect(mockGetTasks).toHaveBeenCalledWith(expect.objectContaining({
        workspace: 'default_ws',
      }));
    });
  });

  describe('createTask', () => {
    /**
     * テスト: すべてのフィールドを指定してタスクを作成
     * 目的: name, notes, due_on, project_idなどすべてのパラメータが正しく渡されることを確認
     * 理由: タスク作成は最も重要な機能の1つ。すべてのフィールドが正しく
     *       Asana APIに送信されることを保証する必要がある
     */
    it('should create task with all fields', async () => {
      const mockTaskData = {
        data: {
          gid: 'new_task_123',
          name: 'New Task',
          permalink_url: 'https://app.asana.com/0/0/new_task_123'
        }
      };

      const mockCreateTask = jest.fn().mockResolvedValue(mockTaskData);
      (Asana.TasksApi as jest.MockedClass<typeof Asana.TasksApi>).mockImplementation(() => ({
        createTask: mockCreateTask,
      } as any));

      const client = AsanaClient.getInstance();
      const task = await client.createTask(
        'New Task',
        'project_123',
        undefined,
        '2025-12-31',
        'Task notes here'
      );

      expect(task.gid).toBe('new_task_123');
      expect(mockCreateTask).toHaveBeenCalledWith(
        {
          data: {
            name: 'New Task',
            notes: 'Task notes here',
            due_on: '2025-12-31',
            projects: ['project_123']
          }
        },
        { opt_fields: 'gid,name,permalink_url' }
      );
    });

    /**
     * テスト: notesフィールドが未指定の場合に含まれないことの検証
     * 目的: notesがundefinedの場合、API呼び出しにnotesフィールドが含まれないことを確認
     * 理由: これは非常に重要なテスト。Asana APIは空のnotesフィールドを受け取るとエラーを返す。
     *       条件付きでnotesを含める実装（if (notes) data.notes = notes）が
     *       正しく動作していることを保証する。これがないとタスク作成が失敗する
     */
    it('should not include notes if not provided', async () => {
      const mockTaskData = {
        data: { gid: 'new_task_456', name: 'Task without notes' }
      };

      const mockCreateTask = jest.fn().mockResolvedValue(mockTaskData);
      (Asana.TasksApi as jest.MockedClass<typeof Asana.TasksApi>).mockImplementation(() => ({
        createTask: mockCreateTask,
      } as any));

      const client = AsanaClient.getInstance();
      await client.createTask('Task without notes', 'project_123');

      const callArgs = mockCreateTask.mock.calls[0][0];
      expect(callArgs.data.notes).toBeUndefined();
      expect(callArgs.data.name).toBe('Task without notes');
    });
  });

  describe('updateTask', () => {
    /**
     * テスト: タスク更新機能
     * 目的: updateTask()が指定されたフィールドのみを更新することを確認
     * 理由: タスクの部分更新は頻繁に使用される機能。nameやcompletedなど、
     *       指定されたフィールドだけが更新データに含まれることを保証。
     *       これにより、意図しないフィールドが上書きされるのを防ぐ
     */
    it('should update task with provided fields', async () => {
      const mockTaskData = {
        data: {
          gid: 'task_789',
          name: 'Updated Task',
          completed: true
        }
      };

      const mockUpdateTask = jest.fn().mockResolvedValue(mockTaskData);
      (Asana.TasksApi as jest.MockedClass<typeof Asana.TasksApi>).mockImplementation(() => ({
        updateTask: mockUpdateTask,
      } as any));

      const client = AsanaClient.getInstance();
      const task = await client.updateTask('task_789', {
        name: 'Updated Task',
        completed: true
      });

      expect(task.completed).toBe(true);
      expect(mockUpdateTask).toHaveBeenCalledWith(
        {
          data: {
            name: 'Updated Task',
            completed: true
          }
        },
        'task_789',
        { opt_fields: 'gid,name,completed' }
      );
    });
  });
});
