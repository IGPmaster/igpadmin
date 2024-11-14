export async function onRequest(context) {
  const { env, params } = context;
  const imageId = params.id;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/images/v1/${imageId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${env.CF_IMAGES_TOKEN}`
        }
      }
    );

    const data = await response.json();
    return new Response(JSON.stringify(data), { headers });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to delete image' }), 
      { headers, status: 500 }
    );
  }
}