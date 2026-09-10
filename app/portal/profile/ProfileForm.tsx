"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, TextInput } from "@/components/ui/Field";
import { Alert } from "@/components/ui/States";
import { DEBATE_EVENTS } from "@/lib/constants";
import { ApiError, api } from "@/lib/client/api";

export function ProfileForm({
  initial,
}: {
  initial: { contactEmail: string; events: string[]; partnerName: string; nsdaMemberId: string };
}) {
  const router = useRouter();
  const [contactEmail, setContactEmail] = useState(initial.contactEmail);
  const [events, setEvents] = useState<string[]>(initial.events);
  const [partnerName, setPartnerName] = useState(initial.partnerName);
  const [nsdaMemberId, setNsdaMemberId] = useState(initial.nsdaMemberId);

  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function toggleEvent(key: string) {
    setEvents((current) => (current.includes(key) ? current.filter((e) => e !== key) : [...current, key]));
    setStatus("idle");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setError(null);
    setFieldErrors({});

    try {
      await api.patch("/api/profile", {
        contactEmail: contactEmail.trim() || undefined,
        events,
        partnerName: partnerName.trim() || undefined,
        nsdaMemberId: nsdaMemberId.trim() || undefined,
      });
      setStatus("saved");
      router.refresh();
    } catch (caught) {
      setStatus("idle");
      if (caught instanceof ApiError) {
        setError(caught.message);
        if (caught.fields) setFieldErrors(caught.fields);
      } else {
        setError("Could not save your changes. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {status === "saved" ? <Alert tone="good">Profile updated.</Alert> : null}
      {error ? (
        <Alert tone="bad" title="Could not save">
          {error}
        </Alert>
      ) : null}

      <fieldset>
        <legend className="text-sm font-medium text-ink">Events you compete in</legend>
        <p className="mt-1 text-sm text-ink/60">Officers use this when planning entries and practice groups.</p>
        <div className="mt-3 space-y-2.5">
          {(Object.keys(DEBATE_EVENTS) as (keyof typeof DEBATE_EVENTS)[]).map((key) => (
            <Checkbox
              key={key}
              label={DEBATE_EVENTS[key]}
              checked={events.includes(key)}
              onChange={() => toggleEvent(key)}
            />
          ))}
        </div>
      </fieldset>

      <Field
        label="Preferred partner"
        hint="Who you usually debate with. Leave blank if you would like officers to pair you."
        error={fieldErrors.partnerName}
      >
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            value={partnerName}
            onChange={(event) => {
              setPartnerName(event.target.value);
              setStatus("idle");
            }}
            maxLength={200}
          />
        )}
      </Field>

      <Field
        label="Contact email"
        hint="Optional. A second address officers can reach you at outside school email."
        error={fieldErrors.contactEmail}
      >
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            type="email"
            aria-describedby={describedBy}
            invalid={invalid}
            value={contactEmail}
            onChange={(event) => {
              setContactEmail(event.target.value);
              setStatus("idle");
            }}
            maxLength={200}
          />
        )}
      </Field>

      <Field
        label="NSDA member ID"
        hint="If you know it. Officers verify membership status separately."
        error={fieldErrors.nsdaMemberId}
      >
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            value={nsdaMemberId}
            onChange={(event) => {
              setNsdaMemberId(event.target.value);
              setStatus("idle");
            }}
            maxLength={200}
          />
        )}
      </Field>

      <div className="flex items-center gap-6 border-t-2 border-rule-faint pt-5">
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
