"use client";

import React, { useState } from "react";
import { SidebarLayout } from "@/components/sidebar";
import {
  User,
  CreditCard,
  Tags,
  Bot,
  Bell,
  Palette,
  Shield,
  Database,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  Zap,
  Crown,
  Moon,
  Sun,
  Monitor,
  ToggleLeft,
  ToggleRight,
  Settings2,
  Calendar,
  SquareKanban,
  StickyNote,
  Clock,
  Download,
  Lock,
  Eye,
  EyeOff,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: "calendar" | "kanban" | "notes" | "reminders";
}

type SettingsSection =
  | "profile"
  | "subscription"
  | "categories"
  | "ai"
  | "appearance"
  | "notifications"
  | "calendar"
  | "tasks"
  | "privacy";

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_COLORS = [
  "#f15f49", "#a855f7", "#0ea5e9", "#10b981",
  "#f59e0b", "#ec4899", "#6366f1", "#14b8a6",
];

const CATEGORY_ICONS = ["📁", "🎯", "💼", "🏠", "🌟", "🎨", "📚", "🔑", "🚀", "💡", "📅", "🎓"];

const AI_MODELS = [
  { id: "gemini-pro", name: "Gemini Pro", desc: "Best for complex reasoning", badge: "Recommended" },
  { id: "gemini-flash", name: "Gemini Flash", desc: "Faster, lighter tasks", badge: "" },
  { id: "gpt-4o", name: "GPT-4o", desc: "OpenAI's latest model", badge: "Premium" },
  { id: "claude-sonnet", name: "Claude Sonnet", desc: "Great for writing tasks", badge: "" },
];

const AI_TONES = ["Professional", "Friendly", "Cozy", "Concise", "Creative", "Formal"];

const NAV_ITEMS: { id: SettingsSection; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "profile", label: "Profile", icon: <User className="h-4 w-4" />, desc: "Personal info & account" },
  { id: "subscription", label: "Subscription", icon: <CreditCard className="h-4 w-4" />, desc: "Plan & billing" },
  { id: "categories", label: "Categories", icon: <Tags className="h-4 w-4" />, desc: "Custom categories" },
  { id: "ai", label: "AI Settings", icon: <Bot className="h-4 w-4" />, desc: "Model & behavior" },
  { id: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" />, desc: "Theme & display" },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" />, desc: "Alerts & reminders" },
  { id: "calendar", label: "Calendar", icon: <Calendar className="h-4 w-4" />, desc: "Default views" },
  { id: "tasks", label: "Tasks", icon: <SquareKanban className="h-4 w-4" />, desc: "Priority & auto-save" },
  { id: "privacy", label: "Privacy & Security", icon: <Shield className="h-4 w-4" />, desc: "Data & permissions" },
];

// ─── Default state ─────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Work", color: "#0ea5e9", icon: "💼", type: "calendar" },
  { id: "2", name: "Personal", color: "#10b981", icon: "🏠", type: "calendar" },
  { id: "3", name: "Design", color: "#a855f7", icon: "🎨", type: "kanban" },
  { id: "4", name: "Ideas", color: "#f59e0b", icon: "💡", type: "notes" },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  return (
    <SidebarLayout activeLabel="Settings">
      <SettingsContent />
    </SidebarLayout>
  );
}

