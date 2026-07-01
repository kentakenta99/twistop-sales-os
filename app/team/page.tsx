"use client";

import { useState, useEffect } from "react";
import {
  Plus, Pin, Trash2, CheckCircle2, Circle, Clock, AlertCircle, X, Smile,
  ChevronLeft, ChevronRight, Star, Pencil, MessageCircle, Send,
} from "lucide-react";
import { getCurrentUser, KNOWN_USERS, type AppUser } from "@/lib/currentUser";

// ── Types ─────────────────────────────────────────────────────────────────────

type Priority = "low" | "medium" | "high" | "urgent";
type TaskStatus = "todo" | "in_progress" | "done";
type EventType = "first_meet" | "negotiation" | "contract_target" | "general" | "production" | "milestone";

type User = { id: string; name: string; avatar_color: string };

type Task = {
  id: string; title: string; description: string | null;
  status: TaskStatus; priority: Priority;
  assignee: User | null; creator: User | null;
  due_date: string | null; created_at: string;
};

type Reaction = { id: string; emoji: string; user_id: string };

type Comment = {
  id: string; post_id: string; content: string;
  author: User | null; created_at: string;
};

type Post = {
  id: string; title: string; content: string;
  author: User | null; pinned: boolean;
  reactions: Reaction[]; created_at: string;
};

