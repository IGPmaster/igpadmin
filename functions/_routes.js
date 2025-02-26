// This is a Cloudflare Function that handles routing for the SPA
export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const path = url.pathname;

  
  // Log the request for debugging
  console.log(`[Function] Processing request for: ${path}`);

  // Check if the request is for a static asset
  if (
    path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/) ||
    path.startsWith('/assets/') ||
    path.startsWith('/images/') ||
    path.startsWith('/img/') ||
    path.startsWith('/js/') ||
    path.startsWith('/css/') ||
    path.startsWith('/_nuxt/')
  ) {
    console.log(`[Function] Detected static asset, passing to next handler: ${path}`);
    return context.next();
  }

  // For ALL other routes, let Cloudflare serve the SPA but add our headers
  try {
    console.log(`[Function] Serving SPA for path: ${path}`);
    
    // Instead of fetching index.html directly, let Cloudflare serve the app
    // but modify the response with our headers
    const response = await context.next();
    
    // Create a new response with our custom headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
    
    // Add our custom headers
    newResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    newResponse.headers.set('Pragma', 'no-cache');
    newResponse.headers.set('Expires', '0');
    newResponse.headers.set('X-Handled-By', 'Cloudflare-Function-SPA-Router');
    
    return newResponse;
  } catch (error) {
    console.error(`[Function] Error serving SPA: ${error.message}`);
    return new Response(`Error serving SPA: ${error.message}`, { 
      status: 500 
    });
  }
} 