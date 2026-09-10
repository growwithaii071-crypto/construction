import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { ChatThread } from "@/components/messages/chat-thread";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Chat — BuildPro" };

const CHAT_OK = new Set(["ACCEPTED", "IN_PROGRESS", "COMPLETED"]);

export default async function ContractorChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const req = await prisma.serviceRequest.findFirst({
    where: { id, service: { contractorId: session.user.id } },
    include: {
      service: { select: { title: true } },
      client: { select: { name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!req) notFound();

  const clientName = req.client.name.split(" — ")[0];

  if (!CHAT_OK.has(req.status)) {
    return (
      <div className="space-y-4 p-4 lg:p-6">
        <Link href="/construction/requests" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="h-4 w-4" /> Back to requests
        </Link>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-8 text-center">
          <MessageCircle className="mx-auto mb-3 h-10 w-10 text-amber-400" />
          <h1 className="text-lg font-bold text-amber-900">Messaging locked</h1>
          <p className="mt-2 text-sm text-amber-700">
            Accept this request first to chat with <strong>{clientName}</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <Link href="/construction/messages" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="h-4 w-4" /> Messages
        </Link>
        <h1 className="mt-1 text-xl font-bold text-gray-900">{req.service.title}</h1>
        <p className="text-sm text-gray-500">Chat with {clientName}</p>
      </div>

      <ChatThread
        requestId={req.id}
        currentUserId={session.user.id}
        otherPartyName={clientName}
        initialMessages={req.messages}
      />
    </div>
  );
}
