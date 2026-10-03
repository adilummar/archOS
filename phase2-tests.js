const { PrismaClient } = require('@prisma/client');
const { createProject, instantiateProjectFromTemplate } = require('./src/services/project.service.ts'); // Wait, node can't require ts directly without ts-node or similar.
