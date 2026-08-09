import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "customer@buildpro.com";
  const password = "Customer@123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("✅ Customer user already exists:", email);
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name: "Test Customer",
      email,
      password: hashed,
      role: "CLIENT",
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log("✅ Test customer created!");
  console.log("📧 Email:", email);
  console.log("🔑 Password:", password);
  console.log("🔗 Login: http://localhost:3000/customer/login");
}

main().catch(console.error).finally(() => prisma.$disconnect());
