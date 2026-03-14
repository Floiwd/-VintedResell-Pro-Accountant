import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, Layers, CreditCard, LogOut, Moon, Sun, TrendingUp, Cloud, Check, AlertCircle, Loader2, Save, Globe } from 'lucide-react';
import { AppState, FilterState, RecurringExpense } from './types';
import { INITIAL_INVENTORY, INITIAL_MEMBERS } from './constants';
import { supabase } from './lib/supabase';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Finances from './components/Finances';
import PricingGuide from './components/PricingGuide';
import Auth from './components/Auth';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const NavItem = ({ active, onClick, icon, label, badgeCount }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badgeCount?: number }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center justify-between px-5 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all duration-300 ${
      active 
      ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 dark:shadow-none translate-x-1' 
      : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    <div className="flex items-center gap-4">
      <span className={`${active ? 'scale-110' : 'scale-100'} transition-transform`}>{icon}</span>
      <span>{label}</span>
    </div>
    {badgeCount !== undefined && badgeCount > 0 && (
      <span className={`px-2 py-1 rounded-full text-[9px] font-black ${active ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'}`}>
        {badgeCount}
      </span>
    )}
  </button>
);

const AppContent: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'finances' | 'pricing'>('dashboard');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('vpro_theme') === 'dark';
  });

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vpro_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('vpro_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const toggleLanguage = () => setLanguage(language === 'fr' ? 'en' : 'fr');

  const [state, setState] = useState<AppState>({
    inventory: INITIAL_INVENTORY,
    members: INITIAL_MEMBERS,
    transfers: [],
    recurringExpenses: [],
    cashThreshold: 100,
    nextItemNumber: INITIAL_INVENTORY.length + 1,
    sharedWith: [],
    filters: { brands: [], categories: [], sizes: [], status: [], dateRange: { start: '', end: '' }, sortBy: 'id_desc', searchTerm: '' },
    catalog: []
  });

  const isInitialLoad = useRef(true);

  // --- LOGIQUE DÉPENSES RÉCURRENTES ---
  const processRecurringExpenses = useCallback((currentState: AppState) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newTransfers = [...currentState.transfers];
    let newExpenses = [...currentState.recurringExpenses];
    let hasChanges = false;

    newExpenses.forEach((exp, index) => {
        if (!exp.active) return;
        
        let dueDate = new Date(exp.nextDueDate);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate <= today) {
            hasChanges = true;
            newTransfers.push({
                id: crypto.randomUUID(),
                amount: exp.amount,
                date: exp.nextDueDate,
                type: 'WITHDRAWAL',
                description: `[Abonnement] ${exp.name}`
            });

            const nextDate = new Date(dueDate);
            if (exp.frequency === 'MONTHLY') {
                nextDate.setMonth(nextDate.getMonth() + 1);
            } else if (exp.frequency === 'YEARLY') {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            } else if (exp.frequency === 'WEEKLY') {
                nextDate.setDate(nextDate.getDate() + 7);
            }
            
            newExpenses[index] = {
                ...exp,
                nextDueDate: nextDate.toISOString().split('T')[0]
            };
        }
    });

    if (hasChanges) {
        setState(prev => ({
            ...prev,
            transfers: newTransfers,
            recurringExpenses: newExpenses
        }));
    }
  }, []);

  const getOrgId = async (userId: string) => {
    let orgId = userId;
    try {
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', userId).maybeSingle();
      if (profile && profile.organization_id) {
        orgId = profile.organization_id;
      }
    } catch (e) {
      console.warn("Error fetching profile, defaulting to userId:", e);
    }
    return orgId;
  };

  const saveToCloud = async (newState: AppState, manual = false) => {
    if ((!isInitialized || isInitialLoad.current || loadError) && !manual) return;
    setSaveStatus('saving');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
          if (manual) alert("Vous devez être connecté pour sauvegarder.");
          setSaveStatus('error');
          return;
      }
      const orgId = await getOrgId(user.id);
      const { data: existingRows, error: fetchError } = await supabase
        .from('inventory')
        .select('id')
        .eq('organization_id', orgId)
        .limit(1);

      if (fetchError) {
        console.error("Error fetching existing inventory:", fetchError);
        if (manual) alert("Erreur lors de la vérification de l'inventaire: " + fetchError.message);
        setSaveStatus('error');
        return;
      }

      const existingRow = existingRows && existingRows.length > 0 ? existingRows[0] : null;

      if (existingRow) {
        const { error: updateError } = await supabase
          .from('inventory')
          .update({
            state: newState,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRow.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('inventory')
          .insert({
            organization_id: orgId,
            state: newState,
            updated_at: new Date().toISOString()
          });
        if (insertError) throw insertError;
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);

    } catch (err: any) {
      console.error("Sync error:", err);
      if (manual) alert("Erreur de sauvegarde: " + (err.message || "Erreur inconnue"));
      setSaveStatus('error');
    }
  };

  const loadFromCloud = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsInitialized(true);
        isInitialLoad.current = false;
        setLoading(false);
        return;
      }
      const orgId = await getOrgId(user.id);
      const { data, error } = await supabase
        .from('inventory')
        .select('state, updated_at')
        .eq('organization_id', orgId)
        .limit(1)
        .maybeSingle();

      if (error) {
         setLoadError(true);
         alert("Erreur de chargement des données. La sauvegarde automatique est désactivée par sécurité. Veuillez rafraîchir.");
      }
      
      if (data && data.state) {
        const loadedState = {
          ...data.state,
          catalog: data.state.catalog || [],
          recurringExpenses: data.state.recurringExpenses || []
        };
        setState(loadedState);
        setTimeout(() => processRecurringExpenses(loadedState), 100);
      }
      
      if (!error) {
          setIsInitialized(true);
          isInitialLoad.current = false;
      }

    } catch (err) {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [processRecurringExpenses]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) { setUser(session.user); loadFromCloud(); }
      else { setUser(null); setIsInitialized(false); }
    });
    return () => subscription.unsubscribe();
  }, [loadFromCloud]);

  useEffect(() => {
    if (isInitialized && !isInitialLoad.current && !loadError) {
      const timer = setTimeout(() => saveToCloud(state), 2000);
      return () => clearTimeout(timer);
    }
  }, [state, isInitialized, loadError]);

  if (loading && !isInitialized) return (
    <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-[#020617]">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Auth />;

  return (
    <div className="h-screen w-full flex bg-[#F8FAFC] dark:bg-[#020617] overflow-hidden transition-colors duration-500">
      <aside className="hidden lg:flex w-80 bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 flex-col h-full shadow-2xl z-20">
        <div className="p-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-[20px] flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-200 dark:shadow-none">V</div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white leading-none italic uppercase">ResellPro</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{t.nav.connected}</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-6 space-y-2 py-4">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Home className="w-5 h-5" />} label={t.nav.dashboard} />
          <NavItem active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Layers className="w-5 h-5" />} label={t.nav.inventory} />
          <NavItem active={activeTab === 'pricing'} onClick={() => setActiveTab('pricing')} icon={<TrendingUp className="w-5 h-5" />} label={t.nav.pricing} />
          <NavItem active={activeTab === 'finances'} onClick={() => setActiveTab('finances')} icon={<CreditCard className="w-5 h-5" />} label={t.nav.finances} />
        </nav>

        <div className="p-8 space-y-4">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 group">
             <div className="flex items-center gap-2">
                 {saveStatus === 'saving' && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                 {saveStatus === 'saved' && <Check className="w-4 h-4 text-emerald-500" />}
                 {saveStatus === 'error' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                 {saveStatus === 'idle' && <Cloud className="w-4 h-4 text-slate-300" />}
                 <span className="text-[10px] font-black uppercase text-slate-400">
                    {loadError ? 'Erreur Sync' : t.nav.sync}
                 </span>
             </div>
             <button 
                onClick={() => saveToCloud(state, true)} 
                title="Forcer la sauvegarde"
                disabled={loadError}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Save className="w-3 h-3" />
             </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button onClick={toggleDarkMode} className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-[20px] border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                {isDarkMode ? <Moon className="w-5 h-5 text-indigo-400 mb-2" /> : <Sun className="w-5 h-5 text-amber-500 mb-2" />}
                <span className="text-[8px] font-black uppercase text-slate-400">{isDarkMode ? t.nav.theme_dark : t.nav.theme_light}</span>
             </button>
             <button onClick={toggleLanguage} className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-[20px] border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                <Globe className="w-5 h-5 text-indigo-500 mb-2" />
                <span className="text-[8px] font-black uppercase text-slate-400">{language.toUpperCase()}</span>
             </button>
          </div>
          
          <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center gap-4 px-5 py-4 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all">
            <LogOut className="w-4 h-4" /> {t.nav.logout}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        <header className="lg:hidden p-6 glass border-b border-slate-200 dark:border-slate-800 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl">V</div>
            <span className="font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">VPro</span>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={() => saveToCloud(state, true)}
                disabled={loadError || saveStatus === 'saving'}
                className={`p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    saveStatus === 'error' ? 'bg-rose-100 text-rose-500 dark:bg-rose-900/20' :
                    saveStatus === 'saved' ? 'bg-emerald-100 text-emerald-500 dark:bg-emerald-900/20' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                }`}
            >
                {saveStatus === 'saving' ? <Loader2 className="w-5 h-5 animate-spin text-indigo-500" /> :
                 saveStatus === 'saved' ? <Check className="w-5 h-5" /> :
                 saveStatus === 'error' ? <AlertCircle className="w-5 h-5" /> :
                 <Save className="w-5 h-5" />}
            </button>
            <button onClick={toggleLanguage} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black">
                {language.toUpperCase()}
            </button>
            <button onClick={toggleDarkMode} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {isDarkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </button>
          </div>
        </header>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 md:p-12 pb-32 lg:pb-12 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard state={state} onBrandClick={(brand) => {
              setState(prev => ({ ...prev, filters: { brands: [brand], categories: prev.filters?.categories || [], sizes: prev.filters?.sizes || [], status: prev.filters?.status || [], dateRange: prev.filters?.dateRange || { start: '', end: '' }, sortBy: prev.filters?.sortBy, searchTerm: prev.filters?.searchTerm } }));
              setActiveTab('inventory');
            }} />}
            {activeTab === 'inventory' && <Inventory 
              inventory={state.inventory} 
              activeFilters={state.filters}
              catalog={state.catalog || []}
              onAdd={(item) => setState(prev => ({ ...prev, inventory: [...prev.inventory, item] }))} 
              onUpdate={(item) => setState(prev => ({ ...prev, inventory: prev.inventory.map(i => i.id === item.id ? item : i) }))} 
              onDelete={(id) => setState(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== id) }))} 
              onUpdateFilters={(f) => setState(prev => ({ ...prev, filters: f }))}
              onAddCatalogItem={(item) => setState(prev => ({ ...prev, catalog: [...(prev.catalog || []), item] }))}
              onDeleteCatalogItem={(id) => setState(prev => ({ ...prev, catalog: (prev.catalog || []).filter(c => c.id !== id) }))}
            />}
            {activeTab === 'pricing' && <PricingGuide inventory={state.inventory} onBrandClick={(brand) => {
              setState(prev => ({ ...prev, filters: { brands: [brand], categories: prev.filters?.categories || [], sizes: prev.filters?.sizes || [], status: prev.filters?.status || [], dateRange: prev.filters?.dateRange || { start: '', end: '' }, sortBy: prev.filters?.sortBy, searchTerm: prev.filters?.searchTerm } }));
              setActiveTab('inventory');
            }} />}
            {activeTab === 'finances' && <Finances 
                state={state} 
                onAddTransfer={(t) => setState(prev => ({ ...prev, transfers: [...prev.transfers, t] }))} 
                onDeleteTransfer={(id) => setState(prev => ({ ...prev, transfers: prev.transfers.filter(t => t.id !== id) }))} 
                onUpdateMember={(m) => setState(prev => ({ ...prev, members: prev.members.map(mem => mem.id === m.id ? m : mem) }))} 
                onAddMember={(m) => setState(prev => ({ ...prev, members: [...prev.members, m] }))} 
                onDeleteMember={(id) => setState(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id) }))} 
                onSetThreshold={(v) => setState(prev => ({ ...prev, cashThreshold: v }))} 
                onInvitePartner={(e) => {}} 
                onRemovePartner={(e) => {}} 
                onAddRecurringExpense={(exp) => setState(prev => ({ ...prev, recurringExpenses: [...prev.recurringExpenses, exp] }))}
                onDeleteRecurringExpense={(id) => setState(prev => ({ ...prev, recurringExpenses: prev.recurringExpenses.filter(e => e.id !== id) }))}
                onUpdateRecurringExpense={(exp) => setState(prev => ({ ...prev, recurringExpenses: prev.recurringExpenses.map(e => e.id === exp.id ? exp : e) }))}
            />}
          </div>
        </div>

        <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-20 glass border border-slate-200/50 dark:border-white/5 rounded-[32px] shadow-2xl flex items-center justify-around px-4 z-40">
            {[
              { id: 'dashboard', icon: <Home className="w-6 h-6" /> },
              { id: 'inventory', icon: <Layers className="w-6 h-6" /> },
              { id: 'pricing', icon: <TrendingUp className="w-6 h-6" /> },
              { id: 'finances', icon: <CreditCard className="w-6 h-6" /> }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`p-3.5 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl scale-110' : 'text-slate-400'}`}
              >
                {tab.icon}
              </button>
            ))}
        </nav>
      </main>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    )
}

export default App;