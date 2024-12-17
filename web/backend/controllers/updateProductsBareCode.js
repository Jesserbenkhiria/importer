
import shopify from "../service/shopify.js";
import { handleGtin } from "../service/utils/gtinRepository.js";

async function getAllProductsInStore(session) {
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
  return articles.flat(1);
}

async function updateProductTagsIfNecessary(product) {
  // product.variants[0].barcode = "000000"
  const barcode = await handleGtin(product.title, product.options[0].values[0]);

  product.variants[0].barcode = barcode;
  await product.save({
    update: true,
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function updateBareCodes(session) {
  try {
    const products = await getAllProductsInStore(session);
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      await updateProductTagsIfNecessary(product, session);

      // Log progress for the first 3 products
      if (i < 3) {
        console.log(`Product ${i + 1} processed.`);
      }

      // Introduce a delay between each call (e.g., 1 second)
      await delay(500); // Delay of 1000ms (1 second)
    }
  } catch (error) {
    console.log("Error while updating products:", error);
  }
}
