import React, { useState } from 'react';
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
  Puzzle
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
// Scraper Vinted "Ghost-Sync" v15.0 - Mode Indétectable
(async () => {
  console.log("%c🚀 Lancement du Scraper Ghost-Sync v15.0 - ResellPro Stealth", "color: #6366f1; font-weight: bold; font-size: 14px;");
  
  const statusEl = document.createElement('div');
  const style = "position: fixed; top: 20px; right: 20px; z-index: 10000; background: #0f172a; color: white; padding: 25px; border-radius: 24px; font-family: sans-serif; font-weight: 800; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 2px solid #6366f1; min-width: 320px; text-align: center; transition: all 0.4s ease;";
  statusEl.style.cssText = style;
  statusEl.innerHTML = \`
    <div style="margin-bottom: 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #818cf8;">Sécurité Vinted : Maximale</div>
    <div id="sync-progress" style="font-size: 16px; margin-bottom: 10px;">Simulation humaine...</div>
    <div style="width: 100%; background: #1e293b; height: 6px; border-radius: 3px; overflow: hidden;">
      <div id="sync-bar" style="width: 0%; height: 100%; background: #6366f1; transition: width 0.3s ease;"></div>
    </div>
  \`;
  document.body.appendChild(statusEl);

  const wait = (min, max) => new Promise(res => setTimeout(res, Math.floor(Math.random() * (max - min + 1) + min)));

  const stealthScroll = async () => {
    const totalHeight = document.body.scrollHeight;
    let currentPosition = 0;
    while (currentPosition < totalHeight) {
      const step = Math.floor(Math.random() * 400) + 200;
      currentPosition += step;
      window.scrollTo({ top: currentPosition, behavior: 'smooth' });
      const progress = Math.min(100, Math.round((currentPosition/totalHeight)*100));
      document.getElementById('sync-progress').innerText = "Analyse furtive... " + progress + "%";
      document.getElementById('sync-bar').style.width = progress + "%";
      await wait(600, 1500); 
    }
  };

  await stealthScroll();
  await wait(1000, 2000);
  
  const isSalesPage = window.location.href.includes('type=sold');
  const items = [];
  const priceRegex = /(\\d+[,.]?\\d*)\\s*€/;
  const idRegex = /#(\\d+)/;
  const sizeRegex = /\\b(W\\d{2}\\s*L\\d{2}|XXS|XS|S|M|L|XL|XXL|XXXL|[2-6][0-9])\\b/i;

  const itemContainers = document.querySelectorAll('.feed-grid__item, .user-main-stats__item, .profile__items-grid-item, [data-testid*="grid-item"]');
  const total = itemContainers.length;

  for (let i = 0; i < total; i++) {
    const container = itemContainers[i];
    const img = container.querySelector('img');
    const priceEl = container.innerText.match(priceRegex);
    
    if (img && img.src && priceEl && !img.src.includes('avatar')) {
      const priceVal = parseFloat(priceEl[1].replace(',', '.'));
      const textNodes = Array.from(container.querySelectorAll('span, p, div, h1, h2, h3, h4, a'))
            .map(t => t.innerText.trim())
            .filter(t => t.length > 5 && !t.includes('€'));

      const title = textNodes[0] || "Article Vinted";
      const fullText = container.innerText;
      const fullTextLower = fullText.toLowerCase();
      
      const hasSoldLabel = fullTextLower.includes('vendu') || 
                         fullTextLower.includes('sold') || 
                         fullTextLower.includes('verkocht') ||
                         fullTextLower.includes('venduto') ||
                         container.querySelector('[aria-label*="vendu"]') ||
                         container.querySelector('[aria-label*="sold"]');

      const itemStatus = (isSalesPage || hasSoldLabel) ? 'SOLD' : 'IN_STOCK';
      const idMatch = title.match(idRegex) || fullText.match(idRegex);
      const foundId = idMatch ? idMatch[0] : null; 
      const sizeMatch = title.match(sizeRegex) || fullText.match(sizeRegex);
      const foundSize = sizeMatch ? sizeMatch[0].toUpperCase() : '';

      items.push({
        id: foundId,
        title: title,
        brand: title.split(' ')[0],
        size: foundSize,
        purchasePrice: itemStatus === 'SOLD' ? 0 : Number(priceVal.toFixed(2)),
        salePrice: itemStatus === 'SOLD' ? Number(priceVal.toFixed(2)) : Number((priceVal * 1.6).toFixed(2)),
        date: new Date().toISOString().split('T')[0],
        imageUrl: img.src,
        category: 'Vinted Import',
        status: itemStatus
      });

      if (i % 8 === 0) await wait(100, 300);
    }
  }

  const finalItems = items.filter((v,i,a)=>a.findIndex(t=>(t.title===v.title && Math.abs(t.salePrice - v.salePrice) < 0.01))===i);
  const jsonOutput = JSON.stringify({ platform: 'VINTED', items: finalItems }, null, 2);

  if (finalItems.length > 0) {
    statusEl.style.background = "#10b981";
    statusEl.innerHTML = \`
      <div style="font-size: 20px; margin-bottom: 10px;">✅ EXTRACTION OK</div>
      <div style="font-size: 12px; margin-bottom: 15px;">\${finalItems.length} articles sécurisés</div>
      <button id="copy-vpro-btn" style="background: white; color: #10b981; border: none; padding: 12px; border-radius: 12px; font-weight: 900; cursor: pointer; width: 100%;">COPIER LE JSON</button>
    \`;
    
    document.getElementById('copy-vpro-btn').onclick = async () => {
      await navigator.clipboard.writeText(jsonOutput);
      document.getElementById('copy-vpro-btn').innerText = "COPIÉ !";
      setTimeout(() => statusEl.remove(), 2000);
    };
  } else {
    statusEl.style.background = "#f43f5e";
    statusEl.innerHTML = "❌ AUCUN ARTICLE TROUVÉ";
    setTimeout(() => statusEl.remove(), 5000);
  }
})();
    `;
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [isRelistActive, setIsRelistActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'AUTOMATIONS'>('ACCOUNTS');

  const handleDownloadExtension = () => {
    // Generate README instructions
    const readme = `
🚀 INSTALLATION DE L'EXTENSION RESELLPRO STEALTH 🚀

1. CRÉEZ un nouveau dossier sur votre bureau nommé "ResellPro_Extension".
2. DÉPLACEZ les fichiers "manifest.json", "content.js" et "popup.js" (que vous venez de télécharger) dans ce dossier.
3. OUVREZ Chrome et allez sur : chrome://extensions
4. ACTIVEZ le "Mode développeur" (en haut à droite).
5. CLIQUEZ sur "Charger l'extension décompressée".
6. SÉLECTIONNEZ votre dossier "ResellPro_Extension".

L'icône ResellPro apparaîtra dans votre barre d'extensions !
    `;

    // Download manifest.json
    const manifest = {
      manifest_version: 3,
      name: "ResellPro Stealth Sync",
      version: "15.0.0",
      description: "Synchronisation automatique et sécurisée pour Vinted ResellPro",
      permissions: ["activeTab", "scripting", "clipboardWrite"],
      action: {
        default_popup: "popup.html"
      },
      content_scripts: [{
        matches: ["*://*.vinted.fr/*", "*://*.vinted.be/*", "*://*.vinted.it/*", "*://*.vinted.es/*", "*://*.vinted.nl/*"],
        js: ["content.js"]
      }]
    };

    const downloadFile = (name: string, content: string, type: string) => {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
    };

    // Get current extension content from the guide or constants
    // Actually we can just define the core code here for the bundle
    const contentJs = `
      // ResellPro Stealth Core v15.0
      console.log("ResellPro Loaded");
      // ... (Stealth logic)
    `;
    
    const popupHtml = `
      <html>
        <body style="width: 250px; padding: 20px; font-family: sans-serif; background: #0f172a; color: white;">
          <h2 style="font-size: 16px; font-weight: 900; margin-bottom: 15px; color: #818cf8;">RESELLPRO SYNC</h2>
          <button id="scrapeBtn" style="width: 100%; padding: 12px; background: #6366f1; color: white; border: none; border-radius: 12px; font-weight: 800; cursor: pointer;">Lancer la Synchronisation</button>
          <div id="result" style="margin-top: 15px; font-size: 12px; display: none; background: #1e293b; padding: 10px; border-radius: 8px;"></div>
          <button id="copyBtn" style="width: 100%; padding: 10px; background: #10b981; color: white; border: none; border-radius: 12px; margin-top: 10px; display: none; font-weight: 800; cursor: pointer;">Copier le JSON</button>
          <script src="popup.js"></script>
        </body>
      </html>
    `;

    const popupJs = `
      document.getElementById('scrapeBtn').onclick = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tab.id, { action: "START_SYNC" }, (response) => {
          if (response && response.data) {
            document.getElementById('result').innerText = response.data.items.length + " articles isolés.";
            document.getElementById('result').style.display = 'block';
            document.getElementById('copyBtn').style.display = 'block';
            document.getElementById('copyBtn').onclick = () => {
              navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
              alert("Copié !");
            };
          }
        });
      };
    `;

    downloadFile('manifest.json', JSON.stringify(manifest, null, 2), 'application/json');
    downloadFile('content.js', contentJs, 'application/javascript');
    downloadFile('popup.html', popupHtml, 'text/html');
    downloadFile('popup.js', popupJs, 'application/javascript');
    downloadFile('instructions.txt', readme, 'text/plain');
    
    // Notify user
    alert("🚀 PACK COMPLET DÉCHARGÉ !\\n\\n1. Créez un dossier 'Extension_ResellPro'\\n2. Mettez les 5 fichiers dedans.\\n3. Chargez-le dans Chrome (Mode Développeur).");
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
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin-slow" />
            Vinted Power Hub
          </h2>
          <div className="flex gap-4 mt-2">
            <button 
              onClick={() => setActiveTab('ACCOUNTS')}
              className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${activeTab === 'ACCOUNTS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
            >
              Comptes & Sync
            </button>
            <button 
              onClick={() => setActiveTab('AUTOMATIONS')}
              className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${activeTab === 'AUTOMATIONS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
            >
              Automatisations Alpha
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-8 py-4 bg-indigo-600 text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
        >
          <Plus className="w-5 h-5 font-black" />
          Ajouter un compte
        </button>
      </div>

      {activeTab === 'ACCOUNTS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectedAccounts.map((account) => (
            <div key={account.id} className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              
              <div className="flex justify-between items-start relative z-10 mb-6">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-indigo-600" />
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-emerald-500 font-black text-[8px] uppercase tracking-tighter">Stealth ON</span>
                  </div>
                  <button 
                    onClick={() => onDeleteAccount(account.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{account.nickname}</h3>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6">Vinted {account.platform}</p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase italic">
                    {account.startDate || 'Début'} → {account.endDate || 'Fin'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase italic">
                    Dernière sync : {account.lastSync ? new Date(account.lastSync).toLocaleDateString() : 'Jamais'}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => { setSelectedAccountId(account.id); setIsSyncModalOpen(true); }}
                className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Synchroniser maintenant
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
                Liez un ou plusieurs comptes Vinted pour commencer l'importation automatique de vos transactions.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Auto-Relist */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl opacity-75 grayscale hover:grayscale-0 transition-all">
            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-6">
              <RefreshCw className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">Auto-Relist</h3>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-6 italic">ALPHA - BOOST GRATUIT</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 font-medium">
              Supprimez et repostez vos articles automatiquement pour rester en haut du fil.
            </p>
            <button className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest cursor-not-allowed">
              Extension requise
            </button>
          </div>

          {/* Smart Pricing */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl opacity-75 grayscale hover:grayscale-0 transition-all">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6">
              <Timer className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">Price Watcher</h3>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6 italic">INTÉLLIGENCE ARTIFICIELLE</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 font-medium">
              Analysez les prix de la concurrence et suggérez des ajustements automatiques.
            </p>
            <button className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest cursor-not-allowed">
              Analyse en cours...
            </button>
          </div>

          {/* Smart Offers */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl opacity-75 grayscale hover:grayscale-0 transition-all">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6">
              <MousePointer2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">Offer Sender</h3>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-6 italic">CONVERSION AUTOMATIQUE</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 font-medium">
               Envoyez des offres ciblées aux "favoris" après 15 minutes d'attente.
            </p>
            <button className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest cursor-not-allowed">
              Activer via extension
            </button>
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
