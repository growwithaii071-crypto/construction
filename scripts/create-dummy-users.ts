import { PrismaClient, UserRole } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_STAFF_ROLES = [
  {
    key: "manager",
    name: "Manager",
    description: "Manages projects, clients and team operations",
    baseRole: UserRole.PROJECT_MANAGER,
    permissions: [
      "dashboard.view",
      "projects.view",
      "projects.manage",
      "clients.view",
      "contractors.view",
      "users.view",
      "finance.view",
    ],
  },
  {
    key: "employee",
    name: "Employee",
    description: "Day-to-day staff with limited access",
    baseRole: UserRole.VIEWER,
    permissions: ["dashboard.view", "projects.view", "clients.view", "contractors.view"],
  },
  {
    key: "site_engineer",
    name: "Site Engineer",
    description: "Field and site engineering access",
    baseRole: UserRole.SITE_ENGINEER,
    permissions: ["dashboard.view", "projects.view", "projects.manage", "clients.view"],
  },
  {
    key: "accountant",
    name: "Accountant",
    description: "Invoices, expenses and finance",
    baseRole: UserRole.ACCOUNTANT,
    permissions: ["dashboard.view", "finance.view", "projects.view"],
  },
] as const;

const DUMMY_USERS = [
  {
    name: "Rahul Sharma",
    email: "rahul.manager@buildpro.com",
    password: "User@123",
    phone: "9876543210",
    roleKey: "manager",
  },
  {
    name: "Priya Patel",
    email: "priya.employee@buildpro.com",
    password: "User@123",
    phone: "9876543211",
    roleKey: "employee",
  },
  {
    name: "Amit Verma",
    email: "amit.engineer@buildpro.com",
    password: "User@123",
    phone: "9876543212",
    roleKey: "site_engineer",
  },
  {
    name: "Sneha Gupta",
    email: "sneha.accounts@buildpro.com",
    password: "User@123",
    phone: "9876543213",
    roleKey: "accountant",
  },
  {
    name: "Vikram Singh",
    email: "vikram.manager@buildpro.com",
    password: "User@123",
    phone: "9876543214",
    roleKey: "manager",
  },
  {
    name: "Neha Joshi",
    email: "neha.employee@buildpro.com",
    password: "User@123",
    phone: "9876543215",
    roleKey: "employee",
  },
] as const;

async function main() {
  for (const r of DEFAULT_STAFF_ROLES) {
    await prisma.staffRole.upsert({
      where: { key: r.key },
      create: {
        key: r.key,
        name: r.name,
        description: r.description,
        baseRole: r.baseRole,
        permissions: [...r.permissions],
        isSystem: true,
        isActive: true,
      },
      update: {},
    });
  }

  const roles = await prisma.staffRole.findMany();
  const byKey = Object.fromEntries(roles.map((r) => [r.key, r]));

  console.log("Creating dummy staff users…\n");

  for (const u of DUMMY_USERS) {
    const staffRole = byKey[u.roleKey];
    if (!staffRole) {
      console.log(`⚠️  Role missing: ${u.roleKey}`);
      continue;
    }

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
        phone: u.phone,
        role: staffRole.baseRole,
        staffRoleId: staffRole.id,
        isActive: true,
        emailVerified: new Date(),
      },
    });
    console.log(`✅ ${u.name} · ${staffRole.name} · ${u.email}`);
  }

  console.log("\n─────────────────────────────────────────");
  console.log("Password for all dummy users: User@123");
  console.log("─────────────────────────────────────────");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
