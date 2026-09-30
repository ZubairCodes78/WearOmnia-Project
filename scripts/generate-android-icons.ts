import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const SOURCE_LOGO = path.resolve('public/logo.png');
const RES_DIR = path.resolve('mobile-admin/android/app/src/main/res');
const FLUTTER_ASSETS_DIR = path.resolve('mobile-admin/assets/images');

// Background color for luxury WearOMNIA branding
const BG_COLOR = { r: 15, g: 17, b: 23, alpha: 1 }; // #0F1117

const DENSITIES = [
  { name: 'mipmap-mdpi', legacy: 48, adaptive: 108 },
  { name: 'mipmap-hdpi', legacy: 72, adaptive: 162 },
  { name: 'mipmap-xhdpi', legacy: 96, adaptive: 216 },
  { name: 'mipmap-xxhdpi', legacy: 144, adaptive: 324 },
  { name: 'mipmap-xxxhdpi', legacy: 192, adaptive: 432 },
];

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  console.log('Generating WearOMNIA Android icons from:', SOURCE_LOGO);

  // 1. Trim source logo to get clean emblem bounding box
  const trimmedBuffer = await sharp(SOURCE_LOGO).trim().toBuffer();
  const trimmedMeta = await sharp(trimmedBuffer).metadata();
  console.log('Trimmed emblem dimensions:', trimmedMeta.width, 'x', trimmedMeta.height);

  // 2. Ensure Flutter assets directory and copy logo for in-app UI
  await ensureDir(FLUTTER_ASSETS_DIR);
  await fs.copyFile(SOURCE_LOGO, path.join(FLUTTER_ASSETS_DIR, 'logo.png'));
  console.log('Copied official logo to mobile-admin/assets/images/logo.png');

  // 3. Generate Android mipmap icons for each density
  for (const d of DENSITIES) {
    const dir = path.join(RES_DIR, d.name);
    await ensureDir(dir);

    // --- A. Adaptive Foreground (ic_launcher_foreground.png) ---
    // Total canvas is d.adaptive x d.adaptive. Logo is placed in center ~60% safe zone.
    const fgLogoSize = Math.round(d.adaptive * 0.60);
    const fgLogo = await sharp(trimmedBuffer)
      .resize(fgLogoSize, fgLogoSize, { fit: 'inside' })
      .toBuffer();

    const fgCanvas = await sharp({
      create: {
        width: d.adaptive,
        height: d.adaptive,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: fgLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    // --- B. Legacy Standard Icon (ic_launcher.png) ---
    // Square with rounded corners on #0F1117 background
    const legacySize = d.legacy;
    const legacyLogoSize = Math.round(legacySize * 0.72);
    const legacyLogo = await sharp(trimmedBuffer)
      .resize(legacyLogoSize, legacyLogoSize, { fit: 'inside' })
      .toBuffer();

    // Create rounded rect mask
    const cornerRadius = Math.round(legacySize * 0.18);
    const roundedRectSvg = Buffer.from(
      `<svg width="${legacySize}" height="${legacySize}"><rect x="0" y="0" width="${legacySize}" height="${legacySize}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#0F1117"/></svg>`
    );

    const legacyBg = await sharp(roundedRectSvg).png().toBuffer();

    await sharp(legacyBg)
      .composite([{ input: legacyLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // --- C. Legacy Round Icon (ic_launcher_round.png) ---
    // Circle mask on #0F1117 background
    const circleSvg = Buffer.from(
      `<svg width="${legacySize}" height="${legacySize}"><circle cx="${legacySize / 2}" cy="${legacySize / 2}" r="${legacySize / 2}" fill="#0F1117"/></svg>`
    );
    const roundBg = await sharp(circleSvg).png().toBuffer();
    const roundLogoSize = Math.round(legacySize * 0.68);
    const roundLogo = await sharp(trimmedBuffer)
      .resize(roundLogoSize, roundLogoSize, { fit: 'inside' })
      .toBuffer();

    await sharp(roundBg)
      .composite([{ input: roundLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    console.log(`Generated icons for ${d.name} (legacy: ${legacySize}x${legacySize}, adaptive: ${d.adaptive}x${d.adaptive})`);
  }

  // 4. Create mipmap-anydpi-v26 adaptive icon XML definitions
  const anydpiDir = path.join(RES_DIR, 'mipmap-anydpi-v26');
  await ensureDir(anydpiDir);

  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;

  await fs.writeFile(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXml, 'utf8');
  await fs.writeFile(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml, 'utf8');
  console.log('Created mipmap-anydpi-v26/ic_launcher.xml and ic_launcher_round.xml');

  // 5. Update or create values/colors.xml for ic_launcher_background
  const valuesDir = path.join(RES_DIR, 'values');
  await ensureDir(valuesDir);
  const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0F1117</color>
</resources>
`;
  await fs.writeFile(path.join(valuesDir, 'colors.xml'), colorsXml, 'utf8');
  console.log('Created values/colors.xml with #0F1117 background color');

  console.log('ALL ANDROID ICONS GENERATED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
