import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem, ItemStatus } from '../types';
import { CATEGORIES, BRANDS } from '../constants';
import { 
  Search, ChevronDown, BrainCircuit, X, Loader2, 
  Filter, Package, Sparkles, Scale, Clock,
  CheckCircle2, TrendingUp, Info, Hash
} from 'lucide-react';
import { analyzeModelPerformance } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  inventory: InventoryItem[];
}


interface GroupedModel {
  model_name: string;
  brand: string;
  category: string;
  totalVolume: number;
  totalStock: number;
  totalProfit: number;
  minPrice: number;
  avgPrice: number;
  avgDisplayPrice: number;
  maxPrice: number;
  avgDays: number;
  variants: InventoryItem[];
}

const FormatText = ({ text }: { text: string }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <>{parts.map((part, i) => (part.startsWith('**') && part.endsWith('**')) ? <strong key={i} className="font-black text-slate-900 dark:text-white">{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>)}</>
    );
};

export default function PricingGuide({ inventory }: Props) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('vpro_pricing_search') || '');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'volume' | 'profit' | 'rotation'>('volume');
  
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  const groupedData = useMemo(() => {
    const groups: Record<string, GroupedModel> = {};
    inventory.forEach(item => {
      const groupKey = `${item.name.toLowerCase()}|${item.brand.toLowerCase()}`;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          model_name: item.name, brand: item.brand, category: item.category,
          totalVolume: 0, totalStock: 0, totalProfit: 0, minPrice: Infinity, avgPrice: 0, avgDisplayPrice: 0, maxPrice: -Infinity, avgDays: 0, variants: []
        };
      }
      const g = groups[groupKey];
      g.variants.push(item);
      
      if (item.status === ItemStatus.SOLD || item.status === ItemStatus.PAYMENT_PENDING) {
        g.totalVolume++;
        g.totalProfit += (item.salePrice - item.purchasePrice - (item.boostCost || 0));
        g.minPrice = Math.min(g.minPrice, item.salePrice);
        g.maxPrice = Math.max(g.maxPrice, item.salePrice);
        g.avgPrice += item.salePrice;
        g.avgDisplayPrice += item.displaySalePrice || item.salePrice * 1.1;
        
        const start = new Date(item.receptionDate || item.purchaseDate);
        const end = (item.saleDate) ? new Date(item.saleDate) : new Date();
        g.avgDays += Math.ceil(Math.abs(end.getTime() - start.getTime()) / 86400000);
      } else if (item.status === ItemStatus.IN_STOCK || item.status === ItemStatus.TRANSIT) {
        g.totalStock++;
      }
    });

    return Object.values(groups).map(g => {
      if (g.totalVolume > 0) { 
        g.avgPrice /= g.totalVolume; 
        g.avgDisplayPrice /= g.totalVolume;
        g.avgDays /= g.totalVolume; 
      }
      return g;
    })
    .filter(g => {
      const matchesSearch = g.model_name.toLowerCase().includes(searchTerm.toLowerCase()) || g.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBrand = selectedBrand === 'all' || g.brand === selectedBrand;
      return matchesSearch && matchesBrand;
    })
    .sort((a, b) => {
        if (sortBy === 'volume') return b.totalVolume - a.totalVolume;
        if (sortBy === 'profit') return b.totalProfit - a.totalProfit;
        if (sortBy === 'rotation') return a.avgDays - b.avgDays;
        return 0;
    });
  }, [inventory, searchTerm, selectedBrand, sortBy]);

  const handleAiAnalyze = async () => {
      if (selectedModels.size === 0) return;
      setIsAiAnalyzing(true);
      try {
          const dataToAnalyze = groupedData.filter(g => selectedModels.has(`${g.model_name}|${g.brand}`));
          const report = await analyzeModelPerformance(dataToAnalyze);
          setAiReport(report);
      } catch (err) { console.error(err); } finally { setIsAiAnalyzing(false); }
  };

  const getStatusLabel = (status: ItemStatus) => {
    const label = t.status[status] || status;
    switch (status) {
      case ItemStatus.IN_STOCK: return { label, class: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' };
      case ItemStatus.TRANSIT: return { label, class: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' };
      case ItemStatus.PAYMENT_PENDING: return { label, class: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' };
      case ItemStatus.SOLD: return { label, class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' };
      case ItemStatus.PENDING: return { label, class: 'bg-gray-50 text-gray-500' };
      case ItemStatus.RETURNED: return { label, class: 'bg-rose-50 text-rose-500' };
      default: return { label, class: 'bg-slate-50 text-slate-500' };
    }
  };

  // Typage strict pour l'objet de poids des statuts
  const statusWeight: Record<ItemStatus, number> = { 
    [ItemStatus.IN_STOCK]: 0, 
    [ItemStatus.TRANSIT]: 1, 
    [ItemStatus.PAYMENT_PENDING]: 2, 
    [ItemStatus.SOLD]: 3,
    [ItemStatus.PENDING]: 4,
    [ItemStatus.RETURNED]: 5 
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">{t.pricing.title}</h2>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-2">{t.pricing.subtitle}</p>
          </div>
          <div className="flex gap-4">
              <button 
                onClick={handleAiAnalyze}
                disabled={selectedModels.size === 0 || isAiAnalyzing}
                className={`px-8 py-5 rounded-[24px] font-black uppercase text-xs flex items-center gap-3 transition-all ${selectedModels.size > 0 ? 'bg-indigo-600 text-white shadow-xl hover:bg-indigo-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed'}`}
              >
                  {isAiAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                  {t.pricing.compare} ({selectedModels.size})
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input type="text" placeholder={t.pricing.search_placeholder} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-6 py-5 bg-white dark:bg-[#0F172A] rounded-[24px] border-2 border-slate-100 dark:border-slate-800 shadow-sm outline-none font-bold text-sm focus:border-indigo-500" />
          </div>
          <div className="relative">
              <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-white dark:bg-[#0F172A] rounded-[24px] border-2 border-slate-100 dark:border-slate-800 font-black text-[10px] uppercase outline-none focus:border-indigo-500 appearance-none cursor-pointer">
                  <option value="all">{t.pricing.all_brands}</option>
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
          </div>
          <div className="relative">
              <TrendingUp className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="w-full pl-14 pr-6 py-5 bg-white dark:bg-[#0F172A] rounded-[24px] border-2 border-slate-100 dark:border-slate-800 font-black text-[10px] uppercase outline-none focus:border-indigo-500 appearance-none cursor-pointer">
                  <option value="volume">{t.pricing.sort_volume}</option>
                  <option value="profit">{t.pricing.sort_profit}</option>
                  <option value="rotation">{t.pricing.sort_rotation}</option>
              </select>
          </div>
      </div>

      {aiReport && (
          <div className="bg-white dark:bg-[#0F172A] border-2 border-indigo-200 p-8 rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Sparkles className="w-48 h-48" /></div>
              <div className="flex justify-between items-center mb-8 relative z-10">
                  <h4 className="text-sm font-black uppercase text-indigo-600 flex items-center gap-3"><Sparkles className="w-5 h-5" /> Gemini Insight Pro - Comparaison</h4>
                  <button onClick={() => setAiReport(null)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-6 text-slate-700 dark:text-slate-300 text-sm leading-relaxed relative z-10">
                  {aiReport.split('\n').map((line, i) => (
                      <p key={i} className={line.startsWith('Sur') ? 'font-black p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 text-indigo-900 dark:text-indigo-100' : ''}>
                          <FormatText text={line} />
                      </p>
                  ))}
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {groupedData.map((group) => {
          const key = `${group.model_name}|${group.brand}`;
          const isExpanded = expandedModels.has(key);
          const isSelected = selectedModels.has(key);

          return (
            <div key={key} className={`bg-white dark:bg-[#1E293B] border-2 transition-all rounded-[36px] overflow-hidden ${isExpanded ? 'border-indigo-500 shadow-2xl' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-100'}`}>
              <div onClick={() => { const s = new Set(expandedModels); if(s.has(key)) s.delete(key); else s.add(key); setExpandedModels(s); }} className="p-8 cursor-pointer relative">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={(e) => { e.stopPropagation(); const s = new Set(selectedModels); if(s.has(key)) s.delete(key); else s.add(key); setSelectedModels(s); }} className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'border-slate-100 bg-slate-50 text-transparent'}`}>
                            <CheckCircle2 className="w-6 h-6" />
                        </button>
                        <div>
                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{group.brand}</div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight whitespace-normal break-words">{group.model_name}</h3>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{t.pricing.avg_price}</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{group.avgPrice.toFixed(0)}€</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {t.pricing.rotation}</div>
                        <div className="text-lg font-black text-slate-700 dark:text-200">{group.avgDays.toFixed(0)} <span className="text-[10px] opacity-40">j.</span></div>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" /> {t.pricing.avg_margin}</div>
                        <div className="text-lg font-black text-emerald-500">+{(group.totalProfit / Math.max(1, group.totalVolume)).toFixed(0)}€</div>
                    </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> {group.variants.length} {t.pricing.copies}</span>
                        <span className="flex items-center gap-1.5 text-slate-300">•</span>
                        <span className="flex items-center gap-1.5">{group.totalVolume} {t.pricing.sold}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180 text-indigo-500' : ''}`} />
                </div>
              </div>

              {isExpanded && (
                <div className="p-8 pt-0 border-t border-slate-50 dark:border-slate-800 bg-slate-50/20 dark:bg-black/10 animate-in slide-in-from-top-2">
                   <div className="space-y-4 mt-6">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Info className="w-3 h-3" /> {t.pricing.all_items}
                      </div>
                      <div className="space-y-2">
                        {group.variants.sort((a, b) => {
                          const wA = statusWeight[a.status];
                          const wB = statusWeight[b.status];
                          return (wA ?? 9) - (wB ?? 9);
                        }).map((v, i) => {
                          const statusInfo = getStatusLabel(v.status);
                          const itemId = v.displayId || `#${v.id.substring(0,3)}`;
                          return (
                            <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-100 dark:border-slate-800 group/item hover:border-indigo-200 transition-colors">
                               <div className="flex items-center gap-4">
                                  <span className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl font-black text-[10px] border border-slate-100 shadow-sm">{v.size || 'TU'}</span>
                                  <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded-md uppercase flex items-center gap-1">
                                        <Hash className="w-2 h-2" /> {itemId}
                                      </span>
                                      <span className="text-[9px] font-black text-slate-400 uppercase">• {v.condition?.replace('_', ' ')}</span>
                                    </div>
                                    <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                      {v.salePrice}€
                                      {v.status === ItemStatus.IN_STOCK && v.displaySalePrice > v.salePrice && <span className="ml-2 text-[10px] text-slate-300 line-through font-bold">{v.displaySalePrice}€</span>}
                                    </div>
                                  </div>
                               </div>
                               <div className={`px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider border border-transparent shadow-sm ${statusInfo.class}`}>
                                  {statusInfo.label}
                                </div>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}