const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '../../frontend');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Replace onclick="location.href='...'"
  content = content.replace(/onclick="location\.href='([^']+)'"/g, 'data-href="$1"');
  content = content.replace(/onclick='location\.href="([^"]+)"'/g, 'data-href="$1"');
  
  // 2. We can create a unified data-action attribute for simple function calls without args.
  // E.g., onclick="Auth.logout()" -> data-action="Auth.logout"
  content = content.replace(/onclick="([a-zA-Z0-9_\.]+)\(\)"/g, 'data-action="$1"');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

processDir(frontendDir);
