import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, HardHat, Phone, MapPin, Star } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contractors" };

export default async function ContractorsPage() {
  await requireAuth();
  const contractors = await prisma.contractor
    .findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { projects: true } } },
    })
    .catch(() => []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contractors</h1>
          <p className="text-sm text-gray-500">{contractors.length} contractors</p>
        </div>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link href="/contractors/new">
            <Plus className="w-4 h-4 mr-2" /> Add Contractor
          </Link>
        </Button>
      </div>

      {contractors.length === 0 ? (
        <div className="text-center py-20">
          <HardHat className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No contractors yet</p>
          <Button className="mt-6 bg-orange-500 hover:bg-orange-600" asChild>
            <Link href="/contractors/new">
              <Plus className="w-4 h-4 mr-2" /> Add Contractor
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {contractors.map((c) => (
            <Link key={c.id} href={`/contractors/${c.id}`}>
              <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarFallback className="bg-orange-100 text-orange-700 font-bold text-lg">
                      {c.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                    {c.specialization && (
                      <p className="text-xs text-orange-600 font-medium">{c.specialization}</p>
                    )}
                    {c.company && <p className="text-xs text-gray-400 truncate">{c.company}</p>}
                    <div className="mt-2 space-y-1">
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          {c.phone}
                        </div>
                      )}
                      {c.city && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {c.city}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-xs text-gray-500">{c._count.projects} projects</span>
                  {c.rating && (
                    <div className="flex items-center gap-1 text-xs text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {Number(c.rating).toFixed(1)}
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
