import { Liveblocks } from "@liveblocks/node";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db, kanbanBoards, kanbanBoardShares } from "@/db";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  // 1. Get the current Clerk user
  const user = await currentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Find user's primary email
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress;

  if (!email) {
    return new Response("Email not found", { status: 401 });
  }

  // 2. Parse request body to get the room
  let room: string;
  try {
    const body = await request.json();
    room = body.room;
  } catch (err) {
    return new Response("Invalid request body", { status: 400 });
  }

  if (!room) {
    return new Response("Room is required", { status: 400 });
  }

  // 3. Extract Board ID from room (format: "kanban-board:123")
  const parts = room.split(":");
  if (parts[0] !== "kanban-board" || !parts[1]) {
    return new Response("Invalid room format", { status: 400 });
  }
  const boardId = parseInt(parts[1], 10);
  if (isNaN(boardId)) {
    return new Response("Invalid board ID", { status: 400 });
  }

  // 4. Verify access in database
  try {
    // Check if they own the board
    const [ownedBoard] = await db
      .select()
      .from(kanbanBoards)
      .where(and(eq(kanbanBoards.id, boardId), eq(kanbanBoards.userId, user.id)))
      .limit(1);

    let hasAccess = !!ownedBoard;

    if (!hasAccess) {
      // Check if it's shared with them
      const [sharedRecord] = await db
        .select()
        .from(kanbanBoardShares)
        .where(
          and(
            eq(kanbanBoardShares.boardId, boardId),
            eq(kanbanBoardShares.email, email.trim().toLowerCase())
          )
        )
        .limit(1);
      hasAccess = !!sharedRecord;
    }

    if (!hasAccess) {
      return new Response("Forbidden", { status: 403 });
    }

    // 5. Create Liveblocks Session
    const fullName = user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Guest";
    const session = liveblocks.prepareSession(user.id, {
      userInfo: {
        name: fullName,
        email: email,
        avatar: user.imageUrl,
      },
    });

    // 6. Grant access to the room
    session.allow(room, session.FULL_ACCESS);

    // 7. Authorize and return response
    const { status, body: responseBody } = await session.authorize();
    return new Response(responseBody, { status });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
