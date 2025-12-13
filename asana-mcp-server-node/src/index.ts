#!/usr/bin/env node

/**
 * Entry point for Asana MCP Server
 */

import { serve } from './server.js';

/**
 * Main function that starts the server
 */
async function main(): Promise<void> {
  try {
    await serve();
  } catch (error) {
    console.error('Server error:', error);
    process.exit(1);
  }
}

// Run the server if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export public API
export { serve } from './server.js';
export { AsanaClient, getClient } from './client.js';
export * from './types.js';
