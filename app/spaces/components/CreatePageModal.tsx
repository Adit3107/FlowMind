"use client";

import React, { useState } from "react";
import { X, FileText, Sparkles, Plus, LayoutTemplate } from "lucide-react";
import { createPage } from "../actions";

interface CreatePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: number;
  onCreated: () => void;
}

const TEMPLATES = [
  "Blank Page",
  "Project Plan",
  "Meeting Notes",
  "PRD",
  "Research Notes",
  "Task Plan"
];

export function CreatePageModal({ isOpen, onClose, spaceId, onCreated }: CreatePageModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState(TEMPLATES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await createPage({
        spaceId,
        userId: "mock-user-id", // To be replaced with actual user logic
        title: title.trim(),
        type,
        content: "",
      });
      setTitle("");
      setType(TEMPLATES[0]);
      onCreated();
      onClose();
    } catch (e) {
      console.error("Failed to create page:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose} />
      <div 
        className={`relative w-full max-w-md h-full bg-[#fbf7ef] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#eadfc8] bg-white">
          <h2 className="text-[18px] font-semibold text-slate-900">Create New Page</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg p-1.5 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#fbf7ef]">
          <form id="create-page-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-[13px] font-semibold text-slate-900 mb-2">
                Page Name
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-900 mb-2">
                Add to Space
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                defaultValue="Dev"
                disabled
              >
                <option value="Dev">Dev</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-900 mb-2">
                Template
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {TEMPLATES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-[13px] font-semibold text-slate-900 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>
            
            <button
              form="create-page-form"
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="w-full mt-4 flex items-center justify-center rounded-xl bg-[#f5a397] px-4 py-3 text-[14px] font-semibold text-white shadow-sm hover:bg-[#f15f49] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Page"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
