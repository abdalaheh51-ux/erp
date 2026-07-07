const fs = require('fs');
const path = require('path');

const root = process.cwd();
const sourceDir = path.join(root, '.next', 'static');
const targetDir = path.join(root, '.next', 'standalone', '.next', 'static');
const publicDir = path.join(root, 'public');
const publicTargetDir = path.join(root, '.next', 'standalone', 'public');

if (fs.existsSync(sourceDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

if (fs.existsSync(publicDir)) {
  fs.mkdirSync(publicTargetDir, { recursive: true });
  fs.cpSync(publicDir, publicTargetDir, { recursive: true });
}