function SettingsContent() {
  const [active, setActive] = useState<SettingsSection>("profile");

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#fbf7ef]">
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">

        {/* Page Header */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#f15f49] tracking-wider uppercase">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
              <Settings2 className="h-4 w-4" />
            </div>
            SETTINGS
          </div>
          <h1 className="text-[28px] md:text-[32px] font-semibold text-slate-900 tracking-tight">
            Manage your account & preferences.
          </h1>
        </div>

        <div className="flex gap-6 items-start">

          {/* ── Left Nav ── */}
          <aside className="hidden md:flex flex-col w-[240px] shrink-0 rounded-[20px] border border-[#eadfc8] bg-white shadow-sm overflow-hidden sticky top-8">
            <div className="px-4 py-3 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Settings
            </div>
            <nav className="p-2 flex flex-col gap-0.5">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all w-full group",
                    active === item.id
                      ? "bg-[#f15f49]/8 text-[#f15f49]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <span className={cn(
                    "transition-colors",
                    active === item.id ? "text-[#f15f49]" : "text-slate-400 group-hover:text-slate-600"
                  )}>
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <div className={cn("text-[13px] font-semibold", active === item.id && "text-[#f15f49]")}>
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{item.desc}</div>
                  </div>
                  {active === item.id && (
                    <ChevronRight className="h-3.5 w-3.5 ml-auto text-[#f15f49] shrink-0" />
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Right Content Panel ── */}
          <div className="flex-1 min-w-0 rounded-[20px] border border-[#eadfc8] bg-white shadow-sm overflow-hidden">
            {active === "profile" && <ProfileSection />}
            {active === "subscription" && <SubscriptionSection />}
            {active === "categories" && <CategoriesSection />}
            {active === "ai" && <AISection />}
            {active === "appearance" && <AppearanceSection />}
            {active === "notifications" && <NotificationsSection />}
            {active === "calendar" && <CalendarSection />}
            {active === "tasks" && <TasksSection />}
            {active === "privacy" && <PrivacySection />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section shell ─────────────────────────────────────────────────────────

function SectionShell({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="px-7 py-5 border-b border-slate-100 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-[#f15f49]/10 flex items-center justify-center text-[#f15f49] shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-slate-900">{title}</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="p-7 space-y-6">{children}</div>
    </div>
  );
}

function SettingCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-slate-100 bg-slate-50/50 p-5", className)}>
      {children}
    </div>
  );
}

function SettingRow({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold text-slate-800">{label}</div>
        {desc && <div className="text-[12px] text-slate-400 mt-0.5">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "flex items-center gap-1 px-1 py-1 rounded-full w-12 transition-all",
        enabled ? "bg-[#f15f49] justify-end" : "bg-slate-200 justify-start"
      )}
    >
      <div className="h-5 w-5 rounded-full bg-white shadow-sm" />
    </button>
  );
}

function SaveBtn({ onClick }: { onClick?: () => void }) {
  const [saved, setSaved] = useState(false);
  const handle = () => {
    onClick?.();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all",
        saved
          ? "bg-emerald-500 text-white"
          : "bg-[#f15f49] text-white hover:bg-[#e0503a]"
      )}
    >
      {saved ? <><Check className="h-4 w-4" /> Saved!</> : "Save changes"}
    </button>
  );
}

// ─── 1. Profile ───────────────────────────────────────────────────────────────

function ProfileSection() {
  const [name, setName] = useState("Zane Carter");
  const [email, setEmail] = useState("zane@example.com");
  const [bio, setBio] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <SectionShell title="Profile" subtitle="Manage your personal information and account details." icon={<User className="h-5 w-5" />}>

      {/* Avatar */}
      <SettingCard>
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-[#f15f49] flex items-center justify-center text-white text-[22px] font-bold shrink-0">
            ZC
          </div>
          <div>
            <div className="text-[14px] font-semibold text-slate-800">Profile Photo</div>
            <div className="text-[12px] text-slate-500 mt-0.5 mb-3">PNG, JPG up to 2MB</div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition">
                Upload photo
              </button>
              <button className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-rose-600 hover:bg-rose-50 transition">
                Remove
              </button>
            </div>
          </div>
        </div>
      </SettingCard>

      {/* Name + Email */}
      <SettingCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13.5px] font-medium text-slate-900 focus:outline-none focus:border-[#f15f49] transition"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13.5px] font-medium text-slate-900 focus:outline-none focus:border-[#f15f49] transition"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell us a bit about yourself…"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13.5px] font-medium text-slate-900 focus:outline-none focus:border-[#f15f49] transition resize-none"
            />
          </div>
        </div>
      </SettingCard>

      {/* Account actions */}
      <SettingCard>
        <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3">Account Actions</div>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition">
            <Lock className="h-3.5 w-3.5 text-slate-400" /> Change password
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition">
            <Download className="h-3.5 w-3.5 text-slate-400" /> Export my data
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-100 text-[12.5px] font-semibold text-rose-600 hover:bg-rose-50 transition">
            <Trash2 className="h-3.5 w-3.5" /> Delete account
          </button>
        </div>
      </SettingCard>

      <div className="flex justify-end">
        <SaveBtn />
      </div>
    </SectionShell>
  );
}

