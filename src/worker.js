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

    // For the homepage, inject a script that wires up portfolio card links
    if (pathname === '/' || pathname === '/index.html') {
      const asset = await env.ASSETS.fetch(request);
      let html = await asset.text();

      const linkScript = `<script>
(function(){
  var slugs = {
    'Umhlanga Dental': 'umhlanga-dental',
    'Drakensberg Stays': 'drakensberg-stays',
    'Spice Route Eats': 'spice-route-eats',
    'BuildRight Projects': 'buildright-projects',
    'Coastal Law Co.': 'coastal-law',
    'Zinto Fitness': 'zinto-fitness'
  };
  function wireLinks() {
    document.querySelectorAll('a').forEach(function(a) {
      if (a.getAttribute('href') !== '#work') return;
      var textEls = a.querySelectorAll('div');
      for (var i = 0; i < textEls.length; i++) {
        var t = textEls[i].textContent.trim();
        if (slugs[t]) {
          a.setAttribute('href', '/demos/' + slugs[t]);
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener');
          break;
        }
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(wireLinks, 2000); });
  } else {
    setTimeout(wireLinks, 2000);
  }
  setTimeout(wireLinks, 4000);
  setTimeout(wireLinks, 6000);
})();
</script>`;

      html = html.replace('</body>', linkScript + '</body>');

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      });
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
