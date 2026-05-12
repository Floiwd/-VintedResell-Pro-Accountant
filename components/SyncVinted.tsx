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
// Scraper Vinted "Deep Precision" v8.0 - ResellPro
(async () => {
  console.log("🚀 Initialisation du Scraper Deep Precision...");
  
  const statusEl = document.createElement('div');
  statusEl.style = "position: fixed; top: 20px; right: 20px; z-index: 10000; background: #6366f1; color: white; padding: 22px; border-radius: 20px; font-family: sans-serif; font-weight: 800; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 2px solid rgba(255,255,255,0.4); min-width: 280px; transition: all 0.4s ease;";
  statusEl.innerHTML = "<div style='margin-bottom:12px; font-size:14px'>🔄 Initialisation...</div><div id='resellpro-progress' style='height:10px; background:rgba(255,255,255,0.2); border-radius:5px; overflow:hidden'><div id='resellpro-bar' style='height:100%; width:0%; background:#fff; transition:width 0.3s; border-radius:5px'></div></div>";
  document.body.appendChild(statusEl);

  const updateStatus = (text, progress) => {
    const textEl = statusEl.querySelector('div');
    if (textEl) textEl.innerText = text;
    const bar = statusEl.querySelector('#resellpro-bar');
    if (bar && progress !== undefined) bar.style.width = progress + "%";
  };

  // 1. Navigation automatique vers "Toutes" si besoin
  const tabs = Array.from(document.querySelectorAll('button, a, span'))
    .filter(el => el.innerText.trim().toLowerCase() === 'toutes');
  
  if (tabs.length > 0) {
    const tab = tabs[0];
    const isAlreadyActive = tab.classList.contains('is-active') || 
                           tab.parentElement?.classList.contains('is-active') ||
                           tab.getAttribute('aria-selected') === 'true';
    
    if (!isAlreadyActive) {
      updateStatus("Activation de l'onglet 'Toutes'...", 10);
      tab.click();
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const isSalesPage = window.location.href.includes('type=sold');
  updateStatus("📊 Mode : " + (isSalesPage ? "VENTES" : "ACHATS"), 20);

  // 2. Scroll intelligent (Descente + Remontée)
  const smartScroll = async () => {
    let lastHeight = 0;
    let noChangeCount = 0;
    
    while (noChangeCount < 5) {
      const currentHeight = document.body.scrollHeight;
      window.scrollBy(0, 700);
      
      if (currentHeight === lastHeight) noChangeCount++;
      else noChangeCount = 0;
      
      lastHeight = currentHeight;
      let progress = 20 + Math.min(50, (window.scrollY / (currentHeight || 1)) * 50);
      updateStatus("⏳ Scan de la page : " + Math.round(progress) + "%", progress);
      await new Promise(r => setTimeout(r, 300));
    }
    
    // Remonter pour s'assurer que les images se chargent en haut aussi
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await new Promise(r => setTimeout(r, 1000));
  };

  await smartScroll();
  updateStatus("🕵️ Analyse des articles...", 80);

  const items = [];
  const priceRegex = /(\\d+[,.]\\d{2})\\s*€/;
  
  // 3. Stratégie "Force Brute" : Identifier les prix puis leurs titres
  const allElements = Array.from(document.querySelectorAll('div, span, p, a, h3, h4'));
  
  allElements.forEach(el => {
    const text = el.innerText.trim();
    // On cible les éléments qui contiennent EXACTEMENT un prix (ex: "28,00 €")
    if (priceRegex.test(text) && text.length < 15) {
      const priceVal = parseFloat(text.match(priceRegex)[1].replace(',', '.'));
      
      // Remonter le DOM pour trouver le bloc parent
      let parent = el.parentElement;
      let title = "";
      let image = "";
      
      for(let i=0; i<10; i++) {
        if (!parent) break;
        
        // Un titre est un texte long dans ce bloc qui n'est pas le prix nor un statut
        const potentialTitles = Array.from(parent.querySelectorAll('div, span, p, a, h3, h4'))
          .map(t => t.innerText.trim())
          .filter(t => t.length > 10 && !t.includes('€') && !t.includes('\\n'));
        
        // On filtre les mots-clés de statut pour isoler le vrai titre
        const forbidden = ['commande', 'finalisée', 'évaluée', 'validé', 'remboursement', 'effectué', 'acheteur', 'vendeur', 'vendu', 'annulée', 'suivre', 'virements', 'transaction'];
        const cleanTitles = potentialTitles.filter(t => 
           !forbidden.some(key => t.toLowerCase().includes(key)) && t.length < 100
        );

        if (cleanTitles.length > 0) {
          // On prend le plus long, c'est généralement le nom du produit
          title = cleanTitles.sort((a,b) => b.length - a.length)[0];
          const img = parent.querySelector('img');
          if (img && (img.src.includes('vinted') || img.src.includes('images'))) image = img.src;
          break;
        }
        parent = parent.parentElement;
      }

      if (title && !isNaN(priceVal)) {
        items.push({
          title: title.replace(/["'\\x60]/g, ''),
          brand: title.split(' ')[0],
          purchasePrice: isSalesPage ? 0 : priceVal,
          salePrice: isSalesPage ? priceVal : Math.round(priceVal * 1.6),
          date: new Date().toISOString().split('T')[0],
          imageUrl: image,
          category: 'Vinted Import',
          status: isSalesPage ? 'SOLD' : 'IN_STOCK'
        });
      }
    }
  });

  // Déduplication par titre pour éviter les doublons dus aux éléments imbriqués
  const finalItems = items.filter((v,i,a)=>a.findIndex(t=>(t.title===v.title))===i);
  
  updateStatus("✅ " + finalItems.length + " articles !", 100);
  statusEl.style.background = "#10b981";

  console.log("📦 COPIEZ CE BLOC JSON :");
  console.log(JSON.stringify({ platform: 'VINTED', items: finalItems }, null, 2));

  setTimeout(() => {
    if (statusEl.parentElement) document.body.removeChild(statusEl);
    alert("SYNCHRONISATION VINTED RÉUSSIE !\\n\\n" + finalItems.length + " articles récupérés (" + (isSalesPage ? "Ventes" : "Achats") + ").\\n\\n1. Ouvrez la console (F12)\\n2. Copiez l'objet JSON { platform: 'VINTED', ... }");
  }, 2000);
})();
    `;
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const processSyncData = () => {
    try {
      setIsProcessing(true);
      const data = JSON.parse(syncData);
      
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
        status: ItemStatus.IN_STOCK,
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
            
            <textarea 
              value={syncData}
              onChange={e => setSyncData(e.target.value)}
              placeholder="Collez ici le résultat JSON du script..."
              className="w-full h-48 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500 outline-none font-mono text-xs text-slate-900 dark:text-white mb-8 resize-none"
            />

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
