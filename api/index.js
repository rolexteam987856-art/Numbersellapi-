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
    // If direct URL access, return COLORFUL HTML message
    if (isDirectAccess && path && path !== 'health') {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Access Blocked - Mere bhai </title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
                
                body {
                    font-family: 'Orbitron', sans-serif;
                    background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
                    margin: 0;
                    padding: 0;
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                    position: relative;
                }
                
                /* Animated Background */
                body::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: 
                        radial-gradient(circle at 20% 80%, rgba(255, 0, 255, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(0, 255, 255, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, rgba(255, 255, 0, 0.2) 0%, transparent 50%);
                    animation: backgroundMove 10s ease-in-out infinite;
                    z-index: -2;
                }
                
                @keyframes backgroundMove {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(-10px, -10px) scale(1.1); }
                    50% { transform: translate(10px, 10px) scale(1.05); }
                    75% { transform: translate(-10px, 10px) scale(1.1); }
                }
                
                .container {
                    background: rgba(20, 20, 40, 0.95);
                    padding: 60px;
                    border-radius: 30px;
                    text-align: center;
                    max-width: 800px;
                    margin: 20px;
                    border: 4px solid transparent;
                    background-clip: padding-box;
                    box-shadow: 
                        0 0 50px rgba(255, 0, 255, 0.6),
                        0 0 100px rgba(0, 255, 255, 0.4),
                        0 0 150px rgba(255, 255, 0, 0.2),
                        inset 0 0 40px rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(25px);
                    animation: containerBorder 4s linear infinite;
                    position: relative;
                    overflow: hidden;
                }
                
                @keyframes containerBorder {
                    0% { border-color: #ff0080; }
                    25% { border-color: #8000ff; }
                    50% { border-color: #0080ff; }
                    75% { border-color: #00ff80; }
                    100% { border-color: #ff0080; }
                }
                
                .emoji {
                    font-size: 6rem;
                    margin-bottom: 40px;
                    animation: emojiColors 3s ease-in-out infinite;
                    filter: drop-shadow(0 0 20px currentColor);
                }
                
                @keyframes emojiColors {
                    0% { color: #ff0080; transform: scale(1) rotate(0deg); }
                    25% { color: #8000ff; transform: scale(1.1) rotate(5deg); }
                    50% { color: #0080ff; transform: scale(1.05) rotate(-5deg); }
                    75% { color: #00ff80; transform: scale(1.1) rotate(3deg); }
                    100% { color: #ff0080; transform: scale(1) rotate(0deg); }
                }
                
                .message {
                    font-size: 3rem;
                    font-weight: 900;
                    margin-bottom: 35px;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    animation: messageColors 2s ease-in-out infinite alternate;
                    text-shadow: 0 0 30px currentColor;
                }
                
                @keyframes messageColors {
                    0% { 
                        color: #ff0000;
                        text-shadow: 0 0 30px #ff0000, 0 0 50px #ff0000;
                    }
                    25% { 
                        color: #ffff00;
                        text-shadow: 0 0 30px #ffff00, 0 0 50px #ffff00;
                    }
                    50% { 
                        color: #00ff00;
                        text-shadow: 0 0 30px #00ff00, 0 0 50px #00ff00;
                    }
                    75% { 
                        color: #00ffff;
                        text-shadow: 0 0 30px #00ffff, 0 0 50px #00ffff;
                    }
                    100% { 
                        color: #ff00ff;
                        text-shadow: 0 0 30px #ff00ff, 0 0 50px #ff00ff;
                    }
                }
                
                .shayri {
                    font-size: 1.8rem;
                    font-style: italic;
                    margin: 40px 0;
                    padding: 35px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    border: 2px solid;
                    box-shadow: 0 0 40px currentColor;
                    line-height: 1.8;
                    animation: shayriColors 4s ease-in-out infinite;
                    text-shadow: 0 0 20px currentColor;
                }
                
                @keyframes shayriColors {
                    0% { 
                        color: #ff6b6b;
                        border-color: #ff6b6b;
                    }
                    20% { 
                        color: #4ecdc4;
                        border-color: #4ecdc4;
                    }
                    40% { 
                        color: #45b7d1;
                        border-color: #45b7d1;
                    }
                    60% { 
                        color: #96ceb4;
                        border-color: #96ceb4;
                    }
                    80% { 
                        color: #feca57;
                        border-color: #feca57;
                    }
                    100% { 
                        color: #ff6b6b;
                        border-color: #ff6b6b;
                    }
                }
                
                .note {
                    font-size: 1.5rem;
                    margin: 30px 0;
                    line-height: 1.6;
                    animation: noteColors 5s ease-in-out infinite;
                    text-shadow: 0 0 15px currentColor;
                    font-weight: 700;
                }
                
                @keyframes noteColors {
                    0% { color: #ff9ff3; }
                    16% { color: #f368e0; }
                    32% { color: #ff9f43; }
                    48% { color: #ee5a24; }
                    64% { color: #00d2d3; }
                    80% { color: #54a0ff; }
                    100% { color: #ff9ff3; }
                }
                
                .website-link {
                    display: inline-block;
                    padding: 22px 45px;
                    border-radius: 40px;
                    text-decoration: none;
                    font-weight: 900;
                    margin-top: 40px;
                    font-size: 1.6rem;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    border: 3px solid #ffffff;
                    animation: buttonColors 3s ease-in-out infinite, buttonPulse 2s ease-in-out infinite;
                    transition: all 0.4s ease;
                    position: relative;
                    overflow: hidden;
                }
                
                @keyframes buttonColors {
                    0% { 
                        background: linear-gradient(135deg, #ff0080, #ff8c00);
                        box-shadow: 0 0 40px #ff0080, 0 0 80px #ff0080;
                    }
                    25% { 
                        background: linear-gradient(135deg, #ff8c00, #00ff80);
                        box-shadow: 0 0 40px #ff8c00, 0 0 80px #ff8c00;
                    }
                    50% { 
                        background: linear-gradient(135deg, #00ff80, #0080ff);
                        box-shadow: 0 0 40px #00ff80, 0 0 80px #00ff80;
                    }
                    75% { 
                        background: linear-gradient(135deg, #0080ff, #8000ff);
                        box-shadow: 0 0 40px #0080ff, 0 0 80px #0080ff;
                    }
                    100% { 
                        background: linear-gradient(135deg, #8000ff, #ff0080);
                        box-shadow: 0 0 40px #8000ff, 0 0 80px #8000ff;
                    }
                }
                
                @keyframes buttonPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                }
                
                .website-link:hover {
                    transform: translateY(-10px) scale(1.15);
                    animation: none;
                    background: linear-gradient(135deg, #ffffff, #ffffff) !important;
                    color: #000000;
                    box-shadow: 
                        0 0 60px #ffffff,
                        0 0 120px #ffffff,
                        0 0 180px #ffffff !important;
                }
                
                .website-link::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
                    transition: left 0.8s ease;
                }
                
                .website-link:hover::before {
                    left: 100%;
                }
                
                .warning {
                    font-size: 1.4rem;
                    margin-top: 35px;
                    font-weight: bold;
                    animation: warningColors 2s ease-in-out infinite alternate;
                    text-shadow: 0 0 20px currentColor;
                }
                
                @keyframes warningColors {
                    0% { 
                        color: #ff3838;
                        text-shadow: 0 0 25px #ff3838;
                    }
                    100% { 
                        color: #ff9f1a;
                        text-shadow: 0 0 35px #ff9f1a;
                    }
                }
                
                /* Floating Colorful Particles */
                .particle {
                    position: absolute;
                    border-radius: 50%;
                    animation: floatAround 8s ease-in-out infinite;
                    z-index: -1;
                    filter: blur(1px);
                }
                
                @keyframes floatAround {
                    0%, 100% { 
                        transform: translate(0, 0) scale(1) rotate(0deg);
                        opacity: 0.7;
                    }
                    25% { 
                        transform: translate(100px, -50px) scale(1.3) rotate(90deg);
                        opacity: 1;
                    }
                    50% { 
                        transform: translate(-80px, 80px) scale(0.8) rotate(180deg);
                        opacity: 0.5;
                    }
                    75% { 
                        transform: translate(60px, 100px) scale(1.2) rotate(270deg);
                        opacity: 0.9;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="emoji">✨🚫😂</div>
                <div class="message">Ye API Nahi Hai, Bhai!</div>
                
                <div class="shayri">
                    "Log kehte hain — 'Bhai tu hamesha smile karta hai!'<br>
                    Arre naam hi Happy hai, rona toh gunah hai bhaiya! 😜"
                </div>
                
                <div class="note">
                    ✨ Direct API access allowed nahi hai!<br>
                    ✨ Website use karo, yeh kya direct URL mein ghus gaye?
                </div>
                
                <a href="https://numbersellapi.vercel.app" class="website-link">
                    ✨ Correct Website Pe Aao Yahan
                </a>
                
                <div class="warning">
                    ⚠️ Warna Happy Bhai naaraaz ho jayega!
                </div>
            </div>
            
            <script>
                // Add colorful floating particles
                const colors = ['#ff0080', '#8000ff', '#0080ff', '#00ff80', '#ffff00', '#ff8000'];
                
                for (let i = 0; i < 20; i++) {
                    createParticle();
                }
                
                function createParticle() {
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    const size = Math.random() * 80 + 20;
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    
                    particle.style.width = size + 'px';
                    particle.style.height = size + 'px';
                    particle.style.left = Math.random() * 100 + 'vw';
                    particle.style.top = Math.random() * 100 + 'vh';
                    particle.style.background = `radial-gradient(circle, ${color}, transparent)`;
                    particle.style.animationDelay = Math.random() * 8 + 's';
                    particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
                    
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
