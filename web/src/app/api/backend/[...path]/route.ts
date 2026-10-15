import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  accessCookie,
  BACKEND_URL,
  REFRESH_COOKIE,
  refreshCookie,
  refreshSession,
  type Tokens,
} from "@/lib/server/session";

/**
 * Same-origin proxy to the backend. The browser never sees a token: it is read
 * from an httpOnly cookie here and sent as a bearer header. Expired access
 * tokens are refreshed once and the request is retried.
 */
async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const allowed =
    path[0] === "admin" ||
    (path[0] === "auth" && path[1] === "admin" && path[2] === "me");
  if (!allowed)
    return NextResponse.json({ message: "Not found" }, { status: 404 });

  const target = `${BACKEND_URL}/api/${path.join("/")}${req.nextUrl.search}`;
  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await req.arrayBuffer();

  const call = (token: string | undefined) =>
    fetch(target, {
      method: req.method,
      headers: {
        ...(body
          ? {
              "content-type":
                req.headers.get("content-type") ?? "application/json",
            }
          : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body,
      cache: "no-store",
    });

  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;

  let res = access ? await call(access) : undefined;
  let renewed: Tokens | null = null;
  if ((!res || res.status === 401) && refresh) {
    renewed = await refreshSession(refresh);
    if (renewed) res = await call(renewed.accessToken);
  }
  res ??= new Response(
    JSON.stringify({ statusCode: 401, message: "Unauthorized" }),
    {
      status: 401,
      headers: { "content-type": "application/json" },
    },
  );

  const payload = res.status === 204 ? null : await res.arrayBuffer();
  const out = new NextResponse(payload, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
  if (renewed) {
    out.cookies.set(accessCookie(renewed));
    out.cookies.set(refreshCookie(renewed));
  } else if (res.status === 401) {
    out.cookies.delete(ACCESS_COOKIE);
    out.cookies.delete(REFRESH_COOKIE);
  }
  return out;
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
