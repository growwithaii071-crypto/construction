import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Materials" };

export default async function MaterialsPage() {
  await requireAuth();

  const materials = await prisma.material
    .findMany({
      orderBy: { name: "asc" },
      include: { project: { select: { name: true, code: true } } },
    })
    .catch(() => []);

  const lowStock = materials.filter(
    (m) => (m.currentStock ?? m.stockQty) < (m.minimumStock ?? m.minStockQty)
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materials</h1>
          <p className="text-sm text-gray-500">
            {materials.length} items · {lowStock.length} low stock
          </p>
        </div>
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No materials tracked yet</p>
          <p className="text-sm text-gray-400 mt-1">Materials will appear when added to projects</p>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((m) => {
            const isLow = (m.currentStock ?? m.stockQty) < (m.minimumStock ?? m.minStockQty);
            return (
              <Card key={m.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{m.name}</p>
                        {isLow && (
                          <Badge className="bg-red-100 text-red-700 text-[10px]">Low Stock</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {m.unit} · {m.category ?? "General"}
                      </p>
                      {m.project && <p className="text-xs text-blue-500">{m.project.code}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {m.currentStock ?? m.stockQty} {m.unit}
                    </p>
                    {m.unitPrice > 0 && (
                      <p className="text-xs text-gray-400">
                        ₹{Number(m.unitPrice).toLocaleString("en-IN")}/unit
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
