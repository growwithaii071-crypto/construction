import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ContractorSidebar } from "@/components/contractor/contractor-sidebar";
import { ContractorTopbar } from "@/components/contractor/contractor-topbar";

export default async function ContractorAreaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "CONTRACTOR") redirect("/dashboard");

  const user = { name: session.user.name, email: session.user.email };

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-gray-50">
      <aside className="hidden h-full min-h-0 w-64 shrink-0 overflow-hidden lg:flex">
        <ContractorSidebar user={user} />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <ContractorTopbar user={user} />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </main>
      </div>
    </div>
  );
}
