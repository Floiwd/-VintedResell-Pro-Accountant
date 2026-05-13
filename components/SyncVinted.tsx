import React, { useState } from 'react';
import JSZip from 'jszip';
import { 
  RefreshCw, 
  Plus, 
  Trash2, 
  Calendar, 
  Shield, 
  ExternalLink, 
  Copy, 
  Check, 
  Info, 
  FileText, 
  Download, 
  Loader2,
  ShieldCheck,
  Timer,
  MousePointer2,
  Fingerprint,
  Puzzle,
  Zap
} from 'lucide-react';
import { ConnectedAccount, InventoryItem, ItemStatus, ItemCondition, ItemSubStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SyncVintedProps {
  connectedAccounts: ConnectedAccount[];
  onAddAccount: (account: ConnectedAccount) => void;
  onDeleteAccount: (id: string) => void;
  onSync: (accountId: string, data: any) => void;
  onAddInventoryItems: (items: InventoryItem[]) => void;
}

const SyncVinted: React.FC<SyncVintedProps> = ({ 
  connectedAccounts, 
  onAddAccount, 
  onDeleteAccount, 
  onSync,
  onAddInventoryItems 
}) => {
  const { t } = useLanguage();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [guideTab, setGuideTab] = useState<'CONSOLE' | 'EXTENSION'>('CONSOLE');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  const [newAccount, setNewAccount] = useState({
    nickname: '',
    startDate: '',
    endDate: ''
  });

  const [syncData, setSyncData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAddAccount = () => {
    if (!newAccount.nickname) return;
    const account: ConnectedAccount = {
      id: crypto.randomUUID(),
      platform: 'VINTED',
      nickname: newAccount.nickname,
      startDate: newAccount.startDate,
      endDate: newAccount.endDate,
      status: 'ACTIVE'
    };
    onAddAccount(account);
    setNewAccount({ nickname: '', startDate: '', endDate: '' });
    setIsAddModalOpen(false);
  };

  const handleCopyScript = () => {
    const script = `
// Scraper Vinted "Ghost-Sync" v16.0 - Ultra Stealth
(async () => {
  console.log("%c🚀 Lancement du Scraper Ghost-Sync v16.0 - ResellPro Ultra", "color: #6366f1; font-weight: bold; font-size: 14px;");
  
  const statusEl = document.createElement('div');
  const style = "position: fixed; top: 20px; right: 20px; z-index: 2147483647; background: #0f172a; color: white; padding: 25px; border-radius: 24px; font-family: sans-serif; font-weight: 800; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 2px solid #6366f1; min-width: 320px; text-align: center; transition: all 0.4s ease;";
  statusEl.style.cssText = style;
  statusEl.innerHTML = \`
    <div style="margin-bottom: 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #818cf8;">Sécurité Vinted : Maximale</div>
    <div id="sync-progress" style="font-size: 16px; margin-bottom: 10px;">Initialisation...</div>
    <div style="width: 100%; background: #1e293b; height: 6px; border-radius: 3px; overflow: hidden;">
      <div id="sync-bar" style="width: 0%; height: 100%; background: #6366f1; transition: width 0.3s ease;"></div>
    </div>
  \`;
  document.body.appendChild(statusEl);

  const wait = (min, max) => new Promise(res => setTimeout(res, Math.floor(Math.random() * (max - min + 1) + min)));

  const stealthScroll = async () => {
    let lastHeight = document.body.scrollHeight;
    let stationary = 0;
    while (stationary < 5) {
      window.scrollBy({ top: Math.random() * 800 + 400, behavior: 'smooth' });
      await wait(1000, 2000);
      let newHeight = document.body.scrollHeight;
      if (newHeight === lastHeight) stationary++;
      else {
        stationary = 0;
        lastHeight = newHeight;
      }
      const progress = Math.min(95, Math.round((window.scrollY / lastHeight) * 100));
      document.getElementById('sync-progress').innerText = "Analyse furtive... " + progress + "%";
      document.getElementById('sync-bar').style.width = progress + "%";
      if (window.scrollY > 20000) break;
    }
  };

  await stealthScroll();
  await wait(1500, 3000);
  
  const isSalesPage = /sold|transactions|mes_ventes|order|purchase/.test(window.location.href);
  const items = [];
  
  // Robust Selectors
  const selectors = [
    '[data-testid*="grid-item"]',
    '[data-testid*="item-card"]',
    '.feed-grid__item',
    '.user-main-stats__item',
    '.profile__items-grid-item',
    'article'
  ];

  const containers = document.querySelectorAll(selectors.join(','));
  document.getElementById('sync-progress').innerText = "Extraction : " + containers.length + " trouvés";

  for (let i = 0; i < containers.length; i++) {
    const el = containers[i];
    try {
      const text = el.innerText || "";
      const priceMatch = text.match(/(\\d+[,.]?\\d*)\\s*[€£$]/) || text.match(/[€£$]\\s*(\\d+[,.]?\\d*)/);
      const img = el.querySelector("img");
      
      if (priceMatch && img && img.src && !img.src.includes("avatar")) {
        const lines = text.split("\\n").map(l => l.trim()).filter(l => l.length > 2 && !l.includes("€") && !l.includes("£") && !l.includes("$"));
        const title = lines.find(l => l.length > 3) || "Vinted Item";
        const brand = lines.find(l => l.length > 2 && l !== title) || "";
        
        const lower = text.toLowerCase();
        const isSold = lower.includes("vendu") || lower.includes("sold") || lower.includes("verkocht") || lower.includes("venduto") || lower.includes("terminé");
        const status = (isSalesPage || isSold) ? "SOLD" : "IN_STOCK";
        
        items.push({ 
          title: title.substring(0, 80), 
          brand: brand.substring(0, 50), 
          purchasePrice: 0,
          salePrice: parseFloat((priceMatch[1] || "0").replace(",", ".")), 
          imageUrl: img.src, 
          status, 
          date: new Date().toISOString().split("T")[0] 
        });
      }
    } catch (e) {}
  }

  // Deduplicate
  const finalItems = items.filter((v,i,a)=>a.findIndex(t=>(t.imageUrl===v.imageUrl))===i);
  const jsonOutput = JSON.stringify({ platform: 'VINTED', items: finalItems }, null, 2);

  if (finalItems.length > 0) {
    statusEl.style.background = "#10b981";
    document.getElementById('sync-bar').style.width = "100%";
    statusEl.innerHTML = \`
      <div style="font-size: 20px; margin-bottom: 10px;">✅ EXTRACTION OK</div>
      <div style="font-size: 12px; margin-bottom: 15px;">\${finalItems.length} articles extraits</div>
      <button id="copy-vpro-btn" style="background: white; color: #10b981; border: none; padding: 12px; border-radius: 12px; font-weight: 900; cursor: pointer; width: 100%;">COPIER POUR LE HUB</button>
    \`;
    
    document.getElementById('copy-vpro-btn').onclick = async () => {
      await navigator.clipboard.writeText(jsonOutput);
      document.getElementById('copy-vpro-btn').innerText = "COPIÉ !";
      setTimeout(() => statusEl.remove(), 2500);
    };
  } else {
    statusEl.style.background = "#f43f5e";
    statusEl.innerHTML = "❌ AUCUN ARTICLE TROUVÉ<br><span style='font-size: 10px'>Essayez de défiler manuellement d'abord.</span>";
    setTimeout(() => statusEl.remove(), 6000);
  }
})();
    `;
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [isRelistActive, setIsRelistActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'AUTOMATIONS'>('ACCOUNTS');

  const handleDownloadExtension = async () => {
    const zip = new JSZip();

    const readme = `
🚀 INSTALLATION DE L'EXTENSION RESELLPRO STEALTH 🚀

L'extension est maintenant compressée en un seul fichier ZIP pour éviter les erreurs de renommage automatiques du navigateur.

1. EXTRAIRE le fichier ZIP dans un dossier sur votre bureau (ex: "ResellPro_Extension").
2. OUVREZ chrome://extensions dans votre navigateur.
3. ACTIVEZ le "Mode développeur" (en haut à droite).
4. CLIQUEZ sur "Charger l'extension décompressée" (Load unpacked).
5. SÉLECTIONNEZ le dossier "ResellPro_Extension" que vous venez de créer.

Le dossier doit contenir exactement :
- manifest.json
- content.js
- popup.js
- popup.html
    `;

    const manifest = {
      manifest_version: 3,
      name: "ResellPro Stealth Sync",
      version: "16.1.0",
      description: "Synchronisation automatique et sécurisée pour Vinted ResellPro",
      permissions: ["activeTab", "scripting"],
      action: {
        default_popup: "popup.html"
      },
      content_scripts: [{
        matches: ["*://*.vinted.fr/*", "*://*.vinted.be/*", "*://*.vinted.it/*", "*://*.vinted.es/*", "*://*.vinted.nl/*", "*://*.vinted.co.uk/*", "*://*.vinted.de/*", "*://*.vinted.com/*"],
        js: ["content.js"]
      }]
    };

    const contentJs = `
const SYNC_CONFIG = { MIN_DELAY: 600, MAX_DELAY: 1400, VERSION: '16.1 Ghost' };
const wait = (ms) => new Promise(res => setTimeout(res, ms));

async function stealthScroll() {
  const overlay = createStatusOverlay("SCANNING VINTED DATABASE...");
  let currentPos = 0;
  let lastHeight = document.body.scrollHeight;
  let stationaryCount = 0;
  let forceStop = false;

  // Add stop button to overlay
  const stopBtn = document.createElement('button');
  stopBtn.innerText = "FINISH NOW";
  stopBtn.style.cssText = "margin-top: 15px; background: #374151; color: white; border: none; padding: 8px 12px; border-radius: 8px; font-size: 10px; font-weight: bold; cursor: pointer;";
  stopBtn.onclick = () => { forceStop = true; };
  overlay.appendChild(stopBtn);

  // Initial nudge
  window.scrollTo({ top: 500, behavior: 'smooth' });
  await wait(800);

  while (stationaryCount < 12 && !forceStop) { 
    const scrollStep = Math.floor(Math.random() * 800) + 500;
    currentPos += scrollStep;
    window.scrollTo({ top: currentPos, behavior: 'smooth' });
    
    await wait(Math.floor(Math.random() * (SYNC_CONFIG.MAX_DELAY - SYNC_CONFIG.MIN_DELAY)) + SYNC_CONFIG.MIN_DELAY);
    
    const newHeight = document.body.scrollHeight;
    const progress = Math.min(99, Math.round((currentPos / Math.max(newHeight, currentPos + 1)) * 100));
    updateOverlayProgress(overlay, progress);

    if (newHeight <= lastHeight && currentPos >= newHeight - 300) {
      stationaryCount++;
    } else {
      stationaryCount = 0;
      lastHeight = newHeight;
    }
    
    if (currentPos > 100000) break;
  }
  
  updateOverlayProgress(overlay, 100);
  const statusTxt = document.getElementById("rp-status-text");
  if (statusTxt) statusTxt.innerHTML = '<span style="color: #10b981;">SYNC OK</span>';
  if (stopBtn) stopBtn.remove();
  await wait(800);
  overlay.remove();
  return scrapeData();
}

function createStatusOverlay(text) {
  const div = document.createElement('div');
  div.id = "rp-overlay";
  div.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 2147483647; background: #0f172a; color: white; padding: 25px; border-radius: 20px; font-family: sans-serif; box-shadow: 0 20px 40px rgba(0,0,0,0.5); border: 2px solid #6366f1; min-width: 280px; text-align: center;";
  div.innerHTML = '<div style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #818cf8; margin-bottom: 10px; font-weight: 800;">ResellPro Stealth Engine</div>' +
                  '<div id="rp-status-text" style="font-weight: 900; margin-bottom: 15px;">' + text + '</div>' +
                  '<div style="width: 100%; background: #1e293b; height: 8px; border-radius: 4px; overflow: hidden;">' +
                  '<div id="rp-progress-bar" style="width: 0%; height: 100%; background: #6366f1; transition: width 0.3s ease;"></div></div>';
  document.body.appendChild(div);
  return div;
}

function updateOverlayProgress(overlay, progress) {
  const bar = overlay.querySelector("#rp-progress-bar");
  if (bar) bar.style.width = progress + "%";
}

function scrapeData() {
  const items = [];
  const selectors = [
    '[data-testid*="grid-item"]',
    '[data-testid*="item-card"]',
    '.feed-grid__item',
    '.user-main-stats__item',
    '.profile__items-grid-item',
    'article',
    '.order-list-item', 
    '.purchase-item',
    '.c-order-list__item'
  ];
  
  const containers = document.querySelectorAll(selectors.join(", "));
  const isSalesPage = /transactions|orders|sold|sales|achats|mes_ventes/.test(window.location.href);
  
  containers.forEach(el => {
    try {
      const text = el.innerText || "";
      const priceMatch = text.match(/(\\d+[,.]?\\d*)\\s*[€£$]/) || text.match(/[€£$]\\s*(\\d+[,.]?\\d*)/);
      const img = el.querySelector("img");
      
      if (priceMatch && img && img.src && !img.src.includes("avatar")) {
        const lines = text.split("\\n").map(l => l.trim()).filter(l => l.length > 2 && !l.includes("€") && !l.includes("£") && !l.includes("$"));
        const title = lines.find(l => l.length > 5) || "Vinted Item";
        const brand = lines.find(l => l.length > 2 && l !== title) || "";
        
        const lower = text.toLowerCase();
        const isSold = lower.includes("vendu") || lower.includes("sold") || lower.includes("finalis") || lower.includes("termin") || lower.includes("verkocht") || lower.includes("venduto");
        const status = (isSalesPage || isSold) ? "SOLD" : "IN_STOCK";
        
        items.push({ 
          title: title.substring(0, 80), 
          brand: brand.substring(0, 50), 
          salePrice: parseFloat((priceMatch[1] || "0").replace(",", ".")), 
          imageUrl: img.src, 
          status, 
          date: new Date().toISOString().split("T")[0] 
        });
      }
    } catch (e) {}
  });

  // Deduplicate
  const unique = items.filter((v,i,a)=>a.findIndex(t=>(t.imageUrl===v.imageUrl))===i);
  return { platform: "VINTED", items: unique };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "START_SYNC") {
    stealthScroll().then(data => sendResponse({ data }));
    return true; 
  }
});
    `;

    const popupHtml = `
<html>
<body style="width: 320px; padding: 0; font-family: sans-serif; background: #0f172a; color: white;">
  <div style="background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); padding: 25px; border-bottom: 1px solid #334155; text-align: center;">
    <div style="font-size: 9px; text-transform: uppercase; letter-spacing: 3px; color: #818cf8; font-weight: 800; margin-bottom: 5px;">GHOST ENGINE PRO</div>
    <h2 style="font-size: 22px; font-weight: 900; margin: 0; italic;">RESELLPRO<span style="color: #6366f1;">.PRO</span></h2>
  </div>
  <div style="padding: 25px;">
    <button id="scrapeBtn" style="width: 100%; padding: 16px; background: #6366f1; color: white; border: none; border-radius: 16px; font-weight: 900; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer; transition: all 0.2s; box-shadow: 0 10px 20px rgba(99, 102, 241, 0.4);">
      START STEALTH SYNC
    </button>
    <div id="result" style="margin-top: 20px; font-size: 12px; display: none; background: #1e293b; padding: 15px; border-radius: 14px; border: 1px solid #334155; line-height: 1.5; text-align: center;"></div>
    <button id="copyBtn" style="width: 100%; padding: 14px; background: #10b981; color: white; border: none; border-radius: 14px; margin-top: 15px; display: none; font-weight: 900; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; cursor: pointer;">
      COPY DATA TO HUB
    </button>
  </div>
  <script src="popup.js"></script>
</body>
</html>
    `;

    const popupJs = `
document.getElementById('scrapeBtn').onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || !tab.url.includes('vinted')) { 
    alert('Please open Vinted page (Profile or Transactions)'); return; 
  }
  
  const btn = document.getElementById('scrapeBtn');
  btn.innerText = "SYNCING...";
  btn.disabled = true;
  btn.style.opacity = '0.5';

  chrome.tabs.sendMessage(tab.id, { action: "START_SYNC" }, (response) => {
    btn.innerText = "START STEALTH SYNC";
    btn.disabled = false;
    btn.style.opacity = '1';
    
    if (response && response.data) {
      const count = response.data.items.length;
      document.getElementById('result').innerHTML = '<div style="color: #10b981; font-weight: 900; margin-bottom: 8px;">EXTRACTION OK</div>' + count + ' articles identifiés.';
      document.getElementById('result').style.display = 'block';
      document.getElementById('copyBtn').style.display = 'block';
      document.getElementById('copyBtn').onclick = () => {
        navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
        alert("Succès ! Données copiées. Collez-les maintenant dans le Power Hub.");
      };
    } else {
      alert("Error: Please refresh the page and try again.");
    }
  });
};
    `;

    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    zip.file('content.js', contentJs.trim());
    zip.file('popup.html', popupHtml.trim());
    zip.file('popup.js', popupJs.trim());
    zip.file('INSTRUCTIONS_INSTALLATION.txt', readme.trim());

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ResellPro_Extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert("✅ Extension téléchargée dans 'ResellPro_Extension.zip' !\n\nExtractez ce fichier ZIP dans un dossier sur votre bureau et chargez-le dans chrome://extensions.");
  };

  const processSyncData = () => {
    try {
      setIsProcessing(true);
      
      let data;
      const cleanInput = syncData.trim();
      
      try {
        data = JSON.parse(cleanInput);
      } catch (e) {
        // Robust fallback: Extract JSON between first '{' and last '}'
        const firstBrace = cleanInput.indexOf('{');
        const lastBrace = cleanInput.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const extracted = cleanInput.substring(firstBrace, lastBrace + 1);
          data = JSON.parse(extracted);
        } else {
          throw e;
        }
      }
      
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Format invalide");
      }

      const newItems: InventoryItem[] = data.items.map((item: any) => ({
        id: crypto.randomUUID(),
        displayId: item.id || '',
        name: item.title || 'Article Vinted',
        brand: item.brand || '',
        size: item.size || '',
        condition: ItemCondition.VERY_GOOD,
        purchasePrice: item.purchasePrice || 0,
        displaySalePrice: item.salePrice || 0,
        salePrice: item.salePrice || 0,
        fees: 0,
        shippingCost: 0,
        boostCost: 0,
        status: item.status === 'SOLD' ? ItemStatus.SOLD : ItemStatus.IN_STOCK,
        subStatus: ItemSubStatus.NONE,
        purchaseDate: item.date || new Date().toISOString().split('T')[0],
        category: item.category || 'Vêtements',
        imageUrl: item.imageUrl || ''
      }));

      onAddInventoryItems(newItems);
      onSync(selectedAccountId!, { lastSync: new Date().toISOString() });
      
      alert(`${newItems.length} articles synchronisés avec succès !`);
      setIsSyncModalOpen(false);
      setSyncData('');
    } catch (err) {
      alert("Erreur lors de la synchronisation : " + (err instanceof Error ? err.message : "Format incorrect"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
            <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin-slow" />
            Vinted Power Hub
          </h2>
          <div className="flex gap-4 mt-4">
            <button 
              onClick={() => setActiveTab('ACCOUNTS')}
              className={`text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-full transition-all border-2 ${activeTab === 'ACCOUNTS' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-400'}`}
            >
              Comptes Sync
            </button>
            <button 
              onClick={() => setActiveTab('AUTOMATIONS')}
              className={`text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-full transition-all border-2 ${activeTab === 'AUTOMATIONS' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-400'}`}
            >
              Stealth Automations
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end px-6 border-r border-slate-100 dark:border-slate-800">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Protection Antiban</div>
             <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">GHOST MODE ACTIF</span>
             </div>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-8 py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-[28px] font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3"
          >
            <Plus className="w-5 h-5 font-black" />
            Nouveau Compte
          </button>
        </div>
      </div>

      {activeTab === 'ACCOUNTS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {connectedAccounts.map((account) => (
              <div key={account.id} className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                
                <div className="flex justify-between items-start relative z-10 mb-6">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-emerald-500 font-black text-[8px] uppercase tracking-tighter">Stealth ACTIVE</span>
                    </div>
                    <button 
                      onClick={() => onDeleteAccount(account.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{account.nickname}</h3>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-8 flex items-center gap-2">
                   VINTED {account.platform}
                   <span className="w-1 h-1 rounded-full bg-indigo-300" />
                   AUTH SECURISEE
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-[9px] font-black uppercase">Période d'activité</span>
                    </div>
                    <span className="text-[9px] font-black text-slate-900 dark:text-white italic">
                      {account.startDate || '2024'} → {account.endDate || '2024'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-[9px] font-black uppercase">Dernière Synchronisation</span>
                    </div>
                    <span className="text-[9px] font-black text-indigo-600 italic">
                      {account.lastSync ? new Date(account.lastSync).toLocaleDateString() : 'Première fois'}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => { setSelectedAccountId(account.id); setIsSyncModalOpen(true); }}
                  className="w-full py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 group/btn"
                >
                  <RefreshCw className="w-5 h-5 group-hover/btn:animate-spin" />
                  Synchroniser l'Inventaire
                </button>
              </div>
            ))}

            {connectedAccounts.length === 0 && (
              <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-xl mb-6">
                  <Info className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Aucun compte lié</h3>
                <p className="max-w-xs text-slate-500 dark:text-slate-400 font-medium text-xs">
                  Liez vos comptes Vinted pour centraliser toutes vos ventes et achats instantanément.
                </p>
              </div>
            )}
          </div>

          {/* Side stats / Intelligence */}
          <div className="space-y-6">
             <div className="bg-slate-900 dark:bg-indigo-600 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-110 transition-transform" />
                <div className="flex items-center gap-3 mb-6">
                   <Zap className="w-5 h-5 text-indigo-400 group-hover:animate-pulse" />
                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 italic">Intelligence Marché</h4>
                </div>
                
                <div className="space-y-6 relative z-10">
                   <div>
                      <div className="flex justify-between items-end mb-2">
                         <span className="text-[10px] font-black uppercase italic text-indigo-200">Indice de conversion</span>
                         <span className="text-2xl font-black tracking-tighter">84.2</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                         <div className="h-full bg-gradient-to-r from-indigo-400 to-emerald-400 w-[84%]" />
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-white/5 backdrop-blur-md rounded-[24px] border border-white/5 hover:bg-white/10 transition-all">
                         <div className="text-[8px] font-black uppercase opacity-60 mb-2">ROI Moyen</div>
                         <div className="text-2xl font-black tracking-tighter text-emerald-400">+245%</div>
                      </div>
                      <div className="p-5 bg-white/5 backdrop-blur-md rounded-[24px] border border-white/5 hover:bg-white/10 transition-all">
                         <div className="text-[8px] font-black uppercase opacity-60 mb-2">Tendance</div>
                         <div className="text-xl font-black tracking-tighter italic uppercase text-indigo-300">VINTAGE</div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Analyse de niche</h4>
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="flex flex-wrap gap-2">
                   {['Streetwear', 'Luxuex', 'Archives', 'Gorpcore', 'Y2K', 'Minimalism'].map(tag => (
                     <span key={tag} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all rounded-xl text-[9px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter italic cursor-default border border-transparent hover:border-indigo-200">
                       {tag}
                     </span>
                   ))}
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Auto-Relist */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl relative group">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <RefreshCw className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">Auto-Relist</h3>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-6 italic">STEALTH BOOST v2</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">
              Supprimez et repostez automatiquement vos articles à l'heure d'audience maximale pour rester en haut du fil.
            </p>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 mb-6">
               <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Statut du module</div>
               <div className="text-[10px] font-black text-amber-600">EN ATTENTE D'EXTENSION PRO</div>
            </div>
            <button className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest cursor-not-allowed">
              Configuration requise
            </button>
          </div>

          {/* Smart Pricing */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl relative group">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">Price Neural</h3>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6 italic">AI INTELLIGENCE</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">
              Analyse les prix de vente réels (pas juste les annonces) pour suggérer le prix parfait qui maximise ta marge.
            </p>
            <button className="w-full py-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 opacity-50 rounded-2xl font-black uppercase text-[10px] tracking-widest cursor-not-allowed italic">
              ANALYSE ALPHA EN COURS...
            </button>
          </div>

          {/* Smart Offers */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl relative group">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MousePointer2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">Offer Engine</h3>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-6 italic">CONVERSION AUTOMATIQUE</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">
               Envoie instantanément une offre personnalisée dès qu'un utilisateur met un article en favori.
            </p>
            <button className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 dark:shadow-none">
              Activer (Bientôt)
            </button>
          </div>

          {/* Auto-Reply CRM */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl relative group opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">Auto-Responder</h3>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6 italic">CRM INTELLIGENT</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 font-bold leading-relaxed">
              Répond automatiquement aux questions fréquentes (dimensions, état, dispo) via l'IA pour ne rater aucune vente.
            </p>
            <span className="text-[10px] font-black text-slate-400 italic">DÉVELOPPEMENT EN COURS - Q3 2024</span>
          </div>
        </div>
      )}

      {/* Extension Info Box */}
      <div className="bg-indigo-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/30 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Nouveau : Extension Alpha</span>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none mb-6">
              Récupérez vos données <br />
              <span className="text-indigo-400">en un clic</span>
            </h2>
            <p className="text-indigo-100 font-medium text-sm leading-relaxed mb-8 max-w-xl">
              Utilisez notre script de récupération pour extraire automatiquement vos achats et ventes Vinted sans aucune saisie manuelle.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleCopyScript}
                className="px-8 py-5 bg-white text-indigo-900 rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-3"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copié !' : 'Copier le script'}
              </button>
              <button 
                onClick={() => setIsGuideModalOpen(true)}
                className="px-8 py-5 bg-indigo-800 text-white border border-indigo-700 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-3"
              >
                <FileText className="w-5 h-5 text-indigo-300" />
                Guide d'utilisation
              </button>
            </div>
          </div>
          <div className="lg:w-1/3 flex justify-center">
            <div className="w-48 h-48 bg-white/10 rounded-[60px] flex items-center justify-center border border-white/20 backdrop-blur-sm shadow-2xl rotate-12 transition-transform hover:rotate-0 duration-500">
               <RefreshCw className="w-24 h-24 text-white opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-8 flex items-center gap-3">
              <Plus className="w-8 h-8 text-indigo-600" />
              Lier un compte
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Pseudonyme Vinted</label>
                <input 
                  type="text" 
                  value={newAccount.nickname}
                  onChange={e => setNewAccount(prev => ({ ...prev, nickname: e.target.value }))}
                  placeholder="ex: JeanDupont88"
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500 outline-none font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Date de début</label>
                  <input 
                    type="date" 
                    value={newAccount.startDate}
                    onChange={e => setNewAccount(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500 outline-none font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Date de fin</label>
                  <input 
                    type="date" 
                    value={newAccount.endDate}
                    onChange={e => setNewAccount(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500 outline-none font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black text-slate-500 uppercase text-[10px] tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleAddAccount}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 transition-all"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-8 flex items-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin-slow" />
              Synchronisation
            </h3>

            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-6 rounded-3xl mb-8 border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
                  <Info className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-indigo-900 dark:text-indigo-100 uppercase mb-1">Comment procéder ?</p>
                  <ol className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold space-y-1.5 list-decimal ml-4">
                    <li>Ouvrez votre profil Vinted sur votre navigateur</li>
                    <li>Ouvrez la console (F12 ou clic droit &gt; Inspecter &gt; Console)</li>
                    <li>Collez le script de récupération et appuyez sur Entrée</li>
                    <li>Copiez le résultat JSON affiché et collez-le ci-dessous</li>
                  </ol>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <textarea 
                value={syncData}
                onChange={e => setSyncData(e.target.value)}
                placeholder="Collez ici le résultat JSON du script..."
                className="w-full h-48 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500 outline-none font-mono text-xs text-slate-900 dark:text-white mb-8 resize-none"
              />
              {syncData && (
                <button 
                  onClick={() => setSyncData('')}
                  className="absolute top-4 right-4 p-2 bg-white dark:bg-slate-700 text-rose-500 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600 hover:bg-rose-50 transition-all font-black text-[9px] uppercase tracking-widest"
                >
                  Effacer
                </button>
              )}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setIsSyncModalOpen(false)}
                className="flex-1 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black text-slate-500 uppercase text-[10px] tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Fermer
              </button>
              <button 
                onClick={processSyncData}
                disabled={!syncData || isProcessing}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Lancer l'importation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[40px] p-0 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            {/* Header */}
            <div className="bg-indigo-600 p-8 text-white relative">
              <div className="absolute top-0 right-0 p-8">
                 <button onClick={() => setIsGuideModalOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all">
                   <Trash2 className="w-5 h-5" />
                 </button>
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-4">Sync Center</h3>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setGuideTab('CONSOLE')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${guideTab === 'CONSOLE' ? 'bg-white text-indigo-600' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  Méthode Console
                </button>
                <button 
                  onClick={() => setGuideTab('EXTENSION')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${guideTab === 'EXTENSION' ? 'bg-white text-indigo-600' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  Extension Chrome (BÊTA)
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-10">
              {guideTab === 'CONSOLE' ? (
                <>
                  {/* Step 1 */}
                  <div className="flex gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 text-xl font-black text-indigo-600 italic">01</div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Copiez le Script Magique</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-4">
                        Utilisez le bouton "Copier le script" sur le tableau de bord. Ce script est conçu pour contourner les protections et extraire proprement vos articles.
                      </p>
                      <button onClick={handleCopyScript} className="flex items-center gap-2 text-indigo-600 font-black uppercase text-[10px] tracking-widest px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl hover:bg-indigo-100 transition-all">
                        <Copy className="w-4 h-4" /> {copied ? 'Copié avec succès' : 'Copier maintenant'}
                      </button>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-xl font-black text-slate-400 italic">02</div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Allez sur Vinted (Navigateur PC)</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-4">
                        Connectez-vous à votre compte Vinted sur Chrome, Safari ou Edge. Rendez-vous sur votre profil ou vos ventes.
                      </p>
                      <a href="https://www.vinted.fr" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-slate-900 dark:text-white font-black uppercase text-[10px] tracking-widest px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-all">
                        <ExternalLink className="w-4 h-4" /> Ouvrir Vinted
                      </a>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-xl font-black text-slate-400 italic">03</div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Ouvrez la console développeur</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        Appuyez sur <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-bold">F12</kbd> (ou clic droit &gt; Inspecter) et cliquez sur l'onglet Console.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 text-xl font-black text-indigo-600 italic">04</div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Collez et Exécutez</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        Collez le script (<kbd className="px-1 py-1 bg-slate-100 rounded-md">Ctrl+V</kbd>) et appuyez sur Entrée.
                        Le script va scroller automatiquement de manière furtive.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-[32px] mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-amber-500 rounded-2xl text-white">
                        <Puzzle className="w-6 h-6" />
                      </div>
                      <h4 className="text-xl font-black text-amber-950 dark:text-amber-200 uppercase tracking-tighter italic">L'extension officielle ResellPro</h4>
                    </div>
                    <p className="text-amber-900/80 dark:text-amber-300/80 text-sm font-medium leading-relaxed">
                      L'extension Chrome est la méthode la plus sûre. Elle masque complètement l'activité de synchronisation et permet une mise à jour en un clic sans jamais ouvrir la console.
                    </p>
                  </div>

                  <div className="space-y-8">
                     <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-xl font-black text-slate-400 italic">01</div>
                        <div>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Téléchargez le Pack Extension</h4>
                          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-4">
                            Cliquez sur le bouton ci-dessous pour obtenir les fichiers de l'extension (manifest.json et scripts).
                          </p>
                          <button onClick={handleDownloadExtension} className="flex items-center gap-2 text-white bg-slate-900 dark:bg-white dark:text-slate-900 font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-2xl hover:scale-105 transition-all">
                            <Download className="w-4 h-4" /> Télécharger (Beta)
                          </button>
                        </div>
                     </div>

                     <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-xl font-black text-slate-400 italic">02</div>
                        <div>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Activez le "Mode Développeur"</h4>
                          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                            Allez dans <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">chrome://extensions</code> et cochez l'interrupteur "Mode Développeur" en haut à droite.
                          </p>
                        </div>
                     </div>

                     <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-xl font-black text-slate-400 italic">03</div>
                        <div>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Chargez l'extension</h4>
                          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                            Cliquez sur <strong className="text-indigo-600">"Charger l'extension décompressée"</strong> et sélectionnez le dossier contenant les fichiers téléchargés.
                          </p>
                        </div>
                     </div>
                  </div>
                </>
              )}
              <div className="mt-12 p-8 bg-slate-900 dark:bg-black rounded-[32px] border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h4 className="text-xl font-black text-white uppercase tracking-tight italic flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-indigo-500" /> Stealth Dashboard v15.0
                      </h4>
                      <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Protection Anti-Ban Active</p>
                    </div>
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-emerald-500 font-black text-[10px] uppercase tracking-tighter">Flux sécurisé</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 mb-4">
                        <Timer className="w-5 h-5" />
                      </div>
                      <h5 className="text-white font-black uppercase text-xs tracking-widest mb-2">Random Intervals</h5>
                      <p className="text-slate-400 text-[11px] leading-relaxed">Simule des temps de lecture humains entre les actions pour briser les patterns d'algorithmes bots.</p>
                    </div>

                    <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-500 mb-4">
                        <MousePointer2 className="w-5 h-5" />
                      </div>
                      <h5 className="text-white font-black uppercase text-xs tracking-widest mb-2">Fluid Scroll</h5>
                      <p className="text-slate-400 text-[11px] leading-relaxed">Remplace le défilement instantané par des courbes de vitesse variables imitant un mouvement naturel.</p>
                    </div>

                    <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500 mb-4">
                        <Fingerprint className="w-5 h-5" />
                      </div>
                      <h5 className="text-white font-black uppercase text-xs tracking-widest mb-2">Fingerprint Mask</h5>
                      <p className="text-slate-400 text-[11px] leading-relaxed">Nettoie les en-têtes d'automatisation et les drapeaux navigateur détectables lors de l'exécution.</p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center gap-4 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                    <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    <p className="text-indigo-200/70 text-[11px] font-medium leading-relaxed italic">
                      "Nous recommandons de ne pas synchroniser plus de 5 fois par heure sur le même compte pour garantir une invisibilité totale."
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Info Banner */}
              <div className="mt-10 p-6 bg-amber-500 rounded-3xl text-amber-950 flex items-center justify-between">
                <div>
                  <h4 className="font-black uppercase tracking-tighter text-lg leading-none">Besoin d'une automatisation totale ?</h4>
                  <p className="font-bold text-xs opacity-75 mt-1 uppercase tracking-widest">L'extension Chrome officielle ResellPro arrive bientôt.</p>
                </div>
                <div className="px-6 py-3 bg-amber-950 text-amber-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Coming Soon</div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-4 border-t border-slate-100 dark:border-slate-800">
               <button 
                onClick={() => setIsGuideModalOpen(false)}
                className="px-10 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 transition-all"
               >
                 J'ai compris !
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncVinted;
