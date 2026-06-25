"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, and, inArray } from "drizzle-orm";
import { db, kanbanBoards, kanbanColumns, kanbanTasks, tasks, kanbanBoardShares, users } from "@/db";
import { revalidatePath } from "next/cache";

// Helper to authenticate user
async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

// Helper to get authenticated user's email
async function getAuthenticatedUserEmail() {
  const user = await currentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress;

  if (!email) {
    throw new Error("Email not found");
  }
  return email;
}

// -------------------------------------------------------------
// Board Actions
// -------------------------------------------------------------

export async function getBoards() {
  const userId = await getAuthenticatedUser();
  const userEmail = await getAuthenticatedUserEmail();
  try {
    // 1. Get owned boards
    const ownedBoards = await db
      .select()
      .from(kanbanBoards)
      .where(eq(kanbanBoards.userId, userId))
      .orderBy(kanbanBoards.createdAt);

    // 2. Get shared boards
    const shares = await db
      .select()
      .from(kanbanBoardShares)
      .where(eq(kanbanBoardShares.email, userEmail));
    const sharedBoardIds = shares.map(s => s.boardId);

    if (sharedBoardIds.length > 0) {
      const sharedBoards = await db
        .select()
        .from(kanbanBoards)
        .where(inArray(kanbanBoards.id, sharedBoardIds))
        .orderBy(kanbanBoards.createdAt);

      const allBoards = [...ownedBoards];
      sharedBoards.forEach(sb => {
        if (!allBoards.some(ob => ob.id === sb.id)) {
          allBoards.push(sb);
        }
      });
      return allBoards;
    }

    return ownedBoards;
  } catch (error) {
    console.error("Error fetching boards:", error);
    return [];
  }
}

export async function createBoard(name: string, color: string) {
  const userId = await getAuthenticatedUser();
  try {
    // 1. Insert board
    const [board] = await db
      .insert(kanbanBoards)
      .values({ userId, name, color })
      .returning();

    // 2. Insert default columns: Todo, In Progress, Done
    const defaultColumns = [
      { boardId: board.id, name: "Todo", position: 0 },
      { boardId: board.id, name: "In Progress", position: 1 },
      { boardId: board.id, name: "Done", position: 2 },
    ];
    await db.insert(kanbanColumns).values(defaultColumns);

    revalidatePath("/kanban");
    return board;
  } catch (error) {
    console.error("Error creating board:", error);
    throw new Error("Failed to create board");
  }
}

export async function updateBoard(boardId: number, name: string, color: string) {
  const userId = await getAuthenticatedUser();
  try {
    const [updatedBoard] = await db
      .update(kanbanBoards)
      .set({ name, color, updatedAt: new Date() })
      .where(and(eq(kanbanBoards.id, boardId), eq(kanbanBoards.userId, userId)))
      .returning();

    revalidatePath("/kanban");
    return updatedBoard;
  } catch (error) {
    console.error("Error updating board:", error);
    throw new Error("Failed to update board");
  }
}

export async function deleteBoard(boardId: number) {
  const userId = await getAuthenticatedUser();
  try {
    // Verify board ownership
    const [board] = await db
      .select()
      .from(kanbanBoards)
      .where(and(eq(kanbanBoards.id, boardId), eq(kanbanBoards.userId, userId)))
      .limit(1);

    if (!board) {
      throw new Error("Board not found or unauthorized");
    }

    // Get all columns of the board
    const columns = await db
      .select()
      .from(kanbanColumns)
      .where(eq(kanbanColumns.boardId, boardId));
    const columnIds = columns.map(c => c.id);

    if (columnIds.length > 0) {
      // Find all tasks that are synced with the calendar
      const boardTasks = await db
        .select()
        .from(kanbanTasks)
        .where(inArray(kanbanTasks.columnId, columnIds));

      const calendarTaskIds = boardTasks
        .map(t => t.calendarTaskId)
        .filter((id): id is number => id !== null);

      // Delete synced calendar tasks
      if (calendarTaskIds.length > 0) {
        await db.delete(tasks).where(inArray(tasks.id, calendarTaskIds));
      }

      // Delete board tasks
      await db.delete(kanbanTasks).where(inArray(kanbanTasks.columnId, columnIds));
      // Delete columns
      await db.delete(kanbanColumns).where(eq(kanbanColumns.boardId, boardId));
    }

    // Delete board itself
    await db.delete(kanbanBoards).where(eq(kanbanBoards.id, boardId));

    revalidatePath("/kanban");
    return board;
  } catch (error) {
    console.error("Error deleting board:", error);
    throw new Error("Failed to delete board");
  }
}

