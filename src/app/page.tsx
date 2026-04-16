import Link from "next/link";
import { ArrowRight, Check, Layers3, ShieldCheck, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-[1500px] rounded-[36px] border border-[color:var(--line)] bg-white/76 p-5 shadow-[0_30px_100px_rgba(17,27,24,0.1)] backdrop-blur lg:p-8">
        <header className="flex flex-col gap-4 rounded-[28px] bg-[linear-gradient(135deg,#111b18_0%,#18443e_46%,#ef6b31_100%)] px-6 py-8 text-white lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:py-10">
          <div className="max-w-3xl">
            <Badge className="border-white/15 bg-white/10 text-white">
              Workflow OS Beta
            </Badge>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight lg:text-7xl">
              Build automations that look good, fail less, and scale with your team.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/78 lg:text-lg">
              Northstar Workflows gives you a visual canvas, published workflow
              versions, run history, connector contracts, and a managed Trigger.dev
              execution layer without the usual glue-code chaos.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px]"
            >
              Open Dashboard
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/workflows/wf_customer_router"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              Inspect Workflow Builder
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden p-6 lg:p-8">
            <div className="flex flex-wrap gap-3">
              <Badge variant="success">Visual canvas</Badge>
              <Badge variant="info">Draft / publish versions</Badge>
              <Badge variant="warning">Internal metering</Badge>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: Layers3,
                  title: "Versioned builders",
                  copy: "Keep a mutable draft, ship immutable versions, and replay failures with correlation IDs.",
                },
                {
                  icon: Zap,
                  title: "Managed runtime",
                  copy: "Use Trigger.dev queues, retries, and durable tasks instead of maintaining your own scheduler.",
                },
                {
                  icon: ShieldCheck,
                  title: "Reliability guardrails",
                  copy: "Encrypted secrets, webhook verification, audit trails, and structured connector contracts.",
                },
              ].map(({ icon: Icon, title, copy }) => (
                <div
                  key={title}
                  className="rounded-[24px] border border-[color:var(--line)] bg-[color:var(--panel)] p-5"
                >
                  <div className="inline-flex rounded-2xl bg-[color:var(--accent-soft)] p-3 text-[color:var(--accent)]">
                    <Icon className="size-5" />
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--ink)]">
                    {title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                    {copy}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
              Build Fast, With Fewer Errors
            </p>
            <div className="mt-5 space-y-4">
              {[
                "Start with 5-8 integrations, not 50. OAuth and API drift will dominate your bug surface.",
                "Validate every node with shared Zod schemas on client and server before anything publishes.",
                "Compile workflows into a stable DSL before execution so the runtime is deterministic and replay-safe.",
                "Use published versions for execution. Never run mutable drafts in production.",
              ].map((item) => (
                <div key={item} className="flex gap-3">
                  <span className="mt-0.5 rounded-full bg-[color:var(--teal-soft)] p-1 text-[color:#0b5e52]">
                    <Check className="size-4" />
                  </span>
                  <p className="text-sm leading-7 text-[color:var(--muted)]">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
