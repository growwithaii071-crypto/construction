import { requireAuth } from "@/lib/auth-utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-shrink-0">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </TooltipProvider>
  );
}
