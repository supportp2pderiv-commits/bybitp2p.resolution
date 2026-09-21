
const https = require('https');
const boundary = '----TelegramBoundary' + Date.now();
const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'dummy';
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'dummy';

const b64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const fileBuffer = Buffer.from(b64Data, 'base64');
let data = '';
data += '--' + boundary + '\r\n';
data += 'Content-Disposition: form-data; name="chat_id"\r\n\r\n' + TG_CHAT_ID + '\r\n';
data += '--' + boundary + '\r\n';
data += 'Content-Disposition: form-data; name="document"; filename="evidence.png"\r\n';
data += 'Content-Type: application/octet-stream\r\n\r\n';

const bodyBuffer = Buffer.concat([
  Buffer.from(data, 'utf-8'),
  fileBuffer,
  Buffer.from('\r\n--' + boundary + '--\r\n', 'utf-8')
]);

const options = {
  hostname: 'api.telegram.org',
  path: '/bot' + TG_BOT_TOKEN + '/sendDocument',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': bodyBuffer.length
  }
};

const req = https.request(options, (res) => {
  console.log('Status: ' + res.statusCode);
  res.on('data', d => console.log(d.toString()));
});
req.on('error', console.error);
req.write(bodyBuffer);
req.end();

