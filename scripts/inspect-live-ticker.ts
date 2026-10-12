async function inspectLiveTicker() {
  const res = await fetch('https://www.wearomnia.com', {
    headers: { 'Cache-Control': 'no-cache' },
  });
  const html = await res.text();
  const tickerMatch = html.match(/<div[^>]*role="region"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
  if (tickerMatch) {
    console.log('--- EXACT LIVE TICKER HTML ---');
    console.log(tickerMatch[0]);
    
    // Extract all text content
    const textOnly = tickerMatch[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log('\n--- EXTRACTED TEXT FROM LIVE TICKER ---');
    console.log(textOnly);
  } else {
    console.log('Could not match ticker container');
  }
}

inspectLiveTicker();
