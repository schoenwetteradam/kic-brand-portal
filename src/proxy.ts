import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const dashboardUrl = request.nextUrl.clone();
  dashboardUrl.pathname = "/dashboard";

  return NextResponse.redirect(dashboardUrl);
}

export const config = {
  matcher: ["/"],
};
