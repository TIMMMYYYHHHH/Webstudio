export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let { pathname } = url;

    if (pathname === '/api/contact' && request.method === 'POST') {
      return handleContact(request, env);
    }

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

async function handleContact(request, env) {
  const headers = {
    'Access-Control-Allow-Origin': new URL(request.url).origin,
    'Content-Type': 'application/json',
  };

  try {
    const data = await request.formData();
    const name = data.get('name') || '';
    const email = data.get('email') || '';
    const business = data.get('business') || '';
    const message = data.get('message') || '';

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ success: false, message: 'Please fill in all required fields.' }),
        { status: 400, headers }
      );
    }

    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: env.WEB3FORMS_KEY,
        subject: `New enquiry from ${name}`,
        from_name: name,
        name,
        email,
        business,
        message,
      }),
    });

    const result = await res.json();

    if (result.success) {
      return new Response(
        JSON.stringify({ success: true, message: "Thanks! We'll be in touch within 24 hours." }),
        { status: 200, headers }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Something went wrong. Please try again.' }),
      { status: 500, headers }
    );
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: 'Something went wrong. Please try again.' }),
      { status: 500, headers }
    );
  }
}

function addHeaders(response) {
  const res = new Response(response.body, response);
  res.headers.set('Cache-Control', 'public, max-age=600');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return res;
}
