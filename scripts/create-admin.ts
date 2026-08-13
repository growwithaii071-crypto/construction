import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@buildpro.com";
  const password = "Admin@123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("✅ Admin already exists:", email);
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name: "Super Admin",
      email,
      password: hashed,
      role: "SUPER_ADMIN",
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log("✅ Admin created!");
  console.log("📧 Email:", email);
  console.log("🔑 Password:", password);
  console.log("🔗 Login: http://localhost:3000/login");
}

main().catch(console.error).finally(() => prisma.$disconnect());
