export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    };

    // Handle OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        headers: {
          ...corsHeaders,
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    const url = new URL(request.url);

    // Handle KV list request
    if (url.pathname === '/kv/list') {
      try {
        const listResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/storage/kv/namespaces/${env.CF_KV_NAMESPACE_ID}/keys`,
          {
            headers: {
              'Authorization': `Bearer ${env.CF_IMAGES_TOKEN}`
            }
          }
        );

        if (!listResponse.ok) {
          console.error('KV list error:', await listResponse.text());
          throw new Error('Failed to list KV keys');
        }

        const data = await listResponse.json();
        return new Response(JSON.stringify(data.result), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Worker list error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }

    // Handle image uploads
    if (url.pathname === '/upload') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
      }

      try {
        const formData = await request.formData();
        const file = formData.get('file');
        const metadata = formData.get('metadata');

        const uploadResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/images/v1`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${env.CF_IMAGES_TOKEN}`
            },
            body: formData
          }
        );

        const result = await uploadResponse.json();

        return new Response(JSON.stringify(result), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }

    // Handle KV operations
    if (url.pathname === '/kv') {
      // Handle GET request
      if (request.method === 'GET') {
        try {
          const key = url.searchParams.get('key');
          if (!key) {
            return new Response(JSON.stringify({ error: 'Key is required' }), {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          }

          const kvResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/storage/kv/namespaces/${env.CF_KV_NAMESPACE_ID}/values/${key}`,
            {
              headers: {
                'Authorization': `Bearer ${env.CF_IMAGES_TOKEN}`
              }
            }
          );

          if (!kvResponse.ok) {
            if (kvResponse.status === 404) {
              const [_, brandId, lang] = key.split(':');
              const defaultContent = {
                brand_info: {
                  whitelabel_id: brandId,
                  brand_name: getBrandName(brandId)
                },
                acf: {
                    logo: '', // Add this
                    logo_alt: '', // Add this
                    image_full: '',
                    image_full_alt: '', // Add this
                    image_small: '',
                    image_small_alt: '', // Add this
                    trust_icons: '',
                    new_games_info: '',
                    popular_games_info: '',
                    slot_games_info: '',
                    casino_games_info: '',
                    jackpot_games_info: '',
                    live_games_info: '',
                    scratch_games_info: '',
                    sig_terms: '',
                    full_terms: '',
                    main_content: '', // Add this line
                    tnc_color: '#FEFBF3',
                    geo_target_country_sel: [lang]
                }
              };

              return new Response(JSON.stringify(defaultContent), {
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json'
                }
              });
            }
            throw new Error('Failed to fetch KV value');
          }

          const content = await kvResponse.json();
          return new Response(JSON.stringify(content), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
      }

      // Handle PUT request
      if (request.method === 'PUT') {
        try {
          const { key, value } = await request.json();
          console.log('Saving to KV:', { key, value });

          const kvResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/storage/kv/namespaces/${env.CF_KV_NAMESPACE_ID}/values/${key}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${env.CF_IMAGES_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(value)
            }
          );

          if (!kvResponse.ok) {
            const errorText = await kvResponse.text();
            console.error('KV save error:', errorText);
            throw new Error(`Failed to save to KV: ${errorText}`);
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          console.error('Worker error:', error);
          return new Response(
            JSON.stringify({ 
              error: error.message,
              details: error.stack 
            }), {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
      }
    }

    return new Response('Not found', { 
      status: 404,
      headers: corsHeaders
    });
  }
};

function getBrandName(brandId) {
  const brands = {
    '12': 'Hippozino',
    '239': 'JazzySpins',
    '65': 'Maxiplay',
    '212': 'BetDukes',
    '188': 'Casimboo',
    '189': 'Royalzee',
    '77': 'MrSlot',
    '76': 'MrMobi',
    '107': 'MrJackvegas',
    '102': 'MrSuperplay',
    '30': 'Dukes Casino',
    '34': 'Jackpot Paradise',
    '26': 'Vegas Paradise'
  };
  return brands[brandId] || `Unknown Brand (${brandId})`;
}