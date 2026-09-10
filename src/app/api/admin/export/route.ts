import { NextRequest } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@/generated/prisma";
import { csvResponse, toCsv } from "@/lib/csv";
import { format } from "date-fns";
import type { Prisma } from "@/generated/prisma";

export const runtime = "nodejs";

const STAFF_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PROJECT_MANAGER,
  UserRole.SITE_ENGINEER,
  UserRole.FOREMAN,
  UserRole.ACCOUNTANT,
  UserRole.VIEWER,
];

function stamp(name: string) {
  return `${name}-${format(new Date(), "yyyy-MM-dd")}.csv`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const resource = searchParams.get("resource") ?? "";
  const q = (searchParams.get("q") ?? "").trim();
  const status = searchParams.get("status") ?? "";

  try {
    switch (resource) {
      case "clients": {
        const where: Prisma.UserWhereInput = {
          role: UserRole.CLIENT,
          ...(q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                  { phone: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        };
        const rows = await prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { serviceRequests: true } } },
        });
        return csvResponse(
          stamp("clients"),
          toCsv(
            ["Name", "Email", "Phone", "Status", "Services", "Joined"],
            rows.map((r) => [
              r.name,
              r.email,
              r.phone,
              r.isActive ? "Active" : "Inactive",
              r._count.serviceRequests,
              format(r.createdAt, "yyyy-MM-dd"),
            ])
          )
        );
      }

      case "contractors": {
        const where: Prisma.UserWhereInput = {
          role: UserRole.CONTRACTOR,
          ...(q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                  { phone: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        };
        const rows = await prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { contractorServices: true } } },
        });
        return csvResponse(
          stamp("contractors"),
          toCsv(
            ["Name", "Email", "Phone", "Status", "Services", "Joined"],
            rows.map((r) => [
              r.name,
              r.email,
              r.phone,
              r.isActive ? "Active" : "Inactive",
              r._count.contractorServices,
              format(r.createdAt, "yyyy-MM-dd"),
            ])
          )
        );
      }

      case "users": {
        const where: Prisma.UserWhereInput = {
          role: { in: STAFF_ROLES },
          ...(q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                  { phone: { contains: q, mode: "insensitive" } },
                  { staffRole: { name: { contains: q, mode: "insensitive" } } },
                ],
              }
            : {}),
        };
        const rows = await prisma.user.findMany({
          where,
          orderBy: [{ role: "asc" }, { name: "asc" }],
          include: { staffRole: { select: { name: true } } },
        });
        return csvResponse(
          stamp("users"),
          toCsv(
            ["Name", "Email", "Phone", "Role", "Staff Role", "Status", "Verified", "Joined"],
            rows.map((r) => [
              r.name,
              r.email,
              r.phone,
              r.role,
              r.staffRole?.name,
              r.isActive ? "Active" : "Inactive",
              r.emailVerified ? "Yes" : "No",
              format(r.createdAt, "yyyy-MM-dd"),
            ])
          )
        );
      }

      case "roles": {
        const where: Prisma.StaffRoleWhereInput = q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { key: { contains: q, mode: "insensitive" } },
              ],
            }
          : {};
        const rows = await prisma.staffRole.findMany({
          where,
          orderBy: [{ isSystem: "desc" }, { name: "asc" }],
          include: { _count: { select: { users: true } } },
        });
        return csvResponse(
          stamp("roles"),
          toCsv(
            ["Name", "Key", "Base Role", "Users", "Permissions", "Active", "System", "Description"],
            rows.map((r) => [
              r.name,
              r.key,
              r.baseRole,
              r._count.users,
              r.permissions.join("; "),
              r.isActive ? "Yes" : "No",
              r.isSystem ? "Yes" : "No",
              r.description,
            ])
          )
        );
      }

      case "projects": {
        const where: Prisma.ServiceRequestWhereInput = {
          ...(status ? { status: status as never } : {}),
          ...(q
            ? {
                OR: [
                  { location: { contains: q, mode: "insensitive" } },
                  { message: { contains: q, mode: "insensitive" } },
                  { client: { name: { contains: q, mode: "insensitive" } } },
                  { client: { email: { contains: q, mode: "insensitive" } } },
                  { service: { title: { contains: q, mode: "insensitive" } } },
                  { service: { category: { contains: q, mode: "insensitive" } } },
                  {
                    service: {
                      contractor: { name: { contains: q, mode: "insensitive" } },
                    },
                  },
                ],
              }
            : {}),
        };
        const rows = await prisma.serviceRequest.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            client: { select: { name: true, email: true, phone: true } },
            service: {
              select: {
                title: true,
                category: true,
                contractor: { select: { name: true, email: true } },
              },
            },
          },
        });
        return csvResponse(
          stamp("projects-jobs"),
          toCsv(
            [
              "Service",
              "Category",
              "Status",
              "Client",
              "Client Email",
              "Contractor",
              "Location",
              "Budget",
              "Created",
            ],
            rows.map((r) => [
              r.service.title,
              r.service.category,
              r.status,
              r.client.name,
              r.client.email,
              r.service.contractor.name,
              r.location,
              r.budget,
              format(r.createdAt, "yyyy-MM-dd"),
            ])
          )
        );
      }

      case "materials": {
        const where: Prisma.MaterialWhereInput = q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { category: { contains: q, mode: "insensitive" } },
                { supplier: { contains: q, mode: "insensitive" } },
                { project: { name: { contains: q, mode: "insensitive" } } },
                { project: { code: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {};
        const rows = await prisma.material.findMany({
          where,
          orderBy: { name: "asc" },
          include: { project: { select: { name: true, code: true } } },
        });
        return csvResponse(
          stamp("materials"),
          toCsv(
            ["Name", "Category", "Unit", "Stock", "Min Stock", "Unit Price", "Supplier", "Project", "Project Code"],
            rows.map((r) => [
              r.name,
              r.category,
              r.unit,
              r.currentStock ?? r.stockQty,
              r.minimumStock ?? r.minStockQty,
              r.unitPrice,
              r.supplier,
              r.project?.name,
              r.project?.code,
            ])
          )
        );
      }

      case "equipment": {
        const where: Prisma.EquipmentWhereInput = q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { type: { contains: q, mode: "insensitive" } },
                { model: { contains: q, mode: "insensitive" } },
                { serialNumber: { contains: q, mode: "insensitive" } },
              ],
            }
          : {};
        const rows = await prisma.equipment.findMany({
          where,
          orderBy: { name: "asc" },
        });
        return csvResponse(
          stamp("equipment"),
          toCsv(
            ["Name", "Type", "Model", "Serial", "Status", "Daily Rate", "Purchase Cost"],
            rows.map((r) => [
              r.name,
              r.type,
              r.model,
              r.serialNumber,
              r.status,
              r.dailyRate,
              r.purchaseCost,
            ])
          )
        );
      }

      case "site-reports": {
        const where: Prisma.SiteReportWhereInput = q
          ? {
              OR: [
                { summary: { contains: q, mode: "insensitive" } },
                { weather: { contains: q, mode: "insensitive" } },
                { project: { name: { contains: q, mode: "insensitive" } } },
                { project: { code: { contains: q, mode: "insensitive" } } },
                { reporter: { name: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {};
        const rows = await prisma.siteReport.findMany({
          where,
          orderBy: { reportDate: "desc" },
          include: {
            project: { select: { name: true, code: true } },
            reporter: { select: { name: true } },
          },
        });
        return csvResponse(
          stamp("site-reports"),
          toCsv(
            ["Date", "Project", "Code", "Reporter", "Progress %", "Workers", "Weather", "Summary"],
            rows.map((r) => [
              format(r.reportDate, "yyyy-MM-dd"),
              r.project.name,
              r.project.code,
              r.reporter.name,
              r.workProgress,
              r.totalWorkers ?? r.workersPresent,
              r.weather ?? r.weatherCondition,
              r.summary,
            ])
          )
        );
      }

      case "issues": {
        const where: Prisma.IssueWhereInput = q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { project: { name: { contains: q, mode: "insensitive" } } },
                { project: { code: { contains: q, mode: "insensitive" } } },
                { reporter: { name: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {};
        const rows = await prisma.issue.findMany({
          where,
          orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
          include: {
            project: { select: { name: true, code: true } },
            reporter: { select: { name: true } },
            assignee: { select: { name: true } },
          },
        });
        return csvResponse(
          stamp("issues"),
          toCsv(
            ["Title", "Severity", "Status", "Project", "Code", "Reporter", "Assignee", "Location", "Created"],
            rows.map((r) => [
              r.title,
              r.severity,
              r.status,
              r.project.name,
              r.project.code,
              r.reporter.name,
              r.assignee?.name,
              r.location,
              format(r.createdAt, "yyyy-MM-dd"),
            ])
          )
        );
      }

      case "documents": {
        const where: Prisma.DocumentWhereInput = q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { notes: { contains: q, mode: "insensitive" } },
                { project: { name: { contains: q, mode: "insensitive" } } },
                { project: { code: { contains: q, mode: "insensitive" } } },
                { uploadedBy: { name: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {};
        const rows = await prisma.document.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            project: { select: { name: true, code: true } },
            uploadedBy: { select: { name: true } },
          },
        });
        return csvResponse(
          stamp("documents"),
          toCsv(
            ["Name", "Type", "Project", "Code", "Uploaded By", "File URL", "Created"],
            rows.map((r) => [
              r.name,
              r.type,
              r.project.name,
              r.project.code,
              r.uploadedBy.name,
              r.fileUrl,
              format(r.createdAt, "yyyy-MM-dd"),
            ])
          )
        );
      }

      case "invoices": {
        const where: Prisma.InvoiceWhereInput = {
          ...(status ? { status: status as never } : {}),
          ...(q
            ? {
                OR: [
                  { invoiceNo: { contains: q, mode: "insensitive" } },
                  { invoiceNumber: { contains: q, mode: "insensitive" } },
                  { notes: { contains: q, mode: "insensitive" } },
                  { client: { name: { contains: q, mode: "insensitive" } } },
                  { project: { name: { contains: q, mode: "insensitive" } } },
                  { project: { code: { contains: q, mode: "insensitive" } } },
                ],
              }
            : {}),
        };
        const rows = await prisma.invoice.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            client: { select: { name: true } },
            project: { select: { name: true, code: true } },
          },
        });
        return csvResponse(
          stamp("invoices"),
          toCsv(
            [
              "Invoice No",
              "Status",
              "Client",
              "Project",
              "Code",
              "Total",
              "Paid",
              "Due Date",
              "Created",
            ],
            rows.map((r) => [
              r.invoiceNumber ?? r.invoiceNo,
              r.status,
              r.client?.name,
              r.project.name,
              r.project.code,
              r.totalAmount,
              r.paidAmount,
              r.dueDate ? format(r.dueDate, "yyyy-MM-dd") : "",
              format(r.createdAt, "yyyy-MM-dd"),
            ])
          )
        );
      }

      case "expenses": {
        const where: Prisma.ExpenseWhereInput = q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { category: { contains: q, mode: "insensitive" } },
                { vendor: { contains: q, mode: "insensitive" } },
                { project: { name: { contains: q, mode: "insensitive" } } },
                { submittedBy: { name: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {};
        const rows = await prisma.expense.findMany({
          where,
          orderBy: { expenseDate: "desc" },
          include: {
            project: { select: { name: true, code: true } },
            submittedBy: { select: { name: true } },
          },
        });
        return csvResponse(
          stamp("expenses"),
          toCsv(
            ["Title", "Category", "Amount", "Vendor", "Project", "Code", "Submitted By", "Date"],
            rows.map((r) => [
              r.title,
              r.category,
              r.amount,
              r.vendor,
              r.project?.name,
              r.project?.code,
              r.submittedBy?.name,
              format(r.expenseDate, "yyyy-MM-dd"),
            ])
          )
        );
      }

      case "services": {
        const where: Prisma.ServiceWhereInput = q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { category: { contains: q, mode: "insensitive" } },
                { contractor: { name: { contains: q, mode: "insensitive" } } },
                { contractor: { email: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {};
        const rows = await prisma.service.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            contractor: { select: { name: true, email: true, phone: true } },
            _count: { select: { requests: true } },
          },
        });
        return csvResponse(
          stamp("services"),
          toCsv(
            [
              "Title",
              "Category",
              "Active",
              "Price From",
              "Price To",
              "Unit",
              "Contractor",
              "Email",
              "Phone",
              "Requests",
              "Created",
            ],
            rows.map((r) => [
              r.title,
              r.category,
              r.isActive ? "Yes" : "No",
              r.priceFrom,
              r.priceTo,
              r.priceUnit,
              r.contractor.name,
              r.contractor.email,
              r.contractor.phone,
              r._count.requests,
              format(r.createdAt, "yyyy-MM-dd"),
            ])
          )
        );
      }

      case "notifications": {
        const where: Prisma.NotificationWhereInput = {
          userId: session.user.id!,
          ...(q
            ? {
                OR: [
                  { title: { contains: q, mode: "insensitive" } },
                  { message: { contains: q, mode: "insensitive" } },
                  { type: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        };
        const rows = await prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 500,
        });
        return csvResponse(
          stamp("notifications"),
          toCsv(
            ["Title", "Message", "Type", "Read", "Link", "Created"],
            rows.map((r) => [
              r.title,
              r.message,
              r.type,
              r.isRead ? "Yes" : "No",
              r.link,
              format(r.createdAt, "yyyy-MM-dd HH:mm"),
            ])
          )
        );
      }

      default:
        return new Response(`Unknown resource: ${resource}`, { status: 400 });
    }
  } catch (err) {
    console.error("[CSV_EXPORT]", err);
    return new Response("Export failed", { status: 500 });
  }
}