// -------------------------------------------------------------
// Column Actions
// -------------------------------------------------------------

export async function getColumns(boardId: number) {
  await getAuthenticatedUser();
  try {
    return await db
      .select()
      .from(kanbanColumns)
      .where(eq(kanbanColumns.boardId, boardId))
      .orderBy(kanbanColumns.position);
  } catch (error) {
    console.error("Error fetching columns:", error);
    return [];
  }
}

export async function createColumn(boardId: number, name: string) {
  const userId = await getAuthenticatedUser();
  try {
    // Verify board owner
    const [board] = await db
      .select()
      .from(kanbanBoards)
      .where(and(eq(kanbanBoards.id, boardId), eq(kanbanBoards.userId, userId)))
      .limit(1);

    if (!board) {
      throw new Error("Unauthorized");
    }

    // Check count (max 5)
    const existingColumns = await db
      .select()
      .from(kanbanColumns)
      .where(eq(kanbanColumns.boardId, boardId));

    if (existingColumns.length >= 5) {
      throw new Error("Maximum of 5 columns allowed per board");
    }

    // Insert new column with position at the end
    const position = existingColumns.length;
    const [newCol] = await db
      .insert(kanbanColumns)
      .values({ boardId, name, position })
      .returning();

    revalidatePath("/kanban");
    return newCol;
  } catch (error) {
    console.error("Error creating column:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create column");
  }
}

export async function updateColumn(columnId: number, name: string) {
  await getAuthenticatedUser();
  try {
    const [updatedCol] = await db
      .update(kanbanColumns)
      .set({ name, updatedAt: new Date() })
      .where(eq(kanbanColumns.id, columnId))
      .returning();

    revalidatePath("/kanban");
    return updatedCol;
  } catch (error) {
    console.error("Error updating column:", error);
    throw new Error("Failed to update column");
  }
}

export async function deleteColumn(columnId: number) {
  await getAuthenticatedUser();
  try {
    // Find all tasks in this column
    const colTasks = await db
      .select()
      .from(kanbanTasks)
      .where(eq(kanbanTasks.columnId, columnId));

    const calendarTaskIds = colTasks
      .map(t => t.calendarTaskId)
      .filter((id): id is number => id !== null);

    // Delete synced calendar tasks
    if (calendarTaskIds.length > 0) {
      await db.delete(tasks).where(inArray(tasks.id, calendarTaskIds));
    }

    // Delete column tasks
    await db.delete(kanbanTasks).where(eq(kanbanTasks.columnId, columnId));
    // Delete column itself
    const [deletedCol] = await db
      .delete(kanbanColumns)
      .where(eq(kanbanColumns.id, columnId))
      .returning();

    revalidatePath("/kanban");
    return deletedCol;
  } catch (error) {
    console.error("Error deleting column:", error);
    throw new Error("Failed to delete column");
  }
}

// -------------------------------------------------------------
// Task Actions
// -------------------------------------------------------------

export async function getTasksForBoard(boardId: number) {
  await getAuthenticatedUser();
  try {
    const columns = await db
      .select()
      .from(kanbanColumns)
      .where(eq(kanbanColumns.boardId, boardId));
    const columnIds = columns.map(c => c.id);

    if (columnIds.length === 0) {
      return [];
    }

    return await db
      .select()
      .from(kanbanTasks)
      .where(inArray(kanbanTasks.columnId, columnIds))
      .orderBy(kanbanTasks.position);
  } catch (error) {
    console.error("Error fetching board tasks:", error);
    return [];
  }
}

