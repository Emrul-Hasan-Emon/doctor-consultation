import { NextRequest, NextResponse } from "next/server";
import {
  accessCookie,
  BACKEND_URL,
  refreshCookie,
  type Tokens,
} from "@/lib/server/session";

export async function POST(req: NextRequest) {
  const res = await fetch(`${BACKEND_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": req.headers.get("user-agent") ?? "",
    },
    body: await req.text(),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const { user, ...tokens } = data as { user: unknown } & Tokens;
  const out = NextResponse.json({ user });
  out.cookies.set(accessCookie(tokens));
  out.cookies.set(refreshCookie(tokens));
  return out;
}
