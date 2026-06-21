const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

// Create SVG icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#07070a"/>
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9333ea"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
  </defs>
  <circle cx="256" cy="200" r="90" fill="none" stroke="url(#g)" stroke-width="36"/>
  <rect x="306" y="110" width="36" height="140" rx="8" fill="url(#g)"/>
  <rect x="306" y="270" width="36" height="70" rx="18" fill="url(#g)"/>
  <rect x="170" y="195" width="36" height="175" rx="18" fill="url(#g)"/>
  <circle cx="188" cy="352" r="44" fill="url(#g)"/>
  <circle cx="324" cy="322" r="44" fill="url(#g)"/>
</svg>`;

fs.writeFileSync(path.join(outDir, 'icon.svg'), svgIcon);
console.log('SVG icon created');

// Use canvas to create PNG versions if available, otherwise just create a simple PNG using raw bytes
// Let's create a simple script that copies the PNG image and resizes via ImageMagick or uses pure JS fallback

// Check if the source PNG exists
const srcPng = path.join('C:', 'Users', 'U', '.gemini', 'antigravity-ide', 'brain', 'd7f94788-8988-4b5a-b1f3-dd292ea5db46', 'aura_stream_icon_1781806485876.png');

if (fs.existsSync(srcPng)) {
  console.log('Source PNG found:', srcPng);
  // For now, just copy the source image as all sizes (it will display at correct size via HTML)
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  for (const size of sizes) {
    fs.copyFileSync(srcPng, path.join(outDir, `icon-${size}x${size}.png`));
    console.log(`Copied icon-${size}x${size}.png`);
  }
  console.log('All icons created!');
} else {
  console.log('Source PNG not found at:', srcPng);
  console.log('Icons directory created. Manually add PNG icons or they will use SVG fallback.');
}
