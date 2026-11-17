import { requireAuth } from "@/lib/auth-utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return (
    <TooltipProvider>
      <div className="flex h-dvh max-h-dvh overflow-hidden bg-gray-50">
        {/* Desktop Sidebar */}
        <aside className="hidden h-full min-h-0 w-64 shrink-0 overflow-hidden lg:flex">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {children}
          </main>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </TooltipProvider>
  );
}
