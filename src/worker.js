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
document.addEventListener('DOMContentLoaded', function() {
  var slugs = {
    'Umhlanga Dental': 'umhlanga-dental',
    'Drakensberg Stays': 'drakensberg-stays',
    'Spice Route Eats': 'spice-route-eats',
    'BuildRight Projects': 'buildright-projects',
    'Coastal Law Co.': 'coastal-law',
    'Zinto Fitness': 'zinto-fitness'
  };
  function wireLinks() {
    var cards = document.querySelectorAll('a[href="#work"]');
    cards.forEach(function(card) {
      var name = card.querySelector('div[style*="font-weight:800"]');
      if (name) {
        var text = name.textContent.trim();
        if (slugs[text]) {
          card.href = '/demos/' + slugs[text];
          card.target = '_blank';
        }
      }
    });
  }
  wireLinks();
  new MutationObserver(wireLinks).observe(document.body, { childList: true, subtree: true });
});
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
