import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { getWorkspaceSnapshot } from "@/lib/data/repository";

export default async function SettingsPage() {
  const workspace = await getWorkspaceSnapshot();

  return (
    <AppShell
      eyebrow="Workspace"
      title="Team settings and internal beta usage."
      description="The first release optimizes for team workspaces and basic roles. You can layer on enterprise controls later without rebuilding the entire product surface."
    >
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Usage
          </p>
          <div className="mt-5 grid gap-3">
            {workspace.usage.map((item) => (
              <div
                key={item.label}
                className="rounded-[22px] border border-[color:var(--line)] bg-[color:var(--panel)] p-4"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  {item.label}
                </p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="text-3xl font-semibold text-[color:var(--ink)]">
                    {item.value}
                  </p>
                  <p className="text-sm font-semibold text-[color:var(--accent)]">
                    {item.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Members
          </p>
          <div className="mt-5 divide-y divide-[color:var(--line)]">
            {workspace.members.map((member) => (
              <div key={member.email} className="flex items-center justify-between gap-3 py-4">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--ink)]">
                    {member.name}
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    {member.email}
                  </p>
                </div>
                <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
