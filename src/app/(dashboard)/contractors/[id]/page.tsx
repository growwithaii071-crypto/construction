import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Edit, Phone, Mail, MapPin, Star, Trash2 } from "lucide-react";
import { deleteContractorAction } from "@/actions/contractors";

export default async function ContractorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const contractor = await prisma.contractor
    .findUnique({
      where: { id },
      include: { projects: { select: { id: true, contractValue: true } } },
    })
    .catch(() => null);

  if (!contractor) notFound();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/contractors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14">
              <AvatarFallback className="bg-orange-100 text-orange-700 text-2xl font-bold">
                {contractor.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{contractor.name}</h1>
              {contractor.specialization && (
                <p className="text-sm text-orange-600 font-medium">{contractor.specialization}</p>
              )}
              {contractor.company && <p className="text-sm text-gray-400">{contractor.company}</p>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/contractors/${id}/edit`}>
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Link>
          </Button>
          <form action={deleteContractorAction.bind(null, id)}>
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
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">Contact</h3>
          {contractor.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              {contractor.email}
            </div>
          )}
          {contractor.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              {contractor.phone}
            </div>
          )}
          {contractor.city && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              {contractor.city}
              {contractor.state ? `, ${contractor.state}` : ""}
            </div>
          )}
          {contractor.rating && (
            <div className="flex items-center gap-1.5 text-sm">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.round(Number(contractor.rating ?? 0)) ? "text-amber-400 fill-current" : "text-gray-200 fill-current"}`}
                />
              ))}
              <span className="text-gray-500 text-xs ml-1">
                {Number(contractor.rating).toFixed(1)}
              </span>
            </div>
          )}
        </Card>

        <div className="lg:col-span-2">
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Projects ({contractor.projects.length})</h3>
            {contractor.projects.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No projects assigned</p>
            ) : (
              <div className="space-y-2">
                {contractor.projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 border-b last:border-0 px-2"
                  >
                    <p className="text-sm font-medium">Project Assigned</p>
                    <span className="text-xs text-gray-500">
                      ₹{(p.contractValue / 100000).toFixed(1)}L
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
