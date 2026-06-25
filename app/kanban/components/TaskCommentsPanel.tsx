"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { useOthers, useUpdateMyPresence, useThreads, useCreateThread, useCreateComment } from "@/lib/liveblocks";
import { getCollaboratorProfiles } from "../actions";
import type { KanbanTask } from "@/db/schema";

export function TaskCommentsPanel({ task }: { task: KanbanTask }) {
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();
  const { threads } = useThreads();
  const createThread = useCreateThread();
  const createComment = useCreateComment();

  const [newComment, setNewComment] = useState("");
  const [profiles, setProfiles] = useState<Record<string, { name: string; imageUrl: string | null; loaded: boolean }>>({});
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Filter threads relating to this specific task
  const taskThreads = (threads || []).filter(t => t.metadata.taskId === String(task.id));
  const primaryThread = taskThreads[0];
  const comments = primaryThread ? primaryThread.comments : [];

  // Track active task detail modal focus
  useEffect(() => {
    updateMyPresence({ activeTaskId: task.id });
    return () => {
      updateMyPresence({ activeTaskId: null });
    };
  }, [task.id, updateMyPresence]);

  // Scroll to bottom on comment list update
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  // Fetch profiles for comment authors
  const commentAuthorIds = comments.map(c => c.userId);
  const uniqueAuthorIds = useMemo(() => Array.from(new Set(commentAuthorIds)), [commentAuthorIds]);

  useEffect(() => {
    if (uniqueAuthorIds.length === 0) return;

    const idsToFetch = uniqueAuthorIds.filter(id => !profiles[id]?.loaded);
    if (idsToFetch.length === 0) return;

    // Set temporary state to avoid double-fetching
    setProfiles(prev => {
      const next = { ...prev };
      idsToFetch.forEach(id => {
        next[id] = { name: "Loading...", imageUrl: null, loaded: true };
      });
      return next;
    });

    getCollaboratorProfiles(idsToFetch).then(res => {
      setProfiles(prev => {
        const next = { ...prev };
        idsToFetch.forEach(id => {
          next[id] = { name: "Collaborator", imageUrl: null, loaded: true };
        });
        res.forEach(p => {
          if (p.clerkId) {
            next[p.clerkId] = {
              name: p.name || "Collaborator",
              imageUrl: p.imageUrl || null,
              loaded: true,
            };
          }
        });
        return next;
      });
    });
  }, [uniqueAuthorIds]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewComment(val);
    updateMyPresence({ isTypingComment: val.trim().length > 0 });
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const text = newComment.trim();
    setNewComment("");
    updateMyPresence({ isTypingComment: false });

    if (primaryThread) {
      createComment({
        threadId: primaryThread.id,
        body: {
          version: 1,
          content: [
            {
              type: "paragraph",
              children: [{ text }],
            },
          ],
        },
      });
    } else {
      createThread({
        body: {
          version: 1,
          content: [
            {
              type: "paragraph",
              children: [{ text }],
            },
          ],
        },
        metadata: {
          taskId: String(task.id),
        },
      });
    }
  };

  const renderCommentBody = (body: any) => {
    if (!body || !body.content) return "";
    return body.content.map((paragraph: any, pIdx: number) => {
      if (paragraph.type === "paragraph" && paragraph.children) {
        return (
          <p key={pIdx} className="text-[13px] text-slate-700 leading-normal whitespace-pre-wrap">
            {paragraph.children.map((child: any, cIdx: number) => child.text || "").join("")}
          </p>
        );
      }
      return null;
    });
  };

  const formatTimestamp = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return d.toLocaleDateString("default", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const typingOthers = others.filter(
    other => other.presence?.activeTaskId === task.id && other.presence?.isTypingComment
  );

  return (
    <div className="flex flex-col h-full bg-[#fbf7ef]/30 max-h-[75vh] md:max-h-full">
      {/* Thread Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
        <h4 className="text-[14.5px] font-bold text-slate-800">Discussion</h4>
        <span className="text-[11px] font-bold bg-[#f6f1e6] border border-[#eadfc8] text-slate-600 px-2 py-0.5 rounded-full">
          {comments.length} comments
        </span>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-slate-400 h-full">
            <MessageSquare className="h-8 w-8 text-slate-300 stroke-[1.5]" />
            <span className="text-[12.5px] font-bold mt-2 text-slate-700">No comments yet</span>
            <span className="text-[11.5px] text-slate-400 max-w-[200px] mt-0.5 leading-normal">
              Start the discussion by writing a comment below.
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const authorProfile = profiles[comment.userId] || { name: "Collaborator", imageUrl: null };
              const initials = getInitials(authorProfile.name);

              return (
                <div key={comment.id} className="flex gap-3 text-left">
                  {authorProfile.imageUrl ? (
                    <img
                      src={authorProfile.imageUrl}
                      alt={authorProfile.name}
                      className="h-7 w-7 rounded-full object-cover shadow-xs shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-white text-[10px] font-bold shadow-xs shrink-0 mt-0.5 animate-fade-in">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[12.5px] font-bold text-slate-800 truncate">
                        {authorProfile.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {formatTimestamp(comment.createdAt)}
                      </span>
                    </div>
                    <div className="mt-1 bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                      {renderCommentBody(comment.body)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingOthers.length > 0 && (
        <div className="px-4 py-1.5 bg-[#fbf7ef]/40 border-t border-slate-50 shrink-0 text-left">
          <div className="text-[11px] text-slate-400 font-semibold italic flex items-center gap-1.5">
            <span className="flex gap-0.5 items-center">
              <span className="h-1.5 w-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
            {typingOthers.map(o => o.info?.name || "Someone").join(", ")} {typingOthers.length === 1 ? "is" : "are"} typing...
          </div>
        </div>
      )}

      {/* Compose Form */}
      <form onSubmit={handleSendComment} className="p-4 border-t border-slate-100 bg-white shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            required
            value={newComment}
            onChange={handleCommentChange}
            placeholder="Write a comment..."
            rows={1}
            className="flex-1 min-h-[38px] max-h-[100px] resize-none border border-slate-200 rounded-xl px-3 py-2 text-[13px] placeholder-slate-400 focus:outline-none focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706] bg-white text-slate-800"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendComment(e);
              }
            }}
          />
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-[#d97706] hover:brightness-95 text-white px-4 text-[12.5px] font-bold shadow-xs transition cursor-pointer shrink-0"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
