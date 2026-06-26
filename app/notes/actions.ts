"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { db, notes } from "@/db";
import type { Note } from "@/db/schema";
import { revalidatePath } from "next/cache";

// Helper to authenticate user
async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

// Fetch all notes (both active and trashed)
export async function getNotes() {
  const userId = await getAuthenticatedUser();
  try {
    return await db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.isPinned), desc(notes.updatedAt));
  } catch (error) {
    console.error("Error fetching notes:", error);
    return [];
  }
}

// Create a new note
export async function createNote(title = "Untitled", content = "", color = "#10b981") {
  const userId = await getAuthenticatedUser();
  try {
    const [note] = await db
      .insert(notes)
      .values({
        userId,
        title,
        content,
        color,
        icon: "FileText",
        isPinned: false,
        isTrashed: false,
      })
      .returning();

    revalidatePath("/notes");
    return note;
  } catch (error) {
    console.error("Error creating note:", error);
    throw new Error("Failed to create note");
  }
}

// Update note fields
export async function updateNote(id: number, data: {
  title?: string;
  content?: string;
  color?: string;
  icon?: string;
  isPinned?: boolean;
  isTrashed?: boolean;
}) {
  const userId = await getAuthenticatedUser();
  try {
    const [updated] = await db
      .update(notes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .returning();

    revalidatePath("/notes");
    return updated;
  } catch (error) {
    console.error("Error updating note:", error);
    throw new Error("Failed to update note");
  }
}

// Duplicate a note
export async function duplicateNote(id: number) {
  const userId = await getAuthenticatedUser();
  try {
    // 1. Fetch source note
    const [source] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .limit(1);

    if (!source) {
      throw new Error("Source note not found");
    }

    // 2. Insert copy
    const [copy] = await db
      .insert(notes)
      .values({
        userId,
        title: `${source.title} Copy`,
        content: source.content,
        color: source.color,
        icon: source.icon,
        isPinned: false,
        isTrashed: false,
      })
      .returning();

    revalidatePath("/notes");
    return copy;
  } catch (error) {
    console.error("Error duplicating note:", error);
    throw new Error("Failed to duplicate note");
  }
}

// Permanently delete a note
export async function deleteNote(id: number) {
  const userId = await getAuthenticatedUser();
  try {
    await db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)));

    revalidatePath("/notes");
  } catch (error) {
    console.error("Error permanently deleting note:", error);
    throw new Error("Failed to delete note");
  }
}

// Empty the trash bin
export async function emptyTrash() {
  const userId = await getAuthenticatedUser();
  try {
    await db
      .delete(notes)
      .where(and(eq(notes.userId, userId), eq(notes.isTrashed, true)));

    revalidatePath("/notes");
  } catch (error) {
    console.error("Error emptying trash:", error);
    throw new Error("Failed to empty trash");
  }
}
