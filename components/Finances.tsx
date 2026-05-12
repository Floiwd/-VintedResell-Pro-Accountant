import React, { useState, useMemo, useRef } from 'react';
import { AppState, FinancialTransfer, Member, ItemStatus, RecurringExpense } from '../types';
import { 
  Wallet, Users, Trash2, Plus, Edit3, X, AlertCircle, Settings2, 
  ArrowUpRight, ArrowDownRight, Package, AlertTriangle, UserPlus, 
  Mail, Power, Hourglass, TrendingUp, BarChart3, PieChart, Target, CalendarDays,
  Activity, Repeat, CalendarClock, Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart as RePieChart, Pie, Legend
} from 'recharts';
import ConfirmModal from './ConfirmModal';
import { useLanguage } from '../contexts/LanguageContext';


interface Props {
  state: AppState;
  onAddTransfer: (transfer: FinancialTransfer) => void;
  onDeleteTransfer: (id: string) => void;
  onUpdateMember: (member: Member) => void;
  onAddMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onSetThreshold: (value: number) => void;
  onInvitePartner: (email: string) => void;
  onRemovePartner: (email: string) => void;
  onAddRecurringExpense?: (expense: RecurringExpense) => void;
  onDeleteRecurringExpense?: (id: string) => void;
  onUpdateRecurringExpense?: (expense: RecurringExpense) => void;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Finances: React.FC<Props> = ({ 
    state, onAddTransfer, onDeleteTransfer, onUpdateMember, onAddMember, onDeleteMember, 
    onSetThreshold, onInvitePartner, onRemovePartner,
    onAddRecurringExpense, onDeleteRecurringExpense, onUpdateRecurringExpense
}) => {
  const { t } = useLanguage();
  const [view, setView] = useState<'cashflow' | 'analytics'>('cashflow');
  
  // States existants pour Cashflow
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showThresholdForm, setShowThresholdForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false); // New form state

  const [inviteEmail, setInviteEmail] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  
  const [pendingDeleteTransfer, setPendingDeleteTransfer] = useState<string | null>(null);
  const [pendingDeleteMember, setPendingDeleteMember] = useState<string | null>(null);
  const [pendingDeleteRecurring, setPendingDeleteRecurring] = useState<string | null>(null);

  // --- CALCULS TRÉSORERIE ---
  const soldItems = useMemo(() => state.inventory.filter(i => i.status === ItemStatus.SOLD), [state.inventory]);
  const pendingPaymentItems = useMemo(() => state.inventory.filter(i => i.status === ItemStatus.PAYMENT_PENDING), [state.inventory]);

  const totalCA = soldItems.reduce((acc, i) => acc + i.salePrice, 0);
  const totalInvestment = state.inventory.reduce((acc, i) => acc + i.purchasePrice, 0);
  const totalBoostFees = state.inventory.reduce((acc, i) => acc + (i.boostCost || 0), 0);
  const cashFromTransfers = state.transfers.reduce((acc, t) => {
    if (t.type === 'DEPOSIT' || t.type === 'ADJUSTMENT') return acc + t.amount;
    if (t.type === 'WITHDRAWAL') return acc - t.amount;
    return acc;
  }, 0);
  
  const currentCash = totalCA - totalInvestment - totalBoostFees + cashFromTransfers;
  const pendingCash = pendingPaymentItems.reduce((acc, i) => acc + i.salePrice, 0);
  const netProfitFromSales = soldItems.reduce((acc, i) => acc + (i.salePrice - i.purchasePrice - (i.boostCost || 0)), 0);
  const isBelowThreshold = state.cashThreshold !== undefined && currentCash < state.cashThreshold;
  const activeMembers = state.members.filter(m => m.isActive !== false);