// ─── 2. Subscription ─────────────────────────────────────────────────────────

function SubscriptionSection() {
  const plans = [
    { id: "free", name: "Free", price: "$0", period: "forever", features: ["5 Spaces", "50 Pages", "Basic AI", "1 GB storage"], color: "slate", current: false },
    { id: "pro", name: "Pro", price: "$12", period: "per month", features: ["Unlimited Spaces", "Unlimited Pages", "Advanced AI", "10 GB storage", "Priority support"], color: "indigo", current: true, badge: "Current Plan" },
    { id: "team", name: "Team", price: "$29", period: "per month", features: ["Everything in Pro", "Team collaboration", "Admin controls", "100 GB storage", "SSO support"], color: "purple", badge: "Popular" },
  ];

  return (
    <SectionShell title="Subscription" subtitle="Manage your plan, billing, and usage." icon={<CreditCard className="h-5 w-5" />}>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "rounded-2xl border-2 p-5 flex flex-col gap-3 transition-all",
              plan.current
                ? "border-[#f15f49] bg-[#f15f49]/5"
                : "border-slate-200 bg-white hover:border-slate-300"
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[15px] font-bold text-slate-900">{plan.name}</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-[22px] font-bold text-slate-900">{plan.price}</span>
                  <span className="text-[12px] text-slate-400">{plan.period}</span>
                </div>
              </div>
              {plan.badge && (
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  plan.current ? "bg-[#f15f49] text-white" : "bg-slate-100 text-slate-600"
                )}>
                  {plan.badge}
                </span>
              )}
            </div>
            <ul className="space-y-1.5 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[12.5px] text-slate-600">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button className={cn(
              "w-full py-2 rounded-xl text-[13px] font-bold transition",
              plan.current
                ? "bg-[#f15f49] text-white hover:bg-[#e0503a]"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
            )}>
              {plan.current ? "Manage Plan" : "Upgrade"}
            </button>
          </div>
        ))}
      </div>

      {/* Usage */}
      <SettingCard>
        <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-4">Usage This Month</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Spaces", used: 3, max: "∞" },
            { label: "Pages", used: 28, max: "∞" },
            { label: "AI Requests", used: 142, max: 500 },
            { label: "Storage", used: "2.3", max: "10 GB" },
          ].map((u) => (
            <div key={u.label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
              <div className="text-[22px] font-bold text-slate-900">{u.used}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{u.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">of {u.max}</div>
            </div>
          ))}
        </div>
      </SettingCard>

      {/* Billing info */}
      <SettingCard>
        <SettingRow label="Renewal Date" desc="Your plan renews automatically">
          <span className="text-[13px] font-semibold text-slate-700">Aug 1, 2026</span>
        </SettingRow>
        <SettingRow label="Payment Method" desc="Visa ending in 4242">
          <button className="text-[12.5px] font-semibold text-[#f15f49] hover:underline">Update</button>
        </SettingRow>
        <SettingRow label="Billing History" desc="View past invoices">
          <button className="text-[12.5px] font-semibold text-[#f15f49] hover:underline">View all</button>
        </SettingRow>
      </SettingCard>
    </SectionShell>
  );
}

// ─── 3. Categories ────────────────────────────────────────────────────────────

