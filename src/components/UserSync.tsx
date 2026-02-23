"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export default function UserSync() {
  const { user, isSignedIn } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    if (isSignedIn && user) {
      upsertUser({
        clerkId: user.id,
        name: user.fullName ?? user.username ?? "Anonymous",
        email: user.emailAddresses[0]?.emailAddress ?? "",
        imageUrl: user.imageUrl ?? "",
      });
    }
  }, [isSignedIn, user, upsertUser]);

  return null;
}