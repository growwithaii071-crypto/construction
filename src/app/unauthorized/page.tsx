import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-3 text-gray-500 text-sm leading-relaxed">
          You don&apos;t have permission to view this page. Please contact your administrator
          if you believe this is an error.
        </p>
        <div className="mt-8 flex flex-col gap-2">
          <Link href="/dashboard">
            <Button className="w-full bg-[#1e3a5f] hover:bg-[#162e4d] text-white">
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="w-full text-gray-500">
              Sign in with a different account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
