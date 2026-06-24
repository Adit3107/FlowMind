import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db, users } from "@/db";

export async function syncCurrentUser() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses.find((emailAddress) => emailAddress.id === user.primaryEmailAddressId)?.emailAddress;

  if (!email) {
    return null;
  }

  const name =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    null;

  const userData = {
    clerkId: user.id,
    email,
    name,
    imageUrl: user.imageUrl,
    updatedAt: new Date(),
  };

  const [existingUser] = await db.select().from(users).where(eq(users.clerkId, user.id)).limit(1);

  if (existingUser) {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.clerkId, user.id))
      .returning();

    return updatedUser;
  }

  const [syncedUser] = await db
    .insert(users)
    .values(userData)
    .onConflictDoUpdate({
      target: users.email,
      set: userData,
    })
    .returning();

  return syncedUser;
}
