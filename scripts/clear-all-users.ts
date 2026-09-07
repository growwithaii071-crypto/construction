import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Delete in dependency order (children first)
  const d: Record<string, number> = {};

  d.serviceRequests  = (await prisma.serviceRequest.deleteMany()).count;
  d.services         = (await prisma.service.deleteMany()).count;
  d.comments         = (await prisma.comment.deleteMany()).count;
  d.issues           = (await prisma.issue.deleteMany()).count;
  d.notifications    = (await prisma.notification.deleteMany()).count;
  d.invoiceItems     = (await prisma.invoiceItem.deleteMany()).count;
  d.payments         = (await prisma.payment.deleteMany()).count;
  d.invoices         = (await prisma.invoice.deleteMany()).count;
  d.expenses         = (await prisma.expense.deleteMany()).count;
  d.siteReports      = (await prisma.siteReport.deleteMany()).count;
  d.documents        = (await prisma.document.deleteMany()).count;
  d.projectEquipment = (await prisma.projectEquipment.deleteMany()).count;
  d.equipment        = (await prisma.equipment.deleteMany()).count;
  d.projectMaterials = (await prisma.projectMaterial.deleteMany()).count;
  d.materials        = (await prisma.material.deleteMany()).count;
  d.projectContractors = (await prisma.projectContractor.deleteMany()).count;
  d.contractors      = (await prisma.contractor.deleteMany()).count;
  d.tasks            = (await prisma.task.deleteMany()).count;
  d.milestones       = (await prisma.milestone.deleteMany()).count;
  d.clientProjects   = (await prisma.clientProject.deleteMany()).count;
  d.projects         = (await prisma.project.deleteMany()).count;
  d.clients          = (await prisma.client.deleteMany()).count;
  d.refreshTokens    = (await prisma.refreshToken.deleteMany()).count;
  d.passwordTokens   = (await prisma.passwordResetToken.deleteMany()).count;
  d.emailTokens      = (await prisma.emailVerificationToken.deleteMany()).count;
  d.users            = (await prisma.user.deleteMany()).count;

  console.log("🗑️  Deleted:");
  Object.entries(d).forEach(([k, v]) => v > 0 && console.log(`   ✓ ${v} ${k}`));
  console.log("\n✅ All data cleared successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
