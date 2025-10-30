const axios = require("axios");
const crypto = require("crypto");
const { Redis } = require("@upstash/redis");

const API_KEY = process.env.API_KEY;

// --- Redis setup ---
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

function randHex(len = 16) {
  return crypto.randomBytes(len).toString("hex");
}

// --- Helpers ---
async function createToken(ip, sessionId) {
  const token = randHex(16);
  await redis.hset(`token:${token}`, { ip, sessionId });
  await redis.expire(`token:${token}`, 300); // 5 min expiry
  return token;
}
async function consumeToken(token, ip, sessionId) {
  const meta = await redis.hgetall(`token:${token}`);
  if (!meta || !meta.ip || !meta.sessionId) return false;
  if (meta.ip !== ip || meta.sessionId !== sessionId) return false;
  await redis.del(`token:${token}`);
  return true;
}

function getSessionIdFromReq(req) {
  const cookie = req.headers.cookie || "";
  const parts = cookie.split(";").map((s) => s.trim());
  for (const p of parts) if (p.startsWith("sessionId=")) return p.split("=")[1];
  return null;
}
function setSessionCookie(res, sessionId) {
  res.setHeader(
    "Set-Cookie",
    `sessionId=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/`
  );
}

// Reservation helpers in Redis
async function setReservation(sessionId, id, number) {
  const expiresAt = Date.now() + 15 * 60 * 1000;
  await redis.hset(`reserve:${sessionId}`, { id, number, expiresAt });
  await redis.expire(`reserve:${sessionId}`, 15 * 60);
}
async function getReservation(sessionId) {
  const r = await redis.hgetall(`reserve:${sessionId}`);
  if (!r || !r.id) return null;
  if (Date.now() > Number(r.expiresAt)) {
    await redis.del(`reserve:${sessionId}`);
    return null;
  }
  return r;
}
async function clearReservation(sessionId) {
  await redis.del(`reserve:${sessionId}`);
}

// --- main handler ---
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, oneTimeToken, Cookie"
  );
  if (req.method === "OPTIONS") return res.status(200).end();

  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
    .split(",")[0]
    .trim();
  let sessionId = getSessionIdFromReq(req);
  const { path } = req.query || {};

  try {
    if (path === "health")
      return res.json({
        status: "OK",
        message: "Server running",
        timestamp: new Date().toISOString(),
      });

    // 🔹 Token endpoint
    if (path === "token") {
      if (!sessionId) {
        sessionId = randHex(12);
        setSessionCookie(res, sessionId);
      }
      const token = await createToken(ip, sessionId);
      return res.json({ success: true, token, sessionId });
    }

    // Protected paths
    const protectedPaths = ["getNumber", "getOtp", "cancelNumber"];
    if (protectedPaths.includes(path)) {
      if (!sessionId)
        return res.status(401).json({ success: false, error: "No session" });

      const token =
        req.query.oneTimeToken ||
        req.headers.onetimetoken ||
        req.headers["oneTimeToken"];
      if (!token)
        return res.status(401).json({ success: false, error: "Missing token" });

      const ok = await consumeToken(token, ip, sessionId);
      if (!ok)
        return res
          .status(403)
          .json({ success: false, error: "Invalid or expired token" });
    }

    // 🔹 getNumber
    if (path === "getNumber") {
      const existing = await getReservation(sessionId);
      if (existing)
        return res.status(409).json({
          success: false,
          error: "Already have active number",
          active: existing,
        });

      const url = `https://firexotp.com/stubs/handler_api.php?action=getNumber&api_key=${API_KEY}&service=wa&country=51`;
      const r = await axios.get(url);
      const data = r.data;
      const p = data.split(":");
      if (p[0] === "ACCESS_NUMBER" && p.length === 3) {
        const id = p[1],
          number = p[2];
        await setReservation(sessionId, id, number);
        const nextToken = await createToken(ip, sessionId);
        return res.json({
          success: true,
          id,
          number,
          nextToken,
          message: "Reserved for 15 min",
        });
      } else return res.json({ success: false, error: data });
    }

    // 🔹 getOtp
    if (path === "getOtp") {
      const id = req.query.id;
      if (!id) return res.json({ success: false, error: "ID required" });
      const r = await getReservation(sessionId);
      if (!r || r.id !== id)
        return res.status(403).json({ success: false, error: "No reservation" });

      const url = `https://firexotp.com/stubs/handler_api.php?action=getStatus&api_key=${API_KEY}&id=${id}`;
      const resp = await axios.get(url);
      const data = resp.data;
      const otpFound = /\b\d{4,8}\b/.test(data);
      if (otpFound) await clearReservation(sessionId);
      const nextToken = await createToken(ip, sessionId);
      return res.json({ success: true, data, otpFound, nextToken });
    }

    // 🔹 cancelNumber
    if (path === "cancelNumber") {
      const id = req.query.id;
      if (!id) return res.json({ success: false, error: "ID required" });
      const r = await getReservation(sessionId);
      if (!r || r.id !== id)
        return res.status(403).json({ success: false, error: "No reservation" });

      const url = `https://firexotp.com/stubs/handler_api.php?action=setStatus&api_key=${API_KEY}&id=${id}&status=8`;
      const resp = await axios.get(url);
      await clearReservation(sessionId);
      const nextToken = await createToken(ip, sessionId);
      return res.json({ success: true, data: resp.data, nextToken });
    }

    return res.json({ error: "Invalid path" });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, error: err.message });
  }
};
