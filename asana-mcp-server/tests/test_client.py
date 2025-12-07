import unittest
from unittest.mock import MagicMock, patch
import os
from asana_mcp_server.client import AsanaClient

class TestAsanaClient(unittest.TestCase):
    def setUp(self):
        os.environ["ASANA_ACCESS_TOKEN"] = "test_token"
        self.mock_asana_config = patch('asana.Configuration').start()
        self.mock_asana_api_client = patch('asana.ApiClient').start()
        self.mock_users_api = patch('asana.UsersApi').start()
        self.mock_tasks_api = patch('asana.TasksApi').start()
        self.mock_projects_api = patch('asana.ProjectsApi').start()
        self.mock_workspaces_api = patch('asana.WorkspacesApi').start()

    def tearDown(self):
        patch.stopall()
        if "ASANA_ACCESS_TOKEN" in os.environ:
            del os.environ["ASANA_ACCESS_TOKEN"]

    def test_init_raises_without_token(self):
        del os.environ["ASANA_ACCESS_TOKEN"]
        with self.assertRaises(ValueError):
            AsanaClient()

    def test_get_me(self):
        client = AsanaClient()
        client.users_api.get_user.return_value = {"gid": "user1"}
        me = client.get_me()
        client.users_api.get_user.assert_called_with("me", opts={'opt_fields': "gid,name,email,workspaces"})
        self.assertEqual(me, {"gid": "user1"})

    def test_get_my_tasks_with_workspace(self):
        client = AsanaClient()
        client.tasks_api.get_tasks.return_value = [{"gid": "task1"}]
        tasks = client.get_my_tasks(workspace_id="ws1")

        call_kwargs = client.tasks_api.get_tasks.call_args[0][0]
        self.assertEqual(call_kwargs['workspace'], "ws1")
        self.assertEqual(call_kwargs['assignee'], "me")

    def test_get_my_tasks_without_workspace(self):
        client = AsanaClient()
        # Mock get_me to return a workspace
        client.users_api.get_user.return_value = {'workspaces': [{'gid': 'ws_default'}]}
        client.tasks_api.get_tasks.return_value = [{"gid": "task1"}]

        tasks = client.get_my_tasks()

        client.users_api.get_user.assert_called()
        call_kwargs = client.tasks_api.get_tasks.call_args[0][0]
        self.assertEqual(call_kwargs['workspace'], "ws_default")

    def test_create_task(self):
        client = AsanaClient()
        client.create_task("Test Task", workspace_id="ws1")

        client.tasks_api.create_task.assert_called()
        call_args = client.tasks_api.create_task.call_args
        body = call_args[0][0]
        self.assertEqual(body['data']['name'], "Test Task")
        self.assertEqual(body['data']['workspace'], "ws1")

if __name__ == '__main__':
    unittest.main()
