"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/States";
import { ApiError, api } from "@/lib/client/api";

/**
 * Delete or archive.
 *
 * The endpoint decides which happens: a tournament with registrations is
 * archived rather than deleted, so member history survives. This component
 * just reports what the server did.
 */
export function DangerZone({
  tournamentId,
  tournamentName,
  registrationCount,
}: {
  tournamentId: string;
  tournamentName: string;
  registrationCount: number;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const result = await api.delete<{ deleted: boolean; archived: boolean }>(`/api/admin/tournaments/${tournamentId}`);
      if (result.deleted) router.push("/admin/tournaments");
      else router.refresh();
      setConfirming(false);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not complete that.");
    } finally {
      setBusy(false);
    }
  }

  const willArchive = registrationCount > 0;

  return (
    <div className="border border-bad/25 bg-bad-pale/50 p-5">
      <h2 className="font-display text-base font-semibold text-bad">
        {willArchive ? "Archive this tournament" : "Delete this tournament"}
      </h2>
      <p className="mt-1.5 text-base leading-relaxed text-ink/75">
        {willArchive
          ? `${registrationCount} registration${registrationCount === 1 ? "" : "s"} exist, so this will be archived instead of deleted — it disappears from member views but the history is kept.`
          : "Nothing is registered, so this will be permanently deleted."}
      </p>

      {error ? (
        <div className="mt-3">
          <Alert tone="bad">{error}</Alert>
        </div>
      ) : null}

      <div className="mt-4">
        {confirming ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" onClick={remove} disabled={busy} autoFocus>
              {busy ? "Working…" : willArchive ? `Yes, archive "${tournamentName}"` : `Yes, delete "${tournamentName}"`}
            </Button>
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={busy}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirming(true)}>
            {willArchive ? "Archive tournament" : "Delete tournament"}
          </Button>
        )}
      </div>
    </div>
  );
}
