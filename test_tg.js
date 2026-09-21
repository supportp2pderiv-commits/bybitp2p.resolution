
const https = require('https');
const b64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const fileBuffer = Buffer.from(b64Data, 'base64');
const boundary = '----TelegramBoundary' + Date.now();
const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'test';
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '123';
let data = '';
data += '--' + boundary + '\r\n';
data += 'Content-Disposition: form-data; name="chat_id"\r\n\r\n' + TG_CHAT_ID + '\r\n';
data += '--' + boundary + '\r\n';
data += 'Content-Disposition: form-data; name="document"; filename="test.png"\r\n';
data += 'Content-Type: application/octet-stream\r\n\r\n';
const bodyBuffer = Buffer.concat([Buffer.from(data, 'utf-8'), fileBuffer, Buffer.from('\r\n--' + boundary + '--\r\n', 'utf-8')]);
console.log(bodyBuffer.toString());

