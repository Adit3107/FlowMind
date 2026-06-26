"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SidebarLayout, useSidebar } from "@/components/sidebar";
import { WhiteboardSidebar } from "./components/WhiteboardSidebar";
import { WhiteboardCanvas } from "./components/WhiteboardCanvas";
import {
  getWhiteboards,
  createWhiteboard,
  updateWhiteboard,
  deleteWhiteboard,
  duplicateWhiteboard,
} from "./actions";
import type { Whiteboard } from "@/db/schema";

export default function WhiteboardPage() {
  return (
    <SidebarLayout activeLabel="Whiteboard">
      <WhiteboardPageContent />
    </SidebarLayout>
  );
}

function WhiteboardPageContent() {
  const { setIsMobileOpen } = useSidebar();
  const [whiteboardsList, setWhiteboardsList] = useState<Whiteboard[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load whiteboards from DB
  const loadWhiteboards = useCallback(async () => {
    try {
      const data = await getWhiteboards();
      setWhiteboardsList(data);
      if (data.length > 0) {
        if (activeBoardId === null || !data.some((b) => b.id === activeBoardId)) {
          setActiveBoardId(data[0].id);
        }
      } else {
        setActiveBoardId(null);
      }
    } catch (e) {
      console.error("Failed to load whiteboards:", e);
    } finally {
      setIsLoading(false);
    }
  }, [activeBoardId]);

  useEffect(() => {
    loadWhiteboards();
  }, []);

  const handleSelectBoard = (id: number) => {
    setActiveBoardId(id);
  };

  const handleCreateBoard = async () => {
    try {
      const newBoard = await createWhiteboard("Untitled Whiteboard", "#f15f49");
      setWhiteboardsList((prev) => [newBoard, ...prev]);
      setActiveBoardId(newBoard.id);
    } catch (e) {
      console.error("Failed to create whiteboard:", e);
    }
  };

  const handleUpdateBoard = async (id: number, data: { name?: string; color?: string }) => {
    // Optimistic Update
    setWhiteboardsList((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...data, updatedAt: new Date() } : b))
    );
    try {
      return await updateWhiteboard(id, data);
    } catch (e) {
      console.error("Failed to update whiteboard:", e);
      loadWhiteboards();
    }
  };

  const handleDeleteBoard = async (id: number) => {
    // Optimistic Update
    setWhiteboardsList((prev) => prev.filter((b) => b.id !== id));
    if (activeBoardId === id) {
      const remaining = whiteboardsList.filter((b) => b.id !== id);
      if (remaining.length > 0) {
        setActiveBoardId(remaining[0].id);
      } else {
        setActiveBoardId(null);
      }
    }
    try {
      await deleteWhiteboard(id);
    } catch (e) {
      console.error("Failed to delete whiteboard:", e);
      loadWhiteboards();
    }
  };

  const handleDuplicateBoard = async (id: number) => {
    try {
      const copy = await duplicateWhiteboard(id);
      setWhiteboardsList((prev) => [copy, ...prev]);
      setActiveBoardId(copy.id);
    } catch (e) {
      console.error("Failed to duplicate whiteboard:", e);
    }
  };

  const handleSaveContent = async (id: number, elements: string) => {
    // Silent background save (does not trigger full re-renders to prevent canvas stutter)
    setWhiteboardsList((prev) =>
      prev.map((b) => (b.id === id ? { ...b, elements, updatedAt: new Date() } : b))
    );
    try {
      await updateWhiteboard(id, { elements });
    } catch (e) {
      console.error("Failed to auto-save whiteboard content:", e);
    }
  };

  const activeBoard = whiteboardsList.find((b) => b.id === activeBoardId) || null;

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-white text-left">
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
          <span className="text-[13px] text-slate-500 font-semibold mt-4">Loading your board library...</span>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[260px_1fr] overflow-hidden">
          {/* Left sidebar list */}
          <WhiteboardSidebar
            whiteboardsList={whiteboardsList}
            activeBoardId={activeBoardId}
            onSelectBoard={handleSelectBoard}
            onCreateBoard={handleCreateBoard}
            onUpdateBoard={handleUpdateBoard}
            onDeleteBoard={handleDeleteBoard}
            onDuplicateBoard={handleDuplicateBoard}
          />

          {/* Right Excalidraw canvas */}
          <WhiteboardCanvas
            board={activeBoard}
            onSaveContent={handleSaveContent}
          />
        </div>
      )}
    </div>
  );
}
