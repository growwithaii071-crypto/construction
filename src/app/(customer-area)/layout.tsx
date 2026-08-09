import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CustomerSidebar } from "@/components/customer/customer-sidebar";
import { CustomerTopbar } from "@/components/customer/customer-topbar";

export default async function CustomerAreaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/customer/login");
  if (session.user.role !== "CLIENT") redirect("/dashboard");

  const user = { name: session.user.name, email: session.user.email };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-shrink-0">
        <CustomerSidebar user={user} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <CustomerTopbar user={user} title="Customer Portal" />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
