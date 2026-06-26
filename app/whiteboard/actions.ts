"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { db, whiteboards } from "@/db";
import type { Whiteboard } from "@/db/schema";
import { revalidatePath } from "next/cache";

// Helper to authenticate user
async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

// Fetch all whiteboards for current user
export async function getWhiteboards() {
  const userId = await getAuthenticatedUser();
  try {
    return await db
      .select()
      .from(whiteboards)
      .where(eq(whiteboards.userId, userId))
      .orderBy(desc(whiteboards.updatedAt));
  } catch (error) {
    console.error("Error fetching whiteboards:", error);
    return [];
  }
}

// Create a new whiteboard
export async function createWhiteboard(name = "Untitled Whiteboard", color = "#f15f49") {
  const userId = await getAuthenticatedUser();
  try {
    const [board] = await db
      .insert(whiteboards)
      .values({
        userId,
        name,
        color,
        elements: "[]",
      })
      .returning();

    revalidatePath("/whiteboard");
    return board;
  } catch (error) {
    console.error("Error creating whiteboard:", error);
    throw new Error("Failed to create whiteboard");
  }
}

// Update whiteboard properties (name, color, or canvas elements JSON)
export async function updateWhiteboard(id: number, data: {
  name?: string;
  color?: string;
  elements?: string;
}) {
  const userId = await getAuthenticatedUser();
  try {
    const [updated] = await db
      .update(whiteboards)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(whiteboards.id, id), eq(whiteboards.userId, userId)))
      .returning();

    revalidatePath("/whiteboard");
    return updated;
  } catch (error) {
    console.error("Error updating whiteboard:", error);
    throw new Error("Failed to update whiteboard");
  }
}

// Permanently delete a whiteboard
export async function deleteWhiteboard(id: number) {
  const userId = await getAuthenticatedUser();
  try {
    await db
      .delete(whiteboards)
      .where(and(eq(whiteboards.id, id), eq(whiteboards.userId, userId)));

    revalidatePath("/whiteboard");
  } catch (error) {
    console.error("Error deleting whiteboard:", error);
    throw new Error("Failed to delete whiteboard");
  }
}

// Duplicate an existing whiteboard
export async function duplicateWhiteboard(id: number) {
  const userId = await getAuthenticatedUser();
  try {
    const [original] = await db
      .select()
      .from(whiteboards)
      .where(and(eq(whiteboards.id, id), eq(whiteboards.userId, userId)))
      .limit(1);

    if (!original) {
      throw new Error("Whiteboard not found");
    }

    const [copy] = await db
      .insert(whiteboards)
      .values({
        userId,
        name: `${original.name} Copy`,
        color: original.color,
        elements: original.elements,
      })
      .returning();

    revalidatePath("/whiteboard");
    return copy;
  } catch (error) {
    console.error("Error duplicating whiteboard:", error);
    throw new Error("Failed to duplicate whiteboard");
  }
}
