import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { Suspense } from "react";
import { ServicesClient } from "./services-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Browse Services — BuildPro" };

export default async function PublicServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const searchQuery = params.search?.trim() ?? "";
  const categoryFilter = params.category?.trim() ?? "";

  const allServices = await prisma.service
    .findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        contractor: { select: { name: true, avatar: true } },
        _count: { select: { requests: true } },
      },
    })
    .catch(() => []);

  const services = allServices.filter((s) => {
    const matchSearch =
      !searchQuery ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contractor.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = !categoryFilter || s.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const categories = [...new Set(allServices.map((s) => s.category))].sort();

  // Serialize for client component
  const serialized = services.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    category: s.category,
    priceFrom: s.priceFrom,
    priceTo: s.priceTo,
    priceUnit: s.priceUnit,
    requestCount: s._count.requests,
    contractor: {
      name: s.contractor.name,
      avatar: s.contractor.avatar,
    },
  }));

  return (
    <Suspense>
      <ServicesClient
        services={serialized}
        categories={categories}
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        isLoggedIn={isLoggedIn}
        totalCount={allServices.length}
      />
    </Suspense>
  );
}
