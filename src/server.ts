import { createHmac } from "node:crypto";
import { PublicClient, type DecideRequest, type DecideResult } from "@formizeflow/sdk";

/** Server-side config. Every field falls back to an environment variable, so most apps pass nothing. */
export type FormFlowServerOptions = {
  /** FormFlow origin. Default FORMFLOW_URL, then NEXT_PUBLIC_FORMFLOW_URL. */
  baseUrl?: string;
  /** Workspace identity secret (never sent to the browser). Default FORMFLOW_IDENTITY_SECRET. */
  secret?: string;
};

export const baseUrlOf = (o: FormFlowServerOptions = {}) => (o.baseUrl ?? process.env.FORMFLOW_URL ?? process.env.NEXT_PUBLIC_FORMFLOW_URL ?? "").replace(/\/$/, "");

/** uid_sig for the embed and the public API: lowercase hex HMAC-SHA256 of the uid. */
export function signUid(uid: string, o: FormFlowServerOptions = {}): string {
  const secret = o.secret ?? process.env.FORMFLOW_IDENTITY_SECRET;
  if (!secret) throw new Error("FormFlow: set FORMFLOW_IDENTITY_SECRET (or pass secret) to sign a uid");
  return createHmac("sha256", secret).update(uid).digest("hex");
}

const client = (o: FormFlowServerOptions) => new PublicClient({ baseUrl: baseUrlOf(o) });
const within = (ms: number) => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; };

export type DecideOptions = FormFlowServerOptions & Pick<DecideRequest, "attributes" | "firstRunOnly" | "maxAgeHours" | "test"> & { entry: string; uid: string; timeoutMs?: number };

/**
 * Should this person see the onboarding? Signs the uid for you and asks for the decision only (no definition).
 * Fails closed to `show: false` (reason "error") on a timeout or network error, so a FormFlow outage never blocks sign-in.
 */
export async function decide({ entry, uid, timeoutMs = 1500, baseUrl, secret, ...rest }: DecideOptions): Promise<DecideResult> {
  try {
    return await client({ baseUrl }).decide({ entry, uid, uid_sig: signUid(uid, { secret }), include: "none", ...rest }, within(timeoutMs));
  } catch {
    return { show: false, reason: "error" };
  }
}

/** Report a goal (for example "tool_run") for a person. Never throws; resolves `recorded: false` when it could not be sent. */
export async function reportConversion(event: string, o: FormFlowServerOptions & { entry: string; uid: string; eventId?: string; firstOnly?: boolean; test?: boolean; timeoutMs?: number }) {
  try {
    return await client(o).reportConversion(o.entry, { uid: o.uid, uid_sig: signUid(o.uid, o), event, eventId: o.eventId, firstOnly: o.firstOnly, ...(o.test ? { test: true } : {}) } as never, within(o.timeoutMs ?? 3000));
  } catch {
    return { recorded: false, attributed: false };
  }
}
