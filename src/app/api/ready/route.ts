import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

const readinessHeaders = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export const runtime = "nodejs";

export async function GET() {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const databaseCheck = prisma.$queryRaw`SELECT 1`;
    const timeoutCheck = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error("Readiness timeout")), 1_000);
    });

    await Promise.race([databaseCheck, timeoutCheck]);

    return NextResponse.json({ status: "ok" }, { headers: readinessHeaders });
  } catch {
    return NextResponse.json(
      { status: "unavailable" },
      { status: 503, headers: readinessHeaders },
    );
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
}