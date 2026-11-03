"use client";

import { Printer } from "lucide-react";

export function ReceiptPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0B2A4A] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0a2440]"
    >
      <Printer className="h-4 w-4" />
      Download / Print PDF
    </button>
  );
}
