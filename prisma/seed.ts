import {
  PrismaClient,
  UserRole,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  ContractorType,
  MaterialUnit,
  InvoiceStatus,
  PaymentMethod,
  IssueSeverity,
  IssueStatus,
  MilestoneStatus,
  EquipmentStatus,
} from "../src/generated/prisma";
import { hashSync } from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // ─── Cleanup (order matters due to FK constraints) ────────
  console.log("🧹 Cleaning existing data...");
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.siteReport.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.projectEquipment.deleteMany();
  await prisma.projectMaterial.deleteMany();
  await prisma.projectContractor.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.project.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.clientProject.deleteMany();
  await prisma.user.deleteMany();
  await prisma.client.deleteMany();
  await prisma.contractor.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.material.deleteMany();
  console.log("✅ Cleanup done\n");

  // ─── Users ───────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@construction.com" },
    update: {},
    create: {
      name: "Rajesh Verma",
      email: "admin@construction.com",
      password: hashSync("Admin@123", 12),
      role: UserRole.SUPER_ADMIN,
      phone: "+91-9876543210",
      isActive: true,
    },
  });

  const pmUser = await prisma.user.upsert({
    where: { email: "pm@construction.com" },
    update: {},
    create: {
      name: "Anil Kumar",
      email: "pm@construction.com",
      password: hashSync("PM@123", 12),
      role: UserRole.PROJECT_MANAGER,
      phone: "+91-9876543211",
      isActive: true,
    },
  });

  const engineerUser = await prisma.user.upsert({
    where: { email: "engineer@construction.com" },
    update: {},
    create: {
      name: "Priya Sharma",
      email: "engineer@construction.com",
      password: hashSync("Eng@123", 12),
      role: UserRole.SITE_ENGINEER,
      phone: "+91-9876543212",
      isActive: true,
    },
  });

  const accountantUser = await prisma.user.upsert({
    where: { email: "accounts@construction.com" },
    update: {},
    create: {
      name: "Suresh Mehta",
      email: "accounts@construction.com",
      password: hashSync("Acc@123", 12),
      role: UserRole.ACCOUNTANT,
      phone: "+91-9876543213",
      isActive: true,
    },
  });

  console.log("✅ Users seeded");

  // ─── Clients ──────────────────────────────────────────────
  const client1 = await prisma.client.upsert({
    where: { email: "ravi.builders@gmail.com" },
    update: {},
    create: {
      name: "Ravi Shankar",
      email: "ravi.builders@gmail.com",
      phone: "+91-9812345678",
      company: "Ravi Builders Pvt Ltd",
      address: "14, MG Road",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
      gst: "29AABCR1234D1Z1",
    },
  });

  const client2 = await prisma.client.upsert({
    where: { email: "sunita.enterprises@gmail.com" },
    update: {},
    create: {
      name: "Sunita Rao",
      email: "sunita.enterprises@gmail.com",
      phone: "+91-9823456789",
      company: "Sunita Enterprises",
      address: "27, Park Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      gst: "27AACCS5678E1Z5",
    },
  });

  console.log("✅ Clients seeded");

  // ─── Contractors ──────────────────────────────────────────
  const contractor1 = await prisma.contractor.upsert({
    where: { email: "suresh.civil@gmail.com" },
    update: {},
    create: {
      name: "Suresh Constructions",
      company: "Suresh Civil Works",
      type: ContractorType.CIVIL,
      email: "suresh.civil@gmail.com",
      phone: "+91-9834567890",
      city: "Bangalore",
      state: "Karnataka",
      rating: 4.5,
      isActive: true,
    },
  });

  const contractor2 = await prisma.contractor.upsert({
    where: { email: "mehta.electrical@gmail.com" },
    update: {},
    create: {
      name: "Mehta Electricals",
      company: "Mehta Electrical Works",
      type: ContractorType.ELECTRICAL,
      email: "mehta.electrical@gmail.com",
      phone: "+91-9845678901",
      city: "Mumbai",
      state: "Maharashtra",
      rating: 4.2,
      isActive: true,
    },
  });

  console.log("✅ Contractors seeded");

  // ─── Materials ────────────────────────────────────────────
  await prisma.material.createMany({
    data: [
      { name: "Cement (OPC 53 Grade)", description: "Ordinary Portland Cement 53 Grade", unit: MaterialUnit.BAG, unitPrice: 380, stockQty: 500, minStockQty: 100, supplier: "UltraTech Cement" },
      { name: "TMT Steel Bars (Fe500)", description: "High-strength TMT steel reinforcement bars", unit: MaterialUnit.KG, unitPrice: 68, stockQty: 10000, minStockQty: 2000, supplier: "TATA Steel" },
      { name: "Red Bricks", description: "Standard red clay bricks", unit: MaterialUnit.PIECE, unitPrice: 9, stockQty: 50000, minStockQty: 10000, supplier: "Local Kiln" },
      { name: "River Sand (M-Sand)", description: "Fine aggregate for construction", unit: MaterialUnit.CUBIC_METER, unitPrice: 1200, stockQty: 200, minStockQty: 50, supplier: "Sand Suppliers Co." },
      { name: "Coarse Aggregate (20mm)", description: "Crushed stone aggregate 20mm", unit: MaterialUnit.CUBIC_METER, unitPrice: 1800, stockQty: 150, minStockQty: 30, supplier: "Quarry Works Ltd" },
    ],
  });
  const materials = await prisma.material.findMany({ orderBy: { createdAt: "asc" } });

  console.log("✅ Materials seeded");

  // ─── Equipment ────────────────────────────────────────────
  const equipment = await Promise.all([
    prisma.equipment.upsert({
      where: { serialNumber: "JCB-2024-001" },
      update: {},
      create: {
        name: "JCB Excavator",
        model: "JCB 3DX Plus",
        serialNumber: "JCB-2024-001",
        status: EquipmentStatus.AVAILABLE,
        dailyRate: 8000,
      },
    }),
    prisma.equipment.upsert({
      where: { serialNumber: "MIXER-2024-001" },
      update: {},
      create: {
        name: "Concrete Mixer",
        model: "Ajax Fiori DB 650",
        serialNumber: "MIXER-2024-001",
        status: EquipmentStatus.AVAILABLE,
        dailyRate: 2500,
      },
    }),
    prisma.equipment.upsert({
      where: { serialNumber: "CRANE-2024-001" },
      update: {},
      create: {
        name: "Tower Crane",
        model: "Potain MDT 178",
        serialNumber: "CRANE-2024-001",
        status: EquipmentStatus.AVAILABLE,
        dailyRate: 25000,
      },
    }),
  ]);

  console.log("✅ Equipment seeded");

  // ─── Project 1 ────────────────────────────────────────────
  const project1 = await prisma.project.upsert({
    where: { code: "PRJ-2024-001" },
    update: {},
    create: {
      name: "Ravi Residency — Phase 1",
      code: "PRJ-2024-001",
      description: "G+5 residential apartment complex with 30 units in Bangalore",
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date("2024-01-15"),
      endDate: new Date("2025-06-30"),
      estimatedEndDate: new Date("2025-06-30"),
      budgetAmount: 25000000,
      spentAmount: 8500000,
      address: "Survey No. 45, Whitefield Main Road",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560066",
      latitude: 12.9698,
      longitude: 77.7499,
      clientId: client1.id,
      managerId: pmUser.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { code: "PRJ-2024-002" },
    update: {},
    create: {
      name: "Sunita Commercial Tower",
      code: "PRJ-2024-002",
      description: "12-floor commercial tower with retail and office spaces in Mumbai",
      status: ProjectStatus.PLANNING,
      startDate: new Date("2024-03-01"),
      endDate: new Date("2026-02-28"),
      estimatedEndDate: new Date("2026-02-28"),
      budgetAmount: 85000000,
      spentAmount: 1200000,
      address: "Plot 18, BKC",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400051",
      clientId: client2.id,
      managerId: pmUser.id,
    },
  });

  console.log("✅ Projects seeded");

  // ─── Project Contractors ─────────────────────────────────
  await prisma.projectContractor.upsert({
    where: { projectId_contractorId: { projectId: project1.id, contractorId: contractor1.id } },
    update: {},
    create: {
      projectId: project1.id,
      contractorId: contractor1.id,
      contractValue: 15000000,
      startDate: new Date("2024-01-15"),
    },
  });

  await prisma.projectContractor.upsert({
    where: { projectId_contractorId: { projectId: project1.id, contractorId: contractor2.id } },
    update: {},
    create: {
      projectId: project1.id,
      contractorId: contractor2.id,
      contractValue: 3500000,
      startDate: new Date("2024-04-01"),
    },
  });

  console.log("✅ Project contractors seeded");

  // ─── Milestones ───────────────────────────────────────────
  const m1 = await prisma.milestone.create({
    data: {
      name: "Foundation & Excavation",
      description: "Complete site excavation and lay foundation",
      status: MilestoneStatus.COMPLETED,
      dueDate: new Date("2024-03-31"),
      completedAt: new Date("2024-03-28"),
      order: 1,
      projectId: project1.id,
    },
  });

  const m2 = await prisma.milestone.create({
    data: {
      name: "Ground Floor Structure",
      description: "Columns, beams, and slab for ground floor",
      status: MilestoneStatus.IN_PROGRESS,
      dueDate: new Date("2024-06-30"),
      order: 2,
      projectId: project1.id,
    },
  });

  const m3 = await prisma.milestone.create({
    data: {
      name: "First & Second Floor",
      description: "Complete structure for floors 1 and 2",
      status: MilestoneStatus.PENDING,
      dueDate: new Date("2024-10-31"),
      order: 3,
      projectId: project1.id,
    },
  });

  console.log("✅ Milestones seeded");

  // ─── Tasks ────────────────────────────────────────────────
  await prisma.task.createMany({
    data: [
      {
        title: "Site survey and soil testing",
        description: "Conduct detailed soil testing and site survey",
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
        startDate: new Date("2024-01-15"),
        dueDate: new Date("2024-01-31"),
        completedAt: new Date("2024-01-30"),
        estimatedHours: 40,
        actualHours: 38,
        projectId: project1.id,
        milestoneId: m1.id,
        assigneeId: engineerUser.id,
        creatorId: pmUser.id,
      },
      {
        title: "Excavation work",
        description: "Excavate as per drawings up to 3m depth",
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
        startDate: new Date("2024-02-01"),
        dueDate: new Date("2024-02-28"),
        completedAt: new Date("2024-02-26"),
        estimatedHours: 120,
        actualHours: 115,
        projectId: project1.id,
        milestoneId: m1.id,
        assigneeId: engineerUser.id,
        creatorId: pmUser.id,
      },
      {
        title: "Foundation concrete pouring",
        description: "Pour M25 grade concrete for footings",
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.CRITICAL,
        startDate: new Date("2024-03-01"),
        dueDate: new Date("2024-03-31"),
        completedAt: new Date("2024-03-28"),
        estimatedHours: 200,
        actualHours: 195,
        projectId: project1.id,
        milestoneId: m1.id,
        assigneeId: engineerUser.id,
        creatorId: pmUser.id,
      },
      {
        title: "Column reinforcement — Ground Floor",
        description: "Place and bind TMT steel bars for ground floor columns",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        startDate: new Date("2024-04-15"),
        dueDate: new Date("2024-05-31"),
        estimatedHours: 160,
        actualHours: 80,
        projectId: project1.id,
        milestoneId: m2.id,
        assigneeId: engineerUser.id,
        creatorId: pmUser.id,
      },
      {
        title: "Ground floor slab shuttering",
        description: "Set up formwork for ground floor slab",
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        startDate: new Date("2024-06-01"),
        dueDate: new Date("2024-06-15"),
        estimatedHours: 80,
        projectId: project1.id,
        milestoneId: m2.id,
        assigneeId: engineerUser.id,
        creatorId: pmUser.id,
      },
      {
        title: "Electrical conduit planning — Ground Floor",
        description: "Plan and install conduits before concrete",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date("2024-06-20"),
        estimatedHours: 40,
        projectId: project1.id,
        milestoneId: m2.id,
        assigneeId: engineerUser.id,
        creatorId: pmUser.id,
      },
    ],
  });

  console.log("✅ Tasks seeded");

  // ─── Project Materials ────────────────────────────────────
  await prisma.projectMaterial.createMany({
    data: [
      {
        projectId: project1.id,
        materialId: materials[0].id,
        quantity: 2000,
        usedQuantity: 800,
        unitPrice: 380,
        totalCost: 760000,
        deliveryDate: new Date("2024-01-20"),
      },
      {
        projectId: project1.id,
        materialId: materials[1].id,
        quantity: 50000,
        usedQuantity: 18000,
        unitPrice: 68,
        totalCost: 3400000,
        deliveryDate: new Date("2024-01-22"),
      },
      {
        projectId: project1.id,
        materialId: materials[2].id,
        quantity: 100000,
        usedQuantity: 0,
        unitPrice: 9,
        totalCost: 900000,
        deliveryDate: new Date("2024-05-01"),
      },
    ],
  });

  console.log("✅ Project materials seeded");

  // ─── Project Equipment ────────────────────────────────────
  await prisma.projectEquipment.createMany({
    data: [
      {
        projectId: project1.id,
        equipmentId: equipment[0].id,
        startDate: new Date("2024-02-01"),
        endDate: new Date("2024-03-15"),
        totalCost: 280000,
      },
      {
        projectId: project1.id,
        equipmentId: equipment[1].id,
        startDate: new Date("2024-03-01"),
        totalCost: 150000,
      },
    ],
  });

  console.log("✅ Project equipment seeded");

  // ─── Invoice ──────────────────────────────────────────────
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2024-001",
      status: InvoiceStatus.PAID,
      issueDate: new Date("2024-03-31"),
      dueDate: new Date("2024-04-15"),
      subtotal: 5000000,
      taxRate: 18,
      taxAmount: 900000,
      totalAmount: 5900000,
      paidAmount: 5900000,
      notes: "First milestone completion payment",
      projectId: project1.id,
      clientId: client1.id,
      lineItems: {
        create: [
          {
            description: "Foundation & Excavation Work — Milestone 1",
            quantity: 1,
            unitPrice: 4500000,
            totalPrice: 4500000,
            order: 1,
          },
          {
            description: "Material procurement — Phase 1",
            quantity: 1,
            unitPrice: 500000,
            totalPrice: 500000,
            order: 2,
          },
        ],
      },
      payments: {
        create: {
          amount: 5900000,
          method: PaymentMethod.BANK_TRANSFER,
          transactionId: "TXN20240415001",
          paymentDate: new Date("2024-04-14"),
          notes: "Full payment received via NEFT",
        },
      },
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2024-002",
      status: InvoiceStatus.PARTIAL,
      issueDate: new Date("2024-05-31"),
      dueDate: new Date("2024-06-15"),
      subtotal: 3000000,
      taxRate: 18,
      taxAmount: 540000,
      totalAmount: 3540000,
      paidAmount: 2000000,
      notes: "Ground floor progress payment",
      projectId: project1.id,
      clientId: client1.id,
      lineItems: {
        create: [
          {
            description: "Ground Floor Structural Work — Partial",
            quantity: 1,
            unitPrice: 3000000,
            totalPrice: 3000000,
            order: 1,
          },
        ],
      },
      payments: {
        create: {
          amount: 2000000,
          method: PaymentMethod.CHEQUE,
          transactionId: "CHQ-00456789",
          paymentDate: new Date("2024-06-10"),
          notes: "Partial payment — cheque",
        },
      },
    },
  });

  console.log("✅ Invoices & payments seeded");

  // ─── Expenses ─────────────────────────────────────────────
  await prisma.expense.createMany({
    data: [
      {
        title: "Site office setup",
        category: "Infrastructure",
        amount: 85000,
        expenseDate: new Date("2024-01-18"),
        description: "Temporary site office, furniture, and equipment",
        projectId: project1.id,
      },
      {
        title: "Labor welfare fund",
        category: "Labor",
        amount: 25000,
        expenseDate: new Date("2024-02-01"),
        projectId: project1.id,
      },
      {
        title: "Safety equipment purchase",
        category: "Safety",
        amount: 45000,
        expenseDate: new Date("2024-02-05"),
        description: "Helmets, safety shoes, harnesses, and signage",
        projectId: project1.id,
      },
      {
        title: "Diesel for generator",
        category: "Utilities",
        amount: 12000,
        expenseDate: new Date("2024-04-30"),
        projectId: project1.id,
      },
    ],
  });

  console.log("✅ Expenses seeded");

  // ─── Site Reports ─────────────────────────────────────────
  await prisma.siteReport.createMany({
    data: [
      {
        reportDate: new Date("2024-05-20"),
        weatherCondition: "Sunny",
        temperature: 32.5,
        workersPresent: 45,
        summary: "Column reinforcement on grids A-D progressing well",
        progress: "Completed rebar binding for 8 columns. Concrete pour scheduled tomorrow.",
        safetyNotes: "All workers wearing PPE. No incidents.",
        projectId: project1.id,
        reporterId: engineerUser.id,
      },
      {
        reportDate: new Date("2024-05-21"),
        weatherCondition: "Partly Cloudy",
        temperature: 30.0,
        workersPresent: 50,
        summary: "Concrete pour for 8 columns completed",
        progress: "Poured M30 grade concrete for columns. Curing started.",
        issues: "Slight delay due to concrete pump breakdown — resolved within 2 hours.",
        safetyNotes: "All workers wearing PPE. Minor near-miss reported and addressed.",
        projectId: project1.id,
        reporterId: engineerUser.id,
      },
    ],
  });

  console.log("✅ Site reports seeded");

  // ─── Issues ───────────────────────────────────────────────
  await prisma.issue.createMany({
    data: [
      {
        title: "Concrete honeycombing on column C4",
        description:
          "Visible honeycombing defect on south face of column C4 after shuttering removal",
        status: IssueStatus.IN_PROGRESS,
        severity: IssueSeverity.HIGH,
        location: "Ground Floor, Column C4",
        dueDate: new Date("2024-06-01"),
        projectId: project1.id,
        reporterId: engineerUser.id,
        assigneeId: pmUser.id,
      },
      {
        title: "Material delivery delay — Sand",
        description: "M-Sand delivery pending for 5 days, impacting slab shuttering",
        status: IssueStatus.OPEN,
        severity: IssueSeverity.MEDIUM,
        dueDate: new Date("2024-05-28"),
        projectId: project1.id,
        reporterId: engineerUser.id,
        assigneeId: pmUser.id,
      },
    ],
  });

  console.log("✅ Issues seeded");

  // ─── Notifications ────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        title: "Invoice Payment Received",
        message: "Payment of ₹59,00,000 received for Invoice INV-2024-001",
        type: "SUCCESS",
        userId: adminUser.id,
      },
      {
        title: "New Issue Reported",
        message: "High severity issue: Concrete honeycombing on column C4 — PRJ-2024-001",
        type: "WARNING",
        userId: pmUser.id,
      },
      {
        title: "Milestone Completed",
        message: "Milestone 'Foundation & Excavation' completed on PRJ-2024-001",
        type: "INFO",
        userId: adminUser.id,
      },
      {
        title: "Budget Alert",
        message: "Project PRJ-2024-001 has consumed 34% of total budget",
        type: "INFO",
        userId: pmUser.id,
      },
    ],
  });

  console.log("✅ Notifications seeded");

  console.log("\n🎉 Database seeded successfully!");
  console.log(`
  Summary:
  ─────────────────────────────
  👤 Users        : 4
  🏢 Clients      : 2
  🔨 Contractors  : 2
  🧱 Materials    : 5
  🚜 Equipment    : 3
  📋 Projects     : 2
  🏁 Milestones   : 3
  ✅ Tasks        : 6
  🧾 Invoices     : 2
  💰 Payments     : 2
  ⚠️  Issues       : 2
  📊 Site Reports : 2
  🔔 Notifications: 4
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
