import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie, Legend
} from 'recharts';
import { AppState, ItemStatus } from '../types';
import { 
  Package, DollarSign, Wallet, Target, Award, Activity, TrendingUp, AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  state: AppState;
  onBrandClick?: (brand: string) => void;
}

const Dashboard: React.FC<Props> = ({ state, onBrandClick }) => {
  const { t } = useLanguage();
  const { inventory, monthlyGoal = 1000 } = state;

  const stats = useMemo(() => {
    const soldItems = inventory.filter(i => i.status === ItemStatus.SOLD || i.status === ItemStatus.PAYMENT_PENDING);
    const inStockItems = inventory.filter(i => i.status === ItemStatus.IN_STOCK || i.status === ItemStatus.TRANSIT);
    const totalProfit = soldItems.reduce((acc, i) => acc + (i.salePrice - i.purchasePrice - (i.boostCost || 0)), 0);
    const avgMargin = soldItems.length > 0 ? (totalProfit / soldItems.length) : 0;
    
    const profitabilityByItem = soldItems
      .map(i => ({
        name: i.displayId || i.name.substring(0, 12),
        purchase: i.purchasePrice,
        sale: i.salePrice,
        profit: i.salePrice - i.purchasePrice - (i.boostCost || 0)
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 15);

    // Monthly Stats (Revenue & Profit)
    const monthlyData: Record<string, { month: string, revenue: number, profit: number }> = {};
    soldItems.forEach(item => {
      if (!item.saleDate) return;
      const date = new Date(item.saleDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, revenue: 0, profit: 0 };
      }
      monthlyData[monthKey].revenue += item.salePrice;
      monthlyData[monthKey].profit += (item.salePrice - item.purchasePrice - (item.boostCost || 0));
    });
    const monthlyStats = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    // Brand Stats
    const brandData: Record<string, { name: string, value: number }> = {};
    soldItems.forEach(item => {
      const brand = item.brand || 'Inconnu';
      if (!brandData[brand]) brandData[brand] = { name: brand, value: 0 };
      brandData[brand].value += 1;
    });
    const brandStats = Object.values(brandData).sort((a, b) => b.value - a.value).slice(0, 5);

    // Category Stats
    const categoryData: Record<string, { name: string, value: number }> = {};
    soldItems.forEach(item => {
      const cat = item.category || 'Inconnu';
      if (!categoryData[cat]) categoryData[cat] = { name: cat, value: 0 };
      categoryData[cat].value += 1;
    });
    const categoryStats = Object.values(categoryData).sort((a, b) => b.value - a.value).slice(0, 5);

    // Sales by Day of Week
    const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const orderedDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
    const dayData: Record<string, { day: string, revenue: number, profit: number }> = {};
    orderedDays.forEach(day => {
      dayData[day] = { day, revenue: 0, profit: 0 };
    });

    soldItems.forEach(item => {
      if (!item.saleDate) return;
      const date = new Date(item.saleDate);
      const dayName = daysOfWeek[date.getDay()];
      if (dayData[dayName]) {
        dayData[dayName].revenue += item.salePrice;
        dayData[dayName].profit += (item.salePrice - item.purchasePrice - (item.boostCost || 0));
      }
    });
    const dayStats = orderedDays.map(day => dayData[day]);

    const lowStockItems = inStockItems.filter(i => (i.quantity || 1) <= (i.minStockThreshold || 0));

    return {
      totalProfit,
      inStockCount: inStockItems.length,
      avgMargin,
      goalProgress: Math.min((totalProfit / monthlyGoal) * 100, 100),
      profitabilityByItem,
      monthlyStats,
      brandStats,
      categoryStats,
      dayStats,
      lowStockItems
    };
  }, [inventory, monthlyGoal]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500">{t.inventory.item_card.purchase}: {payload[0].payload.purchase}€</p>
            <p className="text-xs font-bold text-slate-500">{t.inventory.item_card.sold}: {payload[0].payload.sale}€</p>
            <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{t.inventory.item_card.profit}: {payload[0].value.toFixed(2)}€</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">{t.dashboard.title}</h2>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-2">{t.dashboard.subtitle}</p>
          </div>
          <div className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-3">
              <Activity className="w-4 h-4 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">{t.dashboard.realtime}</span>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0F172A] p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500"><Wallet className="w-32 h-32" /></div>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-4">{t.dashboard.total_profit}</p>
              <h3 className="text-3xl font-black tracking-tighter">{stats.totalProfit.toFixed(2)}€</h3>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute right-8 top-8 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl text-emerald-500"><Target className="w-6 h-6" /></div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">{t.dashboard.goal}</p>
              <h3 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white mb-4">{stats.totalProfit.toFixed(0)}€ <span className="text-sm font-bold opacity-30">/ {monthlyGoal}€</span></h3>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${stats.goalProgress}%` }} />
              </div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t.dashboard.avg_margin}</p>
                  <Award className="w-5 h-5 text-indigo-500" />
              </div>
              <h3 className="text-3xl font-black tracking-tighter text-emerald-500">+{stats.avgMargin.toFixed(0)}€</h3>
              <p className="text-[10px] font-bold text-slate-300 uppercase mt-2">{t.dashboard.per_sale}</p>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t.dashboard.stock_count}</p>
                  <Package className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{stats.inStockCount}</h3>
              <p className="text-[10px] font-bold text-slate-300 uppercase mt-2">{t.dashboard.active_items}</p>
          </div>
      </div>

      {stats.lowStockItems.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-[32px] border border-red-100 dark:border-red-800/50 shadow-sm">
            <h3 className="text-sm font-black uppercase text-red-600 dark:text-red-400 mb-6 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" /> Alertes Stock Bas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.lowStockItems.map(item => (
                    <div key={item.id} className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-red-100 dark:border-red-800/30 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white">{item.name}</p>
                            <p className="text-[10px] font-bold text-slate-400">{item.brand} • {item.size || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-black text-red-600 dark:text-red-400">{item.quantity || 1}</p>
                            <p className="text-[9px] font-black uppercase text-red-400/60">En stock</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#0F172A] p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white mb-10 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> {t.dashboard.profitability_chart}
          </h3>
          <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.profitabilityByItem} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}} interval={0} angle={-45} textAnchor="end" />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                      <Bar dataKey="profit" radius={[8, 8, 0, 0]} barSize={32}>
                        {stats.profitabilityByItem.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#4F46E5' : '#6366f1'} />
                        ))}
                      </Bar>
                  </BarChart>
              </ResponsiveContainer>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#0F172A] p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white mb-10 flex items-center gap-3">
                  <Activity className="w-5 h-5 text-emerald-500" /> Évolution du CA & Bénéfices
              </h3>
              <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.monthlyStats} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                            itemStyle={{ fontWeight: 'bold' }}
                          />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                          <Line type="monotone" dataKey="revenue" name="Chiffre d'Affaires" stroke="#10B981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="profit" name="Bénéfice" stroke="#4F46E5" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white mb-10 flex items-center gap-3">
                  <Award className="w-5 h-5 text-amber-500" /> Top Marques
              </h3>
              <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={stats.brandStats}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                          >
                              {stats.brandStats.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'][index % 5]} 
                                    onClick={() => onBrandClick && onBrandClick(entry.name)}
                                    className={onBrandClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
                                  />
                              ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                            itemStyle={{ fontWeight: 'bold' }}
                          />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      <div className="bg-white dark:bg-[#0F172A] p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white mb-10 flex items-center gap-3">
              <Activity className="w-5 h-5 text-indigo-500" /> Répartition des Ventes par Jour
          </h3>
          <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.dayStats} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                      <Line type="monotone" dataKey="revenue" name="Chiffre d'Affaires" stroke="#10B981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="profit" name="Bénéfice" stroke="#4F46E5" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
              </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;