// Import Prisma Client
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Function to fetch session by id
export async function getSessionById(id) {
    try {
        const session = await prisma.shopify_sessions.findUnique({
            where: {
                id: id,
            },
        });
        return session;
    } catch (error) {
        console.error(`Error fetching session: ${error.message}`);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}
