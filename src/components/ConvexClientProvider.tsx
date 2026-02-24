"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useEffect, useState } from "react";

export default function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [convex, setConvex] = useState<ConvexReactClient | null>(null);

  useEffect(() => {
    const client = new ConvexReactClient(
      process.env.NEXT_PUBLIC_CONVEX_URL!
    );
    setConvex(client);
  }, []);

  if (!convex) return null;

  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}