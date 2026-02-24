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

    // Ping every 5 seconds to stay online
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        setUserOnline({ clerkId: user.id });
      }
    }, 5000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setUserOnline({ clerkId: user.id });
      } else {
        setUserOffline({ clerkId: user.id });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", () => {
      setUserOffline({ clerkId: user.id });
    });

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isSignedIn, user, setUserOnline, setUserOffline]);

  return null;
}