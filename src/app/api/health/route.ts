import { NextResponse } from "next/server";

const healthHeaders = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export function GET() {
  return NextResponse.json({ status: "ok" }, { headers: healthHeaders });
}