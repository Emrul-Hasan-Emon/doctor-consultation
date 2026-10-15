import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  BACKEND_URL,
  REFRESH_COOKIE,
} from "@/lib/server/session";

export async function POST(req: NextRequest) {
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (access && refresh) {
    await fetch(`${BACKEND_URL}/api/auth/admin/logout`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${access}`,
      },
      body: JSON.stringify({ refreshToken: refresh }),
      cache: "no-store",
    }).catch(() => undefined);
  }
  const out = new NextResponse(null, { status: 204 });
  out.cookies.delete(ACCESS_COOKIE);
  out.cookies.delete(REFRESH_COOKIE);
  return out;
}
