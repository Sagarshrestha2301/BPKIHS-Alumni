import { spawn } from "node:child_process";
import { appendFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const environment = {
  ...process.env,
  E2E: "1",
  NODE_ENV: "production",
};
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: environment,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
      }
    });
  });
}

async function startFakeResend(emailFile) {
  await rm(emailFile, { force: true });

  const server = createServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/emails") {
      response.writeHead(404).end();
      return;
    }

    const chunks = [];
    for await (const chunk of request) {
      chunks.push(chunk);
    }

    await appendFile(emailFile, `${Buffer.concat(chunks).toString("utf8")}\n`);
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ id: `fake-email-${Date.now()}` }));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server;
}

async function start() {
  const emailFile = path.resolve("test-results/e2e-emails.jsonl");
  const fakeResend = await startFakeResend(emailFile);
  const fakeResendAddress = fakeResend.address();

  if (fakeResendAddress === null || typeof fakeResendAddress === "string") {
    throw new Error("The fake Resend server did not expose a TCP address.");
  }

  environment.RESEND_BASE_URL = `http://127.0.0.1:${fakeResendAddress.port}`;

  try {
    await run(npxCommand, ["prisma", "migrate", "deploy"]);
    await run(npmCommand, ["run", "build"]);

    const server = spawn(npmCommand, ["start"], {
      env: environment,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    const stopServer = () => {
      server.kill();
      fakeResend.close();
    };
    process.on("SIGINT", stopServer);
    process.on("SIGTERM", stopServer);

    server.on("exit", (code) => {
      fakeResend.close();
      process.exit(code ?? 1);
    });
  } catch (error) {
    fakeResend.close();
    throw error;
  }
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});