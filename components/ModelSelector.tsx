import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Plus, Loader2, Sparkles, Package, CheckCircle2, Save, Trash2, History } from 'lucide-react';
import { CATEGORIES, BRANDS } from '../constants';
import { parseItemDescription } from '../services/geminiService';
import { InventoryItem, ItemStatus, ItemCondition, CatalogItem } from '../types';


interface ModelSelectorProps {
  onSelect: (id: string | null, name: string | null, brand: string, category: string) => void;
  onAutoFill?: (data: { size?: string, condition?: ItemCondition, color?: string }) => void;
  initialName?: string;
  currentBrand?: string;
  currentCategory?: string;
  inventory: InventoryItem[];
  catalog: CatalogItem[];
  onAddCatalogItem: (item: CatalogItem) => void;
  onDeleteCatalogItem: (id: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  onSelect, 
  onAutoFill, 
  initialName, 
  currentBrand, 
  currentCategory, 
  inventory, 
  catalog, 
  onAddCatalogItem, 
  onDeleteCatalogItem 
}) => {
  const [query, setQuery] = useState(initialName || '');
  const [isCreating, setIsCreating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(initialName || ''); }, [initialName]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Suggestions intelligentes : Catalogue + Historique d'Inventaire
  const suggestions = useMemo(() => {
    if (query.length < 1) return [];

    const lowerQuery = query.toLowerCase();
    
    // 1. Chercher dans le catalogue officiel (Local)
    const catalogMatches = catalog
      .filter(item => item.name.toLowerCase().includes(lowerQuery))
      .map(item => ({ ...item, source: 'catalog' as const }));

    // 2. Chercher dans l'historique de l'inventaire (doublons filtrés)
    const historyMatches: any[] = [];
    const seenNames = new Set(catalogMatches.map(m => m.name.toLowerCase()));
    
    inventory.forEach(item => {
      const nameLower = item.name.toLowerCase();
      if (nameLower.includes(lowerQuery) && !seenNames.has(nameLower)) {
        historyMatches.push({
          id: item.id,
          name: item.name,
          brand: item.brand,
          category: item.category,
          source: 'history' as const
        });
        seenNames.add(nameLower);
      }
    });

    return [...catalogMatches, ...historyMatches].slice(0, 8);
  }, [query, catalog, inventory]);

  const selectModel = (model: any) => {
    setQuery(model.name); 
    setShowDropdown(false);
    onSelect(model.source === 'catalog' ? model.id : null, model.name, model.brand, model.category);
  };

  const handleSmartAnalysis = async () => {
    if (!query || query.length < 3) return;
    setIsAnalyzing(true);
    try {
      const result = await parseItemDescription(query);
      if (result) {
        if (result.modelName) { 
          setQuery(result.modelName); 
          onSelect(null, result.modelName, result.brand || currentBrand || '', result.category || currentCategory || ''); 
        }
      }
    } finally { setIsAnalyzing(false); }
  };

  const handleCreate = async () => {
    if (!query || !currentBrand || !currentCategory) {
        alert("Veuillez renseigner la marque et la catégorie pour sauvegarder ce modèle.");
        return;
    }
    setIsCreating(true);
    try {
        const newItem: CatalogItem = {
            id: crypto.randomUUID(),
            name: query,
            brand: currentBrand,
            category: currentCategory
        };
        onAddCatalogItem(newItem);
        alert("Modèle ajouté à votre catalogue !");
        setShowDropdown(false);
    } catch (e: any) {
        console.error(e);
        alert("Erreur lors de la sauvegarde.");
    } finally {
        setIsCreating(false);
    }
  };

  const handleDeleteFromCatalog = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Supprimer ce modèle de votre catalogue ?")) {
      onDeleteCatalogItem(id);
    }
  };

  return (
    <div className="relative z-[400]" ref={wrapperRef}>
      <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-[0.2em] px-2 flex justify-between items-center">
        <span>Produit / Modèle</span>
        <span className="text-[9px] text-indigo-500 font-black flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Analyse IA</span>
      </label>
      
      <div className="relative group flex gap-2">
        <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              value={query}
              onChange={e => { 
                setQuery(e.target.value); 
                onSelect(null, e.target.value, currentBrand || '', currentCategory || ''); 
                setShowDropdown(true); 
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Ex: Nike Jordan 4 Military Black..."
              className="w-full pl-16 pr-16 py-5 bg-slate-900/50 border-2 border-slate-800 rounded-[24px] focus:border-indigo-500 focus:bg-slate-900 outline-none text-white font-black text-xl placeholder:text-slate-700 transition-all shadow-inner"
            />
            <button 
              type="button"
              onClick={handleSmartAnalysis}
              disabled={isAnalyzing || !query}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all shadow-md disabled:opacity-50"
              title="Analyse automatique du titre"
            >
               {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            </button>
        </div>
      </div>

      {showDropdown && query.length > 0 && (
        <div className="absolute z-[410] w-full bg-slate-900 border-2 border-slate-800 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] mt-3 overflow-hidden animate-in fade-in slide-in-from-top-4">
          <ul className="max-h-[350px] overflow-y-auto custom-scrollbar">
            {suggestions.map((item) => (
              <li 
                key={`${item.source}-${item.id}`}
                onClick={() => selectModel(item)}
                className="p-5 hover:bg-slate-800 cursor-pointer flex justify-between items-center group border-b border-slate-800/50 last:border-none"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${item.source === 'catalog' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-700/50 text-slate-500'}`}>
                    {item.source === 'catalog' ? <Package className="w-5 h-5" /> : <History className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-black text-white text-base group-hover:text-indigo-400 transition-colors">{item.name}</div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{item.brand} • {item.category}</div>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.source === 'catalog' && (
                      <button 
                        onClick={(e) => handleDeleteFromCatalog(e, item.id)}
                        className="p-2.5 bg-slate-700 hover:bg-rose-900/40 text-slate-400 hover:text-rose-500 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                      <Plus className="w-4 h-4" />
                    </div>
                </div>
              </li>
            ))}
            
            {/* Pied du dropdown : Création rapide */}
            <li className="p-4 bg-slate-800/30 flex items-center justify-between border-t border-slate-800">
                <span className="text-[9px] font-bold text-slate-500 uppercase px-2">Modèle non listé ?</span>
                <button 
                  type="button" 
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Sauvegarder au catalogue
                </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;