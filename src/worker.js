export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let { pathname } = url;

    // Clean URL: /foo -> /foo.html, /foo/ -> /foo/index.html
    if (!pathname.includes('.') && pathname !== '/') {
      const cleanPath = pathname.endsWith('/')
        ? pathname + 'index.html'
        : pathname + '.html';
      const newUrl = new URL(request.url);
      newUrl.pathname = cleanPath;
      const asset = await env.ASSETS.fetch(newUrl);
      if (asset.status !== 404) {
        return addHeaders(asset);
      }
    }

    return addHeaders(await env.ASSETS.fetch(request));
  },
};

function addHeaders(response) {
  const res = new Response(response.body, response);
  res.headers.set('Cache-Control', 'public, max-age=600');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return res;
}
