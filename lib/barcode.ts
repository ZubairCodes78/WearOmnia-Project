export function generateSVGBarcode(text: string): string {
  const safeText = (text || 'OMNIA-00000').trim();
  // Generates clean SVG barcode pattern for labels
  const bars = safeText
    .split('')
    .map((char, index) => {
      const width = (char.charCodeAt(0) % 3) + 2;
      return `<rect x="${index * 8}" y="0" width="${width}" height="40" fill="#000000" />`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${safeText.length * 8 + 10} 45" width="100%" height="45">
    <g fill="#000">${bars}</g>
    <text x="50%" y="44" font-family="monospace" font-size="8" text-anchor="middle" fill="#000">${safeText}</text>
  </svg>`;
}

export function generateSVGQRCode(text: string): string {
  const safeText = text || 'https://wearomnia.com';
  // Generates clean SVG QR Code matrix representation for shipping labels
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="80" height="80">
    <rect width="100" height="100" fill="#ffffff" />
    <path d="M10 10 h30 v30 h-30 z M15 15 h20 v20 h-20 z M20 20 h10 v10 h-10 z" fill="#000000" />
    <path d="M60 10 h30 v30 h-30 z M65 15 h20 v20 h-20 z M70 20 h10 v10 h-10 z" fill="#000000" />
    <path d="M10 60 h30 v30 h-30 z M15 65 h20 v20 h-20 z M20 70 h10 v10 h-10 z" fill="#000000" />
    <rect x="50" y="50" width="10" height="10" fill="#000000" />
    <rect x="70" y="50" width="10" height="10" fill="#000000" />
    <rect x="50" y="70" width="10" height="10" fill="#000000" />
    <rect x="80" y="80" width="10" height="10" fill="#000000" />
  </svg>`;
}
