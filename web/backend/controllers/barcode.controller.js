// Import Prisma Client
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Get all GTINs
 */
export const getAllGtins = async (req, res) => {
  console.log("getAllGtins");
  try {
    const gtins = await prisma.gtin.findMany();
    res.status(200).json(gtins);
  } catch (error) {
    console.error("Error fetching GTINs:", error);
    res.status(500).json({ error: "Failed to fetch GTINs" });
  }
};

/**
 * Get a single GTIN by ID
 */
export const getGtinById = async (req, res) => {
  const { id } = req.params;
  try {
    const gtin = await prisma.gtin.findUnique({
      where: { id: parseInt(id) },
    });
    if (gtin) {
      res.status(200).json(gtin);
    } else {
      res.status(404).json({ error: "GTIN not found" });
    }
  } catch (error) {
    console.error("Error fetching GTIN:", error);
    res.status(500).json({ error: "Failed to fetch GTIN" });
  }
};

/**
 * Create a new GTIN
 */
export const createGtin = async (req, res) => {
  const { handle, option1value, variantBarcode } = req.body;
  try {
    const newGtin = await prisma.gtin.create({
      data: { handle, option1value, variantBarcode },
    });
    res.status(201).json(newGtin);
  } catch (error) {
    console.error("Error creating GTIN:", error);
    res.status(500).json({ error: "Failed to create GTIN" });
  }
};

/**
 * Update a GTIN by ID
 */
export const updateGtin = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedGtin = await prisma.gtin.update({
      where: { id: parseInt(id) },
      data: { ...req.body },
    });
    res.status(200).json(updatedGtin);
  } catch (error) {
    console.error("Error updating GTIN:", error);
    res.status(500).json({ error: "Failed to update GTIN" });
  }
};

/**
 * Delete a GTIN by ID
 */
export const deleteGtin = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.gtin.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send(); // No content
  } catch (error) {
    console.error("Error deleting GTIN:", error);
    res.status(500).json({ error: "Failed to delete GTIN" });
  }
};
