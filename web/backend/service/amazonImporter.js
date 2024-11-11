import { gtinRepository } from "./repository/gtinRepository.js";
import shopify from "./shopify.js";
import fetch from "node-fetch";

export default async function amazonProducts(session) {
  console.log("Inizio");
  try {
    console.log("getting prodcucts start ");
    const prodcuts = await getAllProductsAmazon(session);
    let location = await getLocationIdByName(session, "Magazzino Amazon");
    console.log("the location ", location);

    for (const product of prodcuts) {
      const inventoryItemId = product.variants[0]?.inventory_item_id; // Get inventory item ID from the product variants
      if (inventoryItemId) {
        await updateProductLocation(session, inventoryItemId, location);
      } else {
        console.error("Inventory item ID not found for product:", product);
      }
    }
    return prodcuts;
  } catch (error) {
    console.error("Errore durante la creazione del prodotto :", error);
  }
}

async function getAllProductsAmazon(session) {
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
  const filteredArticles = articles
    .flat(1)
    .filter((product) => product.tags.includes("ImportAZ"));
  return filteredArticles;
}
async function updateProductLocation(session, inventory_item_id, location) {
  // console.log(inventory_item_id);
  if (location && inventory_item_id) {
    const inventoryLevel = new shopify.api.rest.InventoryLevel({ session });
    let retryCount = 0;

    // If the location ID is different from the one with the lowest ID
    if (location.locationByName !== location.locationWithLowestId) {
      while (retryCount < 5) {
        // Limit to 5 retries
        try {
          await inventoryLevel.set({
            body: {
              location_id: location.locationByName,
              inventory_item_id: inventory_item_id,
              available: 1,
            },
          });

          // Delete the inventory level at the location with the lowest ID
          await shopify.api.rest.InventoryLevel.delete({
            session: session,
            inventory_item_id: inventory_item_id,
            location_id: location.locationWithLowestId,
          });
          break; // Exit the retry loop on success
        } catch (error) {
          if (error.code === 429) {
            // Rate limit error
            const retryAfter =
              parseInt(error.response.headers["retry-after"]) ||
              Math.pow(2, retryCount) * 1000;
            console.warn(
              `Rate limit exceeded. Retrying after ${retryAfter}ms...`
            );
            await delay(retryAfter); // Wait for the specified time before retrying
            retryCount++;
          } else {
            console.error("Error updating product location:", error);
            break; // Exit on other errors
          }
        }
      }
    }
  } else {
    console.error("Location ID not found.", location, inventory_item_id);
  }
}
// Define this function to retrieve the location ID by name
async function getLocationIdByName(session, locationName) {
  try {
    const locations = await shopify.api.rest.Location.all({ session });
    // Find the location by name
    const locationByName = locations.find((loc) => loc.name === locationName);
    return locationByName;
  } catch (error) {
    console.error("Error retrieving locations:", error);
    throw error; // Propagate the error up for better error handling
  }
}
