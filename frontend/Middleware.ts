import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
	const hasAuth = request.cookies.has('auth_token');
	const { pathname } = request.nextUrl;

	// 1. Eğer kullanıcı zaten giriş yapmışsa ve Login sayfasına gitmeye çalışıyorsa -> Ana sayfaya at.
	if (pathname === '/login' && hasAuth) {
		return NextResponse.redirect(new URL('/', request.url));
	}

	// 2. Korumalı sayfalar (Örn: /vote gibi özel sayfalar gelirse buraya ekleyeceğiz).
	// Şimdilik Ana Sayfa (/) herkese açık, bu yüzden buradaki zorunlu yönlendirmeyi kaldırıyoruz.
	// Sadece gelecekteki '/profile' gibi sayfalar için koruma bırakabiliriz.

	// Şimdilik sadece /login ve statik dosyalar hariç her yer açık kalsın,
	// Yetki kontrolünü sayfa içindeki butona tıklayınca yapacağız.

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};