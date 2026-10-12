async function checkLiveStatus() {
  console.log('Checking live deployment status...');

  // 1. Check API
  try {
    const apiRes = await fetch('https://www.wearomnia.com/api/site-settings', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    const apiData = await apiRes.json();
    const s = apiData.settings;
    console.log('API Status:', apiRes.status);
    console.log('API Vercel ID:', apiRes.headers.get('x-vercel-id'));
    console.log('Has is_preorder_campaign_active?', 'is_preorder_campaign_active' in s);
    console.log('preorder_enabled:', s.preorder_enabled);
    console.log('preorder_advance_enabled:', s.preorder_advance_enabled);
    console.log('is_preorder_campaign_active:', s.is_preorder_campaign_active);
    console.log('announcementText:', s.announcementText);
  } catch (err: any) {
    console.error('API check error:', err.message);
  }

  // 2. Check HTML Announcement Ticker
  try {
    const htmlRes = await fetch('https://www.wearomnia.com', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    const html = await htmlRes.text();
    console.log('\nHTML Status:', htmlRes.status);
    console.log('HTML Vercel ID:', htmlRes.headers.get('x-vercel-id'));
    
    // Check ticker contents
    const hasPreOrderStarting = html.includes('PRE-ORDER STARTING');
    const hasPreOrderLive = html.includes('PRE-ORDER IS NOW LIVE');
    const hasAdvancePayment = html.includes('ADVANCE PAYMENT');
    const hasFreeDelivery = html.includes('FREE DELIVERY');
    
    console.log('Contains PRE-ORDER STARTING:', hasPreOrderStarting);
    console.log('Contains PRE-ORDER IS NOW LIVE:', hasPreOrderLive);
    console.log('Contains ADVANCE PAYMENT:', hasAdvancePayment);
    console.log('Contains FREE DELIVERY:', hasFreeDelivery);

    const tickerMatch = html.match(/role="region"[^>]*>([\s\S]*?)<\/div>/i);
    if (tickerMatch) {
      console.log('\nTicker snippet:', tickerMatch[0].substring(0, 300));
    }
  } catch (err: any) {
    console.error('HTML check error:', err.message);
  }
}

checkLiveStatus();
