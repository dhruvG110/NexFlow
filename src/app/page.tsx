import Link from "next/link";
import {
  ArrowRight,
  Layers3,
  PlayCircle,
  ShieldCheck,
  Workflow,
  Zap,
} from "lucide-react";

import { AuthControls } from "@/components/layout/auth-controls";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { featureFlags } from "@/lib/env";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-[1500px] rounded-[36px] border border-[color:var(--line)] bg-white/76 p-5 shadow-[0_30px_100px_rgba(17,27,24,0.1)] backdrop-blur lg:p-8">
        <header className="rounded-[28px] border border-[color:var(--line)] bg-white/80 px-6 py-5 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge>Northstar Workflows</Badge>
            </div>
            <AuthControls hasClerk={featureFlags.hasClerk} />
          </div>
        </header>

        <section className="mt-6 rounded-[28px] bg-[linear-gradient(135deg,#111b18_0%,#18443e_45%,#ef6b31_100%)] px-6 py-8 text-white lg:px-10 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="max-w-4xl">
              <Badge className="border-white/15 bg-white/10 text-white">
                Visual automation for teams
              </Badge>
              <h1 className="mt-6 text-5xl font-semibold tracking-tight lg:text-7xl">
                Build workflows visually
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/80 lg:text-lg">
                Design workflows on a canvas, save drafts safely, publish immutable versions, and run them through managed execution.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
                >
                  Try Demo
                  <ArrowRight className="size-4" />
                </Link>
                {featureFlags.hasClerk ? (
                  <AuthControls hasClerk mode="site" />
                ) : null}
              </div>
            </div>
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                How it works
              </p>
              <div className="mt-5 space-y-4 text-[color:var(--ink)]">
                {[
                  "Add trigger",
                  "Add actions",
                  "Run workflow",
                ].map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-sm font-semibold text-[color:var(--accent)]">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold">{step}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="mt-6">
          <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: Layers3,
                  title: "Visual Builder",
                  copy: "Build workflow graphs with drag, drop, and draft editing.",
                },
                {
                  icon: Workflow,
                  title: "Automation",
                  copy: "Turn triggers and actions into reusable automations for your team.",
                },
                {
                  icon: Zap,
                  title: "Integrations",
                  copy: "Connect Slack, HubSpot, Notion, Sheets, Airtable, and HTTP endpoints.",
                },
              ].map(({ icon: Icon, title, copy }) => (
                <Card key={title} className="p-6">
                  <div className="inline-flex rounded-2xl bg-[color:var(--accent-soft)] p-3 text-[color:var(--accent)]">
                    <Icon className="size-5" />
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--ink)]">
                    {title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                    {copy}
                  </p>
                </Card>
              ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          {[
            {
              icon: Layers3,
              title: "Step 1",
              copy: "Add trigger",
            },
            {
              icon: Zap,
              title: "Step 2",
              copy: "Add actions",
            },
            {
              icon: PlayCircle,
              title: "Step 3",
              copy: "Run workflow",
            },
          ].map(({ icon: Icon, title, copy }) => (
            <Card key={title} className="p-6">
              <div className="inline-flex rounded-2xl bg-[color:var(--teal-soft)] p-3 text-[color:#0b5e52]">
                <Icon className="size-5" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                {title}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
                {copy}
              </h2>
            </Card>
          ))}
        </section>

        <section className="mt-6 rounded-[28px] border border-[color:var(--line)] bg-[color:var(--panel)] px-6 py-8 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                Start building workflows
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[color:var(--ink)]">
                Publish safe automation from one editor
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-full bg-[color:var(--ink)] px-5 py-3 text-sm font-semibold text-white"
              >
                Try Demo
              </Link>
              <Link
                href="/workflows"
                className="inline-flex items-center rounded-full border border-[color:var(--line)] px-5 py-3 text-sm font-semibold text-[color:var(--ink)]"
              >
                Open Workflows
              </Link>
            </div>
          </div>
        </section>

        <footer className="mt-6 flex flex-col gap-4 border-t border-[color:var(--line)] px-2 pt-6 text-sm text-[color:var(--muted)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-4">
            <Link href="/">About</Link>
            <Link href="/dashboard">Docs</Link>
            <Link href="https://github.com">GitHub</Link>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            <span>© 2026 Northstar Workflows</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
