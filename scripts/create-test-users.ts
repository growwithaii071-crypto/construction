import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      name: "Test Customer",
      email: "customer@buildpro.com",
      password: "Customer@123",
      role: "CLIENT" as const,
    },
    {
      name: "Test Contractor — BuildPro Services",
      email: "contractor@buildpro.com",
      password: "Contractor@123",
      role: "CONTRACTOR" as const,
      avatar: JSON.stringify({
        companyName: "BuildPro Services",
        specialization: ["Residential Construction", "Renovation & Remodeling"],
        licenseNumber: "MH-CON-2024-0099",
      }),
    },
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`⚠️  Already exists: ${u.email}`);
      continue;
    }
    const hashed = await bcrypt.hash(u.password, 12);
    await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: hashed,
        role: u.role,
        isActive: true,
        emailVerified: new Date(),
        avatar: u.avatar ?? null,
      },
    });
    console.log(`✅ Created [${u.role}]: ${u.email}`);
  }

  console.log("\n📋 Login Details:");
  console.log("─────────────────────────────────────────");
  console.log("👤 Customer");
  console.log("   Email   : customer@buildpro.com");
  console.log("   Password: Customer@123");
  console.log("   URL     : http://localhost:3000/customer/login");
  console.log("");
  console.log("🏗️  Contractor");
  console.log("   Email   : contractor@buildpro.com");
  console.log("   Password: Contractor@123");
  console.log("   URL     : http://localhost:3000/construction/login");
  console.log("─────────────────────────────────────────");
}

main().catch(console.error).finally(() => prisma.$disconnect());
