const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const generateIcons = async () => {
  // Create icons directory if it doesn't exist
  if (!fs.existsSync('public/icons')) {
    fs.mkdirSync('public/icons', { recursive: true });
  }

  // Source logo path
  const sourceLogo = path.join(__dirname, '../src/assets/logo.png');

  // Generate different sizes
  const sizes = [192, 512];

  for (const size of sizes) {
    await sharp(sourceLogo)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 42, g: 42, b: 114, alpha: 1 } // #2A2A72
      })
      .png()
      .toFile(`public/icons/icon-${size}.png`);
    
    console.log(`Generated ${size}x${size} icon`);
  }
};

generateIcons().catch(console.error); 