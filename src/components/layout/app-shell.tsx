import Link from "next/link";
import {
  Activity,
  Bot,
  Cable,
  Cog,
  LayoutDashboard,
  ScrollText,
  Workflow,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getAppSession } from "@/lib/auth/session";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/runs", label: "Runs", icon: Activity },
  { href: "/connectors", label: "Connectors", icon: Cable },
  { href: "/audit-log", label: "Audit Log", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Cog },
];

type AppShellProps = {
  title: string;
  eyebrow: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export async function AppShell({
  title,
  eyebrow,
  description,
  children,
  actions,
}: AppShellProps) {
  const session = await getAppSession();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(239,107,49,0.18),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(11,94,82,0.18),_transparent_30%),var(--surface)]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-[32px] border border-[color:var(--line)] bg-[color:var(--panel)] p-6 shadow-[0_30px_80px_rgba(17,27,24,0.12)]">
          <div className="space-y-6">
            <div className="rounded-[24px] border border-[color:var(--line)] bg-[color:var(--accent-soft)] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                    Workspace
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--ink)]">
                    {session.organizationName}
                  </h2>
                </div>
                <div className="rounded-2xl bg-[color:var(--ink)] p-3 text-[color:var(--surface)]">
                  <Bot className="size-5" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant={session.isDemo ? "warning" : "success"}>
                  {session.isDemo ? "Demo mode" : session.role}
                </Badge>
                <Badge variant="info">{session.email}</Badge>
              </div>
            </div>

            <nav className="space-y-2">
              {navigation.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[color:var(--ink)] transition hover:bg-black/5"
                >
                  <span className="rounded-xl bg-white p-2 text-[color:var(--accent)] shadow-sm">
                    <Icon className="size-4" />
                  </span>
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <main className="rounded-[32px] border border-[color:var(--line)] bg-white/84 p-5 shadow-[0_30px_80px_rgba(17,27,24,0.08)] backdrop-blur lg:p-8">
          <div className="flex flex-col gap-4 border-b border-[color:var(--line)] pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--muted)]">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[color:var(--ink)]">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
                {description}
              </p>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>

          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
