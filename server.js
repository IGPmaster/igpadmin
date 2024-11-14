const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 5000;

const CLOUD_FLARE_ACCOUNT_ID = 'cd4628cb46169b384a110e86fa36a731';
const CLOUD_FLARE_API_TOKEN = 'your_cloudflare_api_token_here'; // Replace with your actual token

// Use CORS to allow requests from http://localhost:5173
app.use(cors({
  origin: 'http://localhost:5173',
}));

// Proxy endpoint for fetching images
app.get('/api/images', async (req, res) => {
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUD_FLARE_ACCOUNT_ID}/images/v1`, {
      headers: {
        'Authorization': `Bearer ${CLOUD_FLARE_API_TOKEN}`,
      }
    });

    const data = await response.json();
    res.json(data); // Send the data to your frontend
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
