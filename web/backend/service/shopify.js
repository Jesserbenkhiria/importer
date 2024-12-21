import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the parent project directory
config({ path: path.resolve(__dirname, "../.env") });

import { shopifyApp } from "@shopify/shopify-app-express";
import { MySQLSessionStorage } from "@shopify/shopify-app-session-storage-mysql";
import { LATEST_API_VERSION } from "@shopify/shopify-api";

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
    apiKey: process.env.SHOPIFY_API_KEY, // Chiave API dal file .env
    apiSecretKey: process.env.SHOPIFY_CLIENT_SECRET, // Chiave segreta API dal file .env
    hostName: process.env.SHOPIFY_HOST_NAME, // Nome host dal file .env
    apiVersion: LATEST_API_VERSION,
    restResources,
    future: {
      customerAddressDefaultFix: true,
      lineItemBilling: true,
      unstable_managedPricingSupport: true,
    },
    billing: undefined, // Configura la fatturazione se necessario
    scopes: process.env.SHOPIFY_SCOPES.split(","), // Converte l'array di scope dal .env in JSON
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage, // Use the MySQL session storage
});

export default shopify;
