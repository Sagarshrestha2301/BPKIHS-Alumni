const { spawn } = require("node:child_process");

const environment = {
  ...process.env,
  E2E: "1",
  NODE_ENV: "test",
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

async function start() {
  await run(npxCommand, ["prisma", "migrate", "deploy"]);
  await run(npmCommand, ["run", "build"]);

  const server = spawn(npmCommand, ["start"], {
    env: environment,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  const stopServer = () => server.kill();
  process.on("SIGINT", stopServer);
  process.on("SIGTERM", stopServer);

  server.on("exit", (code) => process.exit(code ?? 1));
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});