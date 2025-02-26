// This function specifically handles blog routes
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  
  // Log the blog request for debugging
  console.log(`[Blog Function] Processing blog request for: ${path}`);
  console.log(`[Blog Function] Path params:`, context.params);
  
  try {
    console.log(`[Blog Function] Serving SPA for blog path: ${path}`);
    
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
    newResponse.headers.set('X-Handled-By', 'Cloudflare-Function-Blog-Router');
    
    return newResponse;
  } catch (error) {
    console.error(`[Blog Function] Error serving blog page: ${error.message}`);
    return new Response(`Error serving blog page: ${error.message}`, { 
      status: 500 
    });
  }
} 