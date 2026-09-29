const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function run() {
  const dir = path.join(__dirname, '..', 'public', 'images');
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      const input = path.join(dir, file);
      const name = path.parse(file).name;
      const output = path.join(dir, `${name}.webp`);

      const inputStat = fs.statSync(input);
      await sharp(input)
        .rotate()
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 84 })
        .toFile(output);

      const outStat = fs.statSync(output);
      console.log(`Optimized ${file}: ${(inputStat.size / 1024).toFixed(1)}KB -> ${(outStat.size / 1024).toFixed(1)}KB (-${Math.round((1 - outStat.size / inputStat.size) * 100)}%)`);
    }
  }

  // Also create public/images/founder.webp from hero-1.jpg or hero-2.jpg
  const hero2 = path.join(dir, 'hero-2.jpg');
  if (fs.existsSync(hero2)) {
    const founderWebp = path.join(dir, 'founder.webp');
    const founderJpg = path.join(dir, 'founder.jpg');
    await sharp(hero2)
      .rotate()
      .resize({ width: 1600, height: 2000, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 86 })
      .toFile(founderWebp);

    await sharp(hero2)
      .rotate()
      .resize({ width: 1600, height: 2000, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toFile(founderJpg);

    console.log('Created founder.webp & founder.jpg from hero-2 authentic portrait');
  }
}

run().catch(console.error);
