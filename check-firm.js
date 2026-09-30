const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const firms = await prisma.firm.findMany();
    console.log("Firms in database:");
    firms.forEach(f => {
      console.log(`- ID: ${f.id} | Name: ${f.name}`);
    });

    const template = await prisma.projectTemplate.findFirst({
      where: { name: "Residential Architecture — Full Project Workflow" },
      include: { firm: true }
    });
    
    if (template) {
      console.log(`\nTemplate is currently assigned to Firm ID: ${template.firmId} | Name: ${template.firm?.name}`);
    } else {
      console.log("\nTemplate not found!");
    }

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
