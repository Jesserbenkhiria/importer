import shopify from "./shopify.js";

// Update products with the "ImportAZ" tag to set their location
export default async function amazonProducts(session) {
  console.log("Start process to update product locations");
  try {
    // Retrieve all products with the "ImportAZ" tag
    const products = await getAllProductsAmazon(session);
    console.log(products);

    // Retrieve location ID for "Magazzino Amazon"
    const location = await getLocationIdByName(session, "Magazzino Amazon");
    if (!location) {
      console.error("Location 'Magazzino Amazon' not found.");
      return;
    }

    console.log("Updating product locations...");
    for (const product of products) {
      const inventoryItemId = product.variants[0]?.inventory_item_id;

      if (inventoryItemId) {
        await updateProductLocation(session, inventoryItemId, location.id);
      } else {
        console.error(`Inventory item ID not found for product: ${product.id}`);
      }
    }
    console.log("Product locations updated successfully!");
  } catch (error) {
    console.error("Error during the process:", error);
  }
}

// Function to retrieve all products with the "ImportAZ" tag
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
  return articles
    .flat(1)
    .filter((product) => product.tags.includes("ImportAZ"));
}

// Function to retrieve location ID by name
async function getLocationIdByName(session, locationName) {
  try {
    const locations = await shopify.api.rest.Location.all({ session });
    const location = locations.find((loc) => loc.name === locationName);
    return location || null;
  } catch (error) {
    console.error("Error retrieving location:", error);
    throw error;
  }
}

// Function to update product location
async function updateProductLocation(session, inventoryItemId, locationId) {
  try {
    const inventoryLevel = new shopify.api.rest.InventoryLevel({ session });

    // Set inventory level at the specified location
    await inventoryLevel.set({
      body: {
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available: 1,
      },
    });

    console.log(
      `Inventory item ${inventoryItemId} updated to location ${locationId}`
    );
  } catch (error) {
    if (error.code === 429) {
      console.warn("Rate limit exceeded, retrying...");
      const retryAfter = parseInt(
        error.response.headers["retry-after"] || 1000
      );
      await delay(retryAfter);
      await updateProductLocation(session, inventoryItemId, locationId);
    } else {
      console.error(
        `Error updating inventory item ${inventoryItemId} to location ${locationId}:`,
        error
      );
    }
  }
}

// Helper function for delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
