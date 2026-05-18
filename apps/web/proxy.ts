import { NextRequest, NextResponse } from "next/server";


export function proxy(req:NextRequest){
    const authRoute = ['/login','/signup']
    const protectedRoute = ['/profile']

    const {pathname} = req.nextUrl

    const isAuthRoute = authRoute.some(route=>pathname.startsWith(route))
    const isProtecTedRoute =
    pathname === '/' || protectedRoute.some(route=>pathname.startsWith(route))

    const sessionCookie = req.cookies.get('better-auth.session_token')?.value || req.cookies.get('__Secure-better-auth.session_token')?.value

    const isLoggedIn = !!sessionCookie
    console.log(sessionCookie,'this is the sewssion vook')
    console.log(isAuthRoute,'this is the auth route')

    if(isLoggedIn && isAuthRoute){
        console.log(isAuthRoute,'this is the auth route')
        const referer = req.headers.get('referer') || req.headers.get('Referer')
        if(referer){
            return NextResponse.redirect(referer)
        }
        return NextResponse.redirect(new URL('/',req.url))
    }

    if(!isLoggedIn && isProtecTedRoute){
        return NextResponse.redirect(new URL('/login',req.url))
    }

    return NextResponse.next()


}

export const config = {
  matcher: [
    // Exclude API routes, static files, image optimizations, and .png files
    '/((?!api|_next/static|_next/image|.*\\.png$).*)',
  ],
}