import { auth } from "@clerk/nextjs/server";

import { featureFlags } from "@/lib/env";

export type WorkspaceRole = "OWNER" | "ADMIN" | "BUILDER" | "VIEWER";

export type AppSession = {
  userId: string;
  email: string;
  name: string;
  organizationId: string;
  organizationName: string;
  role: WorkspaceRole;
  isDemo: boolean;
};

const demoSession: AppSession = {
  userId: "demo_user",
  email: "founder@northstar.work",
  name: "Aarav Gupta",
  organizationId: "org_demo",
  organizationName: "Northstar Ops",
  role: "OWNER",
  isDemo: true,
};

export async function getAppSession(): Promise<AppSession> {
  if (!featureFlags.hasClerk) {
    return demoSession;
  }

  const authState = await auth();

  if (!authState.userId) {
    return demoSession;
  }

  return {
    userId: authState.userId,
    email:
      (authState.sessionClaims?.email as string | undefined) ??
      "operator@workspace.local",
    name:
      (authState.sessionClaims?.fullName as string | undefined) ??
      "Workspace Operator",
    organizationId: authState.orgId ?? demoSession.organizationId,
    organizationName:
      (authState.sessionClaims?.org_name as string | undefined) ??
      demoSession.organizationName,
    role:
      (authState.orgRole?.toUpperCase() as WorkspaceRole | undefined) ??
      "BUILDER",
    isDemo: false,
  };
}
