import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const gtinRepository = {
    getByHandleandOption1Value : async function(titolo, colore) {
        colore = colore === "" ? "Default Title" : colore;
      
        try {
          const product = await prisma.gtin.findFirst({
            where: {
              handle: titolo,
              option1value: colore
            },
            select: {
              variantBarcode: true
            }
          });
      
          return product ? product.variantBarcode : null;
        } catch (error) {
          console.error("Error retrieving GTIN:", error);
          throw error;
        } finally {
          await prisma.$disconnect();
        }
    }
};
