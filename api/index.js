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
    // If direct URL access, return DARK NEON HTML message
    if (isDirectAccess && path && path !== 'health') {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Access Blocked - Happy Singh</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
                
                body {
                    font-family: 'Orbitron', sans-serif;
                    background: radial-gradient(circle at center, #0a0a0a 0%, #000000 100%);
                    margin: 0;
                    padding: 0;
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                    position: relative;
                }
                
                /* Fire Animation */
                body::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: 
                        radial-gradient(circle at 20% 80%, rgba(255, 50, 0, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255, 150, 0, 0.2) 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, rgba(255, 100, 0, 0.15) 0%, transparent 50%);
                    animation: fireFloat 4s ease-in-out infinite;
                    z-index: -1;
                }
                
                @keyframes fireFloat {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-20px) scale(1.05); }
                }
                
                .container {
                    background: rgba(10, 10, 10, 0.9);
                    padding: 50px;
                    border-radius: 25px;
                    text-align: center;
                    max-width: 700px;
                    margin: 20px;
                    border: 3px solid #ff4444;
                    box-shadow: 
                        0 0 30px rgba(255, 0, 0, 0.7),
                        0 0 60px rgba(255, 50, 0, 0.4),
                        0 0 90px rgba(255, 100, 0, 0.2),
                        inset 0 0 20px rgba(255, 0, 0, 0.3);
                    backdrop-filter: blur(15px);
                    animation: neonPulse 2s ease-in-out infinite alternate;
                    position: relative;
                    overflow: hidden;
                }
                
                @keyframes neonPulse {
                    from {
                        box-shadow: 
                            0 0 30px rgba(255, 0, 0, 0.7),
                            0 0 60px rgba(255, 50, 0, 0.4),
                            0 0 90px rgba(255, 100, 0, 0.2);
                    }
                    to {
                        box-shadow: 
                            0 0 40px rgba(255, 0, 0, 0.9),
                            0 0 80px rgba(255, 50, 0, 0.6),
                            0 0 120px rgba(255, 100, 0, 0.3);
                    }
                }
                
                .container::before {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    background: linear-gradient(45deg, #ff0000, #ff6b00, #ff0000, #ff6b00);
                    border-radius: 27px;
                    z-index: -1;
                    animation: borderRotate 3s linear infinite;
                }
                
                @keyframes borderRotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .emoji {
                    font-size: 5rem;
                    margin-bottom: 30px;
                    text-shadow: 0 0 20px #ff0000, 0 0 30px #ff4444;
                    animation: emojiGlow 1.5s ease-in-out infinite alternate;
                }
                
                @keyframes emojiGlow {
                    from { text-shadow: 0 0 20px #ff0000, 0 0 30px #ff4444; }
                    to { text-shadow: 0 0 30px #ff6b00, 0 0 40px #ff8800; }
                }
                
                .message {
                    color: #ff4444;
                    font-size: 2.5rem;
                    font-weight: 900;
                    margin-bottom: 25px;
                    text-shadow: 0 0 15px #ff0000;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    animation: textFlicker 3s ease-in-out infinite;
                }
                
                @keyframes textFlicker {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
                
                .shayri {
                    color: #ffaa00;
                    font-size: 1.4rem;
                    font-style: italic;
                    margin: 35px 0;
                    padding: 25px;
                    background: rgba(255, 100, 0, 0.1);
                    border-radius: 15px;
                    border: 1px solid rgba(255, 100, 0, 0.5);
                    box-shadow: 0 0 20px rgba(255, 100, 0, 0.3);
                    line-height: 1.6;
                    text-shadow: 0 0 10px rgba(255, 150, 0, 0.7);
                }
                
                .note {
                    color: #ff6b6b;
                    font-size: 1.2rem;
                    margin: 25px 0;
                    text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
                }
                
                .website-link {
                    display: inline-block;
                    background: linear-gradient(135deg, #ff0000, #ff6b00);
                    color: #000000;
                    padding: 18px 35px;
                    border-radius: 30px;
                    text-decoration: none;
                    font-weight: 900;
                    margin-top: 30px;
                    font-size: 1.3rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border: 2px solid #ffaa00;
                    box-shadow: 0 0 25px rgba(255, 0, 0, 0.7);
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                
                .website-link:hover {
                    transform: translateY(-5px) scale(1.05);
                    box-shadow: 0 0 40px rgba(255, 0, 0, 0.9);
                    background: linear-gradient(135deg, #ff6b00, #ff0000);
                }
                
                .website-link::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                    transition: left 0.5s ease;
                }
                
                .website-link:hover::before {
                    left: 100%;
                }
                
                .warning {
                    color: #ffaa00;
                    font-size: 1.1rem;
                    margin-top: 25px;
                    text-shadow: 0 0 15px rgba(255, 170, 0, 0.7);
                    font-weight: bold;
                }
                
                /* Floating particles */
                .particle {
                    position: absolute;
                    background: rgba(255, 100, 0, 0.6);
                    border-radius: 50%;
                    animation: floatParticle 6s ease-in-out infinite;
                    z-index: -1;
                }
                
                @keyframes floatParticle {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(20px, -30px) scale(1.2); }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="emoji">🔥🚫😂</div>
                <div class="message">Ye API Nahi Hai, Bhai!</div>
                
                <div class="shayri">
                    "Log kehte hain — 'Bhai tu hamesha smile karta hai!'<br>
                    Arre naam hi Happy hai, rona toh gunah hai bhaiya! 😜"
                </div>
                
                <div class="note">
                    🔥 Direct API access allowed nahi hai!<br>
                    🔥 Website use karo, yeh kya direct URL mein ghus gaye?
                </div>
                
                <a href="https://numbersellapi.vercel.app" class="website-link">
                    🔥 Correct Website Pe Aao Yahan
                </a>
                
                <div class="warning">
                    ⚠️ Warna Happy Singh naaraaz ho jayega!
                </div>
            </div>
            
            <script>
                // Add floating particles
                for (let i = 0; i < 15; i++) {
                    createParticle();
                }
                
                function createParticle() {
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    const size = Math.random() * 20 + 5;
                    particle.style.width = size + 'px';
                    particle.style.height = size + 'px';
                    particle.style.left = Math.random() * 100 + 'vw';
                    particle.style.top = Math.random() * 100 + 'vh';
                    particle.style.animationDelay = Math.random() * 5 + 's';
                    document.body.appendChild(particle);
                }
            </script>
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
