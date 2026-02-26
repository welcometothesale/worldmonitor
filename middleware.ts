/**
 * Vercel Edge Middleware — proxies all API requests to the upstream
 * worldmonitor.app instance (which has all API keys configured).
 * This lets the fork serve a custom frontend while using the original's
 * data layer without needing any API keys.
 */

const UPSTREAM = 'https://worldmonitor.app';

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (!path.startsWith('/api/')) return;

  const upstreamUrl = new URL(path + url.search, UPSTREAM);

  const headers = new Headers(request.headers);
  headers.set('Origin', UPSTREAM);
  headers.set('Referer', UPSTREAM + '/');
  headers.delete('host');

  try {
    const upstream = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    });

    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.delete('content-encoding');

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return new Response('{"error":"upstream unavailable"}', {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
