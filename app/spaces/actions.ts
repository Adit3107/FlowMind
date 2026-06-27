"use server";

import { db } from "@/db";
import { spaces, pages, type NewSpace, type NewPage } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSpaces(userId: string) {
  return await db.select().from(spaces).where(eq(spaces.userId, userId)).orderBy(desc(spaces.createdAt));
}

export async function getSpace(spaceId: number) {
  const result = await db.select().from(spaces).where(eq(spaces.id, spaceId));
  return result[0];
}

export async function createSpace(data: Omit<NewSpace, "id" | "createdAt" | "updatedAt">) {
  const result = await db.insert(spaces).values(data).returning();
  revalidatePath("/spaces");
  return result[0];
}

export async function updateSpace(spaceId: number, data: Partial<NewSpace>) {
  const result = await db
    .update(spaces)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(spaces.id, spaceId))
    .returning();
  revalidatePath("/spaces");
  revalidatePath(`/spaces/${spaceId}`);
  return result[0];
}

export async function deleteSpace(spaceId: number) {
  await db.delete(spaces).where(eq(spaces.id, spaceId));
  // Delete associated pages
  await db.delete(pages).where(eq(pages.spaceId, spaceId));
  revalidatePath("/spaces");
}

export async function getPages(spaceId: number) {
  return await db.select().from(pages).where(eq(pages.spaceId, spaceId)).orderBy(desc(pages.createdAt));
}

export async function getPage(pageId: number) {
  const result = await db.select().from(pages).where(eq(pages.id, pageId));
  return result[0] ?? null;
}

export async function createPage(data: Omit<NewPage, "id" | "createdAt" | "updatedAt">) {
  const result = await db.insert(pages).values(data).returning();
  revalidatePath(`/spaces/${data.spaceId}`);
  return result[0];
}

export async function updatePage(pageId: number, spaceId: number, data: Partial<NewPage>) {
  const result = await db
    .update(pages)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(pages.id, pageId))
    .returning();
  revalidatePath(`/spaces/${spaceId}`);
  return result[0];
}

export async function deletePage(pageId: number, spaceId: number) {
  await db.delete(pages).where(eq(pages.id, pageId));
  revalidatePath(`/spaces/${spaceId}`);
}
