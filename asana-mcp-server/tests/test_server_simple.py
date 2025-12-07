import unittest
from unittest.mock import MagicMock, patch, AsyncMock
import json

# Test that client wrapper is correctly called from logic that resembles the server handler
# Since we cannot easily import the inner functions of server.serve(),
# we will verify the logic flow by recreating the critical parts in the test or trust the client tests.
# However, we can mock `server.serve` and import `AsanaClient` to verify the module loads.

class TestServerModule(unittest.TestCase):
    def test_module_import(self):
        """Test that the server module can be imported without errors."""
        import asana_mcp_server.server
        self.assertTrue(True)

    def test_get_client(self):
        """Test singleton behavior of get_client."""
        from asana_mcp_server.server import get_client, asana_client
        with patch('asana_mcp_server.server.AsanaClient') as MockClient:
            client1 = get_client()
            client2 = get_client()
            self.assertIs(client1, client2)
            MockClient.assert_called_once()

            # Reset for other tests if needed
            import asana_mcp_server.server
            asana_mcp_server.server.asana_client = None

if __name__ == "__main__":
    unittest.main()
