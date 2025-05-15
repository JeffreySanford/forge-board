// scripts/copy-kanban-seed-jsons.js
// Copies kanban seed JSON files from src/app/seed to dist/forgeboard-api/seed after build

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../forgeboard-api/src/app/seed');
const destDir = path.join(__dirname, '../dist/forgeboard-api/seed');

function copyFile(file) {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} -> ${dest}`);
}

function main() {
  if (!fs.existsSync(srcDir)) {
    console.error(`Source directory does not exist: ${srcDir}`);
    process.exit(1);
  }
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.json'));
  files.forEach(copyFile);
  console.log('Kanban seed JSON files copied successfully.');
}

main();
