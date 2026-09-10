"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/States";
import { ApiError, api } from "@/lib/client/api";

/**
 * Permanent member deletion.
 *
 * This removes the account and everything scoped to it — registrations,
 * dues history, orders, awards, sessions, and their officer profile if they
 * have one. There is no undo, so confirming requires typing the member's
 * name, not just clicking twice.
 */
export function DeleteMemberControl({
  userId,
  displayName,
  isSelf,
}: {
  userId: string;
  displayName: string;
  /** The signed-in officer viewing their own profile — deletion is refused server-side too. */
  isSelf: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = confirmText.trim() === displayName;

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await api.delete(`/api/admin/members/${userId}`);
      router.push("/admin/members");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not delete this member.");
      setBusy(false);
    }
  }

  if (isSelf) {
    return (
      <div className="border-2 border-bad/25 bg-bad-pale/50 p-7">
        <h2 className="font-display text-base font-semibold text-bad">Delete this member</h2>
        <p className="mt-2 text-base leading-relaxed text-ink/75">
          You cannot delete your own account from here. Ask another officer to remove it.
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-bad/25 bg-bad-pale/50 p-7">
      <h2 className="font-display text-base font-semibold text-bad">Delete this member</h2>
      <p className="mt-2 text-base leading-relaxed text-ink/75">
        Permanently removes {displayName}&rsquo;s account — registrations, dues history, orders, awards, and their
        officer profile if they have one. This cannot be undone. If they sign in again afterward, a brand-new account
        is created with no memory of this one.
      </p>

      {error ? (
        <div className="mt-4">
          <Alert tone="bad">{error}</Alert>
        </div>
      ) : null}

      <div className="mt-5">
        {confirming ? (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-ink">
              Type <span className="font-semibold">{displayName}</span> to confirm
              <input
                type="text"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                autoFocus
                className="mt-2 block w-full max-w-sm border-2 border-rule bg-paper px-4 py-3 text-base text-ink focus:border-navy-600 focus:outline-none"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <Button variant="danger" onClick={remove} disabled={busy || !matches}>
                {busy ? "Deleting…" : `Delete ${displayName}`}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setConfirming(false);
                  setConfirmText("");
                }}
                disabled={busy}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirming(true)}>
            Delete member
          </Button>
        )}
      </div>
    </div>
  );
}
