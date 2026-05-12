import React, { useState } from 'react';
import { RefreshCw, Plus, Trash2, Calendar, Shield, ExternalLink, Copy, Check, Info, FileText, Download, Loader2 } from 'lucide-react';
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
// Scraper Vinted "Guard-Advanced" v14.0 - ResellPro
(async () => {
  console.log("🚀 Lancement du Scraper Guard-Advanced v14.0...");
  
  const statusEl = document.createElement('div');
  const style = "position: fixed; top: 20px; right: 20px; z-index: 10000; background: #6366f1; color: white; padding: 25px; border-radius: 24px; font-family: sans-serif; font-weight: 800; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 2px solid rgba(255,255,255,0.4); min-width: 320px; text-align: center; transition: all 0.4s ease;";
  statusEl.style = style;
  statusEl.innerHTML = "<div style='margin-bottom: 15px'>⏳ Initialisation Iron-Guard-Pro...</div>";
  document.body.appendChild(statusEl);

  const autoScroll = async () => {
    let lastHeight = 0;
    for(let i=0; i<30; i++) {
      window.scrollBy(0, 1200);
      await new Promise(r => setTimeout(r, 450));
      if (document.body.scrollHeight === lastHeight && i > 10) break;
      lastHeight = document.body.scrollHeight;
      statusEl.innerHTML = "⏳ Scanning profondeur extrême... (" + (i+1) + "/30)";
    }
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 1500));
  };

  await autoScroll();
  
  const isSalesPage = window.location.href.includes('type=sold') || window.location.href.includes('/items');
  const items = [];
  const priceRegex = /(\\d+[,.]?\\d*)\\s*€/;
  const idRegex = /#(\\d+)/;
  const sizeRegex = /\\b(W\\d{2}\\s*L\\d{2}|XXS|XS|S|M|L|XL|XXL|XXXL|[2-6][0-9])\\b/i;

  const allImages = Array.from(document.querySelectorAll('img')).filter(img => {
    const src = img.src || "";
    // FILTRE ABSOLU : Exclure extensions et pixels
    if (src.includes('chrome-extension') || src.includes('pixel.gif') || src.includes('google-analytics')) return false;
    return src.includes('vinted') || src.includes('images') || src.includes('item');
  });

  statusEl.innerHTML = "🕵️ Analyse de " + allImages.length + " blocs réels...";

  allImages.forEach(img => {
    try {
      let container = img.parentElement;
      for (let i = 0; i < 8; i++) {
        if (!container) break;
        
        const content = container.innerText || "";
        const priceMatch = content.match(priceRegex);

        if (priceMatch && content.length > 25) {
          const priceRaw = priceMatch[1].replace(',', '.');
          const priceVal = parseFloat(priceRaw);
          
          if (isNaN(priceVal) || priceVal < 0.1) return;

          const textNodes = Array.from(container.querySelectorAll('span, p, div, h1, h2, h3, h4, a'))
            .map(t => t.innerText.trim())
            .filter(t => t.length > 5 && !t.includes('€') && !t.includes('\\n'));

          // LISTE NOIRE RENFORCÉE (V13.5)
          const forbidden = [
            'commande', 'finalisée', 'évaluée', 'validé', 'remboursement', 'effectué', 
            'acheteur', 'vendeur', 'vendu', 'annulée', 'suivre', 'virements', 
            'transaction', 'mes commandes', 'ventes', 'achats', 'aide', 'toutes',
            'clemz', 'partenaire', 'utilisateur', 'modifications', 'note :', 'ignorer', 
            'inférieure', 'appareil', 'fonctionnalité', 'dressing', 'connecté', 'vinted help',
            'cookies', 'partenaires', 'données', 'personnelles', 'publicité', 'choix', '321'
          ];
          
          const cleanTitles = textNodes.filter(t => !forbidden.some(key => t.toLowerCase().includes(key)) && t.length < 120);

          if (cleanTitles.length > 0) {
            const title = cleanTitles.sort((a,b) => b.length - a.length)[0].replace(/["'\\x60]/g, '');
            
            // FILTRE DE QUALITÉ : Minimum 4 mots et pas de texte "technique"
            const wordCount = title.split(' ').length;
            if (wordCount < 3) return;
            if (title.includes('http') || title.includes('.js') || title.includes('www.')) return;

            const fullText = container.innerText;
            
            // Search ID in title first, then full container text
            const idMatch = title.match(idRegex) || fullText.match(idRegex);
            const foundId = idMatch ? idMatch[0] : null; 
            
            const sizeMatch = title.match(sizeRegex) || fullText.match(sizeRegex);
            const foundSize = sizeMatch ? sizeMatch[0].toUpperCase() : '';

            items.push({
              id: foundId,
              title: title,
              brand: title.split(' ')[0],
              size: foundSize,
              purchasePrice: isSalesPage ? 0 : Number(priceVal.toFixed(2)),
              salePrice: isSalesPage ? Number(priceVal.toFixed(2)) : Number((priceVal * 1.6).toFixed(2)),
              date: new Date().toISOString().split('T')[0],
              imageUrl: img.src,
              category: 'Vinted Import',
              status: isSalesPage ? 'SOLD' : 'IN_STOCK'
            });
            break; 
          }
        }
        container = container.parentElement;
      }
    } catch (e) {}
  });

  const finalItems = items.filter((v,i,a)=>a.findIndex(t=>(t.title===v.title && Math.abs(t.salePrice - v.salePrice) < 0.01))===i);
  const jsonOutput = JSON.stringify({ platform: 'VINTED', items: finalItems }, null, 2);

  if (finalItems.length > 0) {
    statusEl.style.background = "#10b981";
    statusEl.innerHTML = \`
      <div style="margin-bottom: 20px">
        <div style="font-size: 24px; margin-bottom: 5px">✅ EXTRACTION OK</div>
        <div style="font-size: 14px; opacity: 0.8">\${finalItems.length} vrais articles isolés</div>
      </div>
      <button id="copy-vpro-btn" style="background: white; color: #10b981; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 900; cursor: pointer; font-size: 14px; width: 100%; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1)">
        COPIER LE JSON NETTOYÉ
      </button>
      <div style="margin-top: 15px; font-size: 10px; opacity: 0.7">Prêt à être collé dans ResellPro</div>
    \`;
    
    document.getElementById('copy-vpro-btn').onclick = () => {
      const btn = document.getElementById('copy-vpro-btn');
      const textToCopy = jsonOutput;
      
      const performCopy = (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(text);
        }
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          return successful ? Promise.resolve() : Promise.reject();
        } catch (err) {
          document.body.removeChild(textArea);
          return Promise.reject(err);
        }
      };

      performCopy(textToCopy).then(() => {
        btn.innerText = "COPIÉ !";
        btn.style.background = "#059669";
        btn.style.color = "white";
        setTimeout(() => {
          btn.innerText = "COPIER LE JSON NETTOYÉ";
          btn.style.background = "white";
          btn.style.color = "#10b981";
        }, 2000);
      }).catch(err => {
        console.error("Erreur de copie :", err);
        btn.innerText = "ERREUR DE COPIE";
      });
    };
  } else {
    statusEl.style.background = "#f43f5e";
    statusEl.innerHTML = "❌ AUCUN ARTICLE RÉEL TROUVÉ";
    setTimeout(() => statusEl.remove(), 5000);
  }

  console.log("%cResellPro Scraper v14.0 Output (Nettoyé):", "color: #6366f1; font-weight: bold; font-size: 16px;");
  console.log(jsonOutput);
})();
    `;
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            Synchronisation Automatisée
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2 px-1">
            Liez vos comptes Vinted et automatisez votre inventaire
          </p>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-8 py-4 bg-indigo-600 text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
        >
          <Plus className="w-5 h-5 font-black" />
          Ajouter un compte
        </button>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connectedAccounts.map((account) => (
          <div key={account.id} className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            
            <div className="flex justify-between items-start relative z-10 mb-6">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-indigo-600" />
              </div>
              <button 
                onClick={() => onDeleteAccount(account.id)}
                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{account.nickname}</h3>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6">{account.platform}</p>

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
              <button className="px-8 py-5 bg-indigo-800 text-white border border-indigo-700 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-3">
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
    </div>
  );
};

export default SyncVinted;
