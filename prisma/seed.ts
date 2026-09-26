/**
 * DEVELOPMENT SEED — NOT FOR PRODUCTION
 *
 * Dev password for all users: archos@2024
 * This hash is generated with bcrypt, cost factor 12.
 * In production, users must set their own passwords through the invitation flow (Phase 10).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEV_PASSWORD = "archos@2024"; // dev-only — never hardcode in production

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12);
  console.log("🔐 Dev password hash generated (cost=12)");

  // ── Firm ───────────────────────────────────────────────────────────────────
  const firm = await prisma.firm.upsert({
    where: { slug: "cda" },
    update: {},
    create: {
      id: "firm-coastal-001",
      name: "Coastal Design Associates",
      slug: "cda",
      address: "12/A, Marine Drive, Kozhikode, Kerala 673001",
      phone: "+91 495 271 0001",
      email: "hello@coastaldesign.in",
      gstin: "32AABCC1234F1Z5",
      website: "https://coastaldesign.in",
      planType: "professional",
    },
  });
  console.log(`✅ Firm: ${firm.name} (${firm.slug})`);

  // ── Staff ──────────────────────────────────────────────────────────────────
  const staffData = [
    {
      id: "user-adil-001",
      name: "Adil Rahman",
      email: "adil@coastaldesign.in",
      role: "admin",
      designation: "Principal Architect",
      avatarInitials: "AR",
      avatarColor: "#E85D04",
      costRatePerHour: 2500,
    },
    {
      id: "user-priya-001",
      name: "Priya Nair",
      email: "priya@coastaldesign.in",
      role: "team_lead",
      designation: "Senior Architect",
      avatarInitials: "PN",
      avatarColor: "#3A86FF",
      costRatePerHour: 1800,
    },
    {
      id: "user-rahul-001",
      name: "Rahul Menon",
      email: "rahul@coastaldesign.in",
      role: "staff",
      designation: "Architectural Draughtsman",
      avatarInitials: "RM",
      avatarColor: "#8338EC",
      costRatePerHour: 900,
    },
    {
      id: "user-ananya-001",
      name: "Ananya Krishnan",
      email: "ananya@coastaldesign.in",
      role: "staff",
      designation: "Interior Designer",
      avatarInitials: "AK",
      avatarColor: "#06D6A0",
      costRatePerHour: 1100,
    },
    {
      id: "user-sanjay-001",
      name: "Sanjay Thomas",
      email: "sanjay@coastaldesign.in",
      role: "accounts",
      designation: "Accounts Manager",
      avatarInitials: "ST",
      avatarColor: "#FFB703",
      costRatePerHour: 800,
    },
    {
      id: "user-meera-001",
      name: "Meera Suresh",
      email: "meera@coastaldesign.in",
      role: "staff",
      designation: "Architect",
      avatarInitials: "MS",
      avatarColor: "#FF6B6B",
      costRatePerHour: 1200,
    },
    {
      id: "user-faiz-001",
      name: "Mohammed Faiz",
      email: "faiz@coastaldesign.in",
      role: "staff",
      designation: "Civil Engineer",
      avatarInitials: "MF",
      avatarColor: "#4CC9F0",
      costRatePerHour: 1000,
    },
  ];

  for (const staff of staffData) {
    const user = await prisma.user.upsert({
      where: { email: staff.email },
      update: { passwordHash }, // update hash on every seed run
      create: {
        ...staff,
        firmId: firm.id,
        passwordHash,
        status: "active",
      },
    });
    console.log(`  👤 ${user.name} (${user.role}) — ${user.email}`);
  }

  // ── Project Template ───────────────────────────────────────────────────────
  await prisma.projectTemplate.deleteMany({
    where: { firmId: firm.id },
  });

  const template = await prisma.projectTemplate.create({
      data: {
        firmId: firm.id,
        name: "Standard Residential",
        description: "Standard workflow for residential architecture projects",
        isDefault: true,
        stages: {
          create: [
            {
              name: "Schematic Design",
              order: 1,
              isClientApprovalRequired: true,
              defaultDurationDays: 21,
              tasks: {
                create: [
                  { title: "Site Analysis & Measurements", order: 1, priority: "high" },
                  { title: "Zoning & Concept Sketches", order: 2, priority: "normal" },
                  { title: "Initial Floor Plans (Options A & B)", order: 3, priority: "high" },
                  { title: "Client Presentation - Concept", order: 4, priority: "normal" },
                ],
              },
            },
            {
              name: "Design Development",
              order: 2,
              isClientApprovalRequired: true,
              defaultDurationDays: 30,
              tasks: {
                create: [
                  { title: "Refined Floor Plans", order: 1, priority: "high" },
                  { title: "3D Massing & Exterior Elevations", order: 2, priority: "high" },
                  { title: "Basic MEP Coordination Layouts", order: 3, priority: "normal" },
                  { title: "Client Presentation - 3D Walkthrough", order: 4, priority: "normal" },
                ],
              },
            },
            {
              name: "Working Drawings",
              order: 3,
              isClientApprovalRequired: false,
              defaultDurationDays: 45,
              tasks: {
                create: [
                  { title: "GFC Floor Plans & Sections", order: 1, priority: "high" },
                  { title: "Structural Drawings (from Consultant)", order: 2, priority: "high" },
                  { title: "Detailed MEP Drawings", order: 3, priority: "high" },
                  { title: "Joinery & Interior Details", order: 4, priority: "normal" },
                  { title: "Door & Window Schedules", order: 5, priority: "normal" },
                ],
              },
            },
            {
              name: "Tender",
              order: 4,
              isClientApprovalRequired: false,
              defaultDurationDays: 14,
              tasks: {
                create: [
                  { title: "Prepare Bill of Quantities (BOQ)", order: 1, priority: "high" },
                  { title: "Issue Tender Documents to Contractors", order: 2, priority: "normal" },
                  { title: "Evaluate Contractor Bids", order: 3, priority: "high" },
                ],
              },
            },
            {
              name: "Construction",
              order: 5,
              isClientApprovalRequired: false,
              defaultDurationDays: 180,
              tasks: {
                create: [
                  { title: "Site Handover & Marking", order: 1, priority: "high" },
                  { title: "Plinth Level Check", order: 2, priority: "high" },
                  { title: "Roof Slab Casting Site Visit", order: 3, priority: "high" },
                  { title: "Flooring & Finishes Selection", order: 4, priority: "normal" },
                ],
              },
            },
            {
              name: "Final Handover",
              order: 6,
              isClientApprovalRequired: true,
              defaultDurationDays: 7,
              tasks: {
                create: [
                  { title: "Punch List Walkthrough", order: 1, priority: "high" },
                  { title: "As-Built Drawings Compilation", order: 2, priority: "normal" },
                  { title: "Project Closure Sign-off", order: 3, priority: "normal" },
                ],
              },
            },
          ],
        },
      },
    });
    console.log(`✅ Template: ${template.name}`);

  console.log("\n✨ Seed complete.");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  DEV LOGIN CREDENTIALS (never use in production)");
  console.log("  Password for ALL users: archos@2024");
  console.log("  Admin:      adil@coastaldesign.in");
  console.log("  Team Lead:  priya@coastaldesign.in");
  console.log("  Staff:      rahul@coastaldesign.in");
  console.log("  Accounts:   sanjay@coastaldesign.in");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

