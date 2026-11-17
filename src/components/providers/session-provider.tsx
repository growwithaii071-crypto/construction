"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { IdleSessionWatcher } from "@/components/providers/idle-session-watcher";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider
      // Avoid aggressive refetch that remounts idle watchers unnecessarily
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <IdleSessionWatcher />
      {children}
    </NextAuthSessionProvider>
  );
}
