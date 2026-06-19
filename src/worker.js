import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

const assetManifest = JSON.parse(manifestJSON);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      const options = {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
      };

      if (url.pathname === '/') {
        options.mapRequestToAsset = (req) =>
          new Request(`${url.origin}/index.html`, req);
      }

      if (url.pathname.startsWith('/demos/') && !url.pathname.includes('.')) {
        options.mapRequestToAsset = (req) =>
          new Request(`${url.origin}${url.pathname}.html`, req);
      }

      const response = await getAssetFromKV(
        { request, waitUntil: ctx.waitUntil.bind(ctx) },
        options
      );

      const headers = new Response(response.body, response);
      headers.headers.set('X-XSS-Protection', '1; mode=block');
      headers.headers.set('X-Content-Type-Options', 'nosniff');
      headers.headers.set('X-Frame-Options', 'DENY');
      return headers;
    } catch (e) {
      if (url.pathname.startsWith('/demos/')) {
        return new Response(notFoundPage(), {
          status: 404,
          headers: { 'Content-Type': 'text/html;charset=UTF-8' },
        });
      }
      return new Response('Not found', { status: 404 });
    }
  },
};

function notFoundPage() {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>404 — KZN Web Studio</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Archivo',sans-serif;background:#f5f0e8;display:flex;align-items:center;justify-content:center;min-height:100vh;color:#0a0a0a}
.c{text-align:center;padding:2rem}h1{font-size:4rem;font-weight:800;color:#ff5a1f}p{margin:1rem 0;font-size:1.1rem;color:#555}
a{color:#ff5a1f;text-decoration:none;font-weight:600}a:hover{text-decoration:underline}</style></head>
<body><div class="c"><h1>404</h1><p>This demo page doesn't exist yet.</p><a href="/">← Back to KZN Web Studio</a></div></body></html>`;
}
