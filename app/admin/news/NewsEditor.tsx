"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Alert } from "@/components/ui/States";
import { NEWS_STATUSES } from "@/lib/constants";
import { ApiError, api } from "@/lib/client/api";

export interface NewsDraft {
  title: string;
  excerpt: string;
  body: string;
  imageUrl: string;
  status: string;
  tags: string;
}

export const emptyNewsDraft: NewsDraft = {
  title: "",
  excerpt: "",
  body: "",
  imageUrl: "",
  status: "DRAFT",
  tags: "",
};

const MARKDOWN_HELP = [
  "# Heading   ## Smaller heading",
  "- bullet list      1. numbered list",
  "**bold**   *italic*   `code`",
  "[link text](https://example.com)",
  "> quoted line",
].join("\n");

export function NewsEditor({ postId, initial }: { postId?: string; initial: NewsDraft }) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function set<K extends keyof NewsDraft>(key: K, value: NewsDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setNotice(null);
  }

  async function save(status?: string) {
    setBusy(true);
    setError(null);
    setFieldErrors({});
    setNotice(null);

    const payload = {
      title: draft.title.trim(),
      excerpt: draft.excerpt.trim(),
      body: draft.body,
      imageUrl: draft.imageUrl.trim() || undefined,
      status: status ?? draft.status,
      tags: draft.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      if (postId) {
        await api.patch(`/api/admin/news/${postId}`, payload);
        setDraft((current) => ({ ...current, status: payload.status }));
        setNotice(payload.status === "PUBLISHED" ? "Published. It is live on the public news page." : "Saved as a draft.");
        router.refresh();
      } else {
        const created = await api.post<{ id: string }>("/api/admin/news", payload);
        router.push(`/admin/news/${created.id}`);
        router.refresh();
      }
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        if (caught.fields) setFieldErrors(caught.fields);
      } else {
        setError("Could not save. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!postId) return;
    setBusy(true);
    try {
      await api.delete(`/api/admin/news/${postId}`);
      router.push("/admin/news");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not delete.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
        className="space-y-5"
      >
        {notice ? <Alert tone="good">{notice}</Alert> : null}
        {error ? (
          <Alert tone="bad" title="Could not save">
            {error}
          </Alert>
        ) : null}

        <Field label="Title" required error={fieldErrors.title}>
          {({ id, invalid }) => (
            <TextInput id={id} invalid={invalid} value={draft.title} onChange={(e) => set("title", e.target.value)} required maxLength={200} />
          )}
        </Field>

        <Field
          label="Summary"
          required
          hint="One or two sentences. Shown in the news list and used as the page description."
          error={fieldErrors.excerpt}
        >
          {({ id, describedBy, invalid }) => (
            <TextArea id={id} rows={2} aria-describedby={describedBy} invalid={invalid} value={draft.excerpt} onChange={(e) => set("excerpt", e.target.value)} required maxLength={400} />
          )}
        </Field>

        <Field label="Body" required hint="Markdown. Raw HTML is not allowed and will be shown as plain text." error={fieldErrors.body}>
          {({ id, describedBy, invalid }) => (
            <TextArea id={id} rows={16} aria-describedby={describedBy} invalid={invalid} value={draft.body} onChange={(e) => set("body", e.target.value)} required className="font-mono text-[13px]" />
          )}
        </Field>

        <details className="border-2 border-rule-faint bg-paper-sunk px-6 py-4">
          <summary className="cursor-pointer text-sm font-medium text-ink">Formatting reference</summary>
          <pre className="mt-2.5 overflow-x-auto text-sm leading-relaxed text-ink/60">{MARKDOWN_HELP}</pre>
        </details>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tags" hint="Comma separated.">
            {({ id, describedBy }) => (
              <TextInput id={id} aria-describedby={describedBy} value={draft.tags} onChange={(e) => set("tags", e.target.value)} placeholder="tournament, results" />
            )}
          </Field>
          <Field label="Status">
            {({ id }) => (
              <Select id={id} value={draft.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(NEWS_STATUSES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <Field label="Image URL" hint="Optional. A link to an image hosted elsewhere." error={fieldErrors.imageUrl}>
          {({ id, describedBy, invalid }) => (
            <TextInput id={id} type="url" aria-describedby={describedBy} invalid={invalid} value={draft.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} />
          )}
        </Field>

        <div className="flex flex-wrap gap-2 border-t-2 border-rule-faint pt-5">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : postId ? "Save" : "Create post"}
          </Button>
          {draft.status !== "PUBLISHED" ? (
            <Button type="button" variant="primary" onClick={() => save("PUBLISHED")} disabled={busy || !postId}>
              Publish now
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => save("DRAFT")} disabled={busy}>
              Unpublish
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => router.push("/admin/news")} disabled={busy}>
            Back
          </Button>
        </div>
      </form>

      {postId ? (
        <div className="border border-bad/25 bg-bad-pale/50 p-5">
          <h2 className="font-display text-base font-semibold text-bad">Delete this post</h2>
          <p className="mt-1.5 text-base text-ink/75">Permanent. Unpublish instead if you might want it back.</p>
          <div className="mt-4 flex gap-2">
            {confirmingDelete ? (
              <>
                <Button variant="danger" onClick={remove} disabled={busy} autoFocus>
                  Yes, delete permanently
                </Button>
                <Button variant="outline" onClick={() => setConfirmingDelete(false)} disabled={busy}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
                Delete post
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
