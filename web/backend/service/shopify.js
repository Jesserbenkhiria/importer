import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the parent project directory
config({ path: path.resolve(__dirname, '../.env') });


import { shopifyApp } from '@shopify/shopify-app-express';
import { MySQLSessionStorage } from '@shopify/shopify-app-session-storage-mysql';
import { LATEST_API_VERSION } from '@shopify/shopify-api';
// Create MySQL session storage with connection pool limit
const sessionStorage = new MySQLSessionStorage(
  process.env.DATABASE_URL,
  { connectionPoolLimit: 10 } // optional: adjust as needed
);

let { restResources } = await import(
  `@shopify/shopify-api/rest/admin/${LATEST_API_VERSION}`
);

// Initialize Shopify app
const shopify = shopifyApp({
  api: {
    restResources,
    // Adjust as per your Shopify API version requirements
  },
  auth: {
    path: '/api/auth',
    callbackPath: '/api/auth/callback',
  },
  webhooks: {
    path: '/api/webhooks',
  },
  sessionStorage, // Use the MySQL session storage
});

export default shopify;
