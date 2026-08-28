"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

const PAYMENT_MODES = ["PayPal", "Bank Transfer", "Other"] as const;
const PAYMENT_TIMINGS = ["After completion", "Upfront", "Task completion"] as const;
const WORK_TYPES = ["Full-time", "Part-time", "Project-based", "Freelance", "Club/Volunteer"] as const;

export default function RequestModal({
  developerId,
  developerName,
  onClose,
}: {
  developerId: string;
  developerName: string;
  onClose: () => void;
}) {
  const supabase = createClient();

  const [storedProjectName] = useState(() => sessionStorage.getItem("projectmatch:lastProjectName") ?? "");
  const [storedDescription] = useState(() => sessionStorage.getItem("projectmatch:lastDescription") ?? "");
  const hasStoredProject = storedProjectName.trim().length > 0 && storedDescription.trim().length > 0;

  const [projectName, setProjectName] = useState(storedProjectName);
  const [projectDescription, setProjectDescription] = useState(storedDescription);
  const [isPaid, setIsPaid] = useState<"" | "yes" | "no">("");
  const [paymentMode, setPaymentMode] = useState<string>("");
  const [paymentTiming, setPaymentTiming] = useState<string>("");
  const [deadline, setDeadline] = useState("");
  const todayIso = new Date().toISOString().slice(0, 10);
  const [workType, setWorkType] = useState<string>("");

  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const isValid =
    projectName.trim().length >= 2 &&
    projectDescription.trim().length >= 20 &&
    isPaid !== "" &&
    (isPaid === "no" || (paymentMode !== "" && paymentTiming !== "")) &&
    workType !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!isValid) return;

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session expired. Please log in again.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("requests").insert({
      seeker_id: user.id,
      developer_id: developerId,
      project_name: projectName.trim(),
      project_description: projectDescription.trim(),
      is_paid: isPaid === "yes",
      payment_mode: isPaid === "yes" ? paymentMode : null,
      payment_timing: isPaid === "yes" ? paymentTiming : null,
      deadline: deadline || null,
      work_type: workType,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSent(true);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl sm:p-8"
        >
          {sent ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-light text-2xl text-accent-dark">
                ✓
              </div>
              <h2 className="text-lg font-semibold text-ink">Request sent</h2>
              <p className="mt-1.5 max-w-xs text-sm text-muted">
                {developerName.split(" ")[0]} will see this in their inbox and can accept or decline it.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="focus-ring mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-ink">Send a request</h2>
                  <p className="mt-1 text-sm text-muted">To {developerName}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="focus-ring rounded-lg p-1.5 text-muted transition-colors hover:bg-background hover:text-ink"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {hasStoredProject ? (
                  <div className="rounded-lg border border-border bg-background px-4 py-3">
                    <p className="text-xs font-medium text-muted">Project</p>
                    <p className="mt-0.5 text-sm font-semibold text-ink">{projectName}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{projectDescription}</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="req-project-name" className="mb-1.5 block text-xs font-medium text-muted">
                        Project name
                      </label>
                      <input
                        id="req-project-name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="CropWatch"
                        className="focus-ring w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-accent"
                      />
                    </div>
                    <div>
                      <label htmlFor="req-project-desc" className="mb-1.5 block text-xs font-medium text-muted">
                        Project description
                      </label>
                      <textarea
                        id="req-project-desc"
                        rows={3}
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder="What are you building?"
                        className="focus-ring w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-accent"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="req-paid" className="mb-1.5 block text-xs font-medium text-muted">
                    Is this paid?
                  </label>
                  <select
                    id="req-paid"
                    value={isPaid}
                    onChange={(e) => setIsPaid(e.target.value as "" | "yes" | "no")}
                    className="focus-ring w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink transition-colors focus:border-accent"
                  >
                    <option value="" disabled>
                      Select one
                    </option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                {isPaid === "yes" && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="req-payment-mode" className="mb-1.5 block text-xs font-medium text-muted">
                        Mode of payment
                      </label>
                      <select
                        id="req-payment-mode"
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="focus-ring w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink transition-colors focus:border-accent"
                      >
                        <option value="" disabled>
                          Select one
                        </option>
                        {PAYMENT_MODES.map((mode) => (
                          <option key={mode} value={mode}>
                            {mode}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="req-payment-timing" className="mb-1.5 block text-xs font-medium text-muted">
                        How is it paid
                      </label>
                      <select
                        id="req-payment-timing"
                        value={paymentTiming}
                        onChange={(e) => setPaymentTiming(e.target.value)}
                        className="focus-ring w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink transition-colors focus:border-accent"
                      >
                        <option value="" disabled>
                          Select one
                        </option>
                        {PAYMENT_TIMINGS.map((timing) => (
                          <option key={timing} value={timing}>
                            {timing}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="req-deadline" className="mb-1.5 block text-xs font-medium text-muted">
                      Deadline (optional)
                    </label>
                    <input
                      id="req-deadline"
                      type="date"
                      min={todayIso}
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="focus-ring w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink transition-colors focus:border-accent"
                    />
                  </div>
                  <div>
                    <label htmlFor="req-work-type" className="mb-1.5 block text-xs font-medium text-muted">
                      Work type
                    </label>
                    <select
                      id="req-work-type"
                      value={workType}
                      onChange={(e) => setWorkType(e.target.value)}
                      className="focus-ring w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink transition-colors focus:border-accent"
                    >
                      <option value="" disabled>
                        Select one
                      </option>
                      {WORK_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {touched && !isValid && (
                <p className="mt-4 text-xs text-red-600">Fill in all the required fields above.</p>
              )}
              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="focus-ring mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send request"}
              </motion.button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
