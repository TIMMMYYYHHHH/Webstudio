export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let { pathname } = url;

    // Clean URL support: /demos/foo -> /demos/foo.html
    if (pathname.startsWith('/demos/') && !pathname.endsWith('/') && !pathname.includes('.')) {
      const newUrl = new URL(request.url);
      newUrl.pathname = pathname + '.html';
      const asset = await env.ASSETS.fetch(newUrl);
      if (asset.status !== 404) {
        return addHeaders(asset);
      }
    }

    // /demos/ -> /demos/index.html
    if (pathname === '/demos' || pathname === '/demos/') {
      const newUrl = new URL(request.url);
      newUrl.pathname = '/demos/index.html';
      return addHeaders(await env.ASSETS.fetch(newUrl));
    }

    // Default: serve static asset as-is
    return addHeaders(await env.ASSETS.fetch(request));
  },
};

function addHeaders(response) {
  const res = new Response(response.body, response);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  return res;
}
