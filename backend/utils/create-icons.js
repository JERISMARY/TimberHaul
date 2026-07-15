const fs = require('fs');
const path = require('path');

const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const buffer = Buffer.from(b64, 'base64');

const dir = path.join(__dirname, '../frontend/assets/icons');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(path.join(dir, 'icon-192x192.png'), buffer);
fs.writeFileSync(path.join(dir, 'icon-512x512.png'), buffer);
console.log("Icons created.");
