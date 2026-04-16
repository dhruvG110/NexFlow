import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { startConnectorOAuth } from "@/lib/runtime/orchestration";
import { connectorProviderSchema } from "@/lib/workflow/schemas";

type RouteContext = {
  params: Promise<{
    provider: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { provider } = await context.params;
  const parsedProvider = connectorProviderSchema.parse(provider);
  const result = await startConnectorOAuth(
    parsedProvider,
    env.NEXT_PUBLIC_APP_URL,
  );

  return NextResponse.json({
    ok: true,
    data: result,
  });
}
