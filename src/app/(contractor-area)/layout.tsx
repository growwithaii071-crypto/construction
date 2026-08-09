import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ContractorSidebar } from "@/components/contractor/contractor-sidebar";
import { ContractorTopbar } from "@/components/contractor/contractor-topbar";

export default async function ContractorAreaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/construction/login");
  if (session.user.role !== "CONTRACTOR") redirect("/dashboard");

  const user = { name: session.user.name, email: session.user.email };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-shrink-0">
        <ContractorSidebar user={user} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ContractorTopbar user={user} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
