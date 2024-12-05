import cron from "node-cron";
import sqlite3 from "sqlite3";
import productCreator from "./product-creator.js";
import { getSessionById } from "../repository/shopifySession.js";
import importController from "../controllers/importController.js";
import shopify from "./shopify.js";
import postDataTrovaUsati from "./utils/travosatiSelledProduct.js";



export const updateLastWeekOrdersTags = async () => {


  try {
    const session = await getSessionById(
      "offline_" + "istoredevelopment.myshopify.com"
    );
    
    // Calculate the date range for the last week
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    console.log(
      `Fetching orders from ${lastWeek.toISOString()} to ${today.toISOString()}`
    );

    // Fetch orders from the last week
    const orders = await shopify.api.rest.Order.all({
      session,
      created_at_min: lastWeek.toISOString(),
      created_at_max: today.toISOString(),
      status: "any", // to include all orders
    });
   
    console.log(`Fetched ${orders.length} orders`);

    for (const order of orders) {
      let idsCUInOrder = [];
      let idsISTInOrder = [];
      if (!order.tags) {
        console.log(`Processing order ID: ${order.id}`);

        let nbrCU = 0;
        let nbrIST = 0;

        for (const line_item of order.line_items) {
          const product = await shopify.api.rest.Product.find({
            session,
            id: line_item.product_id,
          });

          if (product.tags.includes("ImportatiCU")) {
            const idTrovaUsati = product.tags.split("{")[1].split("}")[0];
            idsCUInOrder.push(idTrovaUsati);
            
            nbrCU++;
          }
          if (product.tags.includes("ImportatiIST")) {
            console.log(product.tags);
            const idTrovaUsati = product.tags.split("{")[1].split("}")[0];
            idsISTInOrder.push(idTrovaUsati);
            nbrIST++;
          }

          console.log(
            `Product ID: ${product.id}, CU Count: ${nbrCU}, IST Count: ${nbrIST}`
          );
        }
  
        if (idsCUInOrder.length > 0) {
          console.log("Posting data to TrovaUsati for CU products:", idsCUInOrder);
          await postDataTrovaUsati(idsCUInOrder, "CU");
        }
        if (idsISTInOrder.length > 0) {
          console.log("Posting data to TrovaUsati for IST products:", idsISTInOrder);
          await postDataTrovaUsati(idsISTInOrder, "IST");
        }

        let orderTags = "";
        if (nbrIST !== 0 && nbrCU !== 0) {
          orderTags = "IST, CU";
        } else if (nbrIST) {
          orderTags = "IST";
        } else {
          orderTags = "CU";
        }

        console.log(`Updating order ID: ${order.id} with tags: ${orderTags}`);

        const orderToUpdate = new shopify.api.rest.Order({ session });
        orderToUpdate.id = order.id;
        orderToUpdate.tags = orderTags;

        await orderToUpdate.save({ update: true });
        console.log(`Order ID: ${order.id} updated successfully`);
      } else {
        console.log(`Order ID: ${order.id} already has tags: ${order.tags}`);
      }
    }
   
 await productCreator(session);
 
  } catch (e) {
    console.log(`Failed to process orders/last-week: ${e.message}`);
    // res.status(status).send({ success: false, error });
  }
};



export default async function autoImport() {
  
  const time = new Date();
  console.log(time.toLocaleString());
  try {
    // Task to run at midnight (00:00)
    cron.schedule("0 0 * * *", async () => {
      try {
        const session = await getSessionById(
          "offline_" + "istoredevelopment.myshopify.com"
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
          "offline_" + "istoredevelopment.myshopify.com"
        );
        productCreator(session);
        importController.getAmazonProducts()
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
            "offline_" + "istoredevelopment.myshopify.com"
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


