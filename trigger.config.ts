import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF ?? "local-dev",
  runtime: "node-22",
  dirs: ["./src/trigger"],
  maxDuration: 300,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1_000,
      maxTimeoutInMs: 30_000,
      factor: 2,
      randomize: true,
    },
  },
  onStart: async ({ ctx }) => {
    console.info("Trigger.dev task started", ctx.task.id);
  },
  onFailure: async ({ ctx, error }) => {
    console.error("Trigger.dev task failed", ctx.task.id, error);
  },
});
