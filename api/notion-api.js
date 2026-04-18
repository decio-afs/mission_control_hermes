const axios = require('axios');

module.exports = async (req, res) => {
  // Enable CORS for the proxy itself (same-origin calls are fine, but just in case)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Notion-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Strip '/notion-api' prefix to get the Notion API path
  const notionPath = req.url.replace(/^\/notion-api/, '');
  const token = process.env.VITE_NOTION_TOKEN;

  if (!token) {
    res.status(500).json({ error: 'Notion token not configured' });
    return;
  }

  try {
    const response = await axios({
      method: req.method,
      url: `https://api.notion.com${notionPath}`,
      headers: {
        'Authorization': req.headers.authorization || `Bearer ${token}`,
        'Notion-Version': req.headers['notion-version'] || '2022-06-28',
        'Content-Type': 'application/json',
      },
      data: req.body,
      validateStatus: () => true, // Don't throw on 4xx/5xx, let us forward them
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Notion proxy error:', error.message);
    res.status(502).json({
      error: 'Notion proxy failed',
      message: error.message,
    });
  }
};
