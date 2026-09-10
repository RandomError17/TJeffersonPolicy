import type { Metadata } from "next";
import { AppShell, type NavGroup } from "@/components/app/AppShell";
import {
  IconBook,
  IconBox,
  IconCalendar,
  IconHome,
  IconTicket,
  IconTrophy,
  IconUser,
  IconWallet,
} from "@/components/ui/Icons";
import { requireUserPage } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: { default: "Team portal", template: "%s · Team portal" },
  // Nothing behind sign-in should ever be indexed.
  robots: { index: false, follow: false, nocache: true },
};

const GROUPS: NavGroup[] = [
  {
    items: [
      { href: "/portal", label: "Dashboard", icon: <IconHome /> },
      { href: "/portal/tournaments", label: "Tournaments", icon: <IconCalendar /> },
      { href: "/portal/registrations", label: "My registrations", icon: <IconTicket /> },
    ],
  },
  {
    heading: "My account",
    items: [
      { href: "/portal/dues", label: "Dues", icon: <IconWallet /> },
      { href: "/portal/orders", label: "Orders", icon: <IconBox /> },
      { href: "/portal/awards", label: "Awards", icon: <IconTrophy /> },
      { href: "/portal/profile", label: "Profile", icon: <IconUser /> },
    ],
  },
  {
    heading: "Team",
    items: [{ href: "/portal/resources", label: "Resources", icon: <IconBook /> }],
  },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage("/portal");

  return (
    <AppShell
      groups={GROUPS}
      area="portal"
      user={{ displayName: user.displayName, role: user.role, gradeNumber: user.gradeNumber }}
      crossLink={user.role === "OFFICER" ? { href: "/admin", label: "Officer dashboard" } : undefined}
    >
      {children}
    </AppShell>
  );
}
