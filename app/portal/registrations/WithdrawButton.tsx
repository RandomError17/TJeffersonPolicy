"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError, api } from "@/lib/client/api";

/**
 * Withdraw control. Asks for confirmation inline rather than with a native
 * confirm() so the prompt is styled, focusable, and dismissible by keyboard.
 */
export function WithdrawButton({ registrationId, tournamentName }: { registrationId: string; tournamentName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withdraw() {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/api/registrations/${registrationId}/withdraw`);
      setConfirming(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not withdraw. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <div className="text-right">
        <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
          Withdraw
        </Button>
        {error ? <p className="mt-1 text-sm text-bad">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="border-2 border-rule-faint bg-paper-sunk p-3">
      <p className="text-base leading-relaxed text-ink/75">
        Withdraw from <strong className="font-semibold">{tournamentName}</strong>? This removes the entry completely —
        officers will see the slot freed up immediately.
      </p>
      <div className="mt-2.5 flex gap-2">
        <Button variant="danger" size="sm" onClick={withdraw} disabled={busy} autoFocus>
          {busy ? "Withdrawing…" : "Yes, withdraw"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={busy}>
          Keep it
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm text-bad">{error}</p> : null}
    </div>
  );
}
