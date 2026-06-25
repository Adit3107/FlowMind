import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

// Presence properties to track active user status
type Presence = {
  activeTaskId: number | null; // The task detail sidebar/modal they are currently viewing
  isTypingComment: boolean;
};

type Storage = {};

// User Metadata passed from Clerk in Route auth
type UserMeta = {
  id: string;
  info: {
    name: string;
    email: string;
    avatar: string;
  };
};

type RoomEvent = {};

// Thread metadata to link comments to a task
type ThreadMetadata = {
  taskId: string;
};

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useThreads,
  useCreateThread,
  useCreateComment,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent, ThreadMetadata>(client);
export { client as liveblocksClient };
