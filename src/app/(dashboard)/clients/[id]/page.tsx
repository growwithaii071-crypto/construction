import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Edit, Phone, Mail, MapPin, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { deleteClientAction } from "@/actions/clients";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Client Detail" };

const STATUS_STYLES: Record<string, string> = {
  PLANNING: "bg-orange-100 text-orange-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;

  const client = await prisma.client
    .findUnique({
      where: { id },
      include: {
        projects: {
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, code: true, status: true, progress: true, endDate: true },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            invoiceNo: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
          },
        },
        _count: { select: { projects: true, invoices: true } },
      },
    })
    .catch(() => null);

  if (!client) notFound();

  const totalRevenue = (client.invoices ?? []).reduce(
    (acc: number, inv: { totalAmount?: number | null }) => acc + Number(inv.totalAmount ?? 0),
    0
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clients">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14">
              <AvatarFallback className="bg-[#1e3a5f] text-white text-2xl font-bold">
                {client.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
              {client.company && <p className="text-sm text-gray-400">{client.company}</p>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/${id}/edit`}>
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Link>
          </Button>
          <form action={deleteClientAction.bind(null, id)}>
            <Button
              variant="outline"
              type="submit"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Contact</h3>
            <div className="space-y-2">
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                >
                  <Mail className="w-4 h-4 text-gray-400" />
                  {client.email}
                </a>
              )}
              {client.phone && (
                <a
                  href={`tel:${client.phone}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                >
                  <Phone className="w-4 h-4 text-gray-400" />
                  {client.phone}
                </a>
              )}
              {client.city && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {[client.address, client.city, client.state, client.pincode]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}
            </div>
          </Card>

          {(client.gst || client.pan) && (
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Tax Info</h3>
              {client.gst && (
                <div className="text-sm">
                  <span className="text-gray-400 text-xs">GST: </span>
                  {client.gst}
                </div>
              )}
              {client.pan && (
                <div className="text-sm mt-1">
                  <span className="text-gray-400 text-xs">PAN: </span>
                  {client.pan}
                </div>
              )}
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{client._count.projects}</p>
              <p className="text-xs text-gray-400 mt-1">Projects</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-lg font-bold text-green-600">
                ₹{(totalRevenue / 100000).toFixed(1)}L
              </p>
              <p className="text-xs text-gray-400 mt-1">Revenue</p>
            </Card>
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Projects</CardTitle>
                <Button size="sm" asChild className="bg-orange-500 hover:bg-orange-600">
                  <Link href={`/projects/new`}>+ Project</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(client.projects ?? []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No projects</p>
              ) : (
                <div className="space-y-2">
                  {(client.projects ?? []).map((p) => (
                    <Link href={`/projects/${p.id}`} key={p.id}>
                      <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#0f2137] rounded-lg flex items-center justify-center">
                            <span className="text-white text-[11px] font-bold">
                              {p.code.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            {p.endDate && (
                              <p className="text-xs text-gray-400">
                                Due {format(new Date(p.endDate), "dd MMM yyyy")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-600">{p.progress}%</span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                              STATUS_STYLES[p.status]
                            )}
                          >
                            {p.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {client.notes && (
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{client.notes}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
