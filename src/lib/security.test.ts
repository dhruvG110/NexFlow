import { describe, expect, it } from "vitest";

import { decryptSecret, encryptSecret, generateWebhookSecret, hashValue } from "@/lib/security";

describe("security helpers", () => {
  it("round-trips encrypted secrets", () => {
    const secret = "super-secret-token";
    const encrypted = encryptSecret(secret);

    expect(decryptSecret(encrypted)).toBe(secret);
  });

  it("generates webhook secrets and hashes deterministically", () => {
    const secret = generateWebhookSecret();

    expect(secret).toHaveLength(48);
    expect(hashValue(secret)).toHaveLength(64);
    expect(hashValue(secret)).toBe(hashValue(secret));
  });
});