  // --- CALCULS ANALYTICS (SNIPER) ---
  const analytics = useMemo(() => {
    const sold = state.inventory.filter(i => i.status === ItemStatus.SOLD);
    if (sold.length === 0) return null;

    // 1. Profit par Marque
    const brandStats: Record<string, { profit: number, count: number }> = {};
    sold.forEach(item => {
      if (!brandStats[item.brand]) brandStats[item.brand] = { profit: 0, count: 0 };
      brandStats[item.brand].profit += (item.salePrice - item.purchasePrice - (item.boostCost || 0));
      brandStats[item.brand].count += 1;
    });
    const brandChartData = Object.entries(brandStats)
      .map(([name, data]) => ({ name, profit: data.profit, count: data.count }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 8); // Top 8

    // 2. Profit par Taille (ROI)
    const sizeStats: Record<string, { profit: number, count: number }> = {};
    sold.forEach(item => {
      const size = item.size || 'TU';
      if (!sizeStats[size]) sizeStats[size] = { profit: 0, count: 0 };
      sizeStats[size].profit += (item.salePrice - item.purchasePrice - (item.boostCost || 0));
      sizeStats[size].count += 1;
    });
    const sizeChartData = Object.entries(sizeStats)
      .map(([name, data]) => ({ name, profit: data.profit }))
      .sort((a, b) => b.profit - a.profit);

    // 3. Profit par Catégorie
    const catStats: Record<string, number> = {};
    sold.forEach(item => {
        if (!catStats[item.category]) catStats[item.category] = 0;
        catStats[item.category] += (item.salePrice - item.purchasePrice - (item.boostCost || 0));
    });
    const catChartData = Object.entries(catStats)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value);

    // 4. Heatmap Jours de vente
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const dayStats = new Array(7).fill(0);
    sold.forEach(item => {
        if (item.saleDate) {
            const date = new Date(item.saleDate);
            dayStats[date.getDay()] += 1; // 0 = Dimanche
        }
    });
    const dayChartData = dayStats.map((count, i) => ({ name: days[i], count }));
    // Trouver le meilleur jour
    const maxDayIndex = dayStats.indexOf(Math.max(...dayStats));
    const bestDay = days[maxDayIndex];

    return { brandChartData, sizeChartData, catChartData, dayChartData, bestDay };
  }, [state.inventory]);


