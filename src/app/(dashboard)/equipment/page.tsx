import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Card } from "@/components/ui/card";
import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Equipment" };

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  IN_USE: "bg-blue-100 text-blue-700",
  MAINTENANCE: "bg-yellow-100 text-yellow-700",
  RETIRED: "bg-gray-100 text-gray-500",
};

export default async function EquipmentPage() {
  await requireAuth();

  const equipment = await prisma.equipment
    .findMany({
      orderBy: { name: "asc" },
    })
    .catch(() => []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Equipment</h1>
        <p className="text-sm text-gray-500">{equipment.length} items</p>
      </div>

      {equipment.length === 0 ? (
        <div className="text-center py-20">
          <Truck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No equipment tracked</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {equipment.map((eq) => (
            <Card key={eq.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{eq.name}</p>
                  <p className="text-xs text-gray-400">
                    {eq.type} · {eq.model ?? "–"}
                  </p>
                </div>
                <span
                  className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-semibold",
                    STATUS_COLORS[eq.status] ?? "bg-gray-100"
                  )}
                >
                  {eq.status.replace("_", " ")}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                {eq.serialNumber && <span>SN: {eq.serialNumber}</span>}
                {eq.purchaseCost && (
                  <span>Cost: ₹{Number(eq.purchaseCost).toLocaleString("en-IN")}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
