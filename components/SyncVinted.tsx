import React, { useState } from 'react';
import JSZip from 'jszip';
import { 
  RefreshCw, 
  Plus, 
  Trash2, 
  Calendar, 
  ShieldCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  Info, 
  FileText, 
  Download, 
  Loader2,
  Timer,
  MousePointer2,
  Fingerprint,
  Puzzle,
  Zap,
  HelpCircle,
  LayoutDashboard,
  Users,
  Settings2,
  ArrowRight,
  Shield,
  Clock,
  ChevronRight,
  Play,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'ACCOUNTS' | 'AUTOMATIONS'>('DASHBOARD');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  const [newAccount, setNewAccount] = useState({
    nickname: '',
    startDate: '',
    endDate: ''
  });

  const [syncData, setSyncData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Guide content
  const guideSteps = [
    {
      title: "Bienvenue sur Sync Stealth",
      description: "Apprenez à synchroniser vos comptes Vinted de manière totalement invisible pour les algorithmes.",
      icon: <Zap className="w-8 h-8 text-indigo-500" />,
      color: "bg-indigo-50 dark:bg-indigo-900/30",
    },
    {
      title: "Étape 1 : Créer votre compte",
      description: "Ajoutez un pseudonyme pour identifier votre boutique dans votre inventaire centralisé.",
      icon: <Users className="w-8 h-8 text-emerald-500" />,
      color: "bg-emerald-50 dark:bg-emerald-900/30",
    },
    {
      title: "Étape 2 : Le Script Invisible",
      description: "Copiez notre script 'Ghost' et collez-le dans la console de votre navigateur (F12) sur Vinted.",
      icon: <FileText className="w-8 h-8 text-amber-500" />,
      color: "bg-amber-50 dark:bg-amber-900/30",
    },
    {
      title: "Étape 3 : Synchronisation",
      description: "Le script extrait vos ventes et achats. Copiez le résultat et collez-le ici pour mettre à jour votre bordereau.",
      icon: <RefreshCw className="w-8 h-8 text-purple-500" />,
      color: "bg-purple-50 dark:bg-purple-900/30",
    }
  ];

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
// Scraper Vinted "Ghost-Sync" v21.0 - Ultra Precision
(async () => {
  console.log("%c🚀 Lancement du Scraper Ghost-Sync v21.0", "color: #6366f1; font-weight: bold; font-size: 14px;");
  
  const statusEl = document.createElement('div');
  const style = "position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; background: #0f172a; color: white; padding: 25px; border-radius: 24px; font-family: sans-serif; font-weight: 800; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 2px solid #6366f1; min-width: 320px; text-align: center; transition: all 0.4s ease;";
  statusEl.style.cssText = style;
  statusEl.innerHTML = '<div style="margin-bottom: 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #818cf8;">Sécurité Vinted : Maximale</div>' +
                       '<div id="sync-progress" style="font-size: 16px; margin-bottom: 10px;">Analyse furtive...</div>' +
                       '<div style="width: 100%; background: #1e293b; height: 6px; border-radius: 3px; overflow: hidden;">' +
                       '<div id="sync-bar" style="width: 0%; height: 100%; background: #6366f1; transition: width 0.3s ease;"></div>' +
                       '</div>';
  document.body.appendChild(statusEl);

  const wait = (min, max) => new Promise(res => setTimeout(res, Math.floor(Math.random() * (max - min + 1) + min)));

  const stealthScroll = async () => {
    let lastHeight = document.body.scrollHeight;
    let stationary = 0;
    let currentScroll = 0;
    
    while (stationary < 8) {
      const jump = Math.floor(Math.random() * 800) + 400;
      currentScroll += jump;
      window.scrollTo({ top: currentScroll, behavior: 'smooth' });
      await wait(800, 1500);
      
      const newHeight = document.body.scrollHeight;
      if (newHeight === lastHeight) stationary++;
      else { stationary = 0; lastHeight = newHeight; }
      
      const progress = Math.min(98, Math.round((currentScroll / lastHeight) * 100));
      document.getElementById('sync-progress').innerText = "Vitesse Stealth habituelle... " + progress + "%";
      document.getElementById('sync-bar').style.width = progress + "%";
      if (currentScroll > 50000) break;
    }
  };

  await stealthScroll();
  
  const isSalesPage = /sold|transactions|mes_ventes|orders|purchase|achats|sales/.test(window.location.href);
  const items = [];
  
  const selectors = ['[data-testid*="grid-item"]', '[data-testid*="item-card"]', '.feed-grid__item', 'article'];
  const containers = document.querySelectorAll(selectors.join(', '));

  containers.forEach(el => {
    try {
      const text = el.innerText || "";
      const priceMatch = text.match(/(\\d+[,.]?\\d*)\\s*[€£$]/) || text.match(/[€£$]\\s*(\\d+[,.]?\\d*)/);
      const img = el.querySelector("img");
      
      if (priceMatch && img && img.src && !img.src.includes("avatar")) {
        const lines = text.split("\\n").map(l => l.trim()).filter(l => l.length > 2 && !l.includes("€") && !l.includes("£") && !l.includes("$"));
        const titleCandidate = lines.sort((a, b) => b.length - a.length)[0] || "Article Vinted";
        const brandCandidate = lines.find(l => l !== titleCandidate && l.length > 2) || "";
        const isSold = /vendu|sold|terminé|finalisé/.test(text.toLowerCase());
        
        items.push({ 
          title: titleCandidate, 
          brand: brandCandidate, 
          salePrice: parseFloat(priceMatch[1].replace(",", ".")), 
          imageUrl: img.src, 
          status: (isSalesPage || isSold) ? "SOLD" : "IN_STOCK",
          date: new Date().toISOString().split("T")[0] 
        });
      }
    } catch (e) {}
  });

  const finalItems = items.filter((v,i,a)=>a.findIndex(t=>(t.imageUrl===v.imageUrl))===i);
  const jsonOutput = JSON.stringify({ platform: 'VINTED', items: finalItems }, null, 2);

  if (finalItems.length > 0) {
    statusEl.style.background = "#10b981";
    statusEl.innerHTML = '<div style="font-size: 18px; margin-bottom: 10px;">✅ SYNC OK (\${finalItems.length})</div>' +
                         '<button id="copy-vpro-btn" style="background: white; color: #10b981; border: none; padding: 12px; border-radius: 12px; font-weight: 900; cursor: pointer; width: 100%;">COPIER POUR LE SITE</button>';
    document.getElementById('copy-vpro-btn').onclick = async () => {
      await navigator.clipboard.writeText(jsonOutput);
      document.getElementById('copy-vpro-btn').innerText = "COPIÉ !";
      setTimeout(() => statusEl.remove(), 2500);
    };
  } else {
    statusEl.style.background = "#f43f5e";
    statusEl.innerHTML = "❌ AUCUN ARTICLE TROUVÉ<br>Scrollez ou changez de page.";
    setTimeout(() => statusEl.remove(), 5000);
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
      
      const newItems: InventoryItem[] = data.items.map((item: any) => ({
        id: crypto.randomUUID(),
        displayId: '',
        name: item.title || 'Article Vinted',
        brand: item.brand || '',
        size: '',
        condition: ItemCondition.VERY_GOOD,
        purchasePrice: 0,
        displaySalePrice: item.salePrice,
        salePrice: item.salePrice,
        fees: 0,
        shippingCost: 0,
        boostCost: 0,
        status: item.status === 'SOLD' ? ItemStatus.SOLD : ItemStatus.IN_STOCK,
        subStatus: ItemSubStatus.NONE,
        purchaseDate: item.date || new Date().toISOString().split('T')[0],
        category: 'Vêtements',
        imageUrl: item.imageUrl || ''
      }));

      onAddInventoryItems(newItems);
      onSync(selectedAccountId!, { lastSync: new Date().toISOString() });
      setIsSyncModalOpen(false);
      setSyncData('');
    } catch (err) {
      alert("Format invalide. Collez bien le JSON généré par le script.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto px-4 md:px-8">
      {/* Header with Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin-slow" />
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Vinted Sync Dashboard</h2>
          </div>
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
            {[
              { id: 'DASHBOARD', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Tableau de bord' },
              { id: 'ACCOUNTS', icon: <Users className="w-4 h-4" />, label: 'Configuration Comptes' },
              { id: 'AUTOMATIONS', icon: <Settings2 className="w-4 h-4" />, label: 'Automatisations' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsGuideOpen(true)}
            className="px-6 py-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2 border-2 border-indigo-100 dark:border-indigo-800"
          >
            <HelpCircle className="w-5 h-5" />
            Aide & Guide
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter un compte
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'DASHBOARD' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Main Stats Column */}
              <div className="lg:col-span-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Quick Sync Hero */}
                  <div className="bg-indigo-600 rounded-[40px] p-8 text-white relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-500" />
                    <Zap className="w-10 h-10 mb-6 text-indigo-200" />
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-2">Sync Furtive</h3>
                    <p className="text-indigo-100 text-sm font-medium mb-8 leading-relaxed opacity-80">
                      Utilisez le script Ghost Engine pour une synchronisation totale sans risque de bannissement.
                    </p>
                    <button 
                      onClick={handleCopyScript}
                      className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Script Copié !' : 'Copier le script Ghost'}
                    </button>
                  </div>

                  {/* Connected Accounts Overview */}
                  <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl relative group">
                    <div className="flex items-center justify-between mb-8">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">État du Réseau</h4>
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-black text-slate-900 dark:text-white uppercase italic">Comptes Liés</span>
                         <span className="text-3xl font-black tracking-tighter text-indigo-600">{connectedAccounts.length}</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-600" style={{ width: `${Math.min(100, connectedAccounts.length * 20)}%` }} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                           <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Ventes Sync</div>
                           <div className="text-lg font-black text-slate-900 dark:text-white">Active</div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                           <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Protection</div>
                           <div className="text-lg font-black text-emerald-500">MAXIMALE</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Sync Table / Activity */}
                <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-slate-100 dark:border-slate-800 shadow-xl">
                   <div className="flex items-center justify-between mb-10">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Activité de Sync Récente</h3>
                      <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all">
                        Tout voir <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                   </div>
                   
                   <div className="space-y-4">
                      {connectedAccounts.length > 0 ? connectedAccounts.slice(0, 3).map(acc => (
                        <div key={acc.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 transition-all group">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
                                 <RefreshCw className="w-6 h-6 text-indigo-600 group-hover:rotate-180 transition-transform duration-500" />
                              </div>
                              <div>
                                 <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">{acc.nickname}</h4>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Dernière fois : {acc.lastSync ? new Date(acc.lastSync).toLocaleDateString() : 'Jamais'}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-8">
                              <div className="text-right hidden md:block">
                                 <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Status</div>
                                 <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">PRÊT</span>
                                 </div>
                              </div>
                              <button 
                                onClick={() => { setSelectedAccountId(acc.id); setIsSyncModalOpen(true); }}
                                className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none hover:scale-105 transition-all"
                              >
                                <Play className="w-5 h-5 fill-current" />
                              </button>
                           </div>
                        </div>
                      )) : (
                        <div className="py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[32px] flex flex-col items-center justify-center text-center">
                           <Info className="w-10 h-10 text-slate-300 mb-4" />
                           <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Aucune activité enregistrée</p>
                        </div>
                      )}
                   </div>
                </div>
              </div>

              {/* Sidebar Info/Market */}
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-slate-900 dark:bg-black rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
                   <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -mr-24 -mt-24 blur-3xl" />
                   <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 italic">Intelligence Stealth</h4>
                   
                   <div className="space-y-6">
                      <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-3">
                         <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-indigo-400" />
                            <span className="text-sm font-black uppercase italic">Protection de Tunnel</span>
                         </div>
                         <p className="text-[10px] text-slate-400 leading-relaxed font-medium">L\'algorithme Vinted détecte les patterns de connexion répétées. Vos synchronisations sont bufferisées pour ne jamais sortir des limites sécurisées.</p>
                      </div>
                      
                      <div className="p-5 bg-white/10 rounded-3xl border border-white/10 space-y-3">
                         <div className="flex items-center gap-3 text-emerald-400">
                            <Lightbulb className="w-5 h-5" />
                            <span className="text-sm font-black uppercase italic">Conseil du Coach</span>
                         </div>
                         <p className="text-[10px] text-indigo-100 leading-relaxed font-bold italic">"Synchronisez après une session de navigation manuelle sur l\'appli pour paraître 100% légitime auprès du serveur Vinted."</p>
                      </div>
                   </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Statut des Serveurs Vinted</h4>
                   <div className="space-y-4">
                      {['France', 'Belgique', 'Italie', 'Espagne'].map(country => (
                        <div key={country} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{country}</span>
                           </div>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">99.9% UP</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ACCOUNTS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {connectedAccounts.map(account => (
                 <div key={account.id} className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-slate-100 dark:border-slate-800 shadow-xl relative group overflow-hidden hover:border-indigo-500/50 transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
                    
                    <div className="flex justify-between items-start mb-10 relative z-10">
                       <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
                          <Users className="w-8 h-8 text-indigo-600" />
                       </div>
                       <button 
                          onClick={() => onDeleteAccount(account.id)}
                          className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all"
                       >
                          <Trash2 className="w-5 h-5" />
                       </button>
                    </div>

                    <div className="mb-10">
                       <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-1">{account.nickname}</h3>
                       <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5" /> Synchronisation Active
                       </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                       <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                          <div className="text-[8px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Période</div>
                          <div className="text-[10px] font-black text-slate-900 dark:text-white uppercase italic">{account.startDate || '2024'} → {account.endDate || '2024'}</div>
                       </div>
                       <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                          <div className="text-[8px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Dernier Sync</div>
                          <div className="text-[10px] font-black text-indigo-600 uppercase italic leading-none">{account.lastSync ? new Date(account.lastSync).toLocaleDateString() : 'Initial'}</div>
                       </div>
                    </div>

                    <button 
                      onClick={() => { setSelectedAccountId(account.id); setIsSyncModalOpen(true); }}
                      className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Lancer la Capture
                    </button>
                 </div>
               ))}
               
               <button 
                 onClick={() => setIsAddModalOpen(true)}
                 className="bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-10 group hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300"
               >
                  <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[32px] flex items-center justify-center shadow-xl mb-6 group-hover:scale-110 transition-transform border border-slate-100 dark:border-slate-800">
                     <Plus className="w-10 h-10 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Nouveau Compte</h3>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Cliquez pour lier une boutique</p>
               </button>
            </div>
          )}

          {activeTab === 'AUTOMATIONS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-slate-100 dark:border-slate-800 shadow-xl relative group">
                  <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                     <RefreshCw className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-2">Relist Auto</h3>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-6 italic">STEALTH BOOST v2</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">Boostez la visibilité en republiant automatiquement vos annonces sans perdre l\'antériorité de l\'article.</p>
                  <div className="p-5 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[28px] text-center mb-10">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Développement</span>
                  </div>
                  <button className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest cursor-not-allowed">Prochainement</button>
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-slate-100 dark:border-slate-800 shadow-xl relative group">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                     <Timer className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-2">Price Adjuster</h3>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6 italic">IA DYNAMIQUE</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">L\'IA ajuste vos prix de 1-2€ dynamiquement pour maintenir vos annonces actives dans les filtres "Nouveautés".</p>
                  <button className="w-full py-4 border-2 border-indigo-100 dark:border-indigo-900/30 text-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-50 transition-all opacity-50 cursor-not-allowed italic">Accès Premium requis</button>
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-slate-100 dark:border-slate-800 shadow-xl relative group">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                     <MousePointer2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-2">Offer Sender</h3>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-6 italic">MAX CONVERSION</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">Envoie une offre à -5% automatiquement dès qu\'un utilisateur ajoute votre article en favori.</p>
                  <button className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-100 dark:shadow-none hover:bg-emerald-600 transition-all">Activer le module</button>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Interactive Guide Modal */}
      <AnimatePresence>
        {isGuideOpen && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl relative border-2 border-indigo-100 dark:border-indigo-900/30"
            >
               <button onClick={() => setIsGuideOpen(false)} className="absolute top-6 right-6 p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:rotate-90 transition-all rounded-2xl z-20">
                 <Trash2 className="w-5 h-5" />
               </button>

               <div className="flex">
                  {/* Sidebar Steps */}
                  <div className="w-1/3 bg-slate-50 dark:bg-slate-800/50 p-8 border-r border-slate-100 dark:border-slate-800 hidden md:block">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 italic">Progression</h4>
                     <div className="space-y-4">
                        {guideSteps.map((step, idx) => (
                           <div key={idx} className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${idx <= guideStep ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-300 border border-slate-100 dark:border-slate-800'}`}>
                                 {idx + 1}
                              </div>
                              <span className={`text-[9px] font-black uppercase tracking-tighter ${idx === guideStep ? 'text-indigo-600' : 'text-slate-400'}`}>Étape {idx + 1}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 p-10 md:p-14">
                      <AnimatePresence mode="wait">
                         <motion.div
                           key={guideStep}
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           className="flex flex-col h-full"
                         >
                            <div className={`w-20 h-20 ${guideSteps[guideStep].color} rounded-[32px] flex items-center justify-center mb-10 shadow-2xl shadow-indigo-100 dark:shadow-none`}>
                               {guideSteps[guideStep].icon}
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none mb-6">
                               {guideSteps[guideStep].title}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-base leading-relaxed mb-12">
                               {guideSteps[guideStep].description}
                            </p>

                            <div className="mt-auto flex items-center justify-between gap-4">
                               {guideStep > 0 && (
                                 <button onClick={() => setGuideStep(p => p - 1)} className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Retour</button>
                               )}
                               {guideStep < guideSteps.length - 1 ? (
                                 <button 
                                  onClick={() => setGuideStep(p => p + 1)}
                                  className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 group"
                                 >
                                    Suivant <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                 </button>
                               ) : (
                                 <button 
                                  onClick={() => setIsGuideOpen(false)}
                                  className="flex-1 px-8 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-3"
                                 >
                                    J\'ai compris, c\'est parti ! <ArrowRight className="w-5 h-5" />
                                 </button>
                               )}
                            </div>
                         </motion.div>
                      </AnimatePresence>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              Capture furtive
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
                    <li>Ouvrez la console (F12)</li>
                    <li>Collez le script Ghost et appuyez sur Entrée</li>
                    <li>Copiez le résultat JSON généré et collez-le ci-dessous</li>
                  </ol>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <textarea 
                value={syncData}
                onChange={e => setSyncData(e.target.value)}
                placeholder="Collez ici le résultat JSON du script..."
                className="w-full h-48 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500 outline-none font-mono text-[10px] text-slate-900 dark:text-white mb-8 resize-none"
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
                Annuler
              </button>
              <button 
                onClick={processSyncData}
                disabled={!syncData || isProcessing}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Importer les articles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncVinted;
