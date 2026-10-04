"use client";

import { useSession } from "@/components/providers/session-provider";
import { Header } from "./header";

export function StoreHeader() {
  const session = useSession();
  return <Header isAuthenticated={session.isAuthenticated} firstName={session.firstName} />;
}
