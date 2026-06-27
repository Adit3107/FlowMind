import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").unique(),
  name: text("name"),
  email: text("email").notNull().unique(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date"), // Null for drafts
  category: text("category").default("Work").notNull(),
  color: text("color").default("#f15f49").notNull(),
  type: text("type").default("task").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const kanbanBoards = pgTable("kanban_boards", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(), // Hex color for the board indicator
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const kanbanColumns = pgTable("kanban_columns", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").notNull(), // relates to kanbanBoards.id
  name: text("name").notNull(),
  position: integer("position").notNull(), // Order
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const kanbanTasks = pgTable("kanban_tasks", {
  id: serial("id").primaryKey(),
  columnId: integer("column_id").notNull(), // relates to kanbanColumns.id
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  priority: text("priority").default("Medium").notNull(), // Low, Medium, High
  labels: text("labels"), // Comma-separated labels
  syncCalendar: boolean("sync_calendar").default(false).notNull(),
  syncNotes: boolean("sync_notes").default(false).notNull(),
  position: integer("position").default(0).notNull(), // Order of task inside column
  calendarTaskId: integer("calendar_task_id"), // Reference to tasks.id for sync updates
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const kanbanBoardShares = pgTable("kanban_board_shares", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").default("Untitled").notNull(),
  content: text("content").default("").notNull(),
  icon: text("icon").default("FileText").notNull(),
  color: text("color").default("#10b981").notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  isTrashed: boolean("is_trashed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const whiteboards = pgTable("whiteboards", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").default("Untitled Whiteboard").notNull(),
  color: text("color").default("#f15f49").notNull(),
  elements: text("elements").default("[]").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type KanbanBoard = typeof kanbanBoards.$inferSelect;
export type NewKanbanBoard = typeof kanbanBoards.$inferInsert;

export type KanbanColumn = typeof kanbanColumns.$inferSelect;
export type NewKanbanColumn = typeof kanbanColumns.$inferInsert;

export type KanbanTask = typeof kanbanTasks.$inferSelect;
export type NewKanbanTask = typeof kanbanTasks.$inferInsert;

export type KanbanBoardShare = typeof kanbanBoardShares.$inferSelect;
export type NewKanbanBoardShare = typeof kanbanBoardShares.$inferInsert;

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export type Whiteboard = typeof whiteboards.$inferSelect;
export type NewWhiteboard = typeof whiteboards.$inferInsert;

export const spaces = pgTable("spaces", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#8b5cf6").notNull(), // Purple default
  isFavorite: boolean("is_favorite").default(false).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull(), // relates to spaces.id
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  type: text("type").default("Blank Page").notNull(),
  content: text("content").default("").notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Space = typeof spaces.$inferSelect;
export type NewSpace = typeof spaces.$inferInsert;

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
