import { updateSession } from '@/supabase/middleware'
import { type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const handleI18n = createMiddleware(routing)

const EXCLUDED_ROUTES = ['/sign-in', '/sign-up', '/wellcome']

export async function middleware(request: NextRequest) {
  // 1. Run i18n middleware
  const response = handleI18n(request)

  // 2. Run Supabase auth middleware
  const { response: finalResponse, user } = await updateSession(request, response)

  // 3. Auth protection logic
  // We need to check if response is a redirect/rewrite from next-intl
  if (finalResponse.headers.has('location')) {
    return finalResponse
  }

  const pathname = request.nextUrl.pathname
  const isExcludedRoute = EXCLUDED_ROUTES.some((route) => pathname.includes(route))

  if (!user && !isExcludedRoute) {
    // Check if we are inside a locale path
    // routing.locales gives ['en']
    const hasLocale = routing.locales.some((locale) => pathname.startsWith(`/${locale}`))

    // If hasLocale is false (e.g. root /), next-intl handles it (redirects to /en)
    // But if we are at /en/dashboard, we want to protect it.

    if (hasLocale) {
      const url = request.nextUrl.clone()
      // Assuming 'en' is default or extracting locale.
      // For now hardcode to /en/sign-in since we only have 'en'.
      // Ideally: const locale = pathname.split('/')[1];
      url.pathname = '/en/sign-in'
      return Response.redirect(url)
    }
  }

  return finalResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
