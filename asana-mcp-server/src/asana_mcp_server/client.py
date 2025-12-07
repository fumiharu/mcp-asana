import os
import asana
from typing import Optional, List, Dict, Any

class AsanaClient:
    def __init__(self, access_token: Optional[str] = None):
        self.access_token = access_token or os.environ.get("ASANA_ACCESS_TOKEN")
        if not self.access_token:
            raise ValueError("ASANA_ACCESS_TOKEN environment variable is required")

        self.configuration = asana.Configuration()
        self.configuration.access_token = self.access_token
        self.api_client = asana.ApiClient(self.configuration)

        self.users_api = asana.UsersApi(self.api_client)
        self.tasks_api = asana.TasksApi(self.api_client)
        self.projects_api = asana.ProjectsApi(self.api_client)
        self.workspaces_api = asana.WorkspacesApi(self.api_client)
        self.stories_api = asana.StoriesApi(self.api_client)

    def get_me(self) -> Dict[str, Any]:
        """Get the current user's information."""
        return self.users_api.get_user("me", opts={'opt_fields': "gid,name,email,workspaces"})

    def get_workspaces(self) -> List[Dict[str, Any]]:
        """Get a list of workspaces accessible to the user."""
        return list(self.workspaces_api.get_workspaces(opts={'opt_fields': "gid,name"}))

    def get_my_tasks(self, workspace_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Get tasks assigned to the current user."""
        # If workspace_id is not provided, we need to find a default one or iterate?
        # Actually get_tasks usually requires workspace or project or assignee.
        # For "my tasks", we usually filter by assignee='me' and workspace.

        if not workspace_id:
            # Try to get the first workspace from 'me'
            me = self.get_me()
            if me.get('workspaces'):
                workspace_id = me['workspaces'][0]['gid']
            else:
                raise ValueError("No workspace found for user")

        opts = {
            'workspace': workspace_id,
            'assignee': 'me',
            'completed_since': 'now', # Only incomplete tasks by default? Or maybe 'now' means recently completed?
            # actually 'completed_since'='now' returns incomplete tasks.
            # If we want all, we might not set this. Let's return incomplete tasks by default.
            'limit': limit,
            'opt_fields': "gid,name,due_on,completed,projects.name"
        }
        return list(self.tasks_api.get_tasks(opts))

    def search_tasks(self, query: str, workspace_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Search for tasks.
        Using typeahead for simple text search or regular search?
        The standard search API is powerful but complex.
        Let's use typeahead for 'resource' like search, but maybe full search for tools.
        Actually, let's use the 'get_tasks' with text filter if available, or typeahead.
        """
        if not workspace_id:
             me = self.get_me()
             if me.get('workspaces'):
                 workspace_id = me['workspaces'][0]['gid']
             else:
                 raise ValueError("No workspace found for user")

        # Using Typeahead for simple text search
        typeahead_api = asana.TypeaheadApi(self.api_client)
        opts = {
            'resource_type': 'task',
            'query': query,
            'opt_fields': "gid,name,completed,due_on,projects.name"
        }
        return list(typeahead_api.typeahead_for_workspace(workspace_id, 'task', opts))

    def create_task(self, name: str, project_id: Optional[str] = None,
                    workspace_id: Optional[str] = None,
                    due_on: Optional[str] = None,
                    notes: Optional[str] = None) -> Dict[str, Any]:
        """Create a new task."""
        body = {"data": {
            "name": name,
            "notes": notes,
            "due_on": due_on
        }}

        if project_id:
            body["data"]["projects"] = [str(project_id)]

        if workspace_id and not project_id:
            body["data"]["workspace"] = str(workspace_id)
        elif not workspace_id and not project_id:
             # Default to first workspace
             me = self.get_me()
             if me.get('workspaces'):
                 body["data"]["workspace"] = me['workspaces'][0]['gid']

        # If project_id is set, workspace is inferred from project, so we don't strictly need it unless project is not in default workspace?
        # Asana API usually handles project -> workspace inference.

        return self.tasks_api.create_task(body, opts={'opt_fields': "gid,name,permalink_url"})

    def update_task(self, task_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing task."""
        body = {"data": data}
        return self.tasks_api.update_task(body, task_id, opts={'opt_fields': "gid,name,completed"})

    def get_task(self, task_id: str) -> Dict[str, Any]:
        """Get full details of a task."""
        return self.tasks_api.get_task(task_id, opts={'opt_fields': "gid,name,notes,completed,due_on,projects.name,permalink_url,assignee.name"})

    def get_project_tasks(self, project_id: str) -> List[Dict[str, Any]]:
        """Get tasks in a project."""
        opts = {
            'project': project_id,
            'opt_fields': "gid,name,completed,due_on,assignee.name"
        }
        return list(self.tasks_api.get_tasks(opts))

    def add_comment(self, task_id: str, text: str) -> Dict[str, Any]:
        """Add a comment to a task."""
        body = {"data": {"text": text}}
        return self.stories_api.create_story_for_task(body, task_id, opts={'opt_fields': "gid,text"})

    def mark_task_complete(self, task_id: str) -> Dict[str, Any]:
        return self.update_task(task_id, {"completed": True})

    def mark_task_incomplete(self, task_id: str) -> Dict[str, Any]:
        return self.update_task(task_id, {"completed": False})
