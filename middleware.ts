import { updateSession } from '@/supabase/middlware'
import { NextResponse, type NextRequest } from 'next/server'

const EXCLUDED_ROUTES = ['/sign-in', '/sign-up', '/wellcome']

export async function middleware(request: NextRequest) {
  const { supabase, response } = updateSession(request)

  const isExcludedRoute = EXCLUDED_ROUTES.some((route) => request.nextUrl.pathname.includes(route))

  if (isExcludedRoute) {
    return response
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/sin-in', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
