/**
 * SMS service. Picks the first configured provider in this order:
 *   1. Notify.lk          (best for Sri Lanka, free trial credits)
 *   2. Text.lk            (Sri Lanka)
 *   3. Twilio             (international fallback)
 *   4. Dev mode           (logs to console, never sends)
 *
 * Env vars (only set the provider you want to use):
 *
 *   # Notify.lk — https://app.notify.lk/
 *   NOTIFY_LK_USER_ID=...
 *   NOTIFY_LK_API_KEY=...
 *   NOTIFY_LK_SENDER_ID=NotifyDEMO     # default sender
 *
 *   # Text.lk — https://app.text.lk/
 *   TEXT_LK_API_TOKEN=...
 *   TEXT_LK_SENDER_ID=TextLKDemo
 *
 *   # Twilio — https://www.twilio.com/console
 *   TWILIO_ACCOUNT_SID=...
 *   TWILIO_AUTH_TOKEN=...
 *   TWILIO_FROM_NUMBER=+1...
 *   TWILIO_MESSAGING_SERVICE_SID=...
 *
 *   SMS_DEFAULT_COUNTRY_CODE=+94       # default for Sri Lanka
 */

const https = require("https");

let twilioClient = null;

function getTwilioClient() {
  if (twilioClient) return twilioClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  try {
    const twilio = require("twilio");
    twilioClient = twilio(sid, token);
    return twilioClient;
  } catch (err) {
    console.error("[SMS] Failed to init Twilio:", err.message);
    return null;
  }
}

/**
 * Convert "0712345678" / "712345678" / "+94712345678" / "94712345678"
 * into E.164 (e.g. "+94712345678").
 */
function toE164(raw) {
  if (!raw) return null;
  const cc = process.env.SMS_DEFAULT_COUNTRY_CODE || "+94";
  let s = String(raw).replace(/[\s-]/g, "").trim();
  if (s.startsWith("+")) return s;
  if (s.startsWith("00")) return `+${s.slice(2)}`;
  if (s.startsWith("0")) return `${cc}${s.slice(1)}`;
  if (s.startsWith(cc.replace("+", ""))) return `+${s}`;
  if (/^\d+$/.test(s)) return `${cc}${s}`;
  return null;
}

/** Strip leading "+" — Notify.lk and Text.lk expect the number without "+". */
function toLocalDigits(e164) {
  return e164 ? e164.replace(/^\+/, "") : "";
}

function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, body });
          }
        });
      })
      .on("error", reject);
  });
}

function httpsPostJson(url, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(payload);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          Accept: "application/json",
          ...headers,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, body });
          }
        });
      },
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function sendViaNotifyLk(toE164Number, body) {
  const userId = process.env.NOTIFY_LK_USER_ID;
  const apiKey = process.env.NOTIFY_LK_API_KEY;
  if (!userId || !apiKey) return null;

  const senderId = process.env.NOTIFY_LK_SENDER_ID || "NotifyDEMO";
  const to = toLocalDigits(toE164Number);
  const url = new URL("https://app.notify.lk/api/v1/send");
  url.searchParams.set("user_id", userId);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("sender_id", senderId);
  url.searchParams.set("to", to);
  url.searchParams.set("message", body);

  try {
    const { status, body: resp } = await httpsGetJson(url.toString());
    const ok =
      status === 200 &&
      (resp?.status === "success" ||
        resp?.status === true ||
        resp?.status === "sent");
    if (ok) {
      return { delivered: true, provider: "notify.lk", raw: resp };
    }
    return {
      delivered: false,
      provider: "notify.lk",
      reason:
        (typeof resp === "object" && (resp.message || resp.data?.message)) ||
        `HTTP ${status}`,
      raw: resp,
    };
  } catch (err) {
    return { delivered: false, provider: "notify.lk", reason: err.message };
  }
}

async function sendViaTextLk(toE164Number, body) {
  const apiToken = process.env.TEXT_LK_API_TOKEN;
  if (!apiToken) return null;

  const senderId = process.env.TEXT_LK_SENDER_ID || "TextLKDemo";
  const to = toLocalDigits(toE164Number);

  try {
    const { status, body: resp } = await httpsPostJson(
      "https://app.text.lk/api/v3/sms/send",
      { recipient: to, sender_id: senderId, type: "plain", message: body },
      { Authorization: `Bearer ${apiToken}` },
    );
    const ok = status >= 200 && status < 300 && (resp?.status === "success" || resp?.success === true);
    if (ok) return { delivered: true, provider: "text.lk", raw: resp };
    return {
      delivered: false,
      provider: "text.lk",
      reason: (typeof resp === "object" && (resp.message || resp.error)) || `HTTP ${status}`,
      raw: resp,
    };
  } catch (err) {
    return { delivered: false, provider: "text.lk", reason: err.message };
  }
}

async function sendViaTwilio(toE164Number, body) {
  const client = getTwilioClient();
  if (!client) return null;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!messagingServiceSid && !from) return null;
  try {
    const message = await client.messages.create({
      to: toE164Number,
      body,
      ...(messagingServiceSid ? { messagingServiceSid } : { from }),
    });
    return { delivered: true, provider: "twilio", sid: message.sid };
  } catch (err) {
    return { delivered: false, provider: "twilio", reason: err.message };
  }
}

async function sendSms(to, body) {
  const e164 = toE164(to);
  if (!e164) return { delivered: false, reason: "Invalid mobile number format" };

  const providers = [sendViaNotifyLk, sendViaTextLk, sendViaTwilio];
  for (const fn of providers) {
    const result = await fn(e164, body);
    if (!result) continue; // provider not configured
    if (result.delivered) {
      console.log(`[SMS] sent via ${result.provider} -> ${e164}`);
      return result;
    }
    console.warn(`[SMS] ${result.provider} failed: ${result.reason}`);
    // Try next provider on failure
  }

  console.log(`[SMS:dev] -> ${e164}: ${body}`);
  return { delivered: false, dev: true, reason: "No SMS provider configured" };
}

async function sendOtp(mobile, otp) {
  const body = `Book Your Artist verification code: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`;
  return sendSms(mobile, body);
}

module.exports = { sendSms, sendOtp, toE164 };
