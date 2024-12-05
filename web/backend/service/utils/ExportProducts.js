import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";
import { parse } from "json2csv";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function exportProductsToCSV(products) {
  const fields = [
    "Handle",
    "Title",
    "Body (HTML)",
    "Vendor",
    "Product Category",
    "Type",
    "Tags",
    "Published",
    "Option1 Name",
    "Option1 Value",
    "Option2 Name",
    "Option2 Value",
    "Option3 Name",
    "Option3 Value",
    "Variant SKU",
    "Variant Grams",
    "Variant Inventory Tracker",
    "Variant Inventory Policy",
    "Variant Fulfillment Service",
    "Variant Price",
    "Variant Compare At Price",
    "Variant Requires Shipping",
    "Variant Taxable",
    "Variant Barcode",
    "Image Src",
    "Image Position",
    "Image Alt Text",
    "Gift Card",
    "SEO Title",
    "SEO Description",
    "Status",
  ];

  const shopifyRows = [];

  products.forEach((product) => {
    const baseProduct = {
      Handle: product.handle || "",
      Title: product.title || "",
      "Body (HTML)": product.body_html || "",
      Vendor: product.vendor || "",
      "Product Category": product.product_type || "",
      Type: product.status || "active",
      Tags: product.tags || "",
      Published: product.published_at ? "TRUE" : "FALSE",
    };

    // Process Variants
    product.variants.forEach((variant, variantIndex) => {
      const variantRow = {
        ...baseProduct,
        "Option1 Name": product.options?.[0]?.name || "Option",
        "Option1 Value": product.options?.[0]?.values?.[variantIndex] || "",
        "Variant SKU": variant.sku || "",
        "Variant Grams": variant.grams || "",
        "Variant Inventory Tracker": variant.inventory_tracker || "",
        "Variant Inventory Policy": variant.inventory_policy || "deny",
        "Variant Fulfillment Service": variant.fulfillment_service || "manual",
        "Variant Price": variant.price || "0.00",
        "Variant Compare At Price": variant.compare_at_price || "",
        "Variant Requires Shipping": variant.requires_shipping
          ? "TRUE"
          : "FALSE",
        "Variant Taxable": variant.taxable ? "TRUE" : "FALSE",
        "Variant Barcode": variant.barcode || "",
      };

      shopifyRows.push(variantRow);
    });

    // Process Images
    product.images.forEach((image, index) => {
      shopifyRows.push({
        ...baseProduct,
        "Image Src": image.src || "",
        "Image Position": index + 1,
        "Image Alt Text": image.alt || "",
      });
    });
  });

  // Convert rows to CSV format
  const csv = parse(shopifyRows, { fields });

  // Ensure the 'ImportingHistory' folder exists
  const historyDir = path.join(__dirname, "ImportingHistory");
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  // Save the CSV file with a timestamped filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(historyDir, `shopify_export_${timestamp}.csv`);

  fs.writeFileSync(filePath, csv, "utf8");
  console.log(`Shopify CSV exported successfully to: ${filePath}`);
  return filePath;
}
