import {
  ConvexProvider as BaseConvexProvider,
  ConvexReactClient,
} from "convex/react";
import React from "react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("Missing EXPO_PUBLIC_CONVEX_URL");
}

export const convexClient = new ConvexReactClient(convexUrl);

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseConvexProvider client={convexClient}>{children}</BaseConvexProvider>
  );
}
