const axios = require('axios');
const crypto = require('crypto');
const Redis = require('ioredis');

// 🔐 API key env me rakha hai
const API_KEY = process.env.API_KEY;

// 🧠 Redis connection
const redis = new Redis(process.env.UPSTASH_REDIS_REST_URL, {
  password: process.env.UPSTASH_REDIS_REST_TOKEN,
  tls: {}
});

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, User-Agent');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;

  try {
    // 🟢 Generate fresh token (15 min expiry)
    if (path === 'getToken') {
      const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const fingerprint = crypto.createHash('sha256').update(ip + userAgent).digest('hex');

      const token = crypto.randomBytes(20).toString('hex');
      await redis.set(`token_${fingerprint}_${token}`, 'valid', 'EX', 900); // 900s = 15 min

      return res.json({ success: true, token });
    }

    // 🔴 Token verification (before any real request)
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const fingerprint = crypto.createHash('sha256').update(ip + userAgent).digest('hex');

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'Missing token' });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const isValid = await redis.get(`token_${fingerprint}_${token}`);
    if (!isValid) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }

    // ✅ Token used once → delete immediately
    await redis.del(`token_${fingerprint}_${token}`);

    // 🔹 Original code below (unchanged)
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

    // Default
    res.json({ error: 'Invalid path' });

  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
};
