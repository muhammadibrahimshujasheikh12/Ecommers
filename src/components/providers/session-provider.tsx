"use client";

import { createContext, useContext, type ReactNode } from "react";

export type SessionInfo = { isAuthenticated: boolean; firstName: string | null; email: string | null };

const SessionContext = createContext<SessionInfo>({ isAuthenticated: false, firstName: null, email: null });

/** Non-sensitive session info for client UI (who's signed in). Authorization always happens on the server. */
export function SessionContextProvider({ value, children }: { value: SessionInfo; children: ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
