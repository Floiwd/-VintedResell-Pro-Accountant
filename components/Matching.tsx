import React, { useState, useMemo, useEffect } from 'react';
import { AppState, InventoryItem, FinancialTransfer, ItemStatus } from '../types';
import { 
  Link, Link2, ArrowRight, Package, DollarSign, Check, X,
  AlertCircle, Search, Filter, Layers, Calculator, Sparkles, Eye, EyeOff
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  state: AppState;
  onUpdateInventory: (items: InventoryItem[]) => void;
}

const Matching: React.FC<Props> = ({ state, onUpdateInventory }) => {
  const { t } = useLanguage();
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
  const [selectedPurchaseItemId, setSelectedPurchaseItemId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllItems, setShowAllItems] = useState(false);
  const [matchingMode, setMatchingMode] = useState<'TRANSFERS' | 'PURCHASES'>('TRANSFERS');
  
  // Transfers available for matching (Withdrawals that might represent purchases)
  const purchases = useMemo(() => {
    return state.transfers.filter(t => t.type === 'WITHDRAWAL').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transfers]);

  // Items that are purchases (have price, imported for example)
  const purchaseItems = useMemo(() => {
    return state.inventory.filter(item => item.purchasePrice > 0).sort((a, b) => (b.displayId || '').localeCompare(a.displayId || ''));
  }, [state.inventory]);

  const selectedTransfer = useMemo(() => 
    purchases.find(p => p.id === selectedTransferId), 
    [purchases, selectedTransferId]
  );

  const selectedPurchaseItem = useMemo(() =>
    purchaseItems.find(p => p.id === selectedPurchaseItemId),
    [purchaseItems, selectedPurchaseItemId]
  );

  // Items for matching (Target items: normally those with 0 cost)
  const displayItems = useMemo(() => {
    return state.inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.displayId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.brand.toLowerCase().includes(searchTerm.toLowerCase());
      
      const categoryMatch = showAllItems ? true : item.purchasePrice === 0;
      
      // Don't show the selected purchase item as a target!
      const notSelf = matchingMode === 'PURCHASES' ? item.id !== selectedPurchaseItemId : true;

      return categoryMatch && matchesSearch && notSelf;
    }).sort((a, b) => (b.displayId || '').localeCompare(a.displayId || ''));
  }, [state.inventory, searchTerm, showAllItems, matchingMode, selectedPurchaseItemId]);

  // Smart Matching Logic
  const handleAutoMatch = () => {
    const searchString = matchingMode === 'TRANSFERS' 
      ? selectedTransfer?.description.toUpperCase() || ''
      : `${selectedPurchaseItem?.name} ${selectedPurchaseItem?.displayId}`.toUpperCase();

    const suggestedIds: string[] = [];

    // 1. Look for #ID (e.g. #046)
    const idMatch = searchString.match(/#(\d+)/);
    const idToSearch = idMatch ? idMatch[0] : null;

    // 2. Look for Size patterns
    const sizeMatch = searchString.match(/\b([W|L]\d{2}|XXS|XS|S|M|L|XL|XXL|XXXL|[0-9]{2,3})\b/i);
    const sizeToSearch = sizeMatch ? sizeMatch[0].toUpperCase() : null;

    state.inventory.forEach(item => {
      let isMatch = false;
      
      // Match by ID
      if (idToSearch && item.displayId === idToSearch) isMatch = true;
      
      // Match by ID contained in desc
      if (item.displayId && searchString.includes(item.displayId.toUpperCase())) isMatch = true;

      // Match by Name keywords + Size (if in Purchase Item mode, use brand)
      if (sizeToSearch && item.size === sizeToSearch) {
        if (matchingMode === 'PURCHASES' && selectedPurchaseItem) {
           if (item.brand.toUpperCase() === selectedPurchaseItem.brand.toUpperCase()) isMatch = true;
        } else if (matchingMode === 'TRANSFERS' && selectedTransfer) {
           if (searchString.includes(item.brand.toUpperCase())) isMatch = true;
        }
      }

      if (isMatch && !selectedItemIds.includes(item.id)) {
        suggestedIds.push(item.id);
      }
    });

    if (suggestedIds.length > 0) {
      setSelectedItemIds(prev => [...new Set([...prev, ...suggestedIds])]);
    }
  };

  // Reset suggestions when changing source
  useEffect(() => {
    setSelectedItemIds([]);
  }, [selectedTransferId, selectedPurchaseItemId, matchingMode]);

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleApplyMatching = () => {
    const cost = matchingMode === 'TRANSFERS' 
      ? (selectedTransfer?.amount || 0)
      : (selectedPurchaseItem?.purchasePrice || 0);

    if (cost <= 0 || selectedItemIds.length === 0) return;

    const pricePerItem = cost / selectedItemIds.length;
    const updatedInventory = state.inventory.map(item => {
      if (selectedItemIds.includes(item.id)) {
        return {
          ...item,
          purchasePrice: Number(pricePerItem.toFixed(2))
        };
      }
      return item;
    });

    onUpdateInventory(updatedInventory);
    
    // Reset selection
    setSelectedItemIds([]);
    setSelectedTransferId(null);
    setSelectedPurchaseItemId(null);
    alert(`${selectedItemIds.length} articles mis à jour avec un prix d'achat de ${pricePerItem.toFixed(2)}€`);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
            Réconciliation <span className="text-indigo-600 italic">Achats</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-500" /> Reliez vos flux ou vos achats importés à vos articles vendus
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Step 1: Select Source of Cost */}
        <div className="bg-white dark:bg-[#0F172A] p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white">1</div>
              Source du coût
            </h3>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button 
                onClick={() => setMatchingMode('TRANSFERS')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${matchingMode === 'TRANSFERS' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                Flux Bancaires
              </button>
              <button 
                onClick={() => setMatchingMode('PURCHASES')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${matchingMode === 'PURCHASES' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                Achats Importés
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {matchingMode === 'TRANSFERS' ? (
              purchases.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-400 font-black text-xs uppercase">Aucun flux de type "Achat" trouvé</p>
                </div>
              ) : (
                purchases.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setSelectedTransferId(p.id)}
                    className={`w-full text-left p-5 rounded-3xl border-2 transition-all ${
                      selectedTransferId === p.id 
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' 
                      : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-black text-slate-900 dark:text-white text-sm">{p.description}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{p.date}</div>
                      </div>
                      <div className="text-lg font-black text-rose-500">-{p.amount.toFixed(2)}€</div>
                    </div>
                  </button>
                ))
              )
            ) : (
              purchaseItems.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-400 font-black text-xs uppercase">Aucun achat importé trouvé</p>
                </div>
              ) : (
                purchaseItems.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => setSelectedPurchaseItemId(item.id)}
                    className={`w-full text-left p-4 rounded-3xl border-2 transition-all flex items-center gap-4 ${
                      selectedPurchaseItemId === item.id 
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' 
                      : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                      {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package className="w-full h-full p-3 text-slate-400" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-black text-slate-900 dark:text-white text-xs truncate uppercase italic">{item.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.displayId || 'ID INCONNU'} • {item.brand}</div>
                    </div>
                    <div className="text-lg font-black text-indigo-600 italic">
                      {item.purchasePrice.toFixed(2)}€
                    </div>
                  </button>
                ))
              )
            )}
          </div>
        </div>

        {/* Step 2: Select Items to Link */}
        <div className="bg-white dark:bg-[#0F172A] p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex justify-between items-center w-full">
              <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white">2</div>
                Articles à relier ({selectedItemIds.length})
              </h3>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowAllItems(!showAllItems)}
                  className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-[10px] font-black uppercase ${
                    showAllItems ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                  }`}
                  title={showAllItems ? "Masquer les articles déjà chiffrés" : "Afficher tout l'inventaire"}
                >
                  {showAllItems ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span className="hidden sm:inline">{showAllItems ? "Inventaire Complet" : "À chiffrer"}</span>
                </button>

                {(selectedTransfer || selectedPurchaseItem) && (
                  <button 
                    onClick={handleAutoMatch}
                    className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 text-amber-600 rounded-xl hover:bg-amber-100 transition-all flex items-center gap-2 text-[10px] font-black uppercase group"
                  >
                    <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Magic Match</span>
                  </button>
                )}
              </div>
            </div>

            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Chercher par nom, marque, ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500" 
              />
            </div>
          </div>

          <div className="flex-1 space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {displayItems.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <Check className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
                <p className="text-slate-400 font-black text-xs uppercase">Aucun article trouvé</p>
              </div>
            ) : (
              displayItems.map(item => (
                <button 
                  key={item.id}
                  onClick={() => toggleItemSelection(item.id)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                    selectedItemIds.includes(item.id) 
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10' 
                    : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                    selectedItemIds.includes(item.id) ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>
                    {selectedItemIds.includes(item.id) ? <Check className="w-5 h-5" /> : (item.displayId || '??')}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-black text-slate-900 dark:text-white text-xs truncate uppercase italic">{item.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                        {item.brand} • {item.size} • {item.status}
                      </span>
                      {item.purchasePrice > 0 && (
                        <span className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[8px] font-black text-slate-500">
                          {item.purchasePrice}€
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Coût unitaire calculé</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {((matchingMode === 'TRANSFERS' ? selectedTransfer?.amount : selectedPurchaseItem?.purchasePrice) || 0) / (selectedItemIds.length || 1)}€
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total de la source</div>
                <div className="text-xl font-black text-indigo-600 italic">
                  {((matchingMode === 'TRANSFERS' ? selectedTransfer?.amount : selectedPurchaseItem?.purchasePrice) || 0).toFixed(2)}€
                </div>
              </div>
            </div>

            <button 
              onClick={handleApplyMatching}
              disabled={(!selectedTransfer && !selectedPurchaseItem) || selectedItemIds.length === 0}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-3 italic"
            >
              <Link2 className="w-5 h-5" /> Relier et appliquer les coûts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Matching;
