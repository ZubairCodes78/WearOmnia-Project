async function checkOtherPages() {
  const pages = [
    'https://www.wearomnia.com/shop',
    'https://www.wearomnia.com/product/midnight-bloom-slub-khaddar-angrakha-3-piece-suit-588e',
    'https://www.wearomnia.com/checkout',
  ];

  for (const url of pages) {
    const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
    const html = await res.text();
    const hasPreOrder = html.includes('PRE-ORDER STARTING') || html.includes('PRE-ORDER IS NOW LIVE');
    const hasAdvance = html.includes('ADVANCE PAYMENT REQUIRED') || html.includes('ADVANCE PAYMENT TO CONFIRM');
    const hasFreeDelivery = html.includes('FREE DELIVERY');
    console.log(`URL: ${url}`);
    console.log(`  Status: ${res.status}`);
    console.log(`  Pre-Order in ticker: ${hasPreOrder}`);
    console.log(`  Advance in ticker: ${hasAdvance}`);
    console.log(`  Free Delivery present: ${hasFreeDelivery}`);
  }
}

checkOtherPages();
