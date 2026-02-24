"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export default function PresenceManager() {
  const { user, isSignedIn } = useUser();
  const setUserOnline = useMutation(api.users.setUserOnline);
  const setUserOffline = useMutation(api.users.setUserOffline);

  useEffect(() => {
    if (!isSignedIn || !user) return;

    // Set online immediately when component mounts
    setUserOnline({ clerkId: user.id });

    // Set online when user comes back to tab
    const handleVisible = () => {
      if (document.visibilityState === "visible") {
        setUserOnline({ clerkId: user.id });
      } else {
        setUserOffline({ clerkId: user.id });
      }
    };

    // Set offline when user closes the tab
    const handleOffline = () => {
      setUserOffline({ clerkId: user.id });
    };

    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("beforeunload", handleOffline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("beforeunload", handleOffline);
    };
  }, [isSignedIn, user, setUserOnline, setUserOffline]);

  return null;
}