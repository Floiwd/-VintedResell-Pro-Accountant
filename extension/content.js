/**
 * ResellPro Stealth Sync v20.0
 * The ultimate Vinted companion extension
 */

const SYNC_CONFIG = {
  MIN_DELAY: 800,
  MAX_DELAY: 2200,
  VERSION: '20.0 Ghost'
};

const wait = (min, max) => {
  const ms = Math.floor(Math.random() * (max - min + 1) + min);
  return new Promise(resolve => setTimeout(resolve, ms));
};

// --- STEALTH ENGINE ---
async function stealthScroll() {
  console.log("%c[ResellPro] Stealth Engine v20.0 Initialized", "color: #6366f1; font-weight: bold;");
  let currentPos = 0;
  let lastHeight = document.body.scrollHeight;
  let stationaryCount = 0;
  const overlay = createStatusOverlay("Synchronisation Furtive v20.0...");

  while (stationaryCount < 10) {
    const jump = Math.floor(Math.random() * 800) + 400;
    currentPos += jump;
    window.scrollTo({ top: currentPos, behavior: 'smooth' });
    
    // Update progress
    const progress = Math.min(99, Math.round((currentPos / Math.max(lastHeight, currentPos + 1)) * 100));
    updateOverlayProgress(overlay, progress);
    
    await wait(SYNC_CONFIG.MIN_DELAY, SYNC_CONFIG.MAX_DELAY);
    
    const newHeight = document.body.scrollHeight;
    if (newHeight <= lastHeight && currentPos >= newHeight - 300) {
      stationaryCount++;
    } else {
      stationaryCount = 0;
      lastHeight = newHeight;
    }

    if (currentPos > 40000) break; // Safety limit
  }
  
  updateOverlayProgress(overlay, 100);
  const statusTxt = document.getElementById("rp-status-text");
  if (statusTxt) statusTxt.innerHTML = '<span style="color: #10b981;">SYNC OK</span>';
  await wait(1000, 1500);
  overlay.remove();
  return scrapeData();
}

// --- OVERLAY UI ENGINE ---
function createStatusOverlay(text) {
  const div = document.createElement('div');
  div.id = "rp-overlay";
  div.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 2147483647; background: #0f172a; color: white; padding: 25px; border-radius: 24px; font-family: sans-serif; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border: 2px solid #6366f1; min-width: 280px; text-align: center;";
  div.innerHTML = `
    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #818cf8; margin-bottom: 8px; font-weight: 800;">ResellPro Ghost Mode</div>
    <div id="rp-status-text" style="font-weight: 900; margin-bottom: 12px; font-size: 14px;">${text}</div>
    <div style="width: 100%; background: #1e293b; height: 8px; border-radius: 4px; overflow: hidden;">
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

// --- DATA SCRAPER ---
function scrapeData() {
  const items = [];
  const selectors = [
    '[data-testid*="grid-item"]',
    '[data-testid*="item-card"]',
    '.feed-grid__item',
    '.user-main-stats__item',
    '.profile__items-grid-item',
    '.c-order-list__item',
    '.purchase-item',
    '.order-list-item',
    '.t-item-box',
    'article'
  ];
  
  const containers = document.querySelectorAll(selectors.join(", "));
  const isSalesPage = /transactions|orders|sold|sales|achats|mes_ventes/.test(window.location.href);

  containers.forEach(container => {
    try {
      const text = container.innerText || "";
      const priceMatch = text.match(/(\d+[,.]?\d*)\s*[€£$]/) || text.match(/[€£$]\s*(\d+[,.]?\d*)/);
      const img = container.querySelector('img');
      
      if (priceMatch && img && img.src && !img.src.includes('avatar')) {
        const lines = text.split('\n')
          .map(l => l.trim())
          .filter(l => {
            const lower = l.toLowerCase();
            return l.length > 2 && 
                   !l.includes("€") && !l.includes("£") && !l.includes("$") && 
                   !/\d+ (vues|views|vistas|visualizações)/i.test(l) &&
                   !/favoris|favori|likes|likes|favori/i.test(lower) && 
                   !/vendu|sold|finalis|termin|verkocht|venduto|éditer|modifier/i.test(lower);
          });
        
        const title = lines.sort((a, b) => b.length - a.length)[0] || "Article Vinted";
        const brand = lines.find(l => l !== title && l.length > 2) || "";
        
        const lowerText = text.toLowerCase();
        const isSold = lowerText.includes("vendu") || lowerText.includes("sold") || lowerText.includes("finalis") || lowerText.includes("termin") || lowerText.includes("verkocht") || lowerText.includes("venduto");
        const status = (isSalesPage || isSold) ? 'SOLD' : 'IN_STOCK';
        
        items.push({
          title: title.substring(0, 100),
          brand: brand.substring(0, 50),
          salePrice: parseFloat(priceMatch[1].replace(',', '.')),
          imageUrl: img.src,
          status,
          date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (e) {}
  });

  const uniqueItems = items.filter((v,i,a)=>a.findIndex(t=>(t.imageUrl===v.imageUrl))===i);
  return { platform: 'VINTED', items: uniqueItems };
}

// Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "START_SYNC") {
    stealthScroll().then(data => sendResponse({ success: true, data })).catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open
  }
});