export async function createTaskCard(data: {
  columnId: number;
  title: string;
  description?: string;
  dueDate?: Date | null;
  priority: string;
  labels?: string;
  syncCalendar: boolean;
  syncNotes: boolean;
}) {
  const userId = await getAuthenticatedUser();
  try {
    // 1. Get position index (add at end of column tasks)
    const existing = await db
      .select()
      .from(kanbanTasks)
      .where(eq(kanbanTasks.columnId, data.columnId));
    const position = existing.length;

    let calendarTaskId: number | null = null;

    // 2. If syncCalendar is toggled, insert into the calendar tasks table
    if (data.syncCalendar) {
      const activeDate = data.dueDate || new Date();
      activeDate.setHours(12, 0, 0, 0); // normalize time

      const [calTask] = await db
        .insert(tasks)
        .values({
          userId,
          title: `[Kanban] ${data.title}`,
          description: data.description || "Synced from Kanban Board",
          date: activeDate,
          category: "Work", // defaults to Work category
          color: data.priority === "High" ? "#e11d48" : data.priority === "Medium" ? "#d97706" : "#0284c7",
          type: "task",
        })
        .returning();
      
      calendarTaskId = calTask.id;
    }

    // 3. Create Kanban Task
    const [kTask] = await db
      .insert(kanbanTasks)
      .values({
        columnId: data.columnId,
        title: data.title,
        description: data.description || null,
        dueDate: data.dueDate || null,
        priority: data.priority,
        labels: data.labels || null,
        syncCalendar: data.syncCalendar,
        syncNotes: data.syncNotes,
        position,
        calendarTaskId,
      })
      .returning();

    revalidatePath("/kanban");
    return kTask;
  } catch (error) {
    console.error("Error creating task:", error);
    throw new Error("Failed to create task card");
  }
}

export async function updateTaskCard(
  taskId: number,
  data: {
    columnId?: number;
    title?: string;
    description?: string | null;
    dueDate?: Date | null;
    priority?: string;
    labels?: string | null;
    syncCalendar?: boolean;
    syncNotes?: boolean;
    position?: number;
  }
) {
  const userId = await getAuthenticatedUser();
  try {
    // Get existing task to check calendar sync state
    const [existingTask] = await db
      .select()
      .from(kanbanTasks)
      .where(eq(kanbanTasks.id, taskId))
      .limit(1);

    if (!existingTask) {
      throw new Error("Task not found");
    }

    const updateData: any = { ...data, updatedAt: new Date() };

    // Sync state toggled/updated handling
    const willSync = data.syncCalendar !== undefined ? data.syncCalendar : existingTask.syncCalendar;
    const currentCalTaskId = existingTask.calendarTaskId;

    const taskTitle = data.title !== undefined ? data.title : existingTask.title;
    const taskDesc = data.description !== undefined ? data.description : existingTask.description;
    const taskDueDate = data.dueDate !== undefined ? data.dueDate : existingTask.dueDate;
    const taskPriority = data.priority !== undefined ? data.priority : existingTask.priority;

    let nextCalTaskId = currentCalTaskId;

    if (willSync) {
      const activeDate = taskDueDate || new Date();
      activeDate.setHours(12, 0, 0, 0); // normalize time
      const calendarColor = taskPriority === "High" ? "#e11d48" : taskPriority === "Medium" ? "#d97706" : "#0284c7";

      if (currentCalTaskId) {
        // Update existing calendar task
        await db
          .update(tasks)
          .set({
            title: `[Kanban] ${taskTitle}`,
            description: taskDesc || "Synced from Kanban Board",
            date: activeDate,
            color: calendarColor,
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, currentCalTaskId));
      } else {
        // Insert new calendar task
        const [calTask] = await db
          .insert(tasks)
          .values({
            userId,
            title: `[Kanban] ${taskTitle}`,
            description: taskDesc || "Synced from Kanban Board",
            date: activeDate,
            category: "Work",
            color: calendarColor,
            type: "task",
          })
          .returning();
        
        nextCalTaskId = calTask.id;
      }
    } else {
      // If was syncing before, delete the calendar task
      if (currentCalTaskId) {
        await db.delete(tasks).where(eq(tasks.id, currentCalTaskId));
        nextCalTaskId = null;
      }
    }

    updateData.calendarTaskId = nextCalTaskId;

    // Apply Update
    const [updatedTask] = await db
      .update(kanbanTasks)
      .set(updateData)
      .where(eq(kanbanTasks.id, taskId))
      .returning();

    revalidatePath("/kanban");
    return updatedTask;
  } catch (error) {
    console.error("Error updating task card:", error);
    throw new Error("Failed to update task card");
  }
}

