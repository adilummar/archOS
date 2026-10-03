const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { instantiateProjectFromTemplate } = require('./.next/server/app/api/v1/projects/instantiate/route.js');

// Actually it might be easier to just simulate it directly or run it using ts-node
