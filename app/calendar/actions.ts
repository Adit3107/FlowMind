"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db, tasks } from "@/db";
import { revalidatePath } from "next/cache";

export async function getTasks() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(tasks.createdAt);
    return userTasks;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
}

export async function createTask(data: {
  title: string;
  description?: string;
  date?: Date | null;
  category: string;
  color: string;
  type: string;
}) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const [newTask] = await db
      .insert(tasks)
      .values({
        userId,
        title: data.title,
        description: data.description || null,
        date: data.date || null,
        category: data.category,
        color: data.color,
        type: data.type,
      })
      .returning();

    revalidatePath("/calendar");
    return newTask;
  } catch (error) {
    console.error("Error creating task:", error);
    throw new Error("Failed to create task");
  }
}

export async function updateTask(
  taskId: number,
  data: {
    title?: string;
    description?: string | null;
    date?: Date | null;
    category?: string;
    color?: string;
    type?: string;
  }
) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.type !== undefined) updateData.type = data.type;
    updateData.updatedAt = new Date();

    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    revalidatePath("/calendar");
    return updatedTask;
  } catch (error) {
    console.error("Error updating task:", error);
    throw new Error("Failed to update task");
  }
}

export async function deleteTask(taskId: number) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const [deletedTask] = await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    revalidatePath("/calendar");
    return deletedTask;
  } catch (error) {
    console.error("Error deleting task:", error);
    throw new Error("Failed to delete task");
  }
}
