"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

/** Auto sign-out after this many ms with no user activity. */
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

const STORAGE_KEY = "buildpro_last_activity";
const CHECK_EVERY_MS = 30_000;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "click",
  "wheel",
];

function readLastActivity(): number {
  if (typeof window === "undefined") return Date.now();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : Date.now();
}

function touchActivity() {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Logs out any authenticated user (admin / client / contractor) after
 * 15 minutes without mouse, keyboard, touch, or scroll activity.
 */
export function IdleSessionWatcher() {
  const { status } = useSession();
  const loggingOut = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    touchActivity();
    loggingOut.current = false;

    let throttleUntil = 0;

    const onActivity = () => {
      const now = Date.now();
      if (now < throttleUntil) return;
      throttleUntil = now + 1000;
      touchActivity();
    };

    const logoutIfIdle = async () => {
      if (loggingOut.current) return;
      const idleFor = Date.now() - readLastActivity();
      if (idleFor < IDLE_TIMEOUT_MS) return;
      loggingOut.current = true;
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      await signOut({ callbackUrl: "/login?idle=1" });
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void logoutIfIdle();
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        // another tab recorded activity — keep this tab alive
      }
    };

    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);

    const interval = window.setInterval(() => {
      void logoutIfIdle();
    }, CHECK_EVERY_MS);

    void logoutIfIdle();

    return () => {
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, onActivity);
      }
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(interval);
    };
  }, [status]);

  return null;
}
