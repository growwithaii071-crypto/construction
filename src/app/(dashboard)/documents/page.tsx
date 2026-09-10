import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Card } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { AdminSearch } from "@/components/admin/admin-search";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const q = (params.q ?? "").trim();

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

  const documents = await prisma.document
    .findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { name: true, code: true } },
        uploadedBy: { select: { name: true } },
      },
    })
    .catch(() => []);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-sm text-gray-500">{documents.length} documents</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch
          basePath="/documents"
          initialQuery={q}
          placeholder="Search name, project, uploader…"
        />
        <CsvExportButton resource="documents" query={q} />
      </div>

      {documents.length === 0 ? (
        <div className="py-20 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-gray-200" />
          <p className="font-medium text-gray-500">
            {q ? "No documents match your search" : "No documents yet"}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {q ? "Try a different keyword" : "Documents uploaded in projects will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                      <span>{doc.type}</span>
                      {doc.project && <span>· {doc.project.code}</span>}
                      <span>· {format(new Date(doc.createdAt), "dd MMM yyyy")}</span>
                      {doc.uploadedBy && <span>· {doc.uploadedBy.name}</span>}
                    </div>
                  </div>
                </div>
                {doc.fileUrl && (
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
