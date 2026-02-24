"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export default function UserSync() {
  const { user, isSignedIn } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);
  const setUserOnline = useMutation(api.users.setUserOnline);

  useEffect(() => {
    if (isSignedIn && user) {
      // Save user profile and set online
      upsertUser({
        clerkId: user.id,
        name: user.fullName ?? user.username ?? "Anonymous",
        email: user.emailAddresses[0]?.emailAddress ?? "",
        imageUrl: user.imageUrl ?? "",
      }).then(() => {
        // After saving profile, make sure they're marked online
        setUserOnline({ clerkId: user.id });
      });
    }
  }, [isSignedIn, user, upsertUser, setUserOnline]);

  return null;
}