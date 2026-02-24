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

  useEffect(() => {
    if (!isSignedIn || !user) return;

    // Set online immediately
    setUserOnline({ clerkId: user.id });

    // Keep pinging online every 30 seconds
    intervalRef.current = setInterval(() => {
      setUserOnline({ clerkId: user.id });
    }, 30000);

    // Set offline when tab is hidden or closed
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        setUserOffline({ clerkId: user.id });
      } else {
        setUserOnline({ clerkId: user.id });
      }
    };

    const handleUnload = () => {
      setUserOffline({ clerkId: user.id });
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [isSignedIn, user, setUserOnline, setUserOffline]);

  return null;
}