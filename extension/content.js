const SYNC_CONFIG = { MIN_DELAY: 800, MAX_DELAY: 1800, VERSION: '21.0 Stealth' };
const wait = (ms) => new Promise(res => setTimeout(res, ms));

async function stealthScroll() {
  const overlay = createStatusOverlay("ENGINE GHOST v21.0 INITIALIZED...");
  let currentPos = 0;
  let lastHeight = document.body.scrollHeight;
  let stationaryCount = 0;
  let forceStop = false;

  const stopBtn = document.createElement('button');
  stopBtn.innerText = "FINISH NOW";
  stopBtn.style.cssText = "margin-top: 15px; background: #6366f1; color: white; border: none; padding: 10px 15px; border-radius: 12px; font-size: 11px; font-weight: 900; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.3);";
  stopBtn.onmouseover = () => { stopBtn.style.transform = "scale(1.05)"; };
  stopBtn.onmouseout = () => { stopBtn.style.transform = "scale(1)"; };
  stopBtn.onclick = () => { forceStop = true; };
  overlay.appendChild(stopBtn);

  // Smooth start nudge
  window.scrollTo({ top: 400, behavior: 'smooth' });
  await wait(1000);

  // Main stealth scroll loop
  while (stationaryCount < 10 && !forceStop) { 
    // Human-like scroll jumps with jitter
    const scrollStep = Math.floor(Math.random() * 900) + 400;
    currentPos += scrollStep;
    window.scrollTo({ top: currentPos, behavior: 'smooth' });
    
    // Dynamic randomized delay
    const delay = Math.floor(Math.random() * (SYNC_CONFIG.MAX_DELAY - SYNC_CONFIG.MIN_DELAY)) + SYNC_CONFIG.MIN_DELAY;
    await wait(delay);
    
    const newHeight = document.body.scrollHeight;
    const progress = Math.min(99, Math.round((currentPos / Math.max(newHeight, currentPos + 1)) * 100));
    updateOverlayProgress(overlay, progress, stationaryCount);

    // Better page bottom detection
    if (newHeight <= lastHeight && currentPos >= newHeight - window.innerHeight - 100) {
      stationaryCount++;
    } else {
      stationaryCount = 0;
      lastHeight = newHeight;
    }
    
    // Hard safety limit
    if (currentPos > 60000) break;
  }
  
  updateOverlayProgress(overlay, 100, 10);
  const statusTxt = document.getElementById("rp-status-text");
  if (statusTxt) statusTxt.innerHTML = '<span style="color: #10b981; font-weight: 900;">SYNC COMPLETED</span>';
  if (stopBtn) stopBtn.remove();
  await wait(1200);
  overlay.remove();
  return scrapeData();
}

function createStatusOverlay(text) {
  const div = document.createElement('div');
  div.id = "rp-overlay";
  div.style.cssText = "position: fixed; bottom: 25px; right: 25px; z-index: 2147483647; background: #0f172a; color: white; padding: 30px; border-radius: 28px; font-family: sans-serif; box-shadow: 0 30px 60px rgba(0,0,0,0.6); border: 2px solid #6366f1; min-width: 300px; text-align: center; border-left: 8px solid #6366f1;";
  div.innerHTML = '<div style="font-size: 10px; text-transform: uppercase; letter-spacing: 3px; color: #818cf8; margin-bottom: 12px; font-weight: 800;">ResellPro Stealth v21.0</div>' +
                  '<div id="rp-status-text" style="font-weight: 900; margin-bottom: 20px; font-size: 15px; font-style: italic;">' + text + '</div>' +
                  '<div style="width: 100%; background: #1e293b; height: 10px; border-radius: 5px; overflow: hidden;">' +
                  '<div id="rp-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #6366f1, #818cf8); transition: width 0.4s ease;"></div></div>' +
                  '<div id="rp-sub-status" style="font-[7px]; text-transform: uppercase; color: #475569; margin-top: 10px; font-weight: 800;">Waiting for engine...</div>';
  document.body.appendChild(div);
  return div;
}

function updateOverlayProgress(overlay, progress, stage) {
  const bar = overlay.querySelector("#rp-progress-bar");
  const sub = overlay.querySelector("#rp-sub-status");
  if (bar) bar.style.width = progress + "%";
  if (sub) sub.innerText = "Analyzing Sector " + progress + "% | Probe " + (stage + 1) + "/10";
}

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
    '.web_ui__Cell__cell',
    'article'
  ];
  
  const containers = document.querySelectorAll(selectors.join(", "));
  const isSalesPage = /transactions|orders|sold|sales|achats|mes_ventes/.test(window.location.href);
  
  containers.forEach(el => {
    try {
      const text = el.innerText || "";
      const priceMatch = text.match(/(\d+[,.]?\d*)\s*[€£$]/) || text.match(/[€£$]\s*(\d+[,.]?\d*)/);
      const img = el.querySelector("img");
      
      if (priceMatch && img && img.src && !img.src.includes("avatar")) {
        const lines = text.split("\n")
          .map(l => l.trim())
          .filter(l => {
            const lower = l.toLowerCase();
            return l.length > 2 && 
                   !l.includes("€") && !l.includes("£") && !l.includes("$") && 
                   !/\d+ (vues|views|vistas)/i.test(l) &&
                   !/favoris|favori|likes|like/i.test(lower) && 
                   !/vendu|sold|finalis|termin|verkocht|venduto|éditer|modifier/i.test(lower);
          });
        
        const titleCandidate = lines.sort((a, b) => b.length - a.length)[0] || "Article Vinted";
        const brandCandidate = lines.find(l => l !== titleCandidate && l.length > 2) || "";
        
        const lowerText = text.toLowerCase();
        const isSold = /vendu|sold|finalis|termin|verkocht|venduto/.test(lowerText);
        const status = (isSalesPage || isSold) ? "SOLD" : "IN_STOCK";
        
        items.push({ 
          title: titleCandidate.substring(0, 100), 
          brand: brandCandidate.substring(0, 50), 
          salePrice: parseFloat((priceMatch[1] || "0").replace(",", ".")), 
          imageUrl: img.src, 
          status, 
          date: new Date().toISOString().split("T")[0] 
        });
      }
    } catch (e) {}
  });

  const unique = items.filter((v,i,a)=>a.findIndex(t=>(t.imageUrl===v.imageUrl))===i);
  return { platform: "VINTED", items: unique };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "START_SYNC") {
    stealthScroll().then(data => {
      sendResponse({ success: true, data });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true; 
  }
});
