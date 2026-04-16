import { NextResponse } from "next/server";

import { completeConnectorOAuth } from "@/lib/runtime/orchestration";
import { connectorProviderSchema } from "@/lib/workflow/schemas";

type RouteContext = {
  params: Promise<{
    provider: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { provider } = await context.params;
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "demo-code";
  const parsedProvider = connectorProviderSchema.parse(provider);

  return NextResponse.json({
    ok: true,
    data: completeConnectorOAuth(parsedProvider, code),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { provider } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { code?: string };
  const parsedProvider = connectorProviderSchema.parse(provider);

  return NextResponse.json({
    ok: true,
    data: completeConnectorOAuth(parsedProvider, body.code ?? "demo-code"),
  });
}
