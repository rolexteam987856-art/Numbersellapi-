// index.js — original logic preserved + sessionId + fingerprint + Upstash REST (no npm)
const axios = require('axios');
const crypto = require('crypto');

// env
const API_KEY = process.env.API_KEY;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL; // e.g. https://polished-lamb-16856.upstash.io
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// ---------------- Redis (Upstash REST) helper functions ----------------
async function redisSet(key, value, expireSeconds) {
  // value must be URL-encoded
  const v = encodeURIComponent(typeof value === 'string' ? value : JSON.stringify(value));
  const setUrl = `${UPSTASH_REDIS_REST_URL}/set/${key}/${v}`;
  await fetch(setUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` }
  });
  if (expireSeconds) {
    const expUrl = `${UPSTASH_REDIS_REST_URL}/expire/${key}/${expireSeconds}`;
    await fetch(expUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` }
    });
  }
}

async function redisGet(key) {
  const url = `${UPSTASH_REDIS_REST_URL}/get/${key}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` } });
  const j = await r.json();
  // Upstash returns { result: "<value>" } or { result: null }
  if (!j || j.result === null || typeof j.result === 'undefined') return null;
  try {
    // try parse JSON, otherwise decode
    const decoded = decodeURIComponent(j.result);
    return JSON.parse(decoded);
  } catch (e) {
    try { return decodeURIComponent(j.result); } catch (e2) { return j.result; }
  }
}

async function redisDel(key) {
  const url = `${UPSTASH_REDIS_REST_URL}/del/${key}`;
  const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` } });
  const j = await r.json();
  return j; // { result: 1 } etc.
}
// ------------------------------------------------------------------------

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
  // NOTE: Secure flag requires HTTPS. On localhost testing remove Secure if needed.
  res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/`);
}

function generateTokenValue() {
  return randHex(24); // longer token
}

// ---------------- main handler ----------------
module.exports = async (req, res) => {
  // CORS (keeps same as original)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query || {};

  try {
    // -------------- health unchanged --------------
    if (path === 'health') {
      return res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString()
      });
    }

    // -------------- token endpoint (create token + session cookie) --------------
    if (path === 'getToken') {
      // ensure sessionId cookie exists; if not create
      let sessionId = getSessionIdFromReq(req);
      if (!sessionId) {
        sessionId = randHex(12);
        setSessionCookie(res, sessionId);
      }

      const fingerprint = fingerprintFor(req);
      const token = generateTokenValue();
      // store token -> { sessionId, fingerprint } with TTL 900s (15 min)
      await redisSet(`token:${token}`, { sessionId, fingerprint }, 900);

      return res.json({ success: true, token, sessionId, expiresIn: 900 });
    }

    // -------------- For protected routes: verify token using session + fingerprint --------------
    const protectedPaths = ['getNumber', 'getOtp', 'cancelNumber'];
    if (protectedPaths.includes(path)) {
      // require session cookie
      const sessionId = getSessionIdFromReq(req);
      if (!sessionId) {
        return res.status(401).json({ success: false, error: 'No session. Call ?path=getToken first.' });
      }

      // require Authorization header
      const authHeader = req.headers['authorization'] || '';
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Missing token' });
      }
      const token = authHeader.replace('Bearer ', '').trim();

      const stored = await redisGet(`token:${token}`);
      if (!stored || !stored.sessionId || !stored.fingerprint) {
        return res.status(403).json({ success: false, error: 'Invalid or expired token' });
      }

      // compare sessionId & fingerprint
      const fingerprint = fingerprintFor(req);
      if (stored.sessionId !== sessionId || stored.fingerprint !== fingerprint) {
        return res.status(403).json({ success: false, error: 'Token does not match session or fingerprint' });
      }

      // token is valid -> consume (delete)
      await redisDel(`token:${token}`);
      // proceed to original actions
    }

    // -------------- ORIGINAL API LOGIC (unchanged) --------------
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

    // default
    return res.json({ error: 'Invalid path' });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || String(error)
    });
  }
};
