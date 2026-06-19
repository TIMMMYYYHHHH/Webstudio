export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let { pathname } = url;

    // Clean URL support for any .html file: /foo -> /foo.html
    if (!pathname.includes('.') && pathname !== '/') {
      const cleanPath = pathname.endsWith('/') ? pathname + 'index.html' : pathname + '.html';
      const newUrl = new URL(request.url);
      newUrl.pathname = cleanPath;
      const asset = await env.ASSETS.fetch(newUrl);
      if (asset.status !== 404) {
        return addHeaders(asset, true);
      }
    }

    // For the homepage, inject a script that wires up portfolio card links
    if (pathname === '/' || pathname === '/index.html') {
      const newUrl = new URL(request.url);
      newUrl.pathname = '/index.html';
      const asset = await env.ASSETS.fetch(new Request(newUrl, request));
      let html = await asset.text();

      const linkScript = `<script>
(function(){
  var defined = false;
  var mo = new MutationObserver(function() {
    if (defined) return;
    var slugs = {
      'Umhlanga Dental': 'umhlanga-dental',
      'Drakensberg Stays': 'drakensberg-stays',
      'Spice Route Eats': 'spice-route-eats',
      'BuildRight Projects': 'buildright-projects',
      'Coastal Law Co.': 'coastal-law',
      'Zinto Fitness': 'zinto-fitness'
    };
    var allLinks = document.querySelectorAll('a');
    if (allLinks.length < 5) return;
    var matched = 0;
    allLinks.forEach(function(a) {
      var text = a.textContent;
      Object.keys(slugs).forEach(function(name) {
        if (text.indexOf(name) !== -1) {
          a.setAttribute('href', '/demos/' + slugs[name]);
          a.setAttribute('target', '_blank');
          matched++;
        }
      });
      if (a.textContent.indexOf('See all demos') !== -1) {
        a.setAttribute('href', '/demos/');
      }
      var t = a.textContent.trim();
      if (t === 'Pricing') {
        a.setAttribute('href', '/pricing');
      }
    });
    if (matched > 0) { defined = true; mo.disconnect(); }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
</script>`;

      html = html.replace('</head>', linkScript + '</head>');

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=300',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
      });
    }

    // Default: serve static asset as-is
    return addHeaders(await env.ASSETS.fetch(request), pathname.includes('.'));
  },
};

function addHeaders(response, isStatic) {
  const res = new Response(response.body, response);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (isStatic) {
    res.headers.set('Cache-Control', 'public, max-age=3600');
  }
  return res;
}
