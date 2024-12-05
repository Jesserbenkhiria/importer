// Import Prisma Client
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Helper function to transform the title
const normalizeTitle = (title) => {
  return title
    .toLowerCase() // Convert to lowercase
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/[^a-z0-9-]/g, ""); // Remove special characters (optional)
};

export const handleGtin = async (title, color) => {
  try {
    // Normalize the title to the desired format
    const handle = normalizeTitle(title);

    // Check if a record exists with the normalized handle and color
    const existingRecord = await prisma.gtin.findFirst({
      where: {
        handle: handle,
        option1value: color
      }
    });

    if (existingRecord) {
      // If found, return the variantBarcode as a string
      console.log("found",existingRecord.handle);
      
      return existingRecord.variantBarcode || "null";
    } else {
      // If not found, create a new record with null barcode
      await prisma.gtin.create({
        data: {
          handle: handle,
          option1value: color,
          variantBarcode: null
        }
      });
      return "null"; // Return "null" as a string
    }
  } catch (error) {
    console.error("Error handling GTIN:", error);
    throw error;
  }
};
