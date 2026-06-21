const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isFile()) {
      fs.copyFileSync(fromPath, toPath);
    } else {
      copyFolderSync(fromPath, toPath);
    }
  });
}

const source = path.join(__dirname, '../src/generated/client');
const destination = path.join(__dirname, '../dist/generated/client');

console.log(`Copying Prisma Client from: ${source}`);
console.log(`To: ${destination}`);

copyFolderSync(source, destination);
console.log('✔ Copied Prisma Client from src to dist successfully');
