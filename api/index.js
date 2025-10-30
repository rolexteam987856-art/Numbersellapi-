const axios = require('axios');
const API_KEY = process.env.API_KEY;

module.exports = async (req, res) => {
  // CORS - Allow all for now
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers['referer'] || '';

  // Check if request is from browser directly (not from your website)
  const isDirectAccess = !referer.includes('numbersellapi.vercel.app') && 
                         userAgent.includes('Mozilla');

  try {
    // If direct URL access, return funny HTML message
    if (isDirectAccess && path && path !== 'health') {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Access Blocked - Happy bhaiya</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 0;
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .container {
                    background: rgba(255, 255, 255, 0.95);
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
                    text-align: center;
                    max-width: 500px;
                    margin: 20px;
                    backdrop-filter: blur(10px);
                    border: 2px solid #ff6b6b;
                    animation: shake 0.5s ease-in-out;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                .emoji {
                    font-size: 4rem;
                    margin-bottom: 20px;
                }
                .message {
                    color: #d63031;
                    font-size: 1.8rem;
                    font-weight: bold;
                    margin-bottom: 15px;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
                }
                .shayri {
                    color: #2d3436;
                    font-size: 1.2rem;
                    font-style: italic;
                    margin: 25px 0;
                    padding: 15px;
                    background: linear-gradient(135deg, #ffeaa7, #fab1a0);
                    border-radius: 10px;
                    border-left: 5px solid #e17055;
                }
                .note {
                    color: #636e72;
                    font-size: 1rem;
                    margin: 15px 0;
                }
                .website-link {
                    display: inline-block;
                    background: linear-gradient(135deg, #fd79a8, #e84393);
                    color: white;
                    padding: 12px 25px;
                    border-radius: 25px;
                    text-decoration: none;
                    font-weight: bold;
                    margin-top: 20px;
                    transition: transform 0.3s ease;
                }
                .website-link:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
                }
                .warning {
                    color: #e17055;
                    font-size: 0.9rem;
                    margin-top: 15px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="emoji">🚫😂</div>
                <div class="message">Ye API Nahi Hai, Bhai!</div>
                
                <div class="shayri">
                    "Log kehte hain — 'Bhai tu hamesha smile karta hai!'<br>
                    Arre naam hi Happy hai, rona toh gunah hai bhaiya! 😜"
                </div>
                
                <div class="note">
                    Direct API access allowed nahi hai!<br>
                    Website use karo, yeh kya direct URL mein ghus gaye?
                </div>
                
                <a href="https://numbersellapi.vercel.app" class="website-link">
                    ✅ Correct Website Pe Aao Yahan
                </a>
                
                <div class="warning">
                    ⚠️ Warna Happy bhaiya naaraaz ho jayega!
                </div>
            </div>
        </body>
        </html>
      `);
    }

    // Rest of your normal API code remains same...
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

    // Default response for invalid paths
    res.json({ error: 'Invalid path' });

  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
};
