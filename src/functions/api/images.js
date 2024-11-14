export async function onRequest(context) {
  // Log request for debugging
  console.log('Images API called');
  
  const { env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    const apiResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/images/v1`,
      {
        headers: {
          'Authorization': `Bearer ${env.CF_IMAGES_TOKEN}`
        }
      }
    );

    const data = await apiResponse.json();
    
    // Return formatted response
    return new Response(JSON.stringify({
      success: true,
      result: data.result
    }), { 
      headers 
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch images'
    }), { 
      headers,
      status: 500
    });
  }
}