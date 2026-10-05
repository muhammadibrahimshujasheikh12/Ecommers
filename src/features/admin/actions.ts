"use server";

import { redirect } from "next/navigation";
import { DEMO_MODE } from "@/lib/demo/mode";
import { demoAdminUser, setDemoUser } from "@/lib/demo/session";

/** Demo store only: signs this browser in as the demo admin. */
export async function enterDemoAdminAction(): Promise<void> {
  if (!DEMO_MODE) redirect("/login?next=/admin");
  await setDemoUser(demoAdminUser());
  redirect("/admin");
}
