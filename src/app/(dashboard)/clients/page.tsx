import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Building2, Phone, Mail, MapPin, FolderKanban } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  await requireAuth();

  const clients = await prisma.client
    .findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { projects: true, invoices: true } } },
    })
    .catch(() => []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} clients</p>
        </div>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link href="/clients/new">
            <Plus className="w-4 h-4 mr-2" /> New Client
          </Link>
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No clients yet</p>
          <Button className="mt-6 bg-orange-500 hover:bg-orange-600" asChild>
            <Link href="/clients/new">
              <Plus className="w-4 h-4 mr-2" /> Add Client
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarFallback className="bg-[#1e3a5f] text-white font-bold text-lg">
                      {client.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{client.name}</p>
                    {client.company && (
                      <p className="text-xs text-gray-400 truncate">{client.company}</p>
                    )}
                    <div className="mt-2 space-y-1">
                      {client.email && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </div>
                      )}
                      {client.city && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {client.city}
                          {client.state ? `, ${client.state}` : ""}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FolderKanban className="w-3.5 h-3.5" />
                    {client._count.projects} projects
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    {client._count.invoices} invoices
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
