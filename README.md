# FormFlow for Next.js

[![CI](https://github.com/formizeflow/formflow-next/actions/workflows/ci.yml/badge.svg)](https://github.com/formizeflow/formflow-next/actions/workflows/ci.yml)

Server helpers and one server component for onboarding with FormFlow. Built on `@formizeflow/sdk` and `@formizeflow/react`; needs `FORMFLOW_URL` and `FORMFLOW_IDENTITY_SECRET` (the workspace identity secret, server only).

```tsx
// app/welcome/page.tsx (server component)
import { FormFlowOnboarding } from "@formizeflow/next";

export default async function Welcome() {
  const user = await currentUser();
  return <FormFlowOnboarding entry="pdfofile-welcome" uid={user.id} returnUrl="/dashboard" />;
}
```

`FormFlowOnboarding` asks FormFlow whether this person should see the entry (once per person by default, `firstRunOnly={false}` to change that). When not, it redirects to `returnUrl`. When so, it renders the embed with a Skip control, and completing or skipping sends the person to `returnUrl` with `?ff_done=1` or `?ff_skipped=1`. If FormFlow is slow or down (1.5 s timeout) the person is sent on to `returnUrl`.

```ts
import { signUid, decide, reportConversion } from "@formizeflow/next/server"; // "@formizeflow/next" exports them too

signUid(user.id);                                                   // uid_sig for the embed or the native app
await decide({ entry: "pdfofile-welcome", uid: user.id });          // { show, reason, ... } (no definition)
await reportConversion("tool_run", { entry: "pdfofile-welcome", uid: user.id, eventId: runId });
```

`reportConversion` never throws. Pass `test: true` to `decide` and `reportConversion` for integration tests: no exposure or conversion is counted.