type CalendarEvent = {
  id: string; title: string; event_date: string;
  event_type: EventType; description: string | null;
  all_day: boolean; start_time: string | null; end_time: string | null;
  created_by: string | null; created_at: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const PRIORITY_META: Record<Priority, { label: string; color: string; icon: React.ReactNode }> = {
  low:    { label: "Low",    color: "text-slate-400",  icon: <Circle size={13} /> },
  medium: { label: "Medium", color: "text-blue-500",   icon: <Clock size={13} /> },
  high:   { label: "High",   color: "text-orange-500", icon: <AlertCircle size={13} /> },
  urgent: { label: "Urgent", color: "text-red-500",    icon: <AlertCircle size={13} /> },
};

const STATUS_COLS: { key: TaskStatus; label: string; bg: string; dot: string }[] = [
  { key: "todo",        label: "To Do",       bg: "bg-slate-50",  dot: "bg-slate-300" },
  { key: "in_progress", label: "In Progress", bg: "bg-blue-50",   dot: "bg-blue-400" },
  { key: "done",        label: "Done",        bg: "bg-green-50",  dot: "bg-green-500" },
];

const QUICK_EMOJIS = ["👍", "🔥", "✅", "🎉", "💡", "❓"];

const EVENT_META: Record<EventType, { label: string; chip: string; dot: string }> = {
  first_meet:      { label: "初回 Meet",    chip: "bg-cyan-100 text-cyan-700 border-cyan-200",        dot: "bg-cyan-500" },
  negotiation:     { label: "商談",         chip: "bg-amber-100 text-amber-700 border-amber-200",     dot: "bg-amber-500" },
  contract_target: { label: "契約目標日",    chip: "bg-red-100 text-red-700 border-red-200",          dot: "bg-red-500" },
  general:         { label: "General",      chip: "bg-blue-100 text-blue-700 border-blue-200",        dot: "bg-blue-500" },
  production:      { label: "製作工程",      chip: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  milestone:       { label: "マイルストーン", chip: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500" },
};

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function Avatar({ user, size = 7 }: { user: User | AppUser | null; size?: number }) {
  if (!user) return <div className={`w-${size} h-${size} rounded-full bg-slate-200`} />;
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
      style={{ backgroundColor: "avatarColor" in user ? user.avatarColor : user.avatar_color }}
      title={user.name}
    >
      {user.name[0]}
    </div>
  );
}

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [tab, setTab] = useState<"tasks" | "board" | "calendar">("tasks");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [me, setMe] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Calendar
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calLoading, setCalLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [evDate, setEvDate] = useState("");
  const [evTitle, setEvTitle] = useState("");
  const [evType, setEvType] = useState<EventType>("general");
  const [evDesc, setEvDesc] = useState("");
  const [evAllDay, setEvAllDay] = useState(true);
  const [evStart, setEvStart] = useState("");
  const [evEnd, setEvEnd] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);

  // Event edit
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editType, setEditType] = useState<EventType>("general");
  const [editDesc, setEditDesc] = useState("");
  const [editAllDay, setEditAllDay] = useState(true);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("medium");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [savingTask, setSavingTask] = useState(false);

  // Post form
  const [showPostForm, setShowPostForm] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [savingPost, setSavingPost] = useState(false);

  useEffect(() => {
    setMe(getCurrentUser());
    fetchAll();
  }, []);

  useEffect(() => {
    if (tab === "calendar") fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, calYear, calMonth]);

  async function fetchAll() {
    setLoading(true);
    const [t, b] = await Promise.all([
      fetch("/api/team/tasks").then((r) => r.json()),
      fetch("/api/team/board").then((r) => r.json()),
    ]);
    setTasks(t.tasks ?? []);
    setPosts(b.posts ?? []);
    setLoading(false);
  }

  async function fetchEvents() {
    setCalLoading(true);
    const res = await fetch(`/api/team/calendar?year=${calYear}&month=${calMonth}`);
    const data = await res.json();
    setEvents(data.events ?? []);
    setCalLoading(false);
  }

  // ── Task CRUD ──────────────────────────────────────────────────────────────

  async function createTask() {
    if (!taskTitle.trim() || !me) return;
    setSavingTask(true);
    const res = await fetch("/api/team/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: taskTitle, description: taskDesc || null, priority: taskPriority, assignee_id: taskAssignee || null, creator_id: me.id, due_date: taskDue || null }),
    });
    const data = await res.json();
    if (data.task) setTasks((prev) => [data.task, ...prev]);
    setTaskTitle(""); setTaskDesc(""); setTaskPriority("medium"); setTaskAssignee(""); setTaskDue("");
    setShowTaskForm(false);
    setSavingTask(false);
  }

  async function updateTaskStatus(id: string, status: TaskStatus) {
    const res = await fetch(`/api/team/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.task) setTasks((prev) => prev.map((t) => (t.id === id ? data.task : t)));
  }

  async function deleteTask(id: string) {
    await fetch(`/api/team/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  // ── Board CRUD ─────────────────────────────────────────────────────────────

  async function createPost() {
    if (!postTitle.trim() || !postContent.trim() || !me) return;
    setSavingPost(true);
    const res = await fetch("/api/team/board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: postTitle, content: postContent, author_id: me.id }),
    });
    const data = await res.json();
    if (data.post) setPosts((prev) => [data.post, ...prev]);
    setPostTitle(""); setPostContent("");
    setShowPostForm(false);
    setSavingPost(false);
  }

  async function togglePin(id: string, pinned: boolean) {
    const res = await fetch(`/api/team/board/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !pinned }),
    });
    const data = await res.json();
    if (data.post) setPosts((prev) => prev.map((p) => (p.id === id ? data.post : p)));
  }

  async function deletePost(id: string) {
    await fetch(`/api/team/board/${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  async function react(postId: string, emoji: string) {
    if (!me) return;
    await fetch("/api/team/board/react", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, user_id: me.id, emoji }),
    });
    const res = await fetch("/api/team/board").then((r) => r.json());
    setPosts(res.posts ?? []);
  }

  // ── Calendar CRUD ──────────────────────────────────────────────────────────

  function prevMonth() {
    if (calMonth === 1) { setCalYear((y) => y - 1); setCalMonth(12); }
    else setCalMonth((m) => m - 1);
  }

  function nextMonth() {
    if (calMonth === 12) { setCalYear((y) => y + 1); setCalMonth(1); }
    else setCalMonth((m) => m + 1);
  }

  function goToday() {
    const n = new Date();
    setCalYear(n.getFullYear());
    setCalMonth(n.getMonth() + 1);
  }

  function openAddEvent(date?: string) {
    setEvDate(date ?? "");
    setEvTitle(""); setEvType("general"); setEvDesc(""); setEvAllDay(true); setEvStart(""); setEvEnd("");
    setShowEventForm(true);
  }

  async function createEvent() {
    if (!evTitle.trim() || !evDate) return;
    setSavingEvent(true);
    const res = await fetch("/api/team/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: evTitle, event_date: evDate, event_type: evType,
        description: evDesc || null, all_day: evAllDay,
        start_time: evAllDay ? null : (evStart || null),
        end_time: evAllDay ? null : (evEnd || null),
        created_by: me?.id ?? null,
      }),
    });
    const data = await res.json();
    if (data.event) {
      const [ey, em] = data.event.event_date.split("-").map(Number);
      if (ey === calYear && em === calMonth) {
        setEvents((prev) =>
          [...prev, data.event].sort((a, b) => a.event_date.localeCompare(b.event_date))
        );
      }
    }
    setShowEventForm(false);
    setSavingEvent(false);
  }

  async function deleteEvent(id: string) {
    await fetch(`/api/team/calendar/${id}`, { method: "DELETE" });
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      // close day modal if no events remain on that day
      if (selectedDay) {
        const stillHas = next.some((e) => e.event_date === selectedDay);
        if (!stillHas) setSelectedDay(null);
      }
      return next;
    });
  }

  function openEdit(ev: CalendarEvent) {
    setEditingEvent(ev);
    setEditTitle(ev.title);
    setEditDate(ev.event_date);
    setEditType(ev.event_type);
    setEditDesc(ev.description ?? "");
    setEditAllDay(ev.all_day);
    setEditStart(ev.start_time ?? "");
    setEditEnd(ev.end_time ?? "");
    setSavingEdit(false);
  }

  async function updateEvent() {
    if (!editingEvent || !editTitle.trim() || !editDate) return;
    setSavingEdit(true);
    const res = await fetch(`/api/team/calendar/${editingEvent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle.trim(),
        event_date: editDate,
        event_type: editType,
        description: editDesc.trim() || null,
        all_day: editAllDay,
        start_time: !editAllDay && editStart ? editStart : null,
        end_time: !editAllDay && editEnd ? editEnd : null,
      }),
    });
    const data = await res.json();
    if (data.event) {
      setEvents((prev) => prev.map((e) => e.id === editingEvent.id ? data.event : e));
    }
    setSavingEdit(false);
    setEditingEvent(null);
  }

  // Derived
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  for (const e of events) {
    if (!eventsByDate[e.event_date]) eventsByDate[e.event_date] = [];
    eventsByDate[e.event_date].push(e);
  }
  const selectedDayEvents = selectedDay ? (eventsByDate[selectedDay] ?? []) : [];
  const todayKey = toDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team</h1>
          <p className="text-slate-500 text-sm mt-1">
            {me ? (
              <span className="flex items-center gap-2">
                Signed in as <Avatar user={me} size={5} />
                <span className="font-semibold text-slate-700">{me.name}</span>
              </span>
            ) : "Select your identity to post"}
          </p>
        </div>
        <div className="flex gap-2">
          {tab === "tasks" && (
            <button onClick={() => setShowTaskForm(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              <Plus size={14} /> New Task
            </button>
          )}
          {tab === "board" && (
            <button onClick={() => setShowPostForm(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              <Plus size={14} /> Post Update
            </button>
          )}
          {tab === "calendar" && (
            <button onClick={() => openAddEvent()} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              <Plus size={14} /> Add Event
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-7">
        {(["tasks", "board", "calendar"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 sm:px-5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "tasks"
              ? `Tasks (${tasks.length})`
              : t === "board"
              ? `Board (${posts.length})`
              : "Calendar"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading && tab !== "calendar" ? (
        <div className="text-slate-400 text-sm py-20 text-center">Loading…</div>
      ) : tab === "tasks" ? (
        <TasksView tasks={tasks} onStatusChange={updateTaskStatus} onDelete={deleteTask} me={me} />
      ) : tab === "board" ? (
        <BoardView posts={posts} onPin={togglePin} onDelete={deletePost} onReact={react} me={me} />
      ) : (
        <CalendarView
          year={calYear}
          month={calMonth}
          loading={calLoading}
          eventsByDate={eventsByDate}
          onPrev={prevMonth}
          onNext={nextMonth}
          onToday={goToday}
          onDayClick={(key) => setSelectedDay(key)}
          today={todayKey}
        />
      )}

      {/* ── Task form modal ── */}
      {showTaskForm && (
        <Modal title="New Task" onClose={() => setShowTaskForm(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Title *</label>
              <input autoFocus value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="What needs to be done?" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Description</label>
              <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={2} placeholder="Optional details…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Priority</label>
                <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as Priority)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none">
                  {(["low","medium","high","urgent"] as Priority[]).map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Assign to</label>
                <select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none">
                  <option value="">Unassigned</option>
                  {KNOWN_USERS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Due Date</label>
              <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none" />
            </div>
            <button onClick={createTask} disabled={!taskTitle.trim() || savingTask} className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
              {savingTask ? "Creating…" : "Create Task"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Post form modal ── */}
      {showPostForm && (
        <Modal title="Post Update" onClose={() => setShowPostForm(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Title *</label>
              <input autoFocus value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="Update title" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Content *</label>
              <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} rows={4} placeholder="Share an update, note, or announcement…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none" />
            </div>
            <button onClick={createPost} disabled={!postTitle.trim() || !postContent.trim() || savingPost} className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
              {savingPost ? "Posting…" : "Post Update"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Event form modal ── */}
      {showEventForm && (
        <Modal title="Add Event" onClose={() => setShowEventForm(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Title *</label>
              <input autoFocus value={evTitle} onChange={(e) => setEvTitle(e.target.value)} placeholder="Event title" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Date *</label>
                <input type="date" value={evDate} onChange={(e) => setEvDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Type *</label>
                <select value={evType} onChange={(e) => setEvType(e.target.value as EventType)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none">
                  {(Object.keys(EVENT_META) as EventType[]).map((k) => (
                    <option key={k} value={k}>{EVENT_META[k].label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Description</label>
              <textarea value={evDesc} onChange={(e) => setEvDesc(e.target.value)} rows={2} placeholder="Optional notes…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={evAllDay} onChange={(e) => setEvAllDay(e.target.checked)} className="rounded" />
              <span className="text-sm text-slate-600">All day</span>
            </label>
            {!evAllDay && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Start</label>
                  <input type="time" value={evStart} onChange={(e) => setEvStart(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">End</label>
                  <input type="time" value={evEnd} onChange={(e) => setEvEnd(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none" />
                </div>
              </div>
            )}
            <button onClick={createEvent} disabled={!evTitle.trim() || !evDate || savingEvent} className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
              {savingEvent ? "Adding…" : "Add Event"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Day detail modal ── */}
      {selectedDay && (
        <Modal
          title={new Date(selectedDay + "T12:00:00").toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}
          onClose={() => setSelectedDay(null)}
        >
          <div className="space-y-2.5">
            {selectedDayEvents.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No events on this day.</p>
            ) : (
              selectedDayEvents.map((ev) => (
                <div key={ev.id} className={`flex items-start justify-between gap-3 p-3 rounded-lg border ${EVENT_META[ev.event_type].chip}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {ev.event_type === "milestone" && <Star size={12} className="text-orange-500 flex-shrink-0" />}
                      <span className="font-semibold text-sm truncate">{ev.title}</span>
                    </div>
                    <span className="text-[11px] opacity-60">{EVENT_META[ev.event_type].label}</span>
                    {ev.description && <p className="text-xs mt-1 opacity-70 leading-relaxed">{ev.description}</p>}
                    {!ev.all_day && ev.start_time && (
                      <p className="text-xs opacity-60 mt-0.5">{ev.start_time}{ev.end_time ? ` – ${ev.end_time}` : ""}</p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setSelectedDay(null); openEdit(ev); }}
                      className="p-1 rounded hover:bg-black/10 transition-colors text-current opacity-60 hover:opacity-100"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => deleteEvent(ev.id)}
                      className="p-1 rounded hover:bg-black/10 transition-colors text-current opacity-60 hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
            <button
              onClick={() => { setSelectedDay(null); openAddEvent(selectedDay); }}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-lg py-2.5 text-sm text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors mt-1"
            >
              <Plus size={14} /> Add Event on This Day
            </button>
          </div>
        </Modal>
      )}

      {/* ── Event edit modal ── */}
      {editingEvent && (
        <Modal title="Edit Event" onClose={() => setEditingEvent(null)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Title *</label>
              <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Date *</label>
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Type *</label>
                <select value={editType} onChange={(e) => setEditType(e.target.value as EventType)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none">
                  {(Object.keys(EVENT_META) as EventType[]).map((k) => (
                    <option key={k} value={k}>{EVENT_META[k].label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Description</label>
              <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} placeholder="Optional notes…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={editAllDay} onChange={(e) => setEditAllDay(e.target.checked)} className="rounded" />
              <span className="text-sm text-slate-600">All day</span>
            </label>
            {!editAllDay && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Start</label>
                  <input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">End</label>
                  <input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none" />
                </div>
              </div>
            )}
            <button onClick={updateEvent} disabled={!editTitle.trim() || !editDate || savingEdit} className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
              {savingEdit ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Calendar view ─────────────────────────────────────────────────────────────

function CalendarView({ year, month, loading, eventsByDate, onPrev, onNext, onToday, onDayClick, today }: {
  year: number;
  month: number;
  loading: boolean;
  eventsByDate: Record<string, CalendarEvent[]>;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onDayClick: (key: string) => void;
  today: string;
}) {
  const cells = buildCalendarGrid(year, month);

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-lg font-bold text-slate-900 w-48 text-center">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
        <button onClick={onToday} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
          Today
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(Object.keys(EVENT_META) as EventType[]).map((k) => (
          <span key={k} className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${EVENT_META[k].chip}`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${EVENT_META[k].dot}`} />
            {EVENT_META[k].label}
          </span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-bold text-slate-400 uppercase py-1.5">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200">
            {cells.map((day, i) => {
              const key = day ? toDateKey(year, month, day) : null;
              const dayEvents = key ? (eventsByDate[key] ?? []) : [];
              const isToday = key === today;

              return (
                <div
                  key={i}
                  onClick={() => day && key && onDayClick(key)}
                  className={`bg-white min-h-[88px] p-1.5 ${day ? "cursor-pointer hover:bg-slate-50 transition-colors" : "bg-slate-50/50"}`}
                >
                  {day && (
                    <>
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1 ${
                        isToday ? "bg-amber-500 text-white" : "text-slate-700 hover:bg-slate-100"
                      }`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id}
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border truncate flex items-center gap-0.5 ${EVENT_META[ev.event_type].chip}`}
                          >
                            {ev.event_type === "milestone" && <Star size={8} className="flex-shrink-0" />}
                            <span className="truncate">{ev.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] text-slate-400 pl-1 font-medium">+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center pt-4 text-slate-400 text-sm">Loading events…</div>
      )}
    </div>
  );
}

// ── Tasks view ────────────────────────────────────────────────────────────────

function TasksView({ tasks, onStatusChange, onDelete, me }: {
  tasks: Task[];
  onStatusChange: (id: string, s: TaskStatus) => void;
  onDelete: (id: string) => void;
  me: AppUser | null;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <CheckCircle2 size={26} className="text-slate-300" />
        </div>
        <p className="text-slate-700 font-semibold text-sm">No tasks yet</p>
        <p className="text-slate-400 text-xs mt-1">Hit "+ New Task" to create the first one.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-5">
      {STATUS_COLS.map(({ key, label, bg, dot }) => {
        const col = tasks.filter((t) => t.status === key);
        return (
          <div key={key} className={`${bg} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${dot}`} />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</span>
              <span className="ml-auto text-xs text-slate-400 font-semibold">{col.length}</span>
            </div>
            <div className="space-y-2.5">
              {col.map((task) => (
                <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} onDelete={onDelete} me={me} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskCard({ task, onStatusChange, onDelete }: {
  task: Task;
  onStatusChange: (id: string, s: TaskStatus) => void;
  onDelete: (id: string) => void;
  me: AppUser | null;
}) {
  const p = PRIORITY_META[task.priority];
  const nextStatus: Record<TaskStatus, TaskStatus> = { todo: "in_progress", in_progress: "done", done: "todo" };
  return (
    <div className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start gap-2 mb-2">
        <button onClick={() => onStatusChange(task.id, nextStatus[task.status])} className="mt-0.5 flex-shrink-0 text-slate-300 hover:text-amber-500 transition-colors" title="Advance status">
          {task.status === "done" ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} />}
        </button>
        <p className={`text-sm font-semibold flex-1 leading-snug ${task.status === "done" ? "line-through text-slate-400" : "text-slate-800"}`}>{task.title}</p>
        <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all flex-shrink-0"><Trash2 size={12} /></button>
      </div>
      {task.description && <p className="text-xs text-slate-400 ml-6 mb-2 leading-relaxed line-clamp-3">{task.description}</p>}
      <div className="flex items-center gap-2 ml-6">
        <span className={`flex items-center gap-1 text-[11px] font-semibold ${p.color}`}>{p.icon} {p.label}</span>
        {task.due_date && <span className="text-[11px] text-slate-400 ml-auto">due {new Date(task.due_date).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>}
        {task.assignee && <Avatar user={task.assignee} size={5} />}
      </div>
    </div>
  );
}

// ── Board view ────────────────────────────────────────────────────────────────

function BoardView({ posts, onPin, onDelete, onReact, me }: {
  posts: Post[];
  onPin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
  onReact: (postId: string, emoji: string) => void;
  me: AppUser | null;
}) {
  if (posts.length === 0) {
    return <div className="text-center py-20 text-slate-400 text-sm">No posts yet. Be the first to post an update.</div>;
  }
  return (
    <div className="space-y-4 max-w-2xl">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onPin={onPin} onDelete={onDelete} onReact={onReact} me={me} />
      ))}
    </div>
  );
}

function PostCard({ post, onPin, onDelete, onReact, me }: {
  post: Post;
  onPin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
  onReact: (postId: string, emoji: string) => void;
  me: AppUser | null;
}) {
  const [showEmojis, setShowEmojis] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  const grouped: Record<string, { count: number; mine: boolean }> = {};
  for (const r of post.reactions ?? []) {
    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, mine: false };
    grouped[r.emoji].count++;
    if (me && r.user_id === me.id) grouped[r.emoji].mine = true;
  }

  async function loadComments() {
    if (loadingComments) return;
    setLoadingComments(true);
    const res = await fetch(`/api/team/board/${post.id}/comments`).then((r) => r.json());
    setComments(res.comments ?? []);
    setLoadingComments(false);
  }

  function toggleComments() {
    if (!showComments && comments.length === 0) loadComments();
    setShowComments((v) => !v);
  }

  async function submitComment() {
    if (!commentText.trim() || !me) return;
    setPostingComment(true);
    const res = await fetch(`/api/team/board/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText, author_id: me.id }),
    }).then((r) => r.json());
    if (res.comment) await loadComments();
    setCommentText("");
    setPostingComment(false);
  }

  async function deleteComment(commentId: string) {
    await fetch(`/api/team/board/${post.id}/comments/${commentId}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  return (
    <div className={`bg-white rounded-xl border ${post.pinned ? "border-amber-200 shadow-amber-50" : "border-slate-200"} shadow-sm p-5 group`}>
      {post.pinned && <div className="flex items-center gap-1.5 text-amber-600 text-[11px] font-bold mb-2"><Pin size={11} /> Pinned</div>}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <Avatar user={post.author} size={8} />
          <div>
            <div className="font-bold text-slate-900 text-sm">{post.title}</div>
            <div className="text-[11px] text-slate-400">{post.author?.name ?? "Unknown"} · {timeAgo(post.created_at)}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onPin(post.id, post.pinned)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-amber-500" title={post.pinned ? "Unpin" : "Pin"}><Pin size={13} /></button>
          <button onClick={() => onDelete(post.id)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-400"><Trash2 size={13} /></button>
        </div>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {/* Reactions + Comment toggle */}
      <div className="flex items-center gap-1.5 mt-4 flex-wrap">
        {Object.entries(grouped).map(([emoji, { count, mine }]) => (
          <button key={emoji} onClick={() => onReact(post.id, emoji)} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${mine ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"}`}>
            {emoji} <span className="font-semibold">{count}</span>
          </button>
        ))}
        <div className="relative">
          <button onClick={() => setShowEmojis(!showEmojis)} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-colors">
            <Smile size={12} />
          </button>
          {showEmojis && (
            <div className="absolute bottom-full left-0 mb-1 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex gap-1 z-10">
              {QUICK_EMOJIS.map((e) => (
                <button key={e} onClick={() => { onReact(post.id, e); setShowEmojis(false); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-base transition-colors">{e}</button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={toggleComments}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${showComments ? "bg-slate-100 border-slate-300 text-slate-700" : "border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"}`}
        >
          <MessageCircle size={12} />
          {comments.length > 0 && <span className="font-semibold">{comments.length}</span>}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
          {loadingComments && <div className="text-xs text-slate-400">Loading…</div>}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5 group/comment">
              <Avatar user={c.author} size={6} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold text-slate-800">{c.author?.name ?? "Unknown"}</span>
                  <span className="text-[10px] text-slate-400">{timeAgo(c.created_at)}</span>
                  {me && c.author?.id === me.id && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="ml-auto opacity-0 group-hover/comment:opacity-100 transition-opacity text-slate-300 hover:text-red-400 p-0.5"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && !loadingComments && (
            <div className="text-xs text-slate-400">No comments yet.</div>
          )}
          {/* Comment input */}
          {me ? (
            <div className="flex gap-2 items-end pt-1">
              <Avatar user={me} size={6} />
              <div className="flex-1 flex gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submitComment(); } }}
                  rows={1}
                  placeholder="Write a comment…"
                  className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none"
                />
                <button
                  onClick={submitComment}
                  disabled={!commentText.trim() || postingComment}
                  className="p-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-lg transition-colors"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400">Select your identity to comment.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared modal ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
