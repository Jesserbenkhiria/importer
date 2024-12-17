import shopify from "./shopify.js";
import { handleGtin } from "./utils/gtinRepository.js";
import fetch from "node-fetch";
import { exportProductsToCSV } from "./utils/ExportProducts.js";
import logger from "./utils/logger.js";

// import { handleGtin } from "./utils/gtinRepository.js";

export default async function productCreator(session) {
  console.log("Inizio");
  try {
    const prodottiShopifyInStore = await getAllProductsInStore(session);
    await importTrovaUsati(
      session,
      "ImportatiIST",
      "IST",
      prodottiShopifyInStore
    );
    await importTrovaUsati(
      session,
      "ImportatiCU",
      "CU",
      prodottiShopifyInStore
    );
    await exportProductsToCSV(prodottiShopifyInStore);
    await updateAllProducts(session);
    console.log("Fine");
  } catch (error) {
    console.error("Errore durante la creazione del prodotto:", error);
  }
}

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
  const barcode = await handleGtin(
    product.title,
    product.options[0].values[0]
  );

  product.variants[0].barcode = barcode;
  await product.save({
    update: true,
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function updateAllProducts(session) {
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

async function importTrovaUsati(
  session,
  tag,
  canale,
  prodottiShopifyInStore,
  correlati
) {
  console.log("Inizio import: " + tag);

  try {
    const { MapProductInstore, inStoreActive, inStoreArchived } =
      await getMapProductInStore(prodottiShopifyInStore, tag);
    const prodottiTrovaUsati = await getAllDataProducts(canale);
    const productIdOutStore = await getTrovaUsatiIds(prodottiTrovaUsati);

    console.log(
      "Numero di prodotti trovaUsati ",
      tag,
      ":",
      productIdOutStore.length
    );
    console.log("Numero di prodotti in store:", MapProductInstore.length);
    console.log("Numero di prodotti in store attivi:", inStoreActive);
    console.log("Numero di prodotti in store archiviati:", inStoreArchived);

    const archived = await archiveUnrelatedProducts(
      tag,
      prodottiShopifyInStore,
      MapProductInstore,
      productIdOutStore
    );
    console.log("Archiviati : ", archived);
    const addUpdate = await addUpdateProducts(
      session,
      tag,
      prodottiShopifyInStore,
      prodottiTrovaUsati,
      MapProductInstore,
      correlati
    );
    console.log("Aggiunti/Aggiornati :", addUpdate);
  } catch (error) {
    console.error("Errore durante l'importazione dei prodotti:", error);
  }
}
async function archiveUnrelatedProducts(
  tag,
  prodottiShopifyInStore,
  MapProductInstore,
  idsTrovaUsati
) {
  const batchSize = 300; // Dimensione del batch per il processing
  // Colleziona gli ID da archiviare
  let idsToArchive = [];
  MapProductInstore.forEach((productInStore) => {
    // Controlla se l'ID TrovaUsati non è incluso
    if (!idsTrovaUsati.includes(parseInt(productInStore.idTrovaUsati))) {
      idsToArchive.push(parseInt(productInStore.idShopify));
    }
  });
  // Filtra i prodotti Shopify da archiviare basandosi sugli ID raccolti
  let productsToArchive = prodottiShopifyInStore.filter((prodottoShopify) => {
    return (
      idsToArchive.includes(prodottoShopify.id) &&
      prodottoShopify.status !== "archived"
    );
  });
  // Archivia i prodotti e attendi 0,5 secondi dopo ogni salvataggio
  let archiveStartTime = Date.now();
  for (
    let indexProductToArchive = 0;
    indexProductToArchive < productsToArchive.length;
    indexProductToArchive++
  ) {
    let productToArchive = productsToArchive[indexProductToArchive];
    productToArchive.status = "archived";
    await productToArchive.save({ update: true });
    await sleep(500);

    if (Date.now() - archiveStartTime >= 10000) {
      console.log(
        "Sto archiviando ",
        productsToArchive.length,
        "prodotti rimanenti da archiviare ",
        productsToArchive.length - indexProductToArchive
      );
      archiveStartTime = Date.now();
    }
  }

  // Trova i prodotti da dearchiviare
  let productsToDeArchive = prodottiShopifyInStore.filter((product) => {
    // Estrai l'ID TrovaUsati dai tag usando una regex
    const match = product.tags.match(/\{(\d+)\}/);
    const idTrovaUsati = match ? parseInt(match[1]) : null;

    return (
      product.status === "archived" &&
      product.tags.includes(tag) &&
      idTrovaUsati !== null &&
      idsTrovaUsati.includes(idTrovaUsati)
    );
  });

  // Dearchivia i prodotti e attendi 0,5 secondi dopo ogni salvataggio
  let deArchiveStartTime = Date.now();
  for (
    let indexToDeArchive = 0;
    indexToDeArchive < productsToDeArchive.length;
    indexToDeArchive++
  ) {
    let archivedProduct = productsToDeArchive[indexToDeArchive];
    archivedProduct.status = "active";
    await archivedProduct.save({ update: true });
    await sleep(500);

    if (Date.now() - deArchiveStartTime >= 10000) {
      console.log(
        "Sto dearchiviando ",
        productsToDeArchive.length,
        " prodotti rimanenti da riattivare ",
        productsToDeArchive.length - indexToDeArchive
      );
      deArchiveStartTime = Date.now();
    }
  }
  return {
    archiviati: productsToArchive.length,
    riattivati: productsToDeArchive.length,
  };
}
async function addUpdateProducts(
  session,
  tag,
  prodottiShopifyInStore,
  prodottiTrovaUsati,
  MapProductInstore
) {
  const correlati = {
    correlatiIphone: await getCorrelati(
      "accessorio_iphone",
      prodottiShopifyInStore
    ),
    correlatiAndroid: await getCorrelati(
      "accessorio_android",
      prodottiShopifyInStore
    ),
  };
  let skipped = 0;
  let saved = 0;
  let updated = 0;
  let prodottiDaSalvare = [],
    prodottiDaAggiornare = [];

  // Create a lookup map for quick access and to check for conflicts
  const idTrovaUsatiToShopifyMap = {};
  const conflictedIds = new Set();

  for (const element of MapProductInstore) {
    const idTrovaUsati = parseInt(element.idTrovaUsati);
    if (idTrovaUsatiToShopifyMap[idTrovaUsati]) {
      // Conflict detected
      conflictedIds.add(idTrovaUsati);
    } else {
      idTrovaUsatiToShopifyMap[idTrovaUsati] = element.idShopify;
    }
  }

  // Handle conflicts by deleting Shopify products with conflicting ids
  for (const idTrovaUsati of conflictedIds) {
    const conflictedProducts = MapProductInstore.filter(
      (element) => parseInt(element.idTrovaUsati) === idTrovaUsati
    );
    for (const product of conflictedProducts) {
      await deleteShopifyProduct(session, product.idShopify);
      console.log(
        `Deleted Shopify product with id: ${product.idShopify} due to conflict on idTrovaUsati: ${idTrovaUsati}`
      );
    }
  }

  // Rebuild the lookup map without conflicts
  const idsTrovaUsatiInStore = MapProductInstore.filter(
    (element) => !conflictedIds.has(parseInt(element.idTrovaUsati))
  ).map((element) => parseInt(element.idTrovaUsati));

  // Separate products to save and update
  for (const prodottoTrovaUsati of prodottiTrovaUsati) {
    if (!idsTrovaUsatiInStore.includes(prodottoTrovaUsati.id)) {
      prodottiDaSalvare.push(prodottoTrovaUsati);
    } else {
      prodottiDaAggiornare.push(prodottoTrovaUsati);
    }
  }
  // Save new products
  let saveStartTime = Date.now();
  for (let prodottoDaSalvare of prodottiDaSalvare) {
    let motiviSaltato = [];

    if (
      prodottoDaSalvare.attributes.screen_condition ===
        "Visibili segni sul vetro" ||
      prodottoDaSalvare.attributes.screen_condition ===
        "Normali segni sul vetro"
    ) {
      motiviSaltato.push("screen_condition non è vuoto");
    }

    if (
      prodottoDaSalvare.attributes.battery_perc !== null &&
      prodottoDaSalvare.attributes.battery_perc <= 90
    ) {
      motiviSaltato.push("battery_perc non è maggiore di 90");
    }

    if (prodottoDaSalvare.attributes.price / 100 < 150) {
      motiviSaltato.push("Il prezzo è inferiore a 150");
    }

    if (tag === "ImportatiIST" || motiviSaltato.length === 0) {
      saved++;
      await saveProduct(session, prodottoDaSalvare, tag, correlati);
    } else {
      skipped++;
    }
    if (Date.now() - saveStartTime >= 10000) {
      console.log("Sto salvando...", saved, skipped);
      saveStartTime = Date.now();
    }
  }

  // Update existing products
  let updateStartTime = Date.now();
  let i = 0;
  for (let prodottoDaAggiornare of prodottiDaAggiornare) {
    const idShopify = idTrovaUsatiToShopifyMap[prodottoDaAggiornare.id];
    const checkifupdated = await updateProductPrice(
      idShopify,
      prodottoDaAggiornare,
      tag,
      prodottiShopifyInStore
    );
    if (checkifupdated) {
      updated++;
    }
    if (Date.now() - updateStartTime >= 10000) {
      console.log("Sto aggiornando i prezzi...", i++);
      updateStartTime = Date.now();
    }
  }

  return { skipped, saved, updated };
}
async function deleteShopifyProduct(session, idShopify) {
  // This function should delete the Shopify product by id
  // Example implementation
  await shopify.api.rest.Product.delete({
    session: session,
    id: idShopify,
  });
  await sleep(500);
  console.log("Deleting Shopify product:", idShopify);
}
async function getCorrelati(tipoAccessorio, prodottiShopifyInStore) {
  let prodottiCorrelati = [];
  for (let prodottoShopifyInStore of prodottiShopifyInStore) {
    if (prodottoShopifyInStore.tags.includes(tipoAccessorio)) {
      prodottiCorrelati.push(prodottoShopifyInStore);
    }
  }
  const metafieldSyntax = '["gid://shopify/Product/';
  let metafieldValue = "";
  for (let i = 0; i < prodottiCorrelati.length; i++) {
    if (i == prodottiCorrelati.length - 1) {
      metafieldValue += metafieldSyntax + prodottiCorrelati[i].id + '"]';
    } else {
      metafieldValue += metafieldSyntax + prodottiCorrelati[i].id + '",';
    }
  }
  return metafieldValue === ""
    ? null
    : [
        {
          namespace: "shopify--discovery--product_recommendation",
          key: "complementary_products",
          value: metafieldValue,
          owner_resource: "product",
          type: "list.product_reference",
        },
        {
          namespace: "shopify--discovery--product_recommendation",
          key: "related_products",
          value: metafieldValue,
          owner_resource: "product",
          type: "list.product_reference",
        },
      ];
}
async function saveProduct(session, prodottoTrovaUsati, tag, correlati) {
  try {
    const product = await createProduct(session, prodottoTrovaUsati, tag); //creating
    setMetafields(product, prodottoTrovaUsati, correlati);
    await product.save({ update: true }); //saving
    await sleep(500);
    await saveVariantImage(session, product);
    await updateProductLocation(
      session,
      product.variants[0].inventory_item_id,
      tag
    );
  } catch (error) {
    console.error("Errore durante il salvataggio del prodotto:", error);
  }
}
async function createProduct(session, prodottoTrovaUsati, tag) {
  const product = new shopify.api.rest.Product({ session });

  const condition =
    prodottoTrovaUsati.attributes.condition === "KM 0"
      ? "COME NUOVO - KM0"
      : "RICONDIZIONATO";
  product.title = prodottoTrovaUsati.attributes.model;

  // Crea il corpo HTML del prodotto
  const description = prodottoTrovaUsati.attributes.description
    ? `<li>${prodottoTrovaUsati.attributes.description}</li>`
    : "";
  const warranty = prodottoTrovaUsati.attributes.warranty
    ? `<li><b>Garanzia : </b><br>${prodottoTrovaUsati.attributes.warranty}</li>`
    : "";
  const accessories = prodottoTrovaUsati.attributes.accessories
    ? `<li><b>Accessori : </b><br>${prodottoTrovaUsati.attributes.accessories}</li>`
    : "";
  const color = prodottoTrovaUsati.attributes.color
    ? `<li><b>Colore : </b><br>${prodottoTrovaUsati.attributes.color}</li>`
    : "";
  const openningTag = "<ul>";
  const closingTag = "</ul><br>";
  const bodyHTML =
    openningTag + description + warranty + accessories + color + closingTag;
  product.body_html = bodyHTML;

  product.vendor = prodottoTrovaUsati.attributes.brand
    ? prodottoTrovaUsati.attributes.brand.charAt(0).toUpperCase() +
      prodottoTrovaUsati.attributes.brand.slice(1)
    : null;
  product.product_type = "Dispositivo Elettronico";
  product.status = "active";

  // Imposta le immagini del prodotto
  product.images = prodottoTrovaUsati.attributes.image_url
    ? [{ src: prodottoTrovaUsati.attributes.image_url }]
    : [];

  // Imposta le opzioni del prodotto
  product.options = [
    {
      name: "Color",
      values: [prodottoTrovaUsati.attributes.color || ""],
    },
    {
      name: "Stato",
      values: [condition],
    },
  ];

  // Imposta i tag del prodotto
  product.tags = [condition, tag, `{${prodottoTrovaUsati.id}}`];

  // Imposta il prezzo del prodotto
  const maggiorato = creaMaggiorazione(
    prodottoTrovaUsati.attributes.price / 100
  );
  const prezzo =
    tag === "ImportatiCU"
      ? maggiorato
      : prodottoTrovaUsati.attributes.price / 100;
  const comparato = tag === "ImportatiIST" ? await creaCompare(prezzo) : null;
  // Imposta i varianti del prodotto
  product.variants = [
    {
      option1: prodottoTrovaUsati.attributes.color || "",
      option2: condition,
      sku: prodottoTrovaUsati.id,
      price: prezzo,
      compare_at_price: comparato,
      inventory_quantity: 1,
      barcode: await handleGtin(
        prodottoTrovaUsati.attributes.model,
        prodottoTrovaUsati.attributes.color
      ),
      inventory_management: "shopify",
      taxable: false,
      image_id: "",
      inventory_item_id: "", // Placeholder for inventory item ID to be updated later
    },
  ];

  return product;
}
async function saveVariantImage(session, product) {
  const variant = new shopify.api.rest.Variant({ session });
  if (product.images.length > 0) {
    variant.id = product.variants[0].id;
    variant.image_id = product.images[0].id;
    await variant.save({ update: true });
  }
  return variant;
}
async function updateProductLocation(session, inventory_item_id, tag) {
  let location = null;
  if (tag === "ImportatiCU") {
    location = await getLocationIdByName(session, "Magazzino");
  } else if (tag === "ImportatiIST") {
    location = await getLocationIdByName(
      session,
      "iStore Milano - Piazza Argentina, 1"
    );
  }
  if (location && inventory_item_id) {
    const inventoryLevel = new shopify.api.rest.InventoryLevel({ session });
    if (location.locationByName !== location.locationWithLowestId) {
      await inventoryLevel.set({
        body: {
          location_id: location.locationByName,
          inventory_item_id: inventory_item_id,
          available: 1,
        },
      });
      const inventory_level = new shopify.api.rest.InventoryLevel({
        session: session,
      });
      await shopify.api.rest.InventoryLevel.delete({
        session: session,
        inventory_item_id: inventory_item_id,
        location_id: location.locationWithLowestId,
      });
    }
  } else {
    console.error("Location ID not found.", location, inventory_item_id);
  }
}
async function updateProductPrice(
  shopifyId,
  prodottoTrovaUsati,
  tag,
  allInStore
) {
  try {
    // Find the product with the matching shopifyId
    const product = allInStore.find(
      (product) => product.id.toString() === shopifyId.toString()
    );
    // if (product.tags.includes("NUOVO")) {
    //   // Split the string into an array using a separator (assuming tags are separated by commas)
    //   let tagsArray = product.tags.split(",").map(tag => tag.trim());

    //   // Find the index of "NUOVO"
    //   const nuovoIndex = tagsArray.indexOf("NUOVO");
    //   if (nuovoIndex !== -1) {
    //     // Replace "NUOVO" with "COME NUOVO - KM0"
    //     tagsArray[nuovoIndex] = "COME NUOVO - KM0";

    //     // Join the array back into a string
    //     product.tags = tagsArray.join(", ");
    //     await product.save({
    //       update: true,
    //     });
    //     console.log("Updated Tags Array: ", tagsArray);
    //   }
    // }
    let updatedFlag = false;
    if (product) {
      let newPrice =
        tag === "ImportatiCU"
          ? creaMaggiorazione(
              prodottoTrovaUsati.attributes.price / 100
            ).toFixed(2)
          : (prodottoTrovaUsati.attributes.price / 100).toFixed(2);
      if (newPrice && product.variants && product.variants.length > 0) {
        if (newPrice !== product.variants[0].price) {
          updatedFlag = true;
          product.variants[0].price = newPrice;
          await sleep(500); // Sleep for another 500ms
          await product.save({
            update: true,
          });
        }
      }
    } else {
      console.log(`Product with id ${shopifyId} not found in allInStore.`);
    }
    return updatedFlag;
  } catch (error) {
    console.log("Error while updating one product price", error);
  }
}
// Helper function to get location ID by name
async function getLocationIdByName(session, locationName) {
  try {
    const locations = await shopify.api.rest.Location.all({ session });
    // Find the location by name
    const locationByName = locations.find((loc) => loc.name === locationName);
    // Find the location with the lowest ID
    let locationWithLowestId = locations[0];
    for (let loc of locations) {
      if (loc.id < locationWithLowestId.id) {
        locationWithLowestId = loc;
      }
    }
    return {
      locationByName: locationByName ? locationByName.id : null,
      locationWithLowestId: locationWithLowestId.id,
    };
  } catch (error) {
    console.error("Error retrieving locations:", error);
    throw error; // Propagate the error up for better error handling
  }
}

async function setMetafields(product, prodottoTrovaUsati, correlati) {
  const title = prodottoTrovaUsati.attributes.model.toLowerCase();
  const brand = prodottoTrovaUsati.attributes.brand
    ? prodottoTrovaUsati.attributes.brand.charAt(0).toUpperCase() +
      prodottoTrovaUsati.attributes.brand.slice(1)
    : "";

  if (brand === "Apple" && title.includes("iphone")) {
    product.metafields = correlati.correlatiIphone || [];
  } else if (
    !title.includes("apple") &&
    !title.includes("watch") &&
    !title.includes("ram") &&
    !title.includes("mac") &&
    !title.includes("laptop") &&
    !title.includes("chromebook") &&
    !title.includes("gear") &&
    !title.includes("lenovo") &&
    !title.includes("pavillon") &&
    !title.includes("ipad") &&
    !title.includes("air")
  ) {
    product.metafields = correlati.correlatiAndroid || [];
  }
}

//logica per il prezzo di dei prodotti di ivan
function creaMaggiorazione(price) {
  // Definiamo le soglie per le varie categorie di prezzo e le relative maggiorazioni

  const thresholds = [
    { min: 150, max: 299, rate: 1.24 },
    { min: 300, max: 499, rate: 1.22 },
    { min: 500, max: 999, rate: 1.19 },
    { min: 1000, max: Infinity, rate: 1.18 },
  ];

  // Troviamo la categoria di prezzo corrispondente all'importo fornito
  const category = thresholds.find(
    ({ min, max }) => price >= min && price <= max
  );

  // Se non è stata trovata alcuna categoria, restituisci l'importo originale
  if (!category) {
    return price;
  }

  // Calcoliamo la maggiorazione utilizzando il tasso corrispondente alla categoria
  const surcharge = Math.ceil((price * category.rate) / 10) * 10 - 1;

  return surcharge;
}

async function getTrovaUsatiIds(data) {
  let ids = [];
  for (let k = 0; k < data.length; k++) {
    ids.push(data[k].id);
  }
  return ids;
}
async function getMapProductInStore(prodottiShopifyInStore, tag) {
  let MapProductInstore = [];
  let inStoreActive = 0,
    inStoreArchived = 0;
  for (let prodottoShopify of prodottiShopifyInStore) {
    if (prodottoShopify.tags.includes(tag)) {
      if (prodottoShopify.status === "archived") {
        inStoreArchived++;
      } else {
        inStoreActive++;
      }
      if (prodottoShopify.tags.includes("{")) {
        MapProductInstore.push({
          idTrovaUsati: prodottoShopify.tags.split("{")[1].split("}")[0],
          idShopify: prodottoShopify.id,
        });
      }
    }
  }
  return {
    MapProductInstore,
    inStoreActive,
    inStoreArchived,
  };
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function getAllDataProducts(canale) {
  let data = await getDataProducts(0, canale);
  let allProductTrovaUsati = [data.data];
  const pages = Math.ceil(
    data.meta.pagination.total / data.meta.pagination.page_size
  );
  for (let currentPage = 1; currentPage < pages; currentPage++) {
    let currentPageData = await getDataProducts(currentPage, canale);
    allProductTrovaUsati.push(currentPageData.data);
  }
  return allProductTrovaUsati.flat(1);
}
async function getDataProducts(page, canale) {
  var requestOptions = {
    method: "GET",
    mode: "no-cors",
  };
  var result = await fetch(
    "https://trovausati.it/api/marketplace/" +
      canale +
      "/products/?page=" +
      page +
      "&X-Authorization=85deb35b175d68bfddabed376b61107e3b60bb6c",
    requestOptions
  )
    // gestisci il successo
    .then((response) => response.json()) // converti a json
    .catch((err) => console.log("Request Failed", err)); // gestisci gli errori
  return result;
}
async function creaCompare(price) {
  let comparato = 0;
  if (price < 500) {
    comparato = price * 1.17;
  } else {
    comparato = price * 1.14;
  }
  let pre = Math.ceil(comparato) - 0.03;
  return pre;
}
