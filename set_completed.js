const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.firm.updateMany({
    data: { onboardingState: "COMPLETED" }
  });
  console.log("Updated all existing firms to COMPLETED");
}
main().catch(console.error).finally(() => prisma.$disconnect());
