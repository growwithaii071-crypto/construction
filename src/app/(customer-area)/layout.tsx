import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CustomerHeader } from "@/components/customer/customer-header";

export default async function CustomerAreaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/customer/login");
  }

  // Non-CLIENT roles should use the main dashboard
  if (session.user.role !== "CLIENT") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={session.user} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
