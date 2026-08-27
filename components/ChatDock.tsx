"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  CHAT_MAX_MEMBERS,
  isChatExpired,
  type ChatMemberRow,
  type ChatMessageRow,
  type ChatProjectRow,
  type ChatRow,
} from "@/lib/chat";

export default function ChatDock() {
  const supabase = createClient();
  const pathname = usePathname();
  const isDeveloperView = pathname?.startsWith("/developer") ?? false;

  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [projects, setProjects] = useState<ChatProjectRow[]>([]);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [projectNames, setProjectNames] = useState<Map<string, string>>(new Map());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const [addingProject, setAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [savingProject, setSavingProject] = useState(false);

  const [addingChatFor, setAddingChatFor] = useState<string | null>(null);
  const [newChatName, setNewChatName] = useState("");
  const [savingChat, setSavingChat] = useState(false);

  const [advisoryChatName, setAdvisoryChatName] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [supabase]);

  useEffect(() => {
    if (!open || !userId || loaded) return;
    if (isDeveloperView) void loadDeveloperChats();
    else void loadAll();
  }, [open, userId, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    const [{ data: projectRows }, { data: chatRows }] = await Promise.all([
      supabase.from("chat_projects").select("*").order("created_at", { ascending: false }),
      supabase.from("chats").select("*").order("created_at", { ascending: false }),
    ]);
    setProjects((projectRows as ChatProjectRow[]) ?? []);
    setChats((chatRows as ChatRow[]) ?? []);
    setLoaded(true);
  }

  async function loadDeveloperChats() {
    if (!userId) return;
    const { data: memberRows } = await supabase.from("chat_members").select("chat_id").eq("user_id", userId);
    const chatIds = Array.from(new Set(((memberRows as { chat_id: string }[]) ?? []).map((r) => r.chat_id)));

    if (chatIds.length === 0) {
      setChats([]);
      setProjectNames(new Map());
      setLoaded(true);
      return;
    }

    const { data: chatRows } = await supabase
      .from("chats")
      .select("*")
      .in("id", chatIds)
      .order("created_at", { ascending: false });
    const rows = (chatRows as ChatRow[]) ?? [];

    const projectIds = Array.from(new Set(rows.map((c) => c.project_id)));
    const names = new Map<string, string>();
    if (projectIds.length > 0) {
      const { data: projectRows } = await supabase.from("chat_projects").select("id, name").in("id", projectIds);
      for (const p of (projectRows as { id: string; name: string }[]) ?? []) names.set(p.id, p.name);
    }

    setChats(rows);
    setProjectNames(names);
    setExpanded(new Set(projectIds));
    setLoaded(true);
  }

  function toggleExpanded(projectId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  async function createProject() {
    const name = newProjectName.trim();
    if (!userId || name.length < 1) return;
    setSavingProject(true);
    const { data, error } = await supabase
      .from("chat_projects")
      .insert({ seeker_id: userId, name })
      .select("*")
      .single();
    setSavingProject(false);
    if (error || !data) return;
    setProjects((prev) => [data as ChatProjectRow, ...prev]);
    setExpanded((prev) => new Set(prev).add((data as ChatProjectRow).id));
    setNewProjectName("");
    setAddingProject(false);
  }

  async function createChat(projectId: string) {
    const name = newChatName.trim();
    if (!userId || name.length < 1) return;
    setSavingChat(true);

    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .insert({ project_id: projectId, client_id: userId, name })
      .select("*")
      .single();

    if (chatError || !chat) {
      setSavingChat(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("chat_members")
      .insert({ chat_id: (chat as ChatRow).id, user_id: userId, role: "client" });

    setSavingChat(false);
    if (memberError) return;

    setChats((prev) => [chat as ChatRow, ...prev]);
    setNewChatName("");
    setAddingChatFor(null);
    setExpanded((prev) => new Set(prev).add(projectId));
    setAdvisoryChatName((chat as ChatRow).name);
  }

  if (!userId) return null;

  return (
    <>
      <div className="fixed bottom-5 left-5 z-40 flex flex-col items-start">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-ink">Chats</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close chats"
                  className="focus-ring rounded-lg p-1 text-muted transition-colors hover:bg-background hover:text-ink"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {selectedChatId ? (
                  <ChatDetailPanel
                    chat={chats.find((c) => c.id === selectedChatId) ?? null}
                    userId={userId}
                    onBack={() => setSelectedChatId(null)}
                    onDeleted={() => {
                      setChats((prev) => prev.filter((c) => c.id !== selectedChatId));
                      setSelectedChatId(null);
                    }}
                  />
                ) : isDeveloperView ? (
                  <DeveloperChatList
                    chats={chats}
                    projectNames={projectNames}
                    expanded={expanded}
                    onToggle={toggleExpanded}
                    onSelect={setSelectedChatId}
                  />
                ) : (
                  <>
                    {projects.length === 0 && !addingProject && (
                      <p className="px-1 py-6 text-center text-xs text-muted">
                        No projects yet. Create one to start a chat with a developer.
                      </p>
                    )}

                    <ul className="flex flex-col gap-1">
                      {projects.map((project) => {
                        const projectChats = chats.filter((c) => c.project_id === project.id);
                        const isOpen = expanded.has(project.id);
                        return (
                          <li key={project.id}>
                            <div className="flex items-center gap-1 rounded-lg px-1 py-1.5 hover:bg-background">
                              <button
                                type="button"
                                onClick={() => toggleExpanded(project.id)}
                                className="focus-ring flex flex-1 items-center gap-1.5 rounded-lg px-1 py-0.5 text-left text-sm font-medium text-ink"
                              >
                                <span
                                  className={`text-muted transition-transform ${isOpen ? "rotate-90" : ""}`}
                                >
                                  ›
                                </span>
                                <span className="truncate">{project.name}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setExpanded((prev) => new Set(prev).add(project.id));
                                  setAddingChatFor(project.id);
                                  setNewChatName("");
                                }}
                                aria-label={`New chat in ${project.name}`}
                                className="focus-ring rounded-md p-1 text-muted transition-colors hover:bg-surface hover:text-accent"
                              >
                                +
                              </button>
                            </div>

                            {isOpen && (
                              <div className="ml-4 flex flex-col gap-0.5 border-l border-border pl-3">
                                {projectChats.map((chat) => (
                                  <button
                                    key={chat.id}
                                    type="button"
                                    onClick={() => setSelectedChatId(chat.id)}
                                    className="focus-ring truncate rounded-lg px-2 py-1.5 text-left text-sm text-muted transition-colors hover:bg-background hover:text-ink"
                                  >
                                    {chat.name}
                                  </button>
                                ))}

                                {addingChatFor === project.id ? (
                                  <div className="flex items-center gap-1 px-1 py-1">
                                    <input
                                      autoFocus
                                      value={newChatName}
                                      onChange={(e) => setNewChatName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") void createChat(project.id);
                                        if (e.key === "Escape") setAddingChatFor(null);
                                      }}
                                      placeholder="Chat name"
                                      className="focus-ring w-full rounded-lg border border-border bg-background px-2 py-1 text-xs text-ink"
                                    />
                                    <button
                                      type="button"
                                      disabled={savingChat || newChatName.trim().length < 1}
                                      onClick={() => void createChat(project.id)}
                                      className="focus-ring shrink-0 rounded-md bg-accent px-2 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {savingChat ? "…" : "Add"}
                                    </button>
                                  </div>
                                ) : (
                                  projectChats.length === 0 && (
                                    <p className="px-2 py-1 text-xs text-muted">No chats yet.</p>
                                  )
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {addingProject ? (
                      <div className="mt-2 flex items-center gap-1 px-1">
                        <input
                          autoFocus
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void createProject();
                            if (e.key === "Escape") setAddingProject(false);
                          }}
                          placeholder="Project name"
                          className="focus-ring w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-ink"
                        />
                        <button
                          type="button"
                          disabled={savingProject || newProjectName.trim().length < 1}
                          onClick={() => void createProject()}
                          className="focus-ring shrink-0 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingProject ? "…" : "Add"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingProject(true);
                          setNewProjectName("");
                        }}
                        className="focus-ring mt-1 flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-accent transition-colors hover:bg-background"
                      >
                        + New Project
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="focus-ring flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-lg transition-colors hover:border-accent"
        >
          <span className="h-2 w-2 rounded-full bg-accent" />
          Chats
        </button>
      </div>

      <AnimatePresence>
        {advisoryChatName && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setAdvisoryChatName(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl"
            >
              <p className="text-sm font-semibold text-ink">“{advisoryChatName}” created</p>
              <p className="mt-2 text-sm text-muted">
                This chat will only be available for <strong className="text-ink">48 hours</strong>.
                For continued communication, connect on a professional platform like LinkedIn.
              </p>
              <button
                type="button"
                onClick={() => setAdvisoryChatName(null)}
                className="focus-ring mt-4 w-full rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
              >
                Got it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function DeveloperChatList({
  chats,
  projectNames,
  expanded,
  onToggle,
  onSelect,
}: {
  chats: ChatRow[];
  projectNames: Map<string, string>;
  expanded: Set<string>;
  onToggle: (projectId: string) => void;
  onSelect: (chatId: string) => void;
}) {
  if (chats.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-xs text-muted">
        No chats yet. A client will add you here once you&apos;re invited into one.
      </p>
    );
  }

  const projectIds = Array.from(new Set(chats.map((c) => c.project_id)));

  return (
    <ul className="flex flex-col gap-1">
      {projectIds.map((projectId) => {
        const projectChats = chats.filter((c) => c.project_id === projectId);
        const isOpen = expanded.has(projectId);
        return (
          <li key={projectId}>
            <button
              type="button"
              onClick={() => onToggle(projectId)}
              className="focus-ring flex w-full items-center gap-1.5 rounded-lg px-1 py-1.5 text-left text-sm font-medium text-ink hover:bg-background"
            >
              <span className={`text-muted transition-transform ${isOpen ? "rotate-90" : ""}`}>›</span>
              <span className="truncate">{projectNames.get(projectId) ?? "Project"}</span>
            </button>
            {isOpen && (
              <div className="ml-4 flex flex-col gap-0.5 border-l border-border pl-3">
                {projectChats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => onSelect(chat.id)}
                    className="focus-ring truncate rounded-lg px-2 py-1.5 text-left text-sm text-muted transition-colors hover:bg-background hover:text-ink"
                  >
                    {chat.name}
                  </button>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

type DeveloperProfileJoin = { title: string | null; profiles: { full_name: string | null } | null };
type MemberWithProfile = ChatMemberRow & { displayName: string; title: string | null };
type Candidate = { developerId: string; name: string; title: string };

function ChatDetailPanel({
  chat,
  userId,
  onBack,
  onDeleted,
}: {
  chat: ChatRow | null;
  userId: string | null;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const supabase = createClient();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showMembers, setShowMembers] = useState(false);

  const [addingMember, setAddingMember] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);

  const [removingId, setRemovingId] = useState<string | null>(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [draftMessage, setDraftMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chat) void loadMembers(chat.id);
  }, [chat?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!chat) return;
    void loadMessages(chat.id);

    const channel = supabase
      .channel(`chat_messages:${chat.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `chat_id=eq.${chat.id}` },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === (payload.new as ChatMessageRow).id)
              ? prev
              : [...prev, payload.new as ChatMessageRow]
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [chat?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMessages(chatId: string) {
    setLoadingMessages(true);
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    setMessages((data as ChatMessageRow[]) ?? []);
    setLoadingMessages(false);
  }

  async function sendMessage() {
    const body = draftMessage.trim();
    if (!chat || !userId || body.length < 1) return;
    setSendingMessage(true);
    const { error } = await supabase
      .from("chat_messages")
      .insert({ chat_id: chat.id, sender_id: userId, body });
    setSendingMessage(false);
    if (!error) setDraftMessage("");
  }

  function senderName(senderId: string) {
    if (senderId === userId) return "You";
    return members.find((m) => m.user_id === senderId)?.displayName ?? "Former member";
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  async function loadMembers(chatId: string) {
    setLoadingMembers(true);
    const { data } = await supabase.from("chat_members").select("*").eq("chat_id", chatId);
    const rows = (data as ChatMemberRow[]) ?? [];

    const developerIds = rows.filter((r) => r.role === "developer").map((r) => r.user_id);
    const profileMap = new Map<string, DeveloperProfileJoin>();
    if (developerIds.length > 0) {
      const { data: devProfiles } = await supabase
        .from("developer_profiles")
        .select("id, title, profiles(full_name)")
        .in("id", developerIds);
      for (const dp of (devProfiles as unknown as (DeveloperProfileJoin & { id: string })[]) ?? []) {
        profileMap.set(dp.id, dp);
      }
    }

    // The client's own name isn't in developer_profiles - resolved separately so a
    // developer viewing the roster sees who the client actually is, not just "You"
    // (which only applies to the row matching the viewer's own id, below).
    const clientRow = rows.find((r) => r.role === "client");
    let clientName = "The client";
    if (clientRow && clientRow.user_id !== userId) {
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", clientRow.user_id)
        .maybeSingle();
      clientName = (clientProfile as { full_name: string | null } | null)?.full_name || "The client";
    }

    setMembers(
      rows.map((r) => ({
        ...r,
        displayName:
          r.user_id === userId
            ? "You"
            : r.role === "client"
              ? clientName
              : profileMap.get(r.user_id)?.profiles?.full_name || "A developer",
        title: r.role === "developer" ? profileMap.get(r.user_id)?.title ?? null : null,
      }))
    );
    setLoadingMembers(false);
  }

  async function openAddPicker() {
    if (!userId) return;
    setAddingMember(true);
    const { data } = await supabase
      .from("requests")
      .select("developer_id, developer_profiles(title, profiles(full_name))")
      .eq("seeker_id", userId)
      .eq("status", "accepted");

    const existingIds = new Set(members.map((m) => m.user_id));
    const seen = new Set<string>();
    const list: Candidate[] = [];
    for (const r of (data as unknown as { developer_id: string; developer_profiles: DeveloperProfileJoin | null }[]) ??
      []) {
      if (existingIds.has(r.developer_id) || seen.has(r.developer_id)) continue;
      seen.add(r.developer_id);
      list.push({
        developerId: r.developer_id,
        name: r.developer_profiles?.profiles?.full_name || "A developer",
        title: r.developer_profiles?.title || "",
      });
    }
    setCandidates(list);
  }

  async function addMember(developerId: string) {
    if (!chat) return;
    setAddingMemberId(developerId);
    const { error } = await supabase
      .from("chat_members")
      .insert({ chat_id: chat.id, user_id: developerId, role: "developer" });
    setAddingMemberId(null);
    if (!error) {
      setAddingMember(false);
      void loadMembers(chat.id);
    }
  }

  async function removeMember(memberId: string) {
    if (!chat) return;
    setRemovingId(memberId);
    await supabase.from("chat_members").delete().eq("id", memberId);
    setRemovingId(null);
    void loadMembers(chat.id);
  }

  async function deleteChat() {
    if (!chat) return;
    setDeleting(true);
    const { error } = await supabase.from("chats").delete().eq("id", chat.id);
    setDeleting(false);
    if (!error) onDeleted();
  }

  async function leaveChat() {
    if (!chat || !userId) return;
    const myRow = members.find((m) => m.user_id === userId);
    if (!myRow) return;
    setDeleting(true);
    const { error } = await supabase.from("chat_members").delete().eq("id", myRow.id);
    setDeleting(false);
    if (!error) onDeleted();
  }

  if (!chat) return null;

  const isOwner = userId === chat.client_id;
  const atCap = members.length >= CHAT_MAX_MEMBERS;
  const expired = isChatExpired(chat);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="focus-ring flex items-center gap-1 self-start rounded-lg px-1.5 py-1 text-xs font-medium text-muted transition-colors hover:text-ink"
        >
          ‹ Back
        </button>
        <button
          type="button"
          onClick={() => setShowMembers((v) => !v)}
          className="focus-ring rounded-md px-1.5 py-0.5 text-xs font-medium text-muted transition-colors hover:bg-background hover:text-ink"
        >
          {members.length}/{CHAT_MAX_MEMBERS} members {showMembers ? "▲" : "▼"}
        </button>
      </div>
      <p className="truncate px-1 text-sm font-semibold text-ink">{chat.name}</p>

      {showMembers && (
        <div className="mt-2 rounded-lg border border-border p-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Members</p>
            {isOwner && !addingMember && !atCap && (
              <button
                type="button"
                onClick={() => void openAddPicker()}
                className="focus-ring rounded-md px-1.5 py-0.5 text-xs font-semibold text-accent transition-colors hover:bg-background"
              >
                + Add
              </button>
            )}
          </div>

          {loadingMembers ? (
            <p className="mt-2 text-xs text-muted">Loading…</p>
          ) : (
            <ul className="mt-1 flex flex-col gap-1">
              {members.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 rounded-lg px-1 py-1 hover:bg-background">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{m.displayName}</p>
                    {m.title && <p className="truncate text-[11px] text-muted">{m.title}</p>}
                  </div>
                  {isOwner && m.role === "developer" && (
                    <button
                      type="button"
                      disabled={removingId === m.id}
                      onClick={() => void removeMember(m.id)}
                      aria-label={`Remove ${m.displayName}`}
                      className="focus-ring shrink-0 rounded-md px-1.5 py-0.5 text-xs text-muted transition-colors hover:bg-surface hover:text-red-600"
                    >
                      {removingId === m.id ? "…" : "Remove"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {addingMember && (
            <div className="mt-2 rounded-lg border border-border p-2">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[11px] font-medium text-muted">Accepted developers</p>
                <button
                  type="button"
                  onClick={() => setAddingMember(false)}
                  className="focus-ring rounded-md px-1 text-xs text-muted hover:text-ink"
                >
                  ✕
                </button>
              </div>
              {candidates.length === 0 ? (
                <p className="px-1 py-1 text-xs text-muted">
                  No developers available. Only developers who&apos;ve accepted a request from you can be added.
                </p>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {candidates.map((c) => (
                    <li key={c.developerId}>
                      <button
                        type="button"
                        disabled={addingMemberId === c.developerId}
                        onClick={() => void addMember(c.developerId)}
                        className="focus-ring flex w-full items-center justify-between gap-2 rounded-md px-1.5 py-1 text-left text-xs transition-colors hover:bg-background"
                      >
                        <span className="min-w-0 truncate text-ink">
                          {c.name}
                          {c.title ? ` — ${c.title}` : ""}
                        </span>
                        <span className="shrink-0 text-accent">
                          {addingMemberId === c.developerId ? "…" : "Add"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-2 border-t border-border pt-2">
            {confirmingDelete ? (
              <div className="flex items-center gap-2">
                <p className="flex-1 text-[11px] text-muted">
                  {isOwner ? "Delete this chat for everyone?" : "Leave this chat?"}
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="focus-ring rounded-md px-2 py-1 text-xs font-medium text-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void (isOwner ? deleteChat() : leaveChat())}
                  className="focus-ring rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "…" : isOwner ? "Delete" : "Leave"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="focus-ring w-full rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                {isOwner ? "Delete chat" : "Leave chat"}
              </button>
            )}
          </div>
        </div>
      )}

      {expired && (
        <p className="mt-2 rounded-lg bg-background px-2 py-1.5 text-center text-[11px] text-muted">
          This chat is locked — its 48-hour window has passed.
        </p>
      )}

      <div className="mt-2 flex-1 overflow-y-auto rounded-lg border border-border bg-background/50 p-2">
        {loadingMessages ? (
          <p className="text-xs text-muted">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted">No messages yet. Say hello.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m) => {
              const mine = m.sender_id === userId;
              return (
                <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  <span className="px-1 text-[10px] text-muted">
                    {senderName(m.sender_id)} · {formatTime(m.created_at)}
                  </span>
                  <p
                    className={`max-w-[85%] break-words rounded-2xl px-3 py-1.5 text-sm ${
                      mine ? "bg-accent text-white" : "border border-border bg-surface text-ink"
                    }`}
                  >
                    {m.body}
                  </p>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <input
          value={draftMessage}
          disabled={expired}
          onChange={(e) => setDraftMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void sendMessage();
          }}
          placeholder={expired ? "This chat is locked" : "Message…"}
          className="focus-ring w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          disabled={expired || sendingMessage || draftMessage.trim().length < 1}
          onClick={() => void sendMessage()}
          className="focus-ring shrink-0 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sendingMessage ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
