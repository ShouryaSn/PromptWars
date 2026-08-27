"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const supabase = createClient();
  const pathname = usePathname();
  const isDeveloperView = pathname?.startsWith("/developer") ?? false;

  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const fullName = data.user?.user_metadata?.full_name as string | undefined;
      setDisplayName(fullName ?? data.user?.email?.split("@")[0] ?? "");
    });
  }, [supabase]);

  useEffect(() => {
    if (open) setEditingName(false);
  }, [open]);

  async function saveDisplayName() {
    const trimmed = nameDraft.trim();
    if (trimmed.length < 2) return;
    setSavingName(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSavingName(false);
      return;
    }

    // Two writes: profiles.full_name is what other users see about this
    // person (e.g. the name shown to a developer in their Request Inbox);
    // the auth user_metadata is what every "Welcome, X" banner in this app
    // actually reads for the signed-in user's own view. Both need updating
    // or one of the two surfaces goes stale.
    const [{ error: profileError }, { error: authError }] = await Promise.all([
      supabase.from("profiles").update({ full_name: trimmed }).eq("id", user.id),
      supabase.auth.updateUser({ data: { full_name: trimmed } }),
    ]);
    setSavingName(false);
    if (!profileError && !authError) {
      setDisplayName(trimmed);
      setEditingName(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col border-l border-border bg-surface shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <p className="truncate text-sm font-semibold text-ink">{displayName || "Menu"}</p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="focus-ring rounded-lg p-1.5 text-muted transition-colors hover:bg-background hover:text-ink"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
              {isDeveloperView ? (
                <>
                  <SidebarLink href="/developer/dashboard" onNavigate={onClose}>
                    Profile Stats
                  </SidebarLink>
                  <SidebarLink href="/developer/edit" onNavigate={onClose}>
                    Edit profile
                  </SidebarLink>
                  <SidebarLink href="/developer/inbox" onNavigate={onClose}>
                    Request Inbox
                  </SidebarLink>
                  <div className="my-2 border-t border-border" />
                  <SidebarLink href="/match" onNavigate={onClose}>
                    Switch to Client
                  </SidebarLink>
                </>
              ) : (
                <>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setNameDraft(displayName);
                        setEditingName((v) => !v);
                      }}
                      className="focus-ring flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-background"
                    >
                      Edit Display Name
                    </button>
                    {editingName && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden px-3 pb-2"
                      >
                        <input
                          value={nameDraft}
                          onChange={(e) => setNameDraft(e.target.value)}
                          className="focus-ring w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-ink"
                          placeholder="Your name"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            disabled={savingName || nameDraft.trim().length < 2}
                            onClick={saveDisplayName}
                            className="focus-ring flex-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {savingName ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingName(false)}
                            className="focus-ring rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <SidebarLink href="/requests/outbox" onNavigate={onClose}>
                    Request Outbox
                  </SidebarLink>
                  <div className="my-2 border-t border-border" />
                  <SidebarLink href="/developer/profile" onNavigate={onClose}>
                    Switch to Developer
                  </SidebarLink>
                </>
              )}
            </nav>

            <div className="border-t border-border p-3">
              <button
                type="button"
                onClick={handleLogout}
                className="focus-ring flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted transition-colors hover:bg-background hover:text-ink"
              >
                Log out
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function SidebarLink({
  href,
  onNavigate,
  children,
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="focus-ring rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-background"
    >
      {children}
    </Link>
  );
}
