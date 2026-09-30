import { next } from '@vercel/edge';

export default function middleware(request) {
  const auth = request.headers.get('authorization');

  if (auth) {
    const [, encoded] = auth.split(' ');
    const decoded = atob(encoded);
    const [, pwd] = decoded.split(':');

    if (pwd === process.env.SITE_PASSWORD) {
      return next();
    }
  }

  return new Response('인증이 필요합니다', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
  });
}

export const config = {
  matcher: '/((?!favicon.ico).*)',
};