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
// Scraper Vinted "Deep Scan" pour ResellPro
(async () => {
  console.log("🔍 Lancement du Deep Scan ResellPro...");
  const items = [];
  
  // Regex plus permissive pour les prix (gère 15€, 15.00€, 15,00 €)
  const priceRegex = /(\\d+[,.]?\\d*)\\s*€/;

  // On cherche tous les éléments parents qui pourraient contenir un article
  const articleContainers = document.querySelectorAll('.u-flexbox, .item-card, .transaction-list-item, .cell__content, div[class*="item"]');
  console.log("📦 Zones de recherche trouvées :", articleContainers.length);

  articleContainers.forEach(container => {
    // Dans chaque container, on cherche un prix et un titre
    const text = container.innerText;
    const priceMatch = text.match(priceRegex);
    
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(',', '.'));
      
      // On cherche un titre : le texte le plus long du container qui n'est pas le prix
      // ou des éléments textuels spécifiques
      let title = "";
      const potentialTitles = Array.from(container.querySelectorAll('span, p, h1, h2, h3, h4, a'))
        .map(el => el.innerText.trim())
        .filter(t => t.length > 8 && !t.includes('€') && !t.includes('\\n'));
        
      if (potentialTitles.length > 0) {
        title = potentialTitles[0];
      }

      if (title && !isNaN(price) && price > 0) {
        // Image
        const img = container.querySelector('img');
        
        items.push({
          title: title,
          brand: title.split(' ')[0],
          purchasePrice: price,
          salePrice: Math.round(price * 1.6),
          date: new Date().toISOString().split('T')[0],
          imageUrl: img ? img.src : '',
          category: 'Vinted Import'
        });
      }
    }
  });

  // Fallback : Si rien trouvé, on scanne toute la page de manière atomique
  if (items.length === 0) {
    console.log("⚠️ Mode fallback activé...");
    const allElements = Array.from(document.querySelectorAll('*'));
    allElements.forEach(el => {
      const text = el.innerText;
      if (text && priceRegex.test(text) && text.length < 15) {
        // On a trouvé un prix isolé, on cherche le titre au dessus
        const price = parseFloat(text.match(priceRegex)[1].replace(',', '.'));
        let prev = el.previousElementSibling || el.parentElement?.firstElementChild;
        let titleCandidate = "";
        
        while (prev && !titleCandidate) {
          if (prev.innerText?.length > 10) titleCandidate = prev.innerText.split('\\n')[0];
          prev = prev.previousElementSibling;
        }
        
        if (titleCandidate && !isNaN(price)) {
          items.push({ title: titleCandidate, purchasePrice: price, salePrice: Math.round(price * 1.5), date: new Date().toISOString().split('T')[0], category: 'Vinted Import' });
        }
      }
    });
  }

  const uniqueItems = items.filter((v,i,a)=>a.findIndex(t=>(t.title===v.title))===i);

  console.log("✅ Articles trouvés :", uniqueItems);
  
  if (uniqueItems.length > 0) {
    console.log(JSON.stringify({ platform: 'VINTED', items: uniqueItems }, null, 2));
    alert("EXTRACTION RÉUSSIE !\\n" + uniqueItems.length + " articles détectés.\\n\\nCopiez le bloc JSON dans la console.");
  } else {
    alert("ERREUR : Aucun article détecté.\\n\\nEssayez de rafraîchir la page ou de descendre en bas de la liste.");
  }
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
