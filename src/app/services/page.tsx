import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { Suspense } from "react";
import { ServicesClient } from "./services-client";
import { computeVerified } from "@/lib/stripe";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Find Tradesmen — BuildPro" };

export default async function PublicServicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    category?: string;
    location?: string;
    jobType?: string;
    rating?: string;
    sort?: string;
    priceMin?: string;
    priceMax?: string;
    verified?: string;
    availability?: string;
    experience?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const searchQuery = params.search?.trim() ?? "";
  const categoryFilter = params.category?.trim() ?? "";
  const locationFilter = params.location?.trim() ?? "";
  const jobTypeFilter = params.jobType?.trim() ?? "all";
  const ratingFilter = params.rating?.trim() ?? "";
  const sortBy = params.sort?.trim() ?? "best";
  const priceMin = params.priceMin ? Number(params.priceMin) : null;
  const priceMax = params.priceMax ? Number(params.priceMax) : null;
  const verifiedOnly = params.verified === "1" || params.verified === "true";
  const availabilityFilter = params.availability?.trim() ?? "any";
  const experienceFilter = params.experience?.trim() ?? "any";

  const allServices = await prisma.service
    .findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        contractor: {
          select: {
            name: true,
            avatar: true,
            phone: true,
            stripeOnboardingDone: true,
            stripePayoutsEnabled: true,
            feePaymentMethodId: true,
          },
        },
        _count: { select: { requests: true } },
      },
    })
    .catch(() => []);

  const categories = [...new Set(allServices.map((s) => s.category))].sort();

  let services = allServices.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.contractor.name.toLowerCase().includes(q);
    const matchCat = !categoryFilter || s.category === categoryFilter;

    const unit = (s.priceUnit ?? "").toLowerCase();
    const matchJobType =
      jobTypeFilter === "all" ||
      !jobTypeFilter ||
      (jobTypeFilter === "hourly" && (unit.includes("hr") || unit.includes("hour"))) ||
      (jobTypeFilter === "fixed" &&
        (unit.includes("fixed") ||
          unit.includes("job") ||
          unit.includes("project") ||
          !unit)) ||
      (jobTypeFilter === "emergency" &&
        (s.title.toLowerCase().includes("emergency") ||
          s.description.toLowerCase().includes("emergency") ||
          s.category.toLowerCase().includes("emergency")));

    const from = s.priceFrom ?? 0;
    const matchPriceMin = priceMin == null || Number.isNaN(priceMin) || from >= priceMin;
    const matchPriceMax =
      priceMax == null ||
      Number.isNaN(priceMax) ||
      (s.priceTo != null ? s.priceTo <= priceMax : from <= priceMax);

    const verified = computeVerified({
      onboardingDone: s.contractor.stripeOnboardingDone,
      payoutsEnabled: s.contractor.stripePayoutsEnabled,
      feePaymentMethodId: s.contractor.feePaymentMethodId,
    });
    const matchVerified = !verifiedOnly || verified;

    return (
      matchSearch &&
      matchCat &&
      matchJobType &&
      matchPriceMin &&
      matchPriceMax &&
      matchVerified
    );
  });

  const hash = (id: string) =>
    id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  const withMeta = services.map((s) => {
    const h = hash(s.id);
    const rating = Math.min(5, Math.round((3.8 + (h % 12) / 10) * 10) / 10);
    const years = 3 + (h % 12);
    const availabilityKey =
      h % 4 === 0 ? "today" : h % 4 === 1 ? "week" : h % 4 === 2 ? "week" : "any";
    const verified = computeVerified({
      onboardingDone: s.contractor.stripeOnboardingDone,
      payoutsEnabled: s.contractor.stripePayoutsEnabled,
      feePaymentMethodId: s.contractor.feePaymentMethodId,
    });
    return { s, rating, h, years, availabilityKey, verified };
  });

  let filtered = ratingFilter
    ? withMeta.filter(({ rating }) => rating >= Number(ratingFilter))
    : withMeta;

  if (availabilityFilter && availabilityFilter !== "any") {
    filtered = filtered.filter(({ availabilityKey }) => {
      if (availabilityFilter === "today") return availabilityKey === "today";
      if (availabilityFilter === "week")
        return availabilityKey === "today" || availabilityKey === "week";
      return true;
    });
  }

  if (experienceFilter && experienceFilter !== "any") {
    filtered = filtered.filter(({ years }) => {
      if (experienceFilter === "junior") return years <= 5;
      if (experienceFilter === "mid") return years > 5 && years <= 10;
      if (experienceFilter === "senior") return years > 10;
      return true;
    });
  }

  if (sortBy === "price_low") {
    filtered.sort((a, b) => (a.s.priceFrom ?? 999999) - (b.s.priceFrom ?? 999999));
  } else if (sortBy === "price_high") {
    filtered.sort((a, b) => (b.s.priceFrom ?? 0) - (a.s.priceFrom ?? 0));
  } else if (sortBy === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  } else {
    filtered.sort(
      (a, b) =>
        (b.verified ? 20 : 0) +
        b.s._count.requests * 2 +
        b.rating -
        ((a.verified ? 20 : 0) + a.s._count.requests * 2 + a.rating)
    );
  }

  const cities = [
    "Mumbai",
    "Delhi",
    "Bengaluru",
    "Hyderabad",
    "Pune",
    "Chennai",
    "Ahmedabad",
    "Jaipur",
  ];

  const serialized = filtered.map(({ s, rating, h, years, verified }) => {
    const distanceKm = (1.5 + (h % 80) / 10).toFixed(1);
    const city = cities[h % cities.length]!;
    const reviews = 5 + (h % 40) + s._count.requests * 2;
    const online = h % 3 !== 0;
    const availability =
      h % 4 === 0
        ? "Available today"
        : h % 4 === 1
          ? "Available Mon–Sat"
          : h % 4 === 2
            ? "Available this week"
            : "Usually replies in hours";

    const tags = [
      s.category.split(" ")[0],
      ...s.title
        .split(/[\s,&/-]+/)
        .filter((t) => t.length > 3)
        .slice(0, 3),
    ]
      .filter((t, i, arr) => arr.indexOf(t) === i)
      .slice(0, 4);

    return {
      id: s.id,
      title: s.title,
      description: s.description,
      category: s.category,
      priceFrom: s.priceFrom,
      priceTo: s.priceTo,
      priceUnit: s.priceUnit,
      requestCount: s._count.requests,
      rating,
      reviews,
      years,
      distanceKm,
      city,
      online,
      availability,
      tags,
      verified,
      contractor: {
        name: s.contractor.name,
        avatar: s.contractor.avatar,
        phone: s.contractor.phone,
      },
    };
  });

  const locationMatched = locationFilter
    ? serialized.filter((s) => s.city.toLowerCase() === locationFilter.toLowerCase())
    : serialized;

  return (
    <Suspense>
      <ServicesClient
        services={locationMatched}
        categories={categories}
        cities={cities}
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        locationFilter={locationFilter}
        jobTypeFilter={jobTypeFilter}
        ratingFilter={ratingFilter}
        sortBy={sortBy}
        priceMin={priceMin != null && !Number.isNaN(priceMin) ? String(priceMin) : ""}
        priceMax={priceMax != null && !Number.isNaN(priceMax) ? String(priceMax) : ""}
        verifiedOnly={verifiedOnly}
        availabilityFilter={availabilityFilter}
        experienceFilter={experienceFilter}
        isLoggedIn={isLoggedIn}
        totalCount={allServices.length}
      />
    </Suspense>
  );
}
