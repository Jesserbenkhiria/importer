// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import shopify from "./service/shopify.js";
import privateRouter from "./route/import-route.js";
import shopifyRouter from "./route/shopify-route.js";
import autoImport, { updateLastWeekOrdersTags } from "./service/autoImport.js";


const PORT = 4000;

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();
// autoImport();
// updateLastWeekOrdersTags();
// app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(shopifyRouter);
app.use(privateRouter);

app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);