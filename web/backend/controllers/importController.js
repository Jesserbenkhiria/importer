/*
  The custom REST API to support the app frontend.
  Handlers combine application data from qr-codes-db.js with helpers to merge the Shopify GraphQL Admin API data.
  The Shop is the Shop that the current user belongs to. For example, the shop that is using the app.
  This information is retrieved from the Authorization header, which is decoded from the request.
  The authorization header is added by App Bridge in the frontend code.
*/

import shopify from "../service/shopify.js";
import productCreator from "../service/product-creator.js";
import amazonProducts from "../service/amazonImporter.js";
import postDataTrovaUsati from "../service/utils/travosatiSelledProduct.js";

const importController = {
  countproduct: async (_req, res) => {
    try {
      let session = res.locals.shopify.session;
      let countIst = 0;
      let countIvan = 0;
      let ImportAZ = 0;
      let articles = [];
      do {
        articles.push(
          await shopify.api.rest.Product.all({
            session,
            ...shopify.api.rest.Product.NEXT_PAGE_INFO?.query,
            limit: 250,
          })
        );
      } while (shopify.api.rest.Product.NEXT_PAGE_INFO);
      let product = articles.flat(1);
      console.log("all prodiuct",product.length);
      
      for (let i = 0; i < product.length; i++) {
        if (product[i].status === "active") {
          if (product[i].tags.includes("ImportatiCU")) {
            countIvan++;
          }
          if (product[i].tags.includes("ImportatiIST")) {
            countIst++;
          }
          if (product[i].tags.includes("ImportAZ")) {
            ImportAZ++;
          }
          /*  
          if(product[i].tags.includes("ImportatiIST")){
              await shopify.api.rest.Product.delete({
              session: session,
              id: product[i].id,
            });
            console.log("elminato", product[i].id + product[i].tags);
          }  
          */
        }
      }
      console.log("count ist ",countIst);
      console.log("count CU ",countIvan);
      console.log("count AZ ",ImportAZ);
      
      let result = { count: countIst, countIvan: countIvan ,ImportAZ};
      res.status(200).send(result);
    } catch (error) {
      let result = {};
      result.countcount = 1;
      res.status(200).send(result);
    }
  },
  createProduct: async (_req, res) => {
    let status = 200;
    let error = null;
    try {
      await productCreator(res.locals.shopify.session);
    } catch (e) {
      console.log(`Failed to process products/create: ${e.message}`);
      status = 500;
      error = e.message;
    }
    res.status(status).send({ success: status === 200, error });
  },
  updateLastWeekOrdersTags: async (_req, res) => {
    let status = 200;
    let error = null;
    try {
      let session = res.locals.shopify.session;
     
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
     const resss =  await productCreator(session);
     console.log(resss);
     
      res.status(200).send({ success: true });
    } catch (e) {
      console.log(`Failed to process orders/last-week: ${e.message}`);
      status = 500;
      error = e.message;
      res.status(status).send({ success: false, error });
    }
  },
  getAmazonProducts: async (_req, res) => {
    try {
      const products = await amazonProducts(res.locals.shopify.session);
      console.log(products);

      res.status(200).json({ data: products });
    } catch (error) {
      console.log(error);
    }
  },
};

export default importController;
