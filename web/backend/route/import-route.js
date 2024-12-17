/*
  The custom REST API to support the app frontend.
  Handlers combine application data from qr-codes-db.js with helpers to merge the Shopify GraphQL Admin API data.
  The Shop is the Shop that the current user belongs to. For example, the shop that is using the app.
  This information is retrieved from the Authorization header, which is decoded from the request.
  The authorization header is added by App Bridge in the frontend code.
*/

// import-route.js
import express from "express";
import importController from "../controllers/importController.js";
import { createGtin, deleteGtin, getAllGtins, getGtinById, updateGtin } from "../controllers/barcode.controller.js";

const privateRouter = express.Router();

privateRouter.get("/api/products/count", importController.countproduct);
privateRouter.get("/api/products/create", importController.createProduct);
privateRouter.get("/api/orders/last-week", importController.updateLastWeekOrdersTags); 
privateRouter.get("/api/amazon", importController.getAmazonProducts); 
privateRouter.get("/api/get-products", importController.getAllProducts);
privateRouter.get("/api/update-barecode", importController.updateAllBareCodes);
privateRouter.get("/api/gtins/get", getAllGtins);
privateRouter.get("/api/gtins/:id", getGtinById);
privateRouter.post("/api/gtins", createGtin);
privateRouter.put("/api/gtins/update/:id", updateGtin);
privateRouter.delete("/api/gtins/:id", deleteGtin);

export default privateRouter;
