// This function specifically handles the root path
export async function onRequest(context) {
  console.log(`[Root Function] Processing root request`);
  
  try {
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
    newResponse.headers.set('X-Handled-By', 'Cloudflare-Function-Root-Router');
    
    return newResponse;
  } catch (error) {
    console.error(`[Root Function] Error serving root page: ${error.message}`);
    return new Response(`Error serving root page: ${error.message}`, { 
      status: 500 
    });
  }
}