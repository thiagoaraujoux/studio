
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// NOTE: Middleware is temporarily disabled to rely on client-side auth checks.
// The security is handled by Firestore rules.
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
