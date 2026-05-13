/**
 * ResellPro Stealth Sync v15.0
 * The ultimate Vinted companion extension
 */

const SYNC_CONFIG = {
  MIN_DELAY: 800,
  MAX_DELAY: 2500,
  JITTER: 300,
  VERSION: '15.0 Stealth'
};

const wait = (min, max) => {
  const ms = Math.floor(Math.random() * (max - min + 1) + min);
  return new Promise(resolve => setTimeout(resolve, ms));
};

// --- STEALTH ENGINE ---
async function stealthScroll() {
  console.log("%c[ResellPro] Stealth Engine Initialized", "color: #6366f1; font-weight: bold;");
  let currentPos = 0;
  const totalHeight = document.body.scrollHeight;
  const overlay = createStatusOverlay("Synchronisation Furtive...");

  while (currentPos < totalHeight) {
    const jump = Math.floor(Math.random() * 400) + 200;
    currentPos += jump;
    window.scrollTo({ top: currentPos, behavior: 'smooth' });
    
    // Update progress
    const progress = Math.min(100, Math.round((currentPos / totalHeight) * 100));
    updateOverlayProgress(overlay, progress);
    
    await wait(SYNC_CONFIG.MIN_DELAY, SYNC_CONFIG.MAX_DELAY);
    if (currentPos > 15000) break; // Safety limit
  }
  
  overlay.remove();
  return scrapeData();
}

// --- OVERLAY UI ENGINE ---
function createStatusOverlay(text) {
  const div = document.createElement('div');
  div.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 99999; background: #0f172a; color: white; padding: 20px; border-radius: 16px; font-family: sans-serif; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); border: 2px solid #6366f1; min-width: 250px;";
  div.innerHTML = `
    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #818cf8; margin-bottom: 8px;">ResellPro Ghost Mode</div>
    <div id="rp-status-text" style="font-weight: 800; margin-bottom: 10px;">${text}</div>
    <div style="width: 100%; background: #1e293b; height: 6px; border-radius: 3px; overflow: hidden;">
      <div id="rp-progress-bar" style="width: 0%; height: 100%; background: #6366f1; transition: width 0.3s ease;"></div>
    </div>
  `;
  document.body.appendChild(div);
  return div;
}

function updateOverlayProgress(overlay, progress) {
  const bar = overlay.querySelector('#rp-progress-bar');
  if (bar) bar.style.width = progress + "%";
}

// --- SMART OVERLAYS (On Vinted Cards) ---
function injectSmartLabels() {
  const items = document.querySelectorAll('.feed-grid__item, .profile__items-grid-item, [data-testid*="grid-item"]');
  
  items.forEach(async (item) => {
    if (item.querySelector('.resellpro-badge')) return;

    const priceText = item.innerText.match(/(\d+[,.]?\d*)\s*€/);
    if (priceText) {
      const price = parseFloat(priceText[1].replace(',', '.'));
      const margin = (price * 1.6 - price).toFixed(2); // Example logic
      
      const badge = document.createElement('div');
      badge.className = 'resellpro-badge';
      badge.style.cssText = "position: absolute; top: 10px; left: 10px; z-index: 10; background: rgba(99, 102, 241, 0.95); color: white; padding: 4px 8px; border-radius: 8px; font-size: 9px; font-weight: 900; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2);";
      badge.innerHTML = `💰 Marge Est. ${margin}€`;
      
      const container = item.querySelector('.item-card__image-container, .web_ui__ItemBox__image-container, [data-testid*="image-container"]') || item;
      container.style.position = 'relative';
      container.appendChild(badge);
    }
  });
}

// --- DATA SCRAPER ---
function scrapeData() {
  const items = [];
  const itemContainers = document.querySelectorAll('.feed-grid__item, .user-main-stats__item, .profile__items-grid-item, [data-testid*="grid-item"]');
  const isSalesPage = window.location.href.includes('type=sold');

  itemContainers.forEach(container => {
    try {
      const priceMatch = container.innerText.match(/(\d+[,.]?\d*)\s*€/);
      const img = container.querySelector('img');
      
      if (priceMatch && img && img.src && !img.src.includes('avatar')) {
        const title = container.innerText.split('\n')[0];
        const status = (isSalesPage || container.innerText.toLowerCase().includes('vendu')) ? 'SOLD' : 'IN_STOCK';
        
        items.push({
          title,
          brand: title.split(' ')[0],
          salePrice: parseFloat(priceMatch[1].replace(',', '.')),
          imageUrl: img.src,
          status,
          date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (e) {}
  });

  return { platform: 'VINTED', items };
}

// Initial Run
setInterval(injectSmartLabels, 3000);

// Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "START_SYNC") {
    stealthScroll().then(data => sendResponse({ data }));
    return true; // Keep channel open
  }
});
