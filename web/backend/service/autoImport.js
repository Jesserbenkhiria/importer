import cron from "node-cron";
import sqlite3 from "sqlite3";
import productCreator from "./product-creator.js";
import { getSessionById } from "../repository/shopifySession.js";

export default async function autoImport() {
  const time = new Date();
  console.log(time.toLocaleString());
  try {
    // Task to run at midnight (00:00)
    cron.schedule("0 0 * * *", async () => {
      try {
        const session = await getSessionById(
          "offline_" + "istoremilano.myshopify.com"
        );
        productCreator(session);
      } catch (error) {
        console.error("Error in midnight task:", error);
      }
    });

    // Task to run at midday (12:00)
    cron.schedule("0 12 * * *", async () => {
      console.log("cron start");
      try {
        const session = await getSessionById(
          "offline_" + "istoremilano.myshopify.com"
        );
        productCreator(session);
      } catch (error) {
        console.error("Error in midday task:", error);
      }
    });

    // Tasks to run from 9 to 18 every 2 hours
    for (let hour = 8; hour <= 18; hour += 2) {
      console.log("cron start");
      cron.schedule(`0 ${hour} * * *`, async () => {
        try {
          const session = await getSessionById(
            "offline_" + "istoremilano.myshopify.com"
          );
          productCreator(session);
          console.log("cron end");
        } catch (error) {
          console.error(`Error at ${hour}:00 task:`, error);
        }
      });
      
    }
  } catch (error) {
    console.error("Error in autoImport:", error);
  }
}

async function getSession() {
  const db = new sqlite3.Database(`${process.cwd()}/database.sqlite`);
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM shopify_sessions WHERE shop = 'istoredevelopment.myshopify.com'",
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close(); // Close the database connection
      }
    );
  });
}
