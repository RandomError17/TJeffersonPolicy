import { cn } from "@/lib/utils/cn";
import {
  DUES_STATUSES,
  NSDA_STATUSES,
  ORDER_STATUSES,
  REGISTRATION_STATUSES,
  TOURNAMENT_STATUSES,
  labelFor,
} from "@/lib/constants";

type Tone = "neutral" | "info" | "good" | "warn" | "bad" | "signal";

/**
 * Status chips are hard-edged tags, not pills: a 2px border, flat fill, and
 * uppercase display type, so they read as stamps on the page.
 *
 * Note that `signal` is used only where a status genuinely is the thing to act
 * on — amber is otherwise reserved for calls to action.
 */
const tones: Record<Tone, string> = {
  neutral: "border-rule-faint bg-paper-sunk text-ink",
  info: "border-navy-600 bg-navy-100 text-navy-800",
  good: "border-good bg-good-pale text-good",
  warn: "border-warn bg-warn-pale text-warn",
  bad: "border-bad bg-bad-pale text-bad",
  signal: "border-ink bg-signal text-paper",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border-2 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.12em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Status pills. Each maps a stored string to a label and a tone in one place,
 * so a status never renders as a raw database value anywhere in the app.
 */
const duesTone: Record<string, Tone> = { PAID: "good", WAIVED: "info", PENDING: "warn", UNPAID: "bad" };
export const DuesBadge = ({ status }: { status: string }) => (
  <Badge tone={duesTone[status] ?? "neutral"}>{labelFor(DUES_STATUSES, status, "Unpaid")}</Badge>
);

/** Shared by registrations and orders — both use the same three statuses. */
const simpleStatusTone: Record<string, Tone> = {
  PENDING: "warn",
  WAITLISTED: "info",
  REGISTERED: "good",
};
export const RegistrationBadge = ({ status }: { status: string }) => (
  <Badge tone={simpleStatusTone[status] ?? "neutral"}>{labelFor(REGISTRATION_STATUSES, status)}</Badge>
);
export const OrderBadge = ({ status }: { status: string }) => (
  <Badge tone={simpleStatusTone[status] ?? "neutral"}>{labelFor(ORDER_STATUSES, status)}</Badge>
);

const tournamentTone: Record<string, Tone> = { OPEN: "good", CLOSED: "neutral", DRAFT: "warn", ARCHIVED: "neutral" };
export const TournamentBadge = ({ status }: { status: string }) => (
  <Badge tone={tournamentTone[status] ?? "neutral"}>{labelFor(TOURNAMENT_STATUSES, status)}</Badge>
);

const nsdaTone: Record<string, Tone> = { ACTIVE: "good", PENDING: "warn", NOT_MEMBER: "neutral", UNKNOWN: "neutral" };
export const NsdaBadge = ({ status }: { status: string }) => (
  <Badge tone={nsdaTone[status] ?? "neutral"}>{labelFor(NSDA_STATUSES, status, "Not recorded")}</Badge>
);
