"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

/** Auto sign-out after this many ms with no user activity. */
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

const STORAGE_KEY = "buildpro_last_activity";
const CHECK_EVERY_MS = 5_000;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "click",
  "wheel",
];

function readLastActivity(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

function touchActivity() {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // ignore quota / private mode
  }
}

function clearActivity() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

async function forceLogout() {
  clearActivity();
  try {
    await signOut({ redirect: false });
  } catch (err) {
    console.error("[IDLE_LOGOUT]", err);
  }
  // Hard navigate so middleware cannot keep a stale client shell
  window.location.replace("/login?idle=1");
}

/**
 * Logs out any authenticated user (admin / client / contractor) after
 * 15 minutes without meaningful interaction.
 *
 * Important: do NOT reset the activity clock when the session effect re-runs
 * (refetch / remount) — that was preventing logout.
 */
export function IdleSessionWatcher() {
  const { status } = useSession();
  const pathname = usePathname();
  const loggingOut = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (
      pathname === "/login" ||
      pathname?.startsWith("/login") ||
      pathname === "/register" ||
      pathname?.startsWith("/customer/login") ||
      pathname?.startsWith("/construction/login")
    ) {
      return;
    }

    // Seed once only — never refresh the idle clock just because React re-ran
    if (readLastActivity() == null) {
      touchActivity();
    }

    loggingOut.current = false;
    let throttleUntil = 0;

    const onActivity = () => {
      const now = Date.now();
      if (now < throttleUntil) return;
      throttleUntil = now + 1000;
      touchActivity();
    };

    const logoutIfIdle = () => {
      if (loggingOut.current) return;
      const last = readLastActivity();
      if (last == null) {
        touchActivity();
        return;
      }
      const idleFor = Date.now() - last;
      if (idleFor < IDLE_TIMEOUT_MS) return;
      loggingOut.current = true;
      void forceLogout();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        logoutIfIdle();
      }
    };

    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);

    const interval = window.setInterval(logoutIfIdle, CHECK_EVERY_MS);
    logoutIfIdle();

    return () => {
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, onActivity);
      }
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, [status, pathname]);

  return null;
}
