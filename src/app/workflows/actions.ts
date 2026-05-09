"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAppSession } from "@/lib/auth/session";
import { createWorkflow, deleteWorkflow } from "@/lib/data/repository";

export async function createWorkflowAction(formData: FormData) {
  const session = await getAppSession();
  const name = formData.get("name")?.toString();
  const workflow = await createWorkflow({
    name,
    organizationId: session.organizationId,
    actorId: session.userId,
  });

  revalidatePath("/workflows");
  redirect(`/workflows/${workflow.id}`);
}

export async function deleteWorkflowAction(formData: FormData) {
  const workflowId = formData.get("workflowId")?.toString();

  if (!workflowId) {
    return;
  }

  await deleteWorkflow(workflowId);
  revalidatePath("/workflows");
}
