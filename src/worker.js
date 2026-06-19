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

    // Clean URLs for top-level pages: /pricing -> /pricing.html, /terms -> /terms.html
    if ((pathname === '/pricing' || pathname === '/terms') && !pathname.includes('.')) {
      const newUrl = new URL(request.url);
      newUrl.pathname = pathname + '.html';
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
    var allLinks = document.querySelectorAll('a');
    console.log('[KZN Debug] Total <a> tags found:', allLinks.length);
    var hrefs = [];
    allLinks.forEach(function(a) {
      var h = a.getAttribute('href');
      if (h) hrefs.push(h);
    });
    console.log('[KZN Debug] All hrefs:', JSON.stringify(hrefs.slice(0,30)));

    // Try matching by text content in ANY link
    allLinks.forEach(function(a) {
      var text = a.textContent;
      Object.keys(slugs).forEach(function(name) {
        if (text.indexOf(name) !== -1) {
          console.log('[KZN Debug] MATCH:', name, 'in link with href:', a.getAttribute('href'), 'tag:', a.tagName);
          a.setAttribute('href', '/demos/' + slugs[name]);
          a.setAttribute('target', '_blank');
        }
      });
    });

    // Fix "See all demos" link
    allLinks.forEach(function(a) {
      if (a.textContent.indexOf('See all demos') !== -1) {
        a.setAttribute('href', '/demos/');
      }
    });

    // Fix "Pricing" nav link to go to /pricing page
    allLinks.forEach(function(a) {
      var t = a.textContent.trim();
      if (t === 'Pricing') {
        a.setAttribute('href', '/pricing');
      }
    });
  }
  setTimeout(wireLinks, 3000);
  setTimeout(wireLinks, 6000);
  setTimeout(wireLinks, 10000);
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
