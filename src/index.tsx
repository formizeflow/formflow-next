import { redirect } from "next/navigation";
import { FormFlowEmbed, type FormFlowEmbedProps } from "@formizeflow/react";
import { baseUrlOf, decide, signUid, type FormFlowServerOptions } from "./server";

export type FormFlowOnboardingProps = FormFlowServerOptions & Omit<FormFlowEmbedProps, "slug" | "uid" | "uidSignature" | "returnUrl"> & {
  /** Experiment entry slug (or form slug). */
  entry: string;
  /** Your signed-in user's stable id. */
  uid: string;
  /** Where to go when there is nothing to show, and after the form is completed or skipped (?ff_done=1 / ?ff_skipped=1). */
  returnUrl: string;
  /** Show it once per person (default true): not again after it was shown, completed or skipped. */
  firstRunOnly?: boolean;
  maxAgeHours?: number;
};

/** Server component: asks FormFlow whether to show the onboarding; redirects to `returnUrl` when not, renders the embed when so. */
export async function FormFlowOnboarding({ entry, uid, returnUrl, firstRunOnly = true, maxAgeHours, baseUrl, secret, test, attributes, ...embed }: FormFlowOnboardingProps) {
  const d = await decide({ entry, uid, baseUrl, secret, firstRunOnly, maxAgeHours, test, attributes });
  if (!d.show) redirect(returnUrl);
  // the embed is addressed by the entry, so the server serves this uid's variant
  return <FormFlowEmbed skippable {...embed} slug={entry} baseUrl={baseUrlOf({ baseUrl })} uid={uid} uidSignature={signUid(uid, { secret })} returnUrl={returnUrl} test={test} attributes={attributes} />;
}

export { decide, reportConversion, signUid } from "./server";
