import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      route: "health-proxy",
      runtime: "nodejs"
    },
    {
      status: 200,
      headers: {
        "x-health-proxy": "active"
      }
    }
  );
}
