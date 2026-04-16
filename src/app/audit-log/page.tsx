import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { getAuditLogEvents } from "@/lib/data/repository";
import { formatRelativeDate } from "@/lib/utils";

export default async function AuditLogPage() {
  const events = await getAuditLogEvents();

  return (
    <AppShell
      eyebrow="Audit"
      title="A paper trail for every publish, replay, and connector change."
      description="Audit logs are part of the product contract, not an afterthought. They reduce support cost and make future enterprise controls much easier to add."
    >
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[0.8fr_1fr_0.8fr_0.7fr] gap-3 border-b border-[color:var(--line)] px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
          <span>Actor</span>
          <span>Action</span>
          <span>Target</span>
          <span>When</span>
        </div>
        <div className="divide-y divide-[color:var(--line)]">
          {events.map((event) => (
            <div
              key={event.id}
              className="grid grid-cols-[0.8fr_1fr_0.8fr_0.7fr] gap-3 px-6 py-5"
            >
              <span className="text-sm font-semibold text-[color:var(--ink)]">
                {event.actor}
              </span>
              <span className="text-sm text-[color:var(--muted)]">{event.action}</span>
              <span className="text-sm text-[color:var(--muted)]">{event.target}</span>
              <span className="text-sm text-[color:var(--muted)]">
                {formatRelativeDate(event.occurredAt)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
