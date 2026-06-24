import { redirect } from "next/navigation";

import { syncCurrentUser } from "@/lib/sync-user";

export const dynamic = "force-dynamic";

export default async function SyncUserPage() {
  await syncCurrentUser();

  redirect("/");
}
