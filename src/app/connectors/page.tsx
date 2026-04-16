import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getConnectorSummaries } from "@/lib/data/repository";

export default async function ConnectorsPage() {
  const connectors = await getConnectorSummaries();

  return (
    <AppShell
      eyebrow="Connectors"
      title="A small launch surface with a strict connector contract."
      description="Every connector follows the same shape: authorize, refresh, validate config, execute, map input, map output, classify errors, and enforce provider-aware rate limits."
    >
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {connectors.map((connector) => (
          <Card key={connector.provider} className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  {connector.provider}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
                  {connector.name}
                </h2>
              </div>
              <Badge
                variant={
                  connector.status === "connected"
                    ? "success"
                    : connector.status === "attention"
                      ? "warning"
                      : "default"
                }
              >
                {connector.status}
              </Badge>
            </div>
            <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
              {connector.description}
            </p>
            <div className="mt-6 rounded-[22px] bg-[color:var(--panel)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Connected accounts
              </p>
              <p className="mt-2 text-3xl font-semibold text-[color:var(--ink)]">
                {connector.connectedAccounts}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
