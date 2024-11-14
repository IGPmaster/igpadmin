export async function onRequest(context) {
  const { env, request } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const formData = await request.formData();
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.CF_IMAGES_TOKEN}`
        },
        body: formData
      }
    );

    const data = await response.json();
    return new Response(JSON.stringify(data), { headers });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to upload image' }), 
      { headers, status: 500 }
    );
  }
}