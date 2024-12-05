import { DeliveryMethod } from "@shopify/shopify-api";
import shopify from "./shopify.js"
import fetch from 'node-fetch'
import productCreator from "./product-creator.js";
import { getSessionById } from "../repository/shopifySession.js";

async function postDataTrovaUsati(id_trovausati, canale) {
  var result = fetch("https://trovausati.it/api/marketplace/" + canale + "/order/?X-Authorization=85deb35b175d68bfddabed376b61107e3b60bb6c", {
    // Adding method type
    method: "POST",

    // Adding body or contents to send
    body: JSON.stringify({
      product_ids: id_trovausati,
      reference: ""
    }),
    // Adding headers to the request
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  })
    // Converting to JSON
    .then(response => response.json())
    // Displaying results to console
    .then(json => {}).catch((err) => console.log("Request Failed", err));
    return await result;
}
const webhooks = {
  ORDERS_CREATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      console.log("ORDERS_CREATE webhook triggered");
  
      const payload = JSON.parse(body);
      const session = await getSessionById("offline_" + shop);
      let idsCUInOrder = [];
      let idsISTInOrder = [];
      let idsAZInOrder = []; // New array to track AZ products
  
      try {
        console.log("Fetching product IDs from the order");
        const productIds = payload.line_items.map(item => item.product_id);
  
        console.log("Retrieving product details for product IDs:", productIds.join(','));
        let products = await shopify.api.rest.Product.all({
          session: session,
          ids: productIds.join(','),
        });
  
        console.log("Processing each product to check tags");
        for (let product of products) {
          console.log("Processing product ID:", product.id, "with tags:", product.tags);
          
          // Checking for ImportatiCU
          if (product.tags.includes("ImportatiCU")) {
            try {
              const idTrovaUsati = product.tags.split("{")[1].split("}")[0];
              idsCUInOrder.push(idTrovaUsati);
              console.log("Added to CU list:", idTrovaUsati);
            } catch (error) {
              console.log("Error processing ImportatiCU tag for product ID:", product.id, error);
            }
          }
  
          // Checking for ImportatiIST
          if (product.tags.includes("ImportatiIST")) {
            try {
              const idTrovaUsati = product.tags.split("{")[1].split("}")[0];
              idsISTInOrder.push(idTrovaUsati);
              console.log("Added to IST list:", idTrovaUsati);
            } catch (error) {
              console.log("Error processing ImportatiIST tag for product ID:", product.id, error);
            }
          }
  
          // New condition for ImportAZ
          if (product.tags.includes("ImportAZ")) {
            try {
              idsAZInOrder.push(product.id);
              console.log("Added to AZ list:", idTrovaUsati);
            } catch (error) {
              console.log("Error processing ImportAZ tag for product ID:", product.id, error);
            }
          }
        }
  
        // Handle external API calls
        let trovausatiCall = {};
        if (idsCUInOrder.length > 0) {
          console.log("Posting data to TrovaUsati for CU products:", idsCUInOrder);
          trovausatiCall = await postDataTrovaUsati(idsCUInOrder, "CU");
        }
        if (idsISTInOrder.length > 0) {
          console.log("Posting data to TrovaUsati for IST products:", idsISTInOrder);
          trovausatiCall = await postDataTrovaUsati(idsISTInOrder, "IST");
        }
        // console.log("trovaUsatiCall :", trovausatiCall);
  
        // Update order with tags
        let orderTags = "";
        if (idsCUInOrder.length > 0) orderTags += "CU, ";
        if (idsISTInOrder.length > 0) orderTags += "IST, ";
        if (idsAZInOrder.length > 0) orderTags += "AZ"; // Add AZ tag
  
        // Remove trailing comma if needed
        orderTags = orderTags.trim().replace(/,$/, "");
  
        if (orderTags) {
          console.log("Updating order with tags:", orderTags);
          const order = new shopify.api.rest.Order({ session: session });
          order.id = payload.id;
          order.tags = orderTags;
          await order.save({ update: true });
          console.log("Order updated successfully");
        }
  
        console.log("Calling productCreator");
        await productCreator(session);
      } catch (error) {
        console.log("Error in ORDERS_CREATE callback:", error);
      }
    },
  },
  



  /**
   * Customers can request their data from a store owner. When this happens,
   * Shopify invokes this webhook.
   *
   * https://shopify.dev/apps/webhooks/configuration/mandatory-webhooks#customers-data_request
   */
  CUSTOMERS_DATA_REQUEST: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const payload = JSON.parse(body);
      // Payload has the following shape:
      // {
      //   "shop_id": 954889,
      //   "shop_domain": "{shop}.myshopify.com",
      //   "orders_requested": [
      //     299938,
      //     280263,
      //     220458
      //   ],
      //   "customer": {
      //     "id": 191167,
      //     "email": "john@example.com",
      //     "phone": "555-625-1199"
      //   },
      //   "data_request": {
      //     "id": 9999
      //   }
      // }
    },
  },

  /**
   * Store owners can request that data is deleted on behalf of a customer. When
   * this happens, Shopify invokes this webhook.
   *
   * https://shopify.dev/apps/webhooks/configuration/mandatory-webhooks#customers-redact
   */
  CUSTOMERS_REDACT: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const payload = JSON.parse(body);
      // Payload has the following shape:
      // {
      //   "shop_id": 954889,
      //   "shop_domain": "{shop}.myshopify.com",
      //   "customer": {
      //     "id": 191167,
      //     "email": "john@example.com",
      //     "phone": "555-625-1199"
      //   },
      //   "orders_to_redact": [
      //     299938,
      //     280263,
      //     220458
      //   ]
      // }
    },
  },

  /**
   * 48 hours after a store owner uninstalls your app, Shopify invokes this
   * webhook.
   *
   * https://shopify.dev/apps/webhooks/configuration/mandatory-webhooks#shop-redact
   */
  SHOP_REDACT: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const payload = JSON.parse(body);
      // Payload has the following shape:
      // {
      //   "shop_id": 954889,
      //   "shop_domain": "{shop}.myshopify.com"
      // }
    },
  },
};

export default webhooks;