export async function deleteTaskCard(taskId: number) {
  await getAuthenticatedUser();
  try {
    const [taskToDelete] = await db
      .select()
      .from(kanbanTasks)
      .where(eq(kanbanTasks.id, taskId))
      .limit(1);

    if (!taskToDelete) {
      throw new Error("Task not found");
    }

    // Delete synced calendar task
    if (taskToDelete.calendarTaskId) {
      await db.delete(tasks).where(eq(tasks.id, taskToDelete.calendarTaskId));
    }

    // Delete Kanban task card
    const [deletedTask] = await db
      .delete(kanbanTasks)
      .where(eq(kanbanTasks.id, taskId))
      .returning();

    revalidatePath("/kanban");
    return deletedTask;
  } catch (error) {
    console.error("Error deleting task card:", error);
    throw new Error("Failed to delete task card");
  }
}

// -------------------------------------------------------------
// Share Actions
// -------------------------------------------------------------

export async function getBoardShares(boardId: number) {
  await getAuthenticatedUser();
  try {
    return await db
      .select()
      .from(kanbanBoardShares)
      .where(eq(kanbanBoardShares.boardId, boardId))
      .orderBy(kanbanBoardShares.createdAt);
  } catch (error) {
    console.error("Error fetching board shares:", error);
    return [];
  }
}

export async function inviteUserToBoard(boardId: number, email: string) {
  const userId = await getAuthenticatedUser();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    throw new Error("Email is required");
  }

  try {
    // 1. Verify board ownership (only owner can share/invite)
    const [board] = await db
      .select()
      .from(kanbanBoards)
      .where(and(eq(kanbanBoards.id, boardId), eq(kanbanBoards.userId, userId)))
      .limit(1);

    if (!board) {
      throw new Error("Only the board owner can invite users");
    }

    // 2. Check if already invited
    const [existingShare] = await db
      .select()
      .from(kanbanBoardShares)
      .where(
        and(
          eq(kanbanBoardShares.boardId, boardId),
          eq(kanbanBoardShares.email, cleanEmail)
        )
      )
      .limit(1);

    if (existingShare) {
      return existingShare;
    }

    // 3. Create invitation record
    const [newShare] = await db
      .insert(kanbanBoardShares)
      .values({ boardId, email: cleanEmail })
      .returning();

    revalidatePath("/kanban");
    return newShare;
  } catch (error) {
    console.error("Error inviting user:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to invite user");
  }
}

export async function removeUserFromBoard(shareId: number) {
  const userId = await getAuthenticatedUser();
  try {
    // Verify ownership of the board related to the share
    const [share] = await db
      .select()
      .from(kanbanBoardShares)
      .where(eq(kanbanBoardShares.id, shareId))
      .limit(1);

    if (!share) {
      throw new Error("Share not found");
    }

    const [board] = await db
      .select()
      .from(kanbanBoards)
      .where(and(eq(kanbanBoards.id, share.boardId), eq(kanbanBoards.userId, userId)))
      .limit(1);

    if (!board) {
      throw new Error("Unauthorized to manage invitations for this board");
    }

    const [deletedShare] = await db
      .delete(kanbanBoardShares)
      .where(eq(kanbanBoardShares.id, shareId))
      .returning();

    revalidatePath("/kanban");
    return deletedShare;
  } catch (error) {
    console.error("Error removing board share:", error);
    throw new Error("Failed to remove board collaborator");
  }
}

export async function getCollaboratorProfiles(clerkIds: string[]) {
  await getAuthenticatedUser();
  if (clerkIds.length === 0) return [];
  try {
    return await db
      .select({
        clerkId: users.clerkId,
        name: users.name,
        imageUrl: users.imageUrl,
      })
      .from(users)
      .where(inArray(users.clerkId, clerkIds));
  } catch (error) {
    console.error("Error fetching collaborator profiles:", error);
    return [];
  }
}
