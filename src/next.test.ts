import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { decide, reportConversion, signUid } from "./server";

describe("@formizeflow/next server helpers", () => {
  it("signs a uid as hex HMAC-SHA256", () => {
    expect(signUid("u1", { secret: "s3" })).toBe(createHmac("sha256", "s3").update("u1").digest("hex"));
    expect(() => signUid("u1", { secret: "" })).toThrow();
  });
  it("decide sends the signed uid and fails closed on a network error", async () => {
    const f = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ data: { show: true, reason: "variant" } }), { status: 200 })).mockRejectedValueOnce(new Error("down"));
    vi.stubGlobal("fetch", f);
    const o = { entry: "welcome", uid: "u1", baseUrl: "https://f.test", secret: "s3" };
    expect((await decide(o)).show).toBe(true);
    expect(JSON.parse(f.mock.calls[0][1].body)).toMatchObject({ entry: "welcome", uid: "u1", uid_sig: signUid("u1", { secret: "s3" }), include: "none" });
    expect(await decide(o)).toEqual({ show: false, reason: "error" });
    expect((await reportConversion("tool_run", o)).recorded).toBe(false);
    vi.unstubAllGlobals();
  });
});