function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0]);
  const [newIcon, setNewIcon] = useState(CATEGORY_ICONS[0]);
  const [newType, setNewType] = useState<Category["type"]>("calendar");

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setEditIcon(cat.icon);
  };

  const saveEdit = () => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === editingId
          ? { ...c, name: editName, color: editColor, icon: editIcon }
          : c
      )
    );
    setEditingId(null);
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const addCategory = () => {
    if (!newName.trim()) return;
    const cat: Category = {
      id: Date.now().toString(),
      name: newName.trim(),
      color: newColor,
      icon: newIcon,
      type: newType,
    };
    setCategories((prev) => [...prev, cat]);
    setNewName("");
    setNewColor(CATEGORY_COLORS[0]);
    setNewIcon(CATEGORY_ICONS[0]);
    setNewType("calendar");
    setShowAdd(false);
  };

  const TYPE_LABELS: Record<Category["type"], string> = {
    calendar: "Calendar",
    kanban: "Task / Kanban",
    notes: "Notes",
    reminders: "Reminders",
  };

  return (
    <SectionShell title="Categories" subtitle="Create and manage custom categories for your workspace." icon={<Tags className="h-5 w-5" />}>

      {/* Add new button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f15f49] text-white text-[13px] font-semibold hover:bg-[#e0503a] transition"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <SettingCard className="border-2 border-[#f15f49]/30 bg-[#f15f49]/3">
          <div className="text-[13px] font-bold text-slate-800 mb-4">New Category</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-[#f15f49] transition"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as Category["type"])}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-[#f15f49] transition"
              >
                {(Object.keys(TYPE_LABELS) as Category["type"][]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={cn("h-7 w-7 rounded-full border-2 transition-transform hover:scale-110", newColor === c ? "border-slate-800 scale-110" : "border-white shadow")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="mb-5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Icon</label>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORY_ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setNewIcon(ic)}
                  className={cn("h-8 w-8 text-[16px] rounded-lg flex items-center justify-center transition", newIcon === ic ? "bg-slate-200 ring-2 ring-slate-400" : "hover:bg-slate-100")}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition">
              Cancel
            </button>
            <button onClick={addCategory} disabled={!newName.trim()} className="flex-1 py-2 rounded-xl bg-[#f15f49] text-white text-[13px] font-semibold hover:bg-[#e0503a] transition disabled:opacity-50">
              Create
            </button>
          </div>
        </SettingCard>
      )}

      {/* Category list */}
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            {editingId === cat.id ? (
              <div className="space-y-3">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium focus:outline-none focus:border-[#f15f49] transition"
                  autoFocus
                />
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Color</div>
                  <div className="flex gap-2 flex-wrap">
                    {CATEGORY_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        className={cn("h-6 w-6 rounded-full border-2 transition-transform hover:scale-110", editColor === c ? "border-slate-800 scale-110" : "border-white shadow")}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Icon</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {CATEGORY_ICONS.map((ic) => (
                      <button
                        key={ic}
                        onClick={() => setEditIcon(ic)}
                        className={cn("h-7 w-7 text-[14px] rounded-lg flex items-center justify-center transition", editIcon === ic ? "bg-slate-200 ring-2 ring-slate-400" : "hover:bg-slate-100")}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition">
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                  <button onClick={saveEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 transition">
                    <Check className="h-3.5 w-3.5" /> Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-[18px] shrink-0" style={{ backgroundColor: `${cat.color}18` }}>
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-[14px] font-semibold text-slate-800">{cat.name}</div>
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  </div>
                  <div className="text-[12px] text-slate-400">{TYPE_LABELS[cat.type]}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteCategory(cat.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
            <Tags className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-[14px] font-semibold">No categories yet</p>
            <p className="text-[12px] mt-1">Click "Add Category" to create one.</p>
          </div>
        )}
      </div>
    </SectionShell>
  );
}

// ─── 4. AI Settings ───────────────────────────────────────────────────────────

function AISection() {
  const [selectedModel, setSelectedModel] = useState("gemini-pro");
  const [selectedTone, setSelectedTone] = useState("Friendly");
  const [features, setFeatures] = useState({
    aiRefine: true,
    aiAssistant: true,
    aiTemplateBuilder: true,
    autoSuggest: false,
    grammarCheck: true,
  });

  const toggle = (key: keyof typeof features) =>
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <SectionShell title="AI Settings" subtitle="Configure your preferred AI model and behavior." icon={<Bot className="h-5 w-5" />}>

      {/* Model selection */}
      <SettingCard>
        <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-4">Preferred AI Model</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AI_MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                selectedModel === m.id
                  ? "border-[#f15f49] bg-[#f15f49]/5"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className={cn(
                "h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0",
                selectedModel === m.id ? "border-[#f15f49] bg-[#f15f49]" : "border-slate-300"
              )}>
                {selectedModel === m.id && <Check className="h-3 w-3 text-white" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-bold text-slate-900">{m.name}</span>
                  {m.badge && (
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      m.badge === "Recommended" ? "bg-emerald-100 text-emerald-700" :
                      m.badge === "Premium" ? "bg-amber-100 text-amber-700" : ""
                    )}>
                      {m.badge}
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-slate-500 mt-0.5">{m.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </SettingCard>

      {/* Tone */}
      <SettingCard>
        <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3">Response Tone / Style</div>
        <div className="flex flex-wrap gap-2">
          {AI_TONES.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTone(t)}
              className={cn(
                "px-4 py-2 rounded-xl text-[13px] font-semibold transition-all border",
                selectedTone === t
                  ? "bg-[#f15f49] text-white border-[#f15f49]"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </SettingCard>

      {/* Feature toggles */}
      <SettingCard>
        <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">AI Features</div>
        <SettingRow label="AI Refine" desc="Refine text with AI on selection">
          <Toggle enabled={features.aiRefine} onChange={() => toggle("aiRefine")} />
        </SettingRow>
        <SettingRow label="AI Assistant" desc="Conversational AI chat panel">
          <Toggle enabled={features.aiAssistant} onChange={() => toggle("aiAssistant")} />
        </SettingRow>
        <SettingRow label="AI Template Builder" desc="Generate page templates automatically">
          <Toggle enabled={features.aiTemplateBuilder} onChange={() => toggle("aiTemplateBuilder")} />
        </SettingRow>
        <SettingRow label="Auto-suggest" desc="Smart suggestions while typing">
          <Toggle enabled={features.autoSuggest} onChange={() => toggle("autoSuggest")} />
        </SettingRow>
        <SettingRow label="Grammar check" desc="Automatically check spelling and grammar">
          <Toggle enabled={features.grammarCheck} onChange={() => toggle("grammarCheck")} />
        </SettingRow>
      </SettingCard>

      <div className="flex justify-end">
        <SaveBtn />
      </div>
    </SectionShell>
  );
}

// ─── 5. Appearance ────────────────────────────────────────────────────────────

function AppearanceSection() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [fontSize, setFontSize] = useState("medium");
  const [density, setDensity] = useState("comfortable");
  const [accentColor, setAccentColor] = useState("#f15f49");

  const ACCENT_COLORS = ["#f15f49", "#a855f7", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899"];

  return (
    <SectionShell title="Appearance" subtitle="Customize the look and feel of your workspace." icon={<Palette className="h-5 w-5" />}>

      {/* Theme */}
      <SettingCard>
        <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-4">Theme</div>
        <div className="grid grid-cols-3 gap-3">
          {([
            { id: "light", label: "Light", icon: <Sun className="h-5 w-5" /> },
            { id: "dark", label: "Dark", icon: <Moon className="h-5 w-5" /> },
            { id: "system", label: "System", icon: <Monitor className="h-5 w-5" /> },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all",
                theme === t.id ? "border-[#f15f49] bg-[#f15f49]/5" : "border-slate-200 hover:border-slate-300"
              )}
            >
              <span className={theme === t.id ? "text-[#f15f49]" : "text-slate-400"}>{t.icon}</span>
              <span className={cn("text-[13px] font-semibold", theme === t.id ? "text-[#f15f49]" : "text-slate-600")}>{t.label}</span>
            </button>
          ))}
        </div>
      </SettingCard>

      {/* Accent color */}
      <SettingCard>
        <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3">Accent Color</div>
        <div className="flex gap-3">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setAccentColor(c)}
              className={cn("h-9 w-9 rounded-full border-2 transition-transform hover:scale-110", accentColor === c ? "border-slate-800 scale-110" : "border-white shadow")}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </SettingCard>

      {/* Font size + density */}
      <SettingCard>
        <SettingRow label="Font Size" desc="Controls text size across the app">
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-[#f15f49] transition"
          >
            {["small", "medium", "large"].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </SettingRow>
        <SettingRow label="Layout Density" desc="How compact the UI feels">
          <select
            value={density}
            onChange={(e) => setDensity(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-[#f15f49] transition"
          >
            {["compact", "comfortable", "spacious"].map((d) => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>
        </SettingRow>
      </SettingCard>

      <div className="flex justify-end">
        <SaveBtn />
      </div>
    </SectionShell>
  );
}

// ─── 6. Notifications ─────────────────────────────────────────────────────────

function NotificationsSection() {
  const [notifs, setNotifs] = useState({
    taskDue: true,
    taskReminder: true,
    calendarEvent: true,
    spaceUpdates: false,
    aiSuggestions: true,
    weeklyDigest: false,
    emailNotifs: true,
    browserPush: false,
  });
  const toggle = (k: keyof typeof notifs) => setNotifs((p) => ({ ...p, [k]: !p[k] }));

  return (
    <SectionShell title="Notifications" subtitle="Control which alerts and reminders you receive." icon={<Bell className="h-5 w-5" />}>
      <SettingCard>
        <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">In-App Notifications</div>
        <SettingRow label="Task due reminders" desc="Alert when a task is due soon">
          <Toggle enabled={notifs.taskDue} onChange={() => toggle("taskDue")} />
        </SettingRow>
        <SettingRow label="Task reminder alerts" desc="Custom reminders you set on tasks">
          <Toggle enabled={notifs.taskReminder} onChange={() => toggle("taskReminder")} />
        </SettingRow>
        <SettingRow label="Calendar events" desc="Alerts for upcoming events">
          <Toggle enabled={notifs.calendarEvent} onChange={() => toggle("calendarEvent")} />
        </SettingRow>
        <SettingRow label="Space & page updates" desc="Notify when collaborators make changes">
          <Toggle enabled={notifs.spaceUpdates} onChange={() => toggle("spaceUpdates")} />
        </SettingRow>
        <SettingRow label="AI suggestions" desc="Nudges from AI features">
          <Toggle enabled={notifs.aiSuggestions} onChange={() => toggle("aiSuggestions")} />
        </SettingRow>
      </SettingCard>

      <SettingCard>
        <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">Delivery Channels</div>
        <SettingRow label="Email notifications" desc="Receive digests and alerts via email">
          <Toggle enabled={notifs.emailNotifs} onChange={() => toggle("emailNotifs")} />
        </SettingRow>
        <SettingRow label="Browser push" desc="Allow browser push notifications">
          <Toggle enabled={notifs.browserPush} onChange={() => toggle("browserPush")} />
        </SettingRow>
        <SettingRow label="Weekly digest" desc="Summary of your week every Monday">
          <Toggle enabled={notifs.weeklyDigest} onChange={() => toggle("weeklyDigest")} />
        </SettingRow>
      </SettingCard>

      <div className="flex justify-end">
        <SaveBtn />
      </div>
    </SectionShell>
  );
}

// ─── 7. Calendar ─────────────────────────────────────────────────────────────

function CalendarSection() {
  const [defaultView, setDefaultView] = useState("week");
  const [startDay, setStartDay] = useState("monday");
  const [timeFormat, setTimeFormat] = useState("12");
  const [showWeekNumbers, setShowWeekNumbers] = useState(false);
  const [defaultDuration, setDefaultDuration] = useState("60");

  return (
    <SectionShell title="Calendar" subtitle="Configure default views and calendar behaviour." icon={<Calendar className="h-5 w-5" />}>
      <SettingCard>
        <SettingRow label="Default View" desc="View to show when opening Calendar">
          <select
            value={defaultView}
            onChange={(e) => setDefaultView(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-[#f15f49] transition"
          >
            {["day", "week", "month", "agenda"].map((v) => (
              <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
            ))}
          </select>
        </SettingRow>
        <SettingRow label="Week Starts On">
          <select
            value={startDay}
            onChange={(e) => setStartDay(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-[#f15f49] transition"
          >
            {["sunday", "monday", "saturday"].map((d) => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>
        </SettingRow>
        <SettingRow label="Time Format">
          <select
            value={timeFormat}
            onChange={(e) => setTimeFormat(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-[#f15f49] transition"
          >
            <option value="12">12-hour (AM/PM)</option>
            <option value="24">24-hour</option>
          </select>
        </SettingRow>
        <SettingRow label="Default Event Duration" desc="Duration in minutes for new events">
          <select
            value={defaultDuration}
            onChange={(e) => setDefaultDuration(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-[#f15f49] transition"
          >
            {["15", "30", "60", "90", "120"].map((d) => (
              <option key={d} value={d}>{d} min</option>
            ))}
          </select>
        </SettingRow>
        <SettingRow label="Show Week Numbers">
          <Toggle enabled={showWeekNumbers} onChange={() => setShowWeekNumbers((v) => !v)} />
        </SettingRow>
      </SettingCard>

      <div className="flex justify-end">
        <SaveBtn />
      </div>
    </SectionShell>
  );
}

// ─── 8. Tasks ────────────────────────────────────────────────────────────────

function TasksSection() {
  const [defaultPriority, setDefaultPriority] = useState("Medium");
  const [autoSave, setAutoSave] = useState(true);
  const [archiveDone, setArchiveDone] = useState(false);
  const [defaultView, setDefaultView] = useState("board");
  const [showDueDate, setShowDueDate] = useState(true);

  const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

  return (
    <SectionShell title="Tasks & Kanban" subtitle="Default task behaviour and Kanban preferences." icon={<SquareKanban className="h-5 w-5" />}>
      <SettingCard>
        <SettingRow label="Default Priority" desc="Priority assigned to new tasks">
          <div className="flex gap-1.5">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => setDefaultPriority(p)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] font-bold transition border",
                  defaultPriority === p
                    ? "bg-[#f15f49] text-white border-[#f15f49]"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </SettingRow>
        <SettingRow label="Default Board View">
          <select
            value={defaultView}
            onChange={(e) => setDefaultView(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-[#f15f49] transition"
          >
            <option value="board">Board (Kanban)</option>
            <option value="list">List</option>
            <option value="calendar">Calendar</option>
          </select>
        </SettingRow>
        <SettingRow label="Auto-save" desc="Save task changes automatically">
          <Toggle enabled={autoSave} onChange={() => setAutoSave((v) => !v)} />
        </SettingRow>
        <SettingRow label="Auto-archive completed" desc="Move done tasks to archive automatically">
          <Toggle enabled={archiveDone} onChange={() => setArchiveDone((v) => !v)} />
        </SettingRow>
        <SettingRow label="Show due date on cards" desc="Display due date chip on Kanban cards">
          <Toggle enabled={showDueDate} onChange={() => setShowDueDate((v) => !v)} />
        </SettingRow>
      </SettingCard>

      <div className="flex justify-end">
        <SaveBtn />
      </div>
    </SectionShell>
  );
}

// ─── 9. Privacy & Security ────────────────────────────────────────────────────

function PrivacySection() {
  const [twoFactor, setTwoFactor] = useState(false);
  const [activityLog, setActivityLog] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <SectionShell title="Privacy & Security" subtitle="Control your data, security settings, and permissions." icon={<Shield className="h-5 w-5" />}>

      <SettingCard>
        <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">Security</div>
        <SettingRow label="Two-Factor Authentication" desc="Add an extra layer of account security">
          <div className="flex items-center gap-3">
            {twoFactor && <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Enabled</span>}
            <Toggle enabled={twoFactor} onChange={() => setTwoFactor((v) => !v)} />
          </div>
        </SettingRow>
        <SettingRow label="Change Password" desc="Last changed 3 months ago">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition">
            <Lock className="h-3.5 w-3.5 text-slate-400" /> Change
          </button>
        </SettingRow>
        <SettingRow label="Active Sessions" desc="Devices currently signed in">
          <button className="text-[12.5px] font-semibold text-[#f15f49] hover:underline">View & revoke</button>
        </SettingRow>
      </SettingCard>

      <SettingCard>
        <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">Privacy</div>
        <SettingRow label="Activity log" desc="Track recent actions in your account">
          <Toggle enabled={activityLog} onChange={() => setActivityLog((v) => !v)} />
        </SettingRow>
        <SettingRow label="Improve AI with my data" desc="Help improve AI models (anonymised)">
          <Toggle enabled={dataSharing} onChange={() => setDataSharing((v) => !v)} />
        </SettingRow>
      </SettingCard>

      <SettingCard>
        <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3">Data Management</div>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition">
            <Download className="h-3.5 w-3.5 text-slate-400" /> Export all data
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition">
            <Globe className="h-3.5 w-3.5 text-slate-400" /> Privacy policy
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-100 text-[12.5px] font-semibold text-rose-600 hover:bg-rose-50 transition">
            <Trash2 className="h-3.5 w-3.5" /> Delete all data
          </button>
        </div>
      </SettingCard>

      <div className="flex justify-end">
        <SaveBtn />
      </div>
    </SectionShell>
  );
}
