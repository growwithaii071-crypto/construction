import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ContractorHeader } from "@/components/contractor/contractor-header";

export default async function ContractorAreaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/construction/login");
  if (session.user.role !== "CONTRACTOR") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <ContractorHeader user={session.user} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
