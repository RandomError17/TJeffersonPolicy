"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { Alert } from "@/components/ui/States";
import { ApiError, api } from "@/lib/client/api";

export interface SettingField {
  key: string;
  label: string;
  hint?: string;
  type?: "text" | "url" | "email" | "textarea";
}

export interface SettingGroup {
  heading: string;
  description?: string;
  fields: SettingField[];
}

/** Club settings form. Every value here is a plain string. */
export function SettingsForm({ groups, initial }: { groups: SettingGroup[]; initial: Record<string, string> }) {
  const router = useRouter();

  const [values, setValues] = useState<Record<string, string>>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await api.put("/api/admin/settings", { settings: values });
      setSaved(true);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not save settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {saved ? <Alert tone="good">Settings saved.</Alert> : null}
      {error ? (
        <Alert tone="bad" title="Could not save">
          {error}
        </Alert>
      ) : null}

      {groups.map((group) => (
        <section key={group.heading} className="space-y-4">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">{group.heading}</h2>
            {group.description ? <p className="mt-1 text-base text-ink/60">{group.description}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <Field
                key={field.key}
                label={field.label}
                hint={field.hint}
                className={field.type === "textarea" ? "sm:col-span-2" : undefined}
              >
                {({ id, describedBy }) =>
                  field.type === "textarea" ? (
                    <TextArea
                      id={id}
                      aria-describedby={describedBy}
                      rows={3}
                      value={values[field.key] ?? ""}
                      onChange={(event) => set(field.key, event.target.value)}
                      maxLength={2000}
                    />
                  ) : (
                    <TextInput
                      id={id}
                      aria-describedby={describedBy}
                      type={field.type ?? "text"}
                      value={values[field.key] ?? ""}
                      onChange={(event) => set(field.key, event.target.value)}
                      maxLength={2000}
                    />
                  )
                }
              </Field>
            ))}
          </div>
        </section>
      ))}

      <div className="border-t-2 border-rule-faint pt-5">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
