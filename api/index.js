const axios = require('axios');
const API_KEY = process.env.API_KEY;

module.exports = async (req, res) => {
  // CORS - SIRF APNI WEBSITE ALLOW KARO
  const ALLOWED_ORIGIN = 'https://numbersellapi.vercel.app'; // 🔥 SIRF APNI WEBSITE
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;
  const origin = req.headers.origin || '';

  try {
    // CHECK IF REQUEST IS FROM ALLOWED ORIGIN
    if (origin !== ALLOWED_ORIGIN) {
      // DIRECT ACCESS - HTML ERROR RETURN KARO
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Access Restricted</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 50px; 
                    background: #f1f1f1;
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    max-width: 500px;
                    margin: 0 auto;
                }
                h1 { color: #ff4444; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚫 Access Restricted</h1>
                <p><strong>Direct API access is not permitted.</strong></p>
                <p>This API can only be accessed through the official website.</p>
                <p>Please visit <strong>https://numbersellapi.vercel.app</strong> to use this service.</p>
            </div>
        </body>
        </html>
      `);
    }

    // SIRF ALLOWED ORIGIN SE REQUEST PROCESS KARO
    if (path === 'health') {
      return res.json({
        status: 'OK',
        message: 'Server is running', 
        timestamp: new Date().toISOString()
      });
    }

    if (path === 'getNumber') {
      const url = `https://firexotp.com/stubs/handler_api.php?action=getNumber&api_key=${API_KEY}&service=wa&country=51`;
      const response = await axios.get(url);
      const data = response.data;

      const parts = data.split(':');
      if (parts[0] === 'ACCESS_NUMBER' && parts.length === 3) {
        return res.json({
          success: true,
          id: parts[1],
          number: parts[2]
        });
      } else {
        return res.json({
          success: false,
          error: data
        });
      }
    }

    if (path === 'getOtp') {
      const { id } = req.query;
      if (!id) {
        return res.json({ success: false, error: 'ID required' });
      }

      const url = `https://firexotp.com/stubs/handler_api.php?action=getStatus&api_key=${API_KEY}&id=${id}`;
      const response = await axios.get(url);

      return res.json({
        success: true,
        data: response.data
      });
    }

    if (path === 'cancelNumber') {
      const { id } = req.query;
      if (!id) {
        return res.json({ success: false, error: 'ID required' });
      }

      const url = `https://firexotp.com/stubs/handler_api.php?action=setStatus&api_key=${API_KEY}&id=${id}&status=8`;
      const response = await axios.get(url);

      return res.json({
        success: true,
        data: response.data
      });
    }

    return res.json({ error: 'Invalid path' });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || String(error)
    });
  }
};
