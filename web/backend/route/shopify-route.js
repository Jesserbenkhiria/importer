import express from 'express';
import shopify from '../service/shopify.js';
import webHooks from '../service/webHook.js';

const shopifyRouter = express.Router();

// Set up Shopify authentication and webhook handling
shopifyRouter.get(shopify.config.auth.path, shopify.auth.begin());
shopifyRouter.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
shopifyRouter.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: webHooks })
);

// All endpoints after this point will require an active session
shopifyRouter.use('/api/*', shopify.validateAuthenticatedSession());

export default shopifyRouter;
