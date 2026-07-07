import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Card } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { format } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  await requireAuth();

  const documents = await prisma.document
    .findMany({
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { name: true, code: true } },
        uploadedBy: { select: { name: true } },
      },
    })
    .catch(() => []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-sm text-gray-500">{documents.length} documents</p>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No documents yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Documents uploaded in projects will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{doc.type}</span>
                      {doc.project && <span>· {doc.project.code}</span>}
                      <span>· {format(new Date(doc.createdAt), "dd MMM yyyy")}</span>
                      {doc.uploadedBy && <span>· {doc.uploadedBy.name}</span>}
                    </div>
                  </div>
                </div>
                {doc.fileUrl && (
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 text-gray-400 hover:text-blue-600" />
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
