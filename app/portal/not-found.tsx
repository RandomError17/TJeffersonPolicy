import { EmptyState } from "@/components/ui/States";
import { PageHeading } from "@/components/app/PageHeading";

export default function PortalNotFound() {
  return (
    <>
      <PageHeading title="Not found" />
      <EmptyState
        title="We could not find that"
        description="It may have been removed, or the link may be out of date. Everything you have access to is in the sidebar."
        action={{ href: "/portal", label: "Back to your dashboard" }}
      />
    </>
  );
}
