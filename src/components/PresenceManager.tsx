"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef } from "react";

export default function PresenceManager() {
  const { user, isSignedIn } = useUser();
  const setUserOnline = useMutation(api.users.setUserOnline);
  const setUserOffline = useMutation(api.users.setUserOffline);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isOnlineRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !user) return;

    const goOnline = () => {
      isOnlineRef.current = true;
      setUserOnline({ clerkId: user.id });
    };

    const goOffline = () => {
      isOnlineRef.current = false;
      setUserOffline({ clerkId: user.id });
    };

    // Set online immediately
    goOnline();

    // Ping every 10 seconds to stay online
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        goOnline();
      }
    }, 10000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        goOnline();
      } else {
        goOffline();
      }
    };

    const handleUnload = () => goOffline();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleUnload);
      goOffline();
    };
  }, [isSignedIn, user, setUserOnline, setUserOffline]);

  return null;
}