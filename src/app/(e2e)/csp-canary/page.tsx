import { headers } from "next/headers";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CspCanaryPage() {
  const nodeEnvironment = Reflect.get(process.env, "NODE_ENV");
  const isE2e = Reflect.get(process.env, "E2E") === "1";

  if (!isE2e || nodeEnvironment === "production") {
    notFound();
  }

  const nonce = (await headers()).get("x-nonce");

  return (
    <main>
      <h1>CSP canary</h1>
      <script
        nonce={nonce ?? undefined}
        dangerouslySetInnerHTML={{
          __html: `
            void fetch("https://csp-canary.invalid/blocked", { mode: "no-cors" }).catch(() => undefined);
            const image = new Image();
            image.src = "https://csp-canary.invalid/blocked.png";
            document.body.append(image);
          `,
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: "window.__cspCanaryInlineScript = true;",
        }}
      />
      <img src="https://csp-canary.invalid/server-rendered.png" alt="" />
    </main>
  );
}