  // Handlers
  const handleTransferSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onAddTransfer({
      id: Date.now().toString(),
      amount: Number(formData.get('amount')),
      date: formData.get('date') as string,
      type: formData.get('type') as any,
      description: formData.get('description') as string,
      memberId: formData.get('memberId') as string || undefined
    });
    setShowTransferForm(false);
  };

  const handleMemberSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const memberData: Member = {
      id: editingMember?.id || Date.now().toString(),
      name: formData.get('name') as string,
      sharePercentage: Number(formData.get('sharePercentage')),
      isActive: editingMember ? editingMember.isActive : true
    };
    if (editingMember) onUpdateMember(memberData); else onAddMember(memberData);
    setShowMemberForm(false); setEditingMember(null);
  };

  const toggleMemberStatus = (member: Member) => {
    onUpdateMember({ ...member, isActive: member.isActive === false ? true : false });
  };

  const handleThresholdSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSetThreshold(Number(formData.get('threshold')));
    setShowThresholdForm(false);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInvitePartner(inviteEmail); setInviteEmail(''); setShowInviteForm(false);
  };

  const handleRecurringSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      if (onAddRecurringExpense) {
          onAddRecurringExpense({
              id: crypto.randomUUID(),
              name: formData.get('name') as string,
              amount: Number(formData.get('amount')),
              frequency: formData.get('frequency') as any,
              nextDueDate: formData.get('nextDueDate') as string,
              active: true
          });
      }
      setShowRecurringForm(false);
  };

  const toggleRecurringActive = (expense: RecurringExpense) => {
      if (onUpdateRecurringExpense) {
          onUpdateRecurringExpense({ ...expense, active: !expense.active });
      }
  };

  // --- RENDER ---

  const handleExportCSV = () => {
    // Export Cashflow
    const cashflowHeaders = ["Date", "Type", "Description", "Montant", "Associé"];
    const cashflowRows = state.transfers.map(t => {
      const typeLabel = t.type === 'DEPOSIT' ? 'Dépôt' : t.type === 'WITHDRAWAL' ? 'Retrait' : 'Ajustement';
      const amount = (t.type === 'DEPOSIT' || t.type === 'ADJUSTMENT') ? `+${t.amount}` : `-${t.amount}`;
      const member = t.memberId ? state.members.find(m => m.id === t.memberId)?.name || 'Inconnu' : 'Caisse Commune';
      return [t.date, typeLabel, t.description, amount, member];
    });
    const cashflowCsv = [cashflowHeaders, ...cashflowRows].map(e => e.join(",")).join("\n");
    const cashflowBlob = new Blob([cashflowCsv], { type: 'text/csv;charset=utf-8;' });
    const cashflowUrl = URL.createObjectURL(cashflowBlob);
    const cashflowLink = document.createElement("a");
    cashflowLink.href = cashflowUrl;
    cashflowLink.setAttribute("download", `flux_tresorerie_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(cashflowLink);
    cashflowLink.click();
    document.body.removeChild(cashflowLink);

    // Export Analytics (Brand Profit)
    if (analytics) {
      const analyticsHeaders = ["Marque", "Profit", "Nombre de Ventes"];
      const analyticsRows = analytics.brandChartData.map(b => [b.name, b.profit.toFixed(2), b.count]);
      const analyticsCsv = [analyticsHeaders, ...analyticsRows].map(e => e.join(",")).join("\n");
      const analyticsBlob = new Blob([analyticsCsv], { type: 'text/csv;charset=utf-8;' });
      const analyticsUrl = URL.createObjectURL(analyticsBlob);
      const analyticsLink = document.createElement("a");
      analyticsLink.href = analyticsUrl;
      analyticsLink.setAttribute("download", `analytiques_marques_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(analyticsLink);
      analyticsLink.click();
      document.body.removeChild(analyticsLink);
    }
  };

  const renderAnalytics = () => {
      if (!analytics) return (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-bold text-sm">{t.finances.analytics.not_enough_data}</p>
          </div>
      );

      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Key Metrics Summary */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                 <div className="bg-indigo-600 rounded-[24px] md:rounded-[32px] p-6 md:p-8 text-white relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Target className="w-24 h-24" /></div>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-2">{t.finances.analytics.brand_star}</p>
                     <h3 className="text-2xl md:text-3xl font-black mb-1">{analytics.brandChartData[0]?.name || 'N/A'}</h3>
                     <p className="text-[10px] md:text-xs font-bold opacity-80">+{analytics.brandChartData[0]?.profit.toFixed(2)}€ {t.inventory.item_card.profit.toLowerCase()}</p>
                 </div>
                 <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] md:rounded-[32px] p-6 md:p-8 relative overflow-hidden">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{t.finances.analytics.best_day}</p>
                     <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2 md:gap-3">
                         <CalendarDays className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" /> {analytics.bestDay}
                     </h3>
                     <p className="text-[10px] md:text-xs font-bold text-slate-500">Pic de ventes hebdomadaire</p>
                 </div>
                 <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] md:rounded-[32px] p-6 md:p-8 relative overflow-hidden">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{t.finances.analytics.total_margin}</p>
                     <h3 className="text-2xl md:text-3xl font-black text-emerald-500 mb-1">+{netProfitFromSales.toFixed(2)}€</h3>
                     <p className="text-[10px] md:text-xs font-bold text-slate-500">Sur {soldItems.length} articles vendus</p>
                 </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                 {/* Chart 1: Profit par Marque */}
                 <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                     <h3 className="text-xs md:text-sm font-black uppercase text-slate-900 dark:text-white mb-6 md:mb-8 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-500" /> {t.finances.analytics.profit_by_brand}
                     </h3>
                     <div className="h-[300px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={analytics.brandChartData} margin={{top: 0, right: 0, left: -20, bottom: 0}}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} interval={0} />
                                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(value) => value.toFixed(2)} />
                                 <Tooltip 
                                    formatter={(value: number) => value.toFixed(2)}
                                    cursor={{fill: 'transparent'}}
                                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)'}}
                                 />
                                 <Bar dataKey="profit" radius={[6, 6, 0, 0]} barSize={40}>
                                     {analytics.brandChartData.map((entry, index) => (
                                         <Cell key={`cell-${index}`} fill={index === 0 ? '#4F46E5' : '#818cf8'} />
                                     ))}
                                 </Bar>
                             </BarChart>
                         </ResponsiveContainer>
                     </div>
                 </div>

                 {/* Chart 2: Répartition Catégorie */}
                 <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                     <h3 className="text-xs md:text-sm font-black uppercase text-slate-900 dark:text-white mb-6 md:mb-8 flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-emerald-500" /> {t.finances.analytics.margin_by_cat}
                     </h3>
                     <div className="h-[300px] w-full flex items-center justify-center">
                         <ResponsiveContainer width="100%" height="100%">
                             <RePieChart>
                                 <Pie
                                     data={analytics.catChartData}
                                     innerRadius={60}
                                     outerRadius={100}
                                     paddingAngle={5}
                                     dataKey="value"
                                 >
                                     {analytics.catChartData.map((entry, index) => (
                                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                     ))}
                                 </Pie>
                                 <Tooltip 
                                     formatter={(value: number) => value.toFixed(2)}
                                     contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)'}} 
                                 />
                                 <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}} />
                             </RePieChart>
                         </ResponsiveContainer>
                     </div>
                 </div>

                 {/* Chart 3: Performance par Taille */}
                 <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                     <h3 className="text-xs md:text-sm font-black uppercase text-slate-900 dark:text-white mb-6 md:mb-8 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-500" /> {t.finances.analytics.roi_size}
                     </h3>
                     <div className="h-[250px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={analytics.sizeChartData}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(value) => value.toFixed(2)} />
                                 <Tooltip 
                                     formatter={(value: number) => value.toFixed(2)}
                                     cursor={{fill: 'transparent'}} 
                                     contentStyle={{borderRadius: '12px'}} 
                                 />
                                 <Bar dataKey="profit" radius={[4, 4, 0, 0]} fill="#F59E0B" barSize={30} />
                             </BarChart>
                         </ResponsiveContainer>
                     </div>
                 </div>

                 {/* Chart 4: Heatmap Jours */}
                 <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                     <h3 className="text-xs md:text-sm font-black uppercase text-slate-900 dark:text-white mb-6 md:mb-8 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-rose-500" /> {t.finances.analytics.sales_freq} (Semaine)
                     </h3>
                     <div className="h-[250px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={analytics.dayChartData}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                 <Tooltip 
                                     formatter={(value: number) => value.toFixed(2)}
                                     cursor={{fill: 'transparent'}} 
                                     contentStyle={{borderRadius: '12px'}} 
                                 />
                                 <Bar dataKey="count" radius={[10, 10, 10, 10]} fill="#EC4899" barSize={12} />
                             </BarChart>
                         </ResponsiveContainer>
                     </div>
                 </div>
             </div>
        </div>
      );
  };

  const renderCashflow = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
      {isBelowThreshold && (
        <div className="flex items-center gap-4 p-6 bg-rose-600 border border-rose-700 rounded-3xl text-white shadow-xl shadow-rose-200 dark:shadow-none animate-bounce-subtle">
          <div className="p-3 bg-white/20 rounded-2xl">
            <AlertTriangle className="w-8 h-8 flex-shrink-0 animate-pulse" />
          </div>
          <div>
            <p className="text-lg font-black uppercase tracking-tight">{t.finances.cashflow.alert}</p>
            <p className="text-sm font-medium opacity-90">
              {t.finances.cashflow.alert_desc}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className={`p-6 md:p-8 rounded-[24px] md:rounded-[32px] text-white shadow-2xl relative overflow-hidden group transition-colors duration-500 ${isBelowThreshold ? 'bg-rose-900 shadow-rose-200 dark:shadow-none' : 'bg-slate-900 dark:bg-slate-800 dark:border dark:border-slate-700'}`}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <span className={`font-black uppercase tracking-widest text-xs flex items-center gap-2 ${isBelowThreshold ? 'text-rose-200' : 'text-slate-400'}`}>
                <Wallet className={`w-4 h-4 ${isBelowThreshold ? 'text-rose-400' : 'text-indigo-400'}`} /> {t.finances.cashflow.real_cash}
              </span>
              <button onClick={() => setShowThresholdForm(true)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <Settings2 className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2 mb-6 md:mb-8">
              <h2 className={`text-4xl md:text-5xl font-black tracking-tighter ${currentCash >= 0 ? 'text-white' : 'text-rose-500'}`}>
                {currentCash.toFixed(2)}€
              </h2>
              {/* Affichage de la Trésorerie en Attente */}
              {pendingCash > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 w-fit animate-in fade-in slide-in-from-bottom-2">
                      <Hourglass className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
                      <span className="text-xs font-bold text-blue-200 uppercase tracking-wide">
                        +{pendingCash.toFixed(2)}€ {t.finances.cashflow.pending}
                      </span>
                  </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" /> {t.finances.cashflow.entries}
                </div>
                <div className="text-lg font-black text-emerald-400">+{totalCA.toFixed(2)}€</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase">
                  <ArrowDownRight className="w-3 h-3 text-rose-500" /> {t.finances.cashflow.outputs}
                </div>
                <div className="text-lg font-black text-rose-400">-{(totalInvestment + totalBoostFees).toFixed(2)}€</div>
              </div>
            </div>

            <button onClick={() => setShowTransferForm(true)} className={`w-full mt-6 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 ${isBelowThreshold ? 'bg-rose-500 text-white hover:bg-rose-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
              {t.finances.cashflow.record_move}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400" /> {t.finances.team.title}
              </h3>
              <p className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{t.finances.team.subtitle}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowInviteForm(true)} className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all" title="Inviter un associé">
                <UserPlus className="w-5 h-5" />
              </button>
              <button onClick={() => { setEditingMember(null); setShowMemberForm(true); }} className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="space-y-6 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {state.members.map(member => {
                const shareValue = (netProfitFromSales * member.sharePercentage) / 100;
                const withdrawn = state.transfers.filter(t => t.memberId === member.id && t.type === 'WITHDRAWAL').reduce((acc, t) => acc + t.amount, 0);
                const remaining = shareValue - withdrawn;
                const isActive = member.isActive !== false; // Default true

                return (
                  <div key={member.id} className={`p-5 rounded-2xl border transition-all relative group ${isActive ? 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700' : 'bg-slate-100/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 opacity-60 grayscale'}`}>
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                            {member.name}
                            {!isActive && <span className="text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">{t.finances.recurring.inactive}</span>}
                          </h4>
                          <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mt-0.5">{member.sharePercentage}% DES PROFITS</div>
                        </div>
                        <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => toggleMemberStatus(member)} 
                            className={`p-1.5 bg-white dark:bg-slate-700 shadow-sm rounded-lg transition-all ${isActive ? 'text-slate-400 hover:text-orange-500' : 'text-slate-400 hover:text-emerald-600'}`}
                            title={isActive ? "Désactiver" : "Activer"}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { setEditingMember(member); setShowMemberForm(true); }} className="p-1.5 bg-white dark:bg-slate-700 shadow-sm rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setPendingDeleteMember(member.id)} className="p-1.5 bg-white dark:bg-slate-700 shadow-sm rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{t.finances.team.share} :</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">{shareValue.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between items-end pt-1">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{t.finances.team.remaining} :</span>
                          <span className={`text-lg font-black ${remaining > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{remaining.toFixed(2)}€</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    
      {/* SECTION ABONNEMENTS */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] md:rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 flex justify-between items-center">
            <div>
               <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                   <Repeat className="w-5 h-5 text-indigo-500" /> {t.finances.recurring.title}
               </h3>
               <p className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{t.finances.recurring.subtitle}</p>
            </div>
            <button onClick={() => setShowRecurringForm(true)} className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all">
                <Plus className="w-5 h-5" />
            </button>
        </div>
        <div className="p-4 md:p-6">
            {state.recurringExpenses && state.recurringExpenses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {state.recurringExpenses.map(expense => (
                        <div key={expense.id} className={`p-5 rounded-2xl border transition-all relative group ${expense.active ? 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700' : 'bg-slate-100/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 opacity-60 grayscale'}`}>
                             <div className="flex justify-between items-start mb-3">
                                 <div>
                                     <h4 className="font-black text-slate-900 dark:text-white text-sm">{expense.name}</h4>
                                     <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md uppercase">
                                            {expense.frequency === 'MONTHLY' ? t.finances.recurring.monthly : expense.frequency === 'YEARLY' ? t.finances.recurring.yearly : t.finances.recurring.weekly}
                                        </span>
                                        {!expense.active && <span className="text-[8px] font-black text-slate-400 uppercase">{t.finances.recurring.inactive}</span>}
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <div className="text-lg font-black text-rose-500">-{expense.amount}€</div>
                                 </div>
                             </div>
                             <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                     <CalendarClock className="w-3.5 h-3.5" /> {t.finances.recurring.next} : {expense.nextDueDate}
                                 </div>
                                 <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button onClick={() => toggleRecurringActive(expense)} className={`p-1.5 rounded-lg transition-colors ${expense.active ? 'bg-white dark:bg-slate-700 text-slate-400 hover:text-orange-500' : 'bg-emerald-50 text-emerald-600'}`} title={expense.active ? "Désactiver" : "Activer"}>
                                         <Power className="w-3.5 h-3.5" />
                                     </button>
                                     <button onClick={() => setPendingDeleteRecurring(expense.id)} className="p-1.5 bg-white dark:bg-slate-700 text-slate-400 hover:text-rose-500 rounded-lg transition-colors">
                                         <Trash2 className="w-3.5 h-3.5" />
                                     </button>
                                 </div>
                             </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-slate-400">
                    <Repeat className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">{t.finances.recurring.empty}</p>
                </div>
            )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[24px] md:rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
          <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t.finances.cashflow.history}</h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[500px]">
            <thead className="bg-slate-50 dark:bg-slate-800 text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-4 md:px-8 py-3 md:py-4">{t.common.date} & {t.common.description}</th>
                <th className="px-4 md:px-8 py-3 md:py-4">{t.common.type} / Vendu par</th>
                <th className="px-4 md:px-8 py-3 md:py-4 text-right">{t.common.amount}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.transfers.sort((a,b) => b.date.localeCompare(a.date)).map(t => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-4 md:px-8 py-4 md:py-5">
                    <div className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-black mb-1">{t.date}</div>
                    <div className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">{t.description}</div>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-lg uppercase ${
                        t.type === 'DEPOSIT' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' :
                        t.type === 'WITHDRAWAL' ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400' :
                        'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400'
                      }`}>
                        {t.type}
                      </span>
                    </div>
                    <div className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                      {t.memberId ? state.members.find(m => m.id === t.memberId)?.name || 'Associé' : 'Caisse Commune'}
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-5 text-right">
                    <div className="flex items-center justify-end gap-2 md:gap-4">
                      <span className={`text-base md:text-lg font-black ${t.type === 'WITHDRAWAL' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {t.type === 'WITHDRAWAL' ? '-' : '+'}{t.amount.toFixed(2)}€
                      </span>
                      <button onClick={() => setPendingDeleteTransfer(t.id)} className="p-1.5 md:p-2 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 transition-colors duration-500 p-2 md:p-4 -m-2 md:-m-4 rounded-[32px] md:rounded-[40px] ${isBelowThreshold && view === 'cashflow' ? 'bg-rose-50/70 dark:bg-rose-900/20 border-2 border-rose-100 dark:border-rose-900' : ''}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 md:mb-8">
          <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">{t.finances.title}</h2>
              <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-1 md:mt-2">{t.finances.subtitle}</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                onClick={handleExportCSV} 
                className="p-3 md:p-4 bg-slate-100 dark:bg-slate-800 rounded-[18px] md:rounded-[22px] text-slate-500 hover:bg-slate-200 transition-all"
                title="Exporter en CSV"
              >
                <Download className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full md:w-auto">
                  <button 
                    onClick={() => setView('cashflow')}
                    className={`flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'cashflow' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                      <Wallet className="w-4 h-4" /> {t.finances.tab_cashflow}
                  </button>
                  <button 
                    onClick={() => setView('analytics')}
                    className={`flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'analytics' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                      <BarChart3 className="w-4 h-4" /> {t.finances.tab_analytics}
                  </button>
              </div>
          </div>
      </div>

      {view === 'cashflow' ? renderCashflow() : renderAnalytics()}

      {/* MODALS (Forms) - Keeping all existing modals */}
      {showTransferForm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-[100dvh] sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-[32px] shadow-2xl border-0 sm:border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-white flex flex-col overflow-hidden">
            <div className="px-6 md:px-8 py-5 md:py-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">FLUX DE TRÉSORERIE</h2>
              <button onClick={() => setShowTransferForm(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-900 dark:text-white"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
            </div>
            <form onSubmit={handleTransferSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 md:p-8 space-y-4 md:space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                <div>
                  <label className="block text-[10px] md:text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5 md:mb-2 uppercase tracking-widest">{t.common.amount} (€)</label>
                  <input name="amount" type="number" step="0.01" required className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-black text-xl md:text-2xl outline-none focus:border-indigo-600 text-slate-900 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-[10px] md:text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5 md:mb-2 uppercase tracking-widest">{t.common.type}</label>
                    <select name="type" className="w-full px-3 md:px-4 py-3 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-bold outline-none text-slate-900 dark:text-white text-sm md:text-base">
                      <option value="WITHDRAWAL">RETRAIT</option>
                      <option value="DEPOSIT">DÉPÔT</option>
                      <option value="ADJUSTMENT">AJUSTEMENT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5 md:mb-2 uppercase tracking-widest">{t.common.date}</label>
                    <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full px-3 md:px-4 py-3 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-bold text-slate-900 dark:text-white text-sm md:text-base" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5 md:mb-2 uppercase tracking-widest">Vendu par</label>
                  <select name="memberId" className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-bold outline-none text-slate-900 dark:text-white text-sm md:text-base">
                    <option value="">Caisse Commune</option>
                    {activeMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5 md:mb-2 uppercase tracking-widest">{t.common.description}</label>
                  <input name="description" required className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-bold outline-none text-slate-900 dark:text-white text-sm md:text-base" placeholder="Libellé" />
                </div>
              </div>
              <div className="p-6 md:p-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3 md:gap-4 shrink-0">
                <button type="button" onClick={() => setShowTransferForm(false)} className="flex-1 px-4 md:px-6 py-3 md:py-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-[10px] md:text-xs hover:bg-slate-50 dark:hover:bg-slate-800">{t.common.cancel}</button>
                <button type="submit" className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black shadow-xl uppercase tracking-widest text-[10px] md:text-xs hover:bg-indigo-700">{t.common.validate}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRecurringForm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-[100dvh] sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-[32px] shadow-2xl border-0 sm:border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-white flex flex-col overflow-hidden">
            <div className="px-6 md:px-8 py-5 md:py-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">{t.finances.recurring.form_title}</h2>
              <button onClick={() => setShowRecurringForm(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-900 dark:text-white"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
            </div>
            <form onSubmit={handleRecurringSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 md:p-8 space-y-4 md:space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                <div>
                  <label className="block text-[10px] md:text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5 md:mb-2 uppercase tracking-widest">{t.finances.recurring.name_label}</label>
                  <input name="name" required placeholder="Ex: Netflix, Loyer, Logiciel..." className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-bold outline-none focus:border-indigo-600 text-slate-900 dark:text-white text-sm md:text-base" />
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-[10px] md:text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5 md:mb-2 uppercase tracking-widest">{t.finances.recurring.amount_label} (€)</label>
                      <input name="amount" type="number" step="0.01" required className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-black text-lg md:text-xl outline-none focus:border-indigo-600 text-slate-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5 md:mb-2 uppercase tracking-widest">{t.finances.recurring.freq_label}</label>
                      <select name="frequency" className="w-full px-3 md:px-4 py-3 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-bold outline-none text-slate-900 dark:text-white cursor-pointer text-sm md:text-base">
                          <option value="MONTHLY">{t.finances.recurring.monthly}</option>
                          <option value="YEARLY">{t.finances.recurring.yearly}</option>
                          <option value="WEEKLY">{t.finances.recurring.weekly}</option>
                      </select>
                    </div>
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5 md:mb-2 uppercase tracking-widest">{t.finances.recurring.due_date}</label>
                  <input name="nextDueDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full px-3 md:px-4 py-3 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-bold text-slate-900 dark:text-white text-sm md:text-base" />
                </div>
              </div>
              <div className="p-6 md:p-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3 md:gap-4 shrink-0">
                <button type="button" onClick={() => setShowRecurringForm(false)} className="flex-1 px-4 md:px-6 py-3 md:py-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-[10px] md:text-xs hover:bg-slate-50 dark:hover:bg-slate-800">{t.common.cancel}</button>
                <button type="submit" className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black shadow-xl uppercase tracking-widest text-[10px] md:text-xs hover:bg-indigo-700">{t.common.add}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberForm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm h-[100dvh] sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-[32px] shadow-2xl border-0 sm:border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-white flex flex-col overflow-hidden">
            <div className="px-6 md:px-8 py-5 md:py-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter">{editingMember ? t.common.edit : t.common.add} {t.finances.team.add_member}</h2>
              <button onClick={() => setShowMemberForm(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-900 dark:text-white"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
            </div>
            <form onSubmit={handleMemberSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 md:p-8 space-y-4 md:space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                <div>
                  <label className="block text-[10px] md:text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5 md:mb-2 uppercase tracking-widest">Nom de l'associé</label>
                  <input name="name" defaultValue={editingMember?.name} required className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-bold outline-none focus:border-indigo-600 text-slate-900 dark:text-white text-sm md:text-base" />
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5 md:mb-2 uppercase tracking-widest">Parts (%)</label>
                  <input name="sharePercentage" type="number" min="0" max="100" defaultValue={editingMember?.sharePercentage || 50} required className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-black text-lg md:text-xl outline-none focus:border-indigo-600 text-slate-900 dark:text-white" />
                </div>
              </div>
              <div className="p-6 md:p-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3 md:gap-4 shrink-0">
                <button type="button" onClick={() => setShowMemberForm(false)} className="flex-1 px-4 md:px-6 py-3 md:py-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-[10px] md:text-xs hover:bg-slate-50 dark:hover:bg-slate-800">{t.common.cancel}</button>
                <button type="submit" className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black shadow-xl uppercase tracking-widest text-[10px] md:text-xs hover:bg-indigo-700">{t.common.confirm}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInviteForm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm h-[100dvh] sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-[32px] shadow-2xl border-0 sm:border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-white flex flex-col overflow-hidden">
            <div className="px-6 md:px-8 py-5 md:py-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">{t.finances.team.invite}</h2>
              <button onClick={() => setShowInviteForm(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-900 dark:text-white"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
            </div>
            <form onSubmit={handleInviteSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 md:p-8 space-y-4 md:space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                <div>
                  <label className="block text-[10px] md:text-xs font-black mb-1.5 md:mb-2 uppercase tracking-widest text-slate-500 dark:text-slate-400">E-mail de l'associé</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="email" 
                      value={inviteEmail} 
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required 
                      placeholder="exemple@email.com"
                      className="w-full pl-12 pr-4 md:pr-5 py-3 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-bold outline-none focus:border-emerald-500 text-slate-900 dark:text-white text-sm md:text-base" 
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 md:p-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3 md:gap-4 shrink-0">
                <button type="button" onClick={() => setShowInviteForm(false)} className="flex-1 px-4 md:px-6 py-3 md:py-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-[10px] md:text-xs hover:bg-slate-50 dark:hover:bg-slate-800">{t.common.cancel}</button>
                <button type="submit" className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-emerald-600 text-white rounded-xl md:rounded-2xl font-black shadow-xl uppercase tracking-widest text-[10px] md:text-xs hover:bg-emerald-700">{t.finances.team.invite}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showThresholdForm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm h-[100dvh] sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-[32px] shadow-2xl border-0 sm:border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-white flex flex-col overflow-hidden">
            <div className="px-6 md:px-8 py-5 md:py-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">SEUIL DE SÉCURITÉ</h2>
              <button onClick={() => setShowThresholdForm(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-900 dark:text-white"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
            </div>
            <form onSubmit={handleThresholdSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 md:p-8 space-y-4 md:space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                <div>
                  <label className="block text-[10px] md:text-xs font-black mb-1.5 md:mb-2 uppercase tracking-widest text-slate-500 dark:text-slate-400">Montant d'alerte (€)</label>
                  <input name="threshold" type="number" step="0.01" defaultValue={state.cashThreshold} required className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-black text-xl md:text-2xl outline-none focus:border-indigo-600 text-slate-900 dark:text-white" />
                </div>
              </div>
              <div className="p-6 md:p-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3 md:gap-4 shrink-0">
                <button type="button" onClick={() => setShowThresholdForm(false)} className="flex-1 px-4 md:px-6 py-3 md:py-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-[10px] md:text-xs hover:bg-slate-50 dark:hover:bg-slate-800">{t.common.cancel}</button>
                <button type="submit" className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black shadow-xl uppercase tracking-widest text-[10px] md:text-xs hover:bg-indigo-700">{t.common.validate}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={pendingDeleteTransfer !== null}
        onClose={() => setPendingDeleteTransfer(null)}
        onConfirm={() => pendingDeleteTransfer && onDeleteTransfer(pendingDeleteTransfer)}
        title="Supprimer ?"
        message="Cette action modifiera la trésorerie."
      />

      <ConfirmModal 
        isOpen={pendingDeleteMember !== null}
        onClose={() => setPendingDeleteMember(null)}
        onConfirm={() => pendingDeleteMember && onDeleteMember(pendingDeleteMember)}
        title="Retirer ?"
        message="L'associé ne recevra plus de profits."
      />

      <ConfirmModal 
        isOpen={pendingDeleteRecurring !== null}
        onClose={() => setPendingDeleteRecurring(null)}
        onConfirm={() => pendingDeleteRecurring && onDeleteRecurringExpense && onDeleteRecurringExpense(pendingDeleteRecurring)}
        title="Arrêter l'abonnement ?"
        message="Cette dépense ne sera plus débitée automatiquement."
      />

      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Finances;