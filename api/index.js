// index.js - original logic preserved + sessionId + fingerprint + access/refresh token (Upstash)
const axios = require('axios');
const crypto = require('crypto');
const { Redis } = require('@upstash/redis');

// ENV
const API_KEY = process.env.API_KEY;
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = new Redis({
  url: UPSTASH_URL,
  token: UPSTASH_TOKEN,
});

// Helpers
function randHex(len = 16) {
  return crypto.randomBytes(len).toString('hex');
}

function getIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim() || 'unknown';
}
function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}
function fingerprintFor(req) {
  // fingerprint = hash(ip + userAgent)
  const ip = getIp(req);
  const ua = getUserAgent(req);
  return crypto.createHash('sha256').update(ip + '|' + ua).digest('hex');
}

function getSessionIdFromReq(req) {
  const cookie = req.headers.cookie || '';
  const parts = cookie.split(';').map(s => s.trim());
  for (const p of parts) {
    if (p.startsWith('sessionId=')) return p.split('=')[1];
  }
  return null;
}
function setSessionCookie(res, sessionId) {
  // HttpOnly + Secure recommended. If testing on http locally, remove Secure.
  // SameSite=Lax to allow normal requests from same origin.
  res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/`);
}

// Token storage keys:
// access: token:<sessionId>:<fingerprint>:<accessToken> -> '1' (EX 900)
// refresh: refresh:<sessionId>:<fingerprint>:<refreshToken> -> '1' (EX 7200)

// create access + refresh tokens (access 15m, refresh 2h)
async function createTokens(sessionId, fingerprint) {
  const access = randHex(20);
  const refresh = randHex(24);
  const accessKey = `token:${sessionId}:${fingerprint}:${access}`;
  const refreshKey = `refresh:${sessionId}:${fingerprint}:${refresh}`;
  await redis.set(accessKey, '1', { ex: 900 });   // 15 min
  await redis.set(refreshKey, '1', { ex: 7200 }); // 2 hour
  return { access, refresh };
}

// validate and consume access token (single-use)
async function consumeAccessToken(sessionId, fingerprint, access) {
  const key = `token:${sessionId}:${fingerprint}:${access}`;
  const v = await redis.get(key);
  if (!v) return false;
  // delete (consume)
  await redis.del(key);
  return true;
}

// validate refresh (do not delete refresh on use; can be left or rotate)
// here we DO NOT delete refresh to allow multiple refreshes until expiry,
// but you can delete it to force one-time refresh tokens.
async function validateRefreshToken(sessionId, fingerprint, refresh) {
  const key = `refresh:${sessionId}:${fingerprint}:${refresh}`;
  const v = await redis.get(key);
  return !!v;
}

// main handler
module.exports = async (req, res) => {
  // CORS - keep exactly similar headers to original
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query || {};

  try {
    // ======= TOKEN ENDPOINTS (new) =======
    // 1) getToken - create sessionId if missing and return access+refresh
    if (path === 'getToken') {
      let sessionId = getSessionIdFromReq(req);
      if (!sessionId) {
        sessionId = randHex(12);
        setSessionCookie(res, sessionId);
      }
      const fingerprint = fingerprintFor(req);
      const tokens = await createTokens(sessionId, fingerprint);
      return res.json({ success: true, accessToken: tokens.access, refreshToken: tokens.refresh, expiresIn: 900, sessionId });
    }

    // 2) refreshToken - exchange refresh for new access (requires session cookie)
    if (path === 'refreshToken') {
      const { token: refreshToken } = req.query || {};
      if (!refreshToken) return res.status(400).json({ success: false, error: 'Refresh token required' });
      const sessionId = getSessionIdFromReq(req);
      if (!sessionId) return res.status(401).json({ success: false, error: 'No session (cookie) present' });
      const fingerprint = fingerprintFor(req);
      const ok = await validateRefreshToken(sessionId, fingerprint, refreshToken);
      if (!ok) return res.status(403).json({ success: false, error: 'Invalid or expired refresh token' });
      // create new access, keep refresh as-is
      const access = randHex(20);
      const accessKey = `token:${sessionId}:${fingerprint}:${access}`;
      await redis.set(accessKey, '1', { ex: 900 });
      return res.json({ success: true, accessToken: access, expiresIn: 900 });
    }

    // ======= PROTECTED: verify access token for all other routes except health/getToken/refreshToken =======
    if (path !== 'health' && path !== 'getToken' && path !== 'refreshToken') {
      // require session cookie
      const sessionId = getSessionIdFromReq(req);
      if (!sessionId) {
        return res.status(401).json({ success: false, error: 'No session. Call ?path=getToken first.' });
      }
      const fingerprint = fingerprintFor(req);
      const authHeader = req.headers['authorization'] || '';
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Missing token' });
      }
      const access = authHeader.replace('Bearer ', '').trim();
      const ok = await consumeAccessToken(sessionId, fingerprint, access);
      if (!ok) {
        return res.status(403).json({ success: false, error: 'Invalid or expired token' });
      }
      // token consumed; proceed to original logic below
    }

    // ======= ORIGINAL CODE (unchanged logic & responses) =======
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
    return res.json({ error: 'Invalid path' });

  } catch (error) {
    console.error('Handler error:', error);
    return res.json({
      success: false,
      error: error.message
    });
  }
};
