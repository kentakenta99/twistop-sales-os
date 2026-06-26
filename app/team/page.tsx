"use client";

import { useState, useEffect } from "react";
import { Plus, Pin, Trash2, CheckCircle2, Circle, Clock, AlertCircle, ChevronDown, X, Smile } from "lucide-react";
import { getCurrentUser, KNOWN_USERS, type AppUser } from "@/lib/currentUser";

// ── Types ─────────────────────────────────────────────────────────────────────

type Priority = "low" | "medium" | "high" | "urgent";
type TaskStatus = "todo" | "in_progress" | "done";

type User = { id: string; name: string; avatar_color: string };

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  assignee: User | null;
  creator: User | null;
  due_date: string | null;
  created_at: string;
};

type Reaction = { id: string; emoji: string; user_id: string };

type Post = {
  id: string;
  title: string;
  content: string;
  author: User | null;
  pinned: boolean;
  reactions: Reaction[];
  created_at: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const PRIORITY_META: Record<Priority, { label: string; color: string; icon: React.ReactNode }> = {
  low:    { label: "Low",    color: "text-slate-400",  icon: <Circle size={13} /> },
  medium: { label: "Medium", color: "text-blue-500",   icon: <Clock size={13} /> },
  high:   { label: "High",   color: "text-orange-500", icon: <AlertCircle size={13} /> },
  urgent: { label: "Urgent", color: "text-red-500",    icon: <AlertCircle size={13} /> },
};

const STATUS_COLS: { key: TaskStatus; label: string; bg: string; dot: string }[] = [
  { key: "todo",        label: "To Do",       bg: "bg-slate-50",   dot: "bg-slate-300" },
  { key: "in_progress", label: "In Progress", bg: "bg-blue-50",    dot: "bg-blue-400" },
  { key: "done",        label: "Done",        bg: "bg-green-50",   dot: "bg-green-500" },
];

const QUICK_EMOJIS = ["👍", "🔥", "✅", "🎉", "💡", "❓"];

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

// ── Main component ─────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [tab, setTab] = useState<"tasks" | "board">("tasks");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [me, setMe] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

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

  async function createTask() {
    if (!taskTitle.trim() || !me) return;
    setSavingTask(true);
    const res = await fetch("/api/team/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: taskTitle,
        description: taskDesc || null,
        priority: taskPriority,
        assignee_id: taskAssignee || null,
        creator_id: me.id,
        due_date: taskDue || null,
      }),
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team</h1>
          <p className="text-slate-500 text-sm mt-1">
            {me ? (
              <span className="flex items-center gap-2">
                Signed in as <Avatar user={me} size={5} /> <span className="font-semibold text-slate-700">{me.name}</span>
              </span>
            ) : "Select your identity to post"}
          </p>
        </div>
        <div className="flex gap-2">
          {tab === "tasks" && (
            <button
              onClick={() => setShowTaskForm(true)}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={14} /> New Task
            </button>
          )}
          {tab === "board" && (
            <button
              onClick={() => setShowPostForm(true)}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={14} /> Post Update
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-7">
        {(["tasks", "board"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "tasks" ? `Tasks (${tasks.length})` : `Board (${posts.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm py-20 text-center">Loading…</div>
      ) : tab === "tasks" ? (
        <TasksView
          tasks={tasks}
          onStatusChange={updateTaskStatus}
          onDelete={deleteTask}
          me={me}
        />
      ) : (
        <BoardView
          posts={posts}
          onPin={togglePin}
          onDelete={deletePost}
          onReact={react}
          me={me}
        />
      )}

      {/* Task form modal */}
      {showTaskForm && (
        <Modal title="New Task" onClose={() => setShowTaskForm(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Title *</label>
              <input
                autoFocus
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Description</label>
              <textarea
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                rows={2}
                placeholder="Optional details…"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as Priority)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                >
                  {(["low","medium","high","urgent"] as Priority[]).map((p) => (
                    <option key={p} value={p}>{PRIORITY_META[p].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Assign to</label>
                <select
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {KNOWN_USERS.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Due Date</label>
              <input
                type="date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
            <button
              onClick={createTask}
              disabled={!taskTitle.trim() || savingTask}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {savingTask ? "Creating…" : "Create Task"}
            </button>
          </div>
        </Modal>
      )}

      {/* Post form modal */}
      {showPostForm && (
        <Modal title="Post Update" onClose={() => setShowPostForm(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Title *</label>
              <input
                autoFocus
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Update title"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Content *</label>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={4}
                placeholder="Share an update, note, or announcement…"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none"
              />
            </div>
            <button
              onClick={createPost}
              disabled={!postTitle.trim() || !postContent.trim() || savingPost}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {savingPost ? "Posting…" : "Post Update"}
            </button>
          </div>
        </Modal>
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
      <div className="text-center py-20 text-slate-400 text-sm">
        No tasks yet. Create one to get started.
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

function TaskCard({ task, onStatusChange, onDelete, me }: {
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
        <button
          onClick={() => onStatusChange(task.id, nextStatus[task.status])}
          className="mt-0.5 flex-shrink-0 text-slate-300 hover:text-amber-500 transition-colors"
          title="Advance status"
        >
          {task.status === "done" ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} />}
        </button>
        <p className={`text-sm font-semibold flex-1 leading-snug ${task.status === "done" ? "line-through text-slate-400" : "text-slate-800"}`}>
          {task.title}
        </p>
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all flex-shrink-0"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-slate-400 ml-6 mb-2 leading-relaxed">{task.description}</p>
      )}

      <div className="flex items-center gap-2 ml-6">
        <span className={`flex items-center gap-1 text-[11px] font-semibold ${p.color}`}>
          {p.icon} {p.label}
        </span>
        {task.due_date && (
          <span className="text-[11px] text-slate-400 ml-auto">
            due {new Date(task.due_date).toLocaleDateString("en", { month: "short", day: "numeric" })}
          </span>
        )}
        {task.assignee && (
          <Avatar user={task.assignee} size={5} />
        )}
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

  // Group reactions
  const grouped: Record<string, { count: number; mine: boolean }> = {};
  for (const r of post.reactions ?? []) {
    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, mine: false };
    grouped[r.emoji].count++;
    if (me && r.user_id === me.id) grouped[r.emoji].mine = true;
  }

  return (
    <div className={`bg-white rounded-xl border ${post.pinned ? "border-amber-200 shadow-amber-50" : "border-slate-200"} shadow-sm p-5 group`}>
      {post.pinned && (
        <div className="flex items-center gap-1.5 text-amber-600 text-[11px] font-bold mb-2">
          <Pin size={11} /> Pinned
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <Avatar user={post.author} size={8} />
          <div>
            <div className="font-bold text-slate-900 text-sm">{post.title}</div>
            <div className="text-[11px] text-slate-400">
              {post.author?.name ?? "Unknown"} · {timeAgo(post.created_at)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onPin(post.id, post.pinned)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-amber-500" title={post.pinned ? "Unpin" : "Pin"}>
            <Pin size={13} />
          </button>
          <button onClick={() => onDelete(post.id)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-400">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {/* Reactions */}
      <div className="flex items-center gap-1.5 mt-4 flex-wrap">
        {Object.entries(grouped).map(([emoji, { count, mine }]) => (
          <button
            key={emoji}
            onClick={() => onReact(post.id, emoji)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
              mine ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {emoji} <span className="font-semibold">{count}</span>
          </button>
        ))}
        <div className="relative">
          <button
            onClick={() => setShowEmojis(!showEmojis)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-colors"
          >
            <Smile size={12} />
          </button>
          {showEmojis && (
            <div className="absolute bottom-full left-0 mb-1 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex gap-1 z-10">
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => { onReact(post.id, e); setShowEmojis(false); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-base transition-colors"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared modal ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
