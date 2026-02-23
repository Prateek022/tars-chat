"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export default function PresenceManager() {
  const { user, isSignedIn } = useUser();
  const setUserOffline = useMutation(api.users.setUserOffline);

  useEffect(() => {
    if (!isSignedIn || !user) return;

    // When user closes or leaves the page, set them offline
    const handleOffline = () => {
      setUserOffline({ clerkId: user.id });
    };

    window.addEventListener("beforeunload", handleOffline);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        setUserOffline({ clerkId: user.id });
      }
    });

    return () => {
      window.removeEventListener("beforeunload", handleOffline);
    };
  }, [isSignedIn, user, setUserOffline]);

  return null;
}