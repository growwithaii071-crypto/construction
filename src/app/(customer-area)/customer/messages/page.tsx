import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Messages — BuildPro" };

const CHAT_OK = ["ACCEPTED", "IN_PROGRESS", "COMPLETED"] as const;

export default async function CustomerMessagesPage() {
  const session = await auth();

  const threads = await prisma.serviceRequest
    .findMany({
      where: {
        clientId: session?.user?.id ?? "",
        status: { in: [...CHAT_OK] },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        service: {
          select: {
            title: true,
            category: true,
            contractor: { select: { name: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
    })
    .catch(() => []);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="mt-1 text-sm text-gray-500">
          Chat with contractors after they accept your request
        </p>
      </div>

      {threads.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-14 text-center shadow-sm">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-200" />
          <h2 className="text-lg font-semibold text-gray-700">No conversations yet</h2>
          <p className="mt-1 text-sm text-gray-400">
            When a contractor accepts your request, messaging will appear here.
          </p>
          <Link
            href="/customer/requests"
            className="mt-5 inline-flex rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            View My Requests
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => {
            const name = t.service.contractor.name.split(" — ")[0];
            const last = t.messages[0];
            return (
              <Link
                key={t.id}
                href={`/customer/messages/${t.id}`}
                className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-gray-900">{name}</p>
                    <span className="shrink-0 text-[10px] font-semibold uppercase text-gray-400">
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="truncate text-xs text-gray-500">{t.service.title}</p>
                  <p className={cn("mt-1 truncate text-sm", last ? "text-gray-600" : "text-gray-400")}>
                    {last?.body ?? "Start the conversation…"}
                  </p>
                </div>
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-600">
                  {t._count.messages}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
