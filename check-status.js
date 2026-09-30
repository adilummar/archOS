const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "adil@coastaldesign.in".toLowerCase().trim() }
    });
    console.log(user);
    
    if (user.status !== "active") {
        await prisma.user.update({
            where: { id: user.id },
            data: { status: "active" }
        });
        console.log("Updated status to active.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
