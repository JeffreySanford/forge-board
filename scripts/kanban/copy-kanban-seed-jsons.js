// scripts/copy-kanban-seed-jsons.js
// Copies kanban seed JSON files from src/app/seed to frontend mocks directory

const fs = require('fs');
const path = require('path');

// Corrected source and destination paths
const frontendKanbanDir = path.join(
  __dirname,
  '..',
  '..',
  'forgeboard-frontend',
  'src',
  'app',
  'mocks',
  'kanban'
);
const backendMocksKanbanDir = path.join(
  __dirname,
  '..',
  '..',
  'forgeboard-api',
  'src',
  'app',
  'mocks',
  'kanban'
);
const backendSeedKanbanDir = path.join(
  __dirname,
  '..',
  '..',
  'forgeboard-api',
  'src',
  'app',
  'seed',
  'kanban'
);

// Ensure destination directories exist
if (!fs.existsSync(backendMocksKanbanDir)) {
  fs.mkdirSync(backendMocksKanbanDir, { recursive: true });
  console.log(`Created directory: ${backendMocksKanbanDir}`);
}
if (!fs.existsSync(backendSeedKanbanDir)) {
  fs.mkdirSync(backendSeedKanbanDir, { recursive: true });
  console.log(`Created directory: ${backendSeedKanbanDir}`);
}

// Files to copy
const filesToCopy = [
  'kanban-example-boards.json',
  'kanban-forgeboard-stories.json',
];

console.log('Copying kanban seed files...');

filesToCopy.forEach((file) => {
  const sourcePath = path.join(frontendKanbanDir, file);
  const mocksTargetPath = path.join(backendMocksKanbanDir, file);
  const seedTargetPath = path.join(backendSeedKanbanDir, file);

  try {
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, mocksTargetPath);
      fs.copyFileSync(sourcePath, seedTargetPath);
      console.log(`✓ Copied ${file} to backend mocks and seed`);
    } else {
      console.log(`⚠ Source file not found: ${sourcePath}`);
    }
  } catch (error) {
    console.error(`✗ Error copying ${file}:`, error.message);
  }
});

// Add kablan mock boards file from frontend to backend mocks and seed
const frontendKablanPath = path.join(
  __dirname,
  '..',
  '..',
  'forgeboard-frontend',
  'src',
  'app',
  'mocks',
  'kablan',
  'mock-boards.json'
);
const backendMocksKablanPath = path.join(
  __dirname,
  '..',
  '..',
  'forgeboard-api',
  'src',
  'app',
  'mocks',
  'kanban',
  'mock-boards.json'
);
const backendSeedKablanPath = path.join(
  __dirname,
  '..',
  '..',
  'forgeboard-api',
  'src',
  'app',
  'seed',
  'kanban',
  'mock-boards.json'
);

// Ensure backend mocks/kanban directory exists (already done above)
// Ensure backend seed/kanban directory exists (already done above)

// Copy kablan mock boards file if it exists
if (fs.existsSync(frontendKablanPath)) {
  fs.copyFileSync(frontendKablanPath, backendMocksKablanPath);
  fs.copyFileSync(frontendKablanPath, backendSeedKablanPath);
  console.log('✓ Copied kablan mock-boards.json to backend mocks and seed');
} else {
  console.log(`⚠ Kablan mock-boards.json not found at: ${frontendKablanPath}`);
}

console.log('Copy operation completed.');

// Verify the files exist and show summary
console.log('\nSeed files summary:');
[...filesToCopy, 'mock-boards.json'].forEach((file) => {
  const targetPath = path.join(backendSeedKanbanDir, file);
  if (fs.existsSync(targetPath)) {
    const stats = fs.statSync(targetPath);
    let boardCount = 0;
    try {
      const content = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
      boardCount = Array.isArray(content) ? content.length : 0;
    } catch {}
    console.log(`✓ ${file} (${stats.size} bytes, ${boardCount} boards)`);
  } else {
    console.log(`✗ ${file} - not found`);
  }
});
