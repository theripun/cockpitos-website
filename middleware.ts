import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isRegionSegment(seg: string): boolean {
  const s = seg.toLowerCase();
  if (s === "intl") return true;
  return s.length === 2 && /^[a-z]{2}$/i.test(s);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return NextResponse.next();

  const first = parts[0];
  if (!isRegionSegment(first)) return NextResponse.next();

  if (parts.length === 1) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.rewrite(url);
  }

  if (parts[1] === "checkout") {
    const url = request.nextUrl.clone();
    url.pathname = "/checkout";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|ads.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|json|webmanifest)$).*)",
  ],
};
