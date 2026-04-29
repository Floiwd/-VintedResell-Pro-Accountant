import React, { useState, useMemo, useEffect, useRef } from 'react';
import { InventoryItem, ItemStatus, ItemSubStatus, ItemCondition, FilterState, CatalogItem } from '../types';
import { CATEGORIES, CONDITIONS, SIZES, BRANDS } from '../constants';
import { 
  Plus, Search, Edit2, Trash2, X, Rocket, Image as ImageIcon, 
  SlidersHorizontal, Scale, Tag, Hash, 
  DollarSign, Download, Copy, ImagePlus, Loader2,
  ArrowUpDown, Calendar, Clock, ChevronDown, RefreshCw, Clipboard, Sparkles, Package,
  FileText
} from 'lucide-react';
import { parse as parseCSV, ParseResult, ParseError } from 'papaparse';
import ModelSelector from './ModelSelector';
import { auth, db } from '../lib/firebase';
import { parseItemDescription } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';


interface Props {
  inventory: InventoryItem[];
  activeFilters?: FilterState;
  catalog: CatalogItem[];
  onAdd: (item: InventoryItem) => void;
  onUpdate: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onUpdateFilters: (filters: FilterState) => void;
  onAddCatalogItem: (item: CatalogItem) => void;
  onDeleteCatalogItem: (id: string) => void;
}

const Inventory: React.FC<Props> = ({ inventory, activeFilters, catalog, onAdd, onUpdate, onDelete, onUpdateFilters, onAddCatalogItem, onDeleteCatalogItem }) => {
  const { t } = useLanguage();
  const [subView, setSubView] = useState<'all' | 'sales'>(() => {
    return (localStorage.getItem('vpro_inv_subview') as any) || 'all';
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isParserOpen, setIsParserOpen] = useState(false); // Modal Parser
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [parserText, setParserText] = useState('');
  const [csvText, setCsvText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isCsvLoading, setIsCsvLoading] = useState(false);

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState(activeFilters?.searchTerm || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      updateGlobalFilters({ ...filters, searchTerm });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputCsvRef = useRef<HTMLInputElement>(null);
  
  const [filters, setFilters] = useState<FilterState>(activeFilters || { 
    brands: [], categories: [], sizes: [], status: [], dateRange: { start: '', end: '' }, sortBy: 'id_desc', searchTerm: '' 
  });

  useEffect(() => {
    if (activeFilters) setFilters(activeFilters);
  }, [activeFilters]);

  const updateGlobalFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    onUpdateFilters(newFilters);
  };

  // Form State
  const [isBoosted, setIsBoosted] = useState(false);
  const [itemStatusInForm, setItemStatusInForm] = useState<ItemStatus>(ItemStatus.IN_STOCK);
  const [subStatusInForm, setSubStatusInForm] = useState<ItemSubStatus>(ItemSubStatus.NONE);
  const [draftDisplayId, setDraftDisplayId] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftBrand, setDraftBrand] = useState('');
  const [draftCategory, setDraftCategory] = useState(CATEGORIES[0]);
  const [draftCondition, setDraftCondition] = useState<ItemCondition>(ItemCondition.VERY_GOOD);
  const [draftSize, setDraftSize] = useState('');
  const [draftQuantity, setDraftQuantity] = useState<string>('1');
  const [draftMinStockThreshold, setDraftMinStockThreshold] = useState<string>('0');
  const [salePriceValue, setSalePriceValue] = useState<string>('');
  const [purchasePriceValue, setPurchasePriceValue] = useState<string>('');
  const [displaySalePriceValue, setDisplaySalePriceValue] = useState<string>('');
  const [boostCostValue, setBoostCostValue] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  
  // New Date States
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [receptionDate, setReceptionDate] = useState('');
  const [saleDate, setSaleDate] = useState('');

  const [isLotModalOpen, setIsLotModalOpen] = useState(false);
  const [lotQuantity, setLotQuantity] = useState('1');
  const [lotTotalPrice, setLotTotalPrice] = useState('');
  const [lotName, setLotName] = useState('');
  const [lotBrand, setLotBrand] = useState('');
  const [lotCategory, setLotCategory] = useState(CATEGORIES[0]);
  const [lotSize, setLotSize] = useState('');
  const [lotCondition, setLotCondition] = useState<ItemCondition>(ItemCondition.VERY_GOOD);
  const [lotPurchaseDate, setLotPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [lotStatus, setLotStatus] = useState<ItemStatus>(ItemStatus.IN_STOCK);
  const [lotSubStatus, setLotSubStatus] = useState<ItemSubStatus>(ItemSubStatus.NONE);

  // Génération automatique intelligente de l'ID suivant
  const generateNextId = (offset = 0) => {
    if (inventory.length === 0 && offset === 0) return "#001";
    
    let maxNum = 0;
    let bestPrefix = "#";
    let bestPadding = 3;

    inventory.forEach(i => {
      if (!i.displayId) return;
      const match = i.displayId.match(/^([^0-9]*)([0-9]+)(.*)$/);
      if (match) {
        const prefix = match[1];
        const numStr = match[2];
        const num = parseInt(numStr, 10);
        if (num > maxNum) {
          maxNum = num;
          bestPrefix = prefix || "#";
          bestPadding = Math.max(numStr.length, 3);
        }
      }
    });

    const nextNum = maxNum + 1 + offset;
    return `${bestPrefix}${nextNum.toString().padStart(bestPadding, '0')}`;
  };

  const resetLotForm = () => {
      setLotQuantity('1');
      setLotTotalPrice('');
      setLotName('');
      setLotBrand('');
      setLotCategory(CATEGORIES[0]);
      setLotSize('');
      setLotCondition(ItemCondition.VERY_GOOD);
      setLotPurchaseDate(new Date().toISOString().split('T')[0]);
      setLotStatus(ItemStatus.IN_STOCK);
  };

  const handleLotSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const qty = Number(lotQuantity);
      const total = Number(lotTotalPrice);
      if (qty <= 0 || total < 0) return;
      
      const pricePerItem = total / qty;
      const finalName = lotName.trim() || 'Article du lot';
      
      for (let i = 0; i < qty; i++) {
          const item: InventoryItem = {
              id: crypto.randomUUID(),
              displayId: generateNextId(i), 
              name: finalName,
              brand: lotBrand,
              category: lotCategory,
              size: lotSize,
              condition: lotCondition,
              status: lotStatus,
              subStatus: lotSubStatus,
              purchasePrice: pricePerItem,
              displaySalePrice: 0,
              salePrice: 0,
              boostCost: 0,
              purchaseDate: lotPurchaseDate || new Date().toISOString().split('T')[0],
              receptionDate: lotStatus === ItemStatus.TRANSIT ? undefined : (lotPurchaseDate || new Date().toISOString().split('T')[0]),
              fees: 0, shippingCost: 0,
              imageUrl: ''
          };
          onAdd(item);
      }
      setIsLotModalOpen(false);
      resetLotForm();
  };

  const resetForm = () => {
      setEditingItem(null); 
      setDraftDisplayId(generateNextId()); 
      setDraftName(''); setDraftBrand(''); 
      setDraftSize(''); setDraftQuantity('1'); setDraftMinStockThreshold('0'); setSalePriceValue(''); setPurchasePriceValue(''); setDisplaySalePriceValue('');
      setBoostCostValue(''); setIsBoosted(false);
      setItemStatusInForm(ItemStatus.IN_STOCK); setSubStatusInForm(ItemSubStatus.NONE); setImageUrl('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setReceptionDate(''); setSaleDate('');
  };
  
  const handleEdit = (item: InventoryItem) => {
      setEditingItem(item);
      setDraftDisplayId(item.displayId || '');
      setDraftName(item.name); setDraftBrand(item.brand); setDraftCategory(item.category);
      setDraftSize(item.size || ''); setDraftCondition(item.condition || ItemCondition.VERY_GOOD);
      setDraftQuantity(item.quantity?.toString() || '1');
      setDraftMinStockThreshold(item.minStockThreshold?.toString() || '0');
      setPurchasePriceValue(item.purchasePrice.toString());
      setDisplaySalePriceValue(item.displaySalePrice?.toString() || item.salePrice.toString());
      setSalePriceValue(item.salePrice.toString());
      setIsBoosted(item.boostCost > 0);
      setBoostCostValue(item.boostCost > 0 ? item.boostCost.toString() : '');
      setItemStatusInForm(item.status);
      setSubStatusInForm(item.subStatus || ItemSubStatus.NONE);
      setImageUrl(item.imageUrl || '');
      setPurchaseDate(item.purchaseDate);
      setReceptionDate(item.receptionDate || '');
      setSaleDate(item.saleDate || '');
      setIsModalOpen(true);
  };

  const handleDuplicate = (item: InventoryItem) => {
    const newItem = {
      ...item,
      id: crypto.randomUUID(),
      displayId: generateNextId(), 
      purchaseDate: new Date().toISOString().split('T')[0],
      receptionDate: undefined,
      saleDate: undefined,
      status: ItemStatus.IN_STOCK,
      subStatus: ItemSubStatus.NONE,
    };
    onAdd(newItem);
  };

  const handleStatusChange = (newStatus: ItemStatus) => {
    setItemStatusInForm(newStatus);
    const today = new Date().toISOString().split('T')[0];
    
    if (newStatus === ItemStatus.IN_STOCK && subStatusInForm === ItemSubStatus.ONLINE && !receptionDate) {
      setReceptionDate(today);
    }
    if (newStatus === ItemStatus.TRANSIT) {
      setReceptionDate('');
    }
    if ((newStatus === ItemStatus.SOLD || newStatus === ItemStatus.PAYMENT_PENDING) && !saleDate) {
      setSaleDate(today);
    }
  };

  const handleSubStatusChange = (newSubStatus: ItemSubStatus) => {
    setSubStatusInForm(newSubStatus);
    const today = new Date().toISOString().split('T')[0];
    
    if (itemStatusInForm === ItemStatus.IN_STOCK && newSubStatus === ItemSubStatus.ONLINE && !receptionDate) {
      setReceptionDate(today);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert("L'image est trop volumineuse (max 5MB)");
        return;
    }

    setIsUploading(true);
    try {
      // Direct Base64 fallback instead of trying Supabase Storage
      const reader = new FileReader();
      reader.onload = (event) => {
          if (event.target?.result && typeof event.target.result === 'string') {
              setImageUrl(event.target.result);
              setIsUploading(false);
          }
      };
      reader.onerror = () => {
          setIsUploading(false);
          alert("Erreur lors de la lecture du fichier");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload failed:", err);
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const item: InventoryItem = {
          id: editingItem?.id || crypto.randomUUID(),
          displayId: draftDisplayId || generateNextId(), 
          name: draftName,
          brand: draftBrand,
          category: draftCategory,
          size: draftSize,
          condition: draftCondition,
          quantity: parseInt(draftQuantity) || 1,
          minStockThreshold: parseInt(draftMinStockThreshold) || 0,
          status: itemStatusInForm,
          subStatus: subStatusInForm,
          purchasePrice: Number(purchasePriceValue),
          displaySalePrice: Number(displaySalePriceValue),
          salePrice: Number(salePriceValue),
          boostCost: isBoosted ? Number(boostCostValue) : 0,
          purchaseDate: purchaseDate,
          receptionDate: receptionDate || undefined,
          saleDate: saleDate || undefined,
          fees: 0, shippingCost: 0,
          imageUrl: imageUrl
      };
      if (editingItem) onUpdate(item); else onAdd(item);
      setIsModalOpen(false);
      resetForm();
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Nom", "Marque", "Prix Achat", "Prix Vente", "Statut", "Reçu le", "Vendu le"];
    const rows = filteredItems.map(i => [i.displayId, i.name, i.brand, i.purchasePrice, i.salePrice, i.status, i.receptionDate || '', i.saleDate || '']);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "export_inventaire.csv";
    link.click();
  };

  const handleParseSubmit = async () => {
      if (!parserText) return;
      setIsParsing(true);
      try {
          const result = await parseItemDescription(parserText);
          if (result) {
              resetForm();
              if (result.modelName) setDraftName(result.modelName);
              if (result.brand) setDraftBrand(result.brand);
              if (result.category) setDraftCategory(result.category);
              if (result.size) setDraftSize(result.size);
              if (result.condition) setDraftCondition(result.condition as any);
              setIsParserOpen(false);
              setParserText('');
              setIsModalOpen(true);
          } else {
              alert("Impossible d'extraire les infos.");
          }
      } catch (e) {
          alert("Erreur IA.");
      } finally {
          setIsParsing(false);
      }
  };

  const handleCsvImport = (content?: string) => {
    const textToParse = content !== undefined ? content : csvText;
    if (!textToParse) return;
    
    setIsCsvLoading(true);
    // Helper to find column value by multiple possible names (case-insensitive)
    const getVal = (row: any, aliases: string[]) => {
      const keys = Object.keys(row);
      for (const alias of aliases) {
        const foundKey = keys.find(k => k.toLowerCase().trim() === alias.toLowerCase().trim());
        if (foundKey) return row[foundKey];
      }
      return '';
    };

    (parseCSV as any)(textToParse, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim(), // Remove extra spaces from headers
      complete: (results: ParseResult<any>) => {
        const { data } = results;
        let count = 0;
        data.forEach((row: any) => {
          // Map common column names from Vinted, Excel, or VPro
          const nameVal = getVal(row, ['title', 'titre', 'name', 'nom', 'article', 'description', 'titre article']).toString();
          let brand = getVal(row, ['brand', 'marque']).toString();
          const priceStr = getVal(row, ['price', 'prix', 'salePrice', 'prix_vente', 'vente', 'total', 'prix article']);
          const purchasePriceStr = getVal(row, ['purchasePrice', 'prix_achat', 'achat', 'cost']);
          const category = getVal(row, ['category', 'categorie', 'type']) || CATEGORIES[0];
          let size = getVal(row, ['size', 'taille', 'dimension']).toString();
          const condition = getVal(row, ['condition', 'etat']) || ItemCondition.VERY_GOOD;
          const date = getVal(row, ['date', 'date_achat', 'created_at', 'vendu_le', 'reception', 'date de vente']);
          const id = getVal(row, ['id', 'reference', 'ref', 'displayId']);

          const pPrice = parseFloat(purchasePriceStr.toString().replace(',', '.') || "0");
          const sPrice = parseFloat(priceStr.toString().replace(',', '.') || purchasePriceStr.toString().replace(',', '.') || "0");

          if (nameVal) {
            // Extraction intelligente depuis le titre
            let extractedId = id ? id.toString() : '';
            
            // 1. Extraction ID (#046)
            if (!extractedId) {
                const idMatch = nameVal.match(/#(\d+)/);
                if (idMatch) extractedId = `#${idMatch[1]}`;
            }

            // 2. Extraction Taille si vide (W27 L30, W28L32, etc)
            if (!size) {
                const sizeMatch = nameVal.match(/[WL]\d{2}[ ]?[WL]?\d{2}|[WL]\d{2}/i);
                if (sizeMatch) {
                    size = sizeMatch[0].toUpperCase();
                } else {
                    // Cherche des tailles standards (S, M, L, XL, etc) avec des frontières de mots
                    const stdSizeMatch = nameVal.match(/\b(XXS|XS|S|M|L|XL|XXL|XXXL)\b/i);
                    if (stdSizeMatch) size = stdSizeMatch[0].toUpperCase();
                }
            }

            // 3. Extraction Marque si vide
            if (!brand) {
                const commonBrands = ['Levi\'s', 'Levis', 'Nike', 'Carhartt', 'Adidas', 'Zara', 'Dickies', 'Ralph Lauren', 'Lacoste'];
                for (const b of commonBrands) {
                    if (nameVal.toLowerCase().includes(b.toLowerCase())) {
                        brand = b;
                        break;
                    }
                }
            }

            const item: InventoryItem = {
              id: crypto.randomUUID(),
              displayId: extractedId || generateNextId(count),
              name: nameVal,
              brand: brand,
              category: category.toString(),
              size: size,
              condition: condition as ItemCondition,
              status: ItemStatus.IN_STOCK,
              subStatus: ItemSubStatus.NONE,
              purchasePrice: isNaN(pPrice) ? 0 : pPrice,
              displaySalePrice: isNaN(sPrice) ? 0 : sPrice,
              salePrice: isNaN(sPrice) ? 0 : sPrice,
              boostCost: 0,
              purchaseDate: date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              receptionDate: date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              fees: 0,
              shippingCost: 0,
              imageUrl: ''
            };
            onAdd(item);
            count++;
          }
        });
        alert(`${count} articles importés avec succès.`);
        setIsCsvModalOpen(false);
        setCsvText('');
        setIsCsvLoading(false);
      },
      error: (error: ParseError) => {
        alert("Erreur lors de l'import CSV: " + error.message);
        setIsCsvLoading(false);
      }
    });
  };

  const handleCsvFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleCsvImport(content);
      }
    };
    reader.readAsText(file);
    // Reset the input
    e.target.value = '';
  };

  const filteredItems = useMemo(() => {
    let result = inventory.filter(i => {
      if (subView === 'sales' && i.status !== ItemStatus.SOLD) return false;
      const matchesSearch = !debouncedSearchTerm || 
        i.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
        i.brand.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
        i.displayId?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (filters.status.length > 0 && !filters.status.includes(i.status)) return false;
      if (filters.brands.length > 0 && !filters.brands.includes(i.brand)) return false;
      if (filters.categories.length > 0 && !filters.categories.includes(i.category)) return false;
      if (filters.sizes.length > 0 && (!i.size || !filters.sizes.includes(i.size))) return false;
      return true;
    });

    result.sort((a, b) => {
      const idA = (a.displayId || '').replace('#', '');
      const idB = (b.displayId || '').replace('#', '');
      switch (filters.sortBy) {
        case 'price_asc': return a.salePrice - b.salePrice;
        case 'price_desc': return b.salePrice - a.salePrice;
        case 'id_asc': return idA.localeCompare(idB, undefined, { numeric: true });
        case 'id_desc': return idB.localeCompare(idA, undefined, { numeric: true });
        case 'date_desc': return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        case 'date_asc': return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
        default: return idB.localeCompare(idA, undefined, { numeric: true });
      }
    });
    return result;
  }, [inventory, searchTerm, subView, filters]);

  const toggleFilter = (type: 'status' | 'brands' | 'categories' | 'sizes', value: any) => {
    const current = filters[type] as any[];
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    updateGlobalFilters({ ...filters, [type]: next });
  };

  const marginInForm = (Number(salePriceValue) || 0) - (Number(purchasePriceValue) || 0) - (isBoosted ? Number(boostCostValue) : 0);

  const calculateRotation = (item: InventoryItem) => {
    if (!item.receptionDate || !item.saleDate) return null;
    const start = new Date(item.receptionDate);
    const end = new Date(item.saleDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">{t.inventory.title}</h2>
              <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-1 md:mt-2">{t.inventory.subtitle}</p>
          </div>
      </div>

      <div className="bg-white dark:bg-[#0F172A] rounded-[32px] md:rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[700px]">
        <div className="p-4 md:p-10 border-b border-slate-100 dark:border-slate-800 space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
                <div className="flex bg-slate-100 dark:bg-[#1E293B] p-1.5 rounded-[22px] w-full md:w-auto shadow-inner">
                    {[{id: 'all', label: t.inventory.tab_stock}, {id: 'sales', label: t.inventory.tab_sales}].map(view => (
                        <button 
                          key={view.id} 
                          onClick={() => setSubView(view.id as any)} 
                          className={`flex-1 md:px-10 py-3 md:py-3.5 rounded-[18px] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${subView === view.id ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {view.label}
                        </button>
                    ))}
                </div>
                
                <div className="flex gap-2 md:gap-3 w-full md:w-auto">
                  <div className="relative group flex-1 md:flex-none">
                     <button onClick={() => setIsParserOpen(true)} className="w-full justify-center p-3 md:p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-[18px] md:rounded-[22px] border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all flex items-center gap-2">
                        <Clipboard className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden md:inline text-xs font-black uppercase">{t.inventory.paste_ad}</span>
                     </button>
                  </div>

                  <button onClick={() => setIsLotModalOpen(true)} className="flex-1 md:flex-none justify-center p-3 md:p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-[18px] md:rounded-[22px] border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all flex items-center gap-2">
                      <Package className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="hidden md:inline text-xs font-black uppercase">Lot</span>
                  </button>

                  <button onClick={() => setIsCsvModalOpen(true)} className="flex-1 md:flex-none justify-center p-3 md:p-4 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-[18px] md:rounded-[22px] border border-orange-100 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-all flex items-center gap-2">
                       <FileText className="w-4 h-4 md:w-5 md:h-5" />
                       <span className="hidden md:inline text-xs font-black uppercase">Import CSV</span>
                  </button>

                  <button onClick={handleExportCSV} title={t.inventory.export_csv} className="p-3 md:p-4 bg-slate-100 dark:bg-slate-800 rounded-[18px] md:rounded-[22px] text-slate-500 hover:bg-slate-200 transition-all"><Download className="w-4 h-4 md:w-5 md:h-5" /></button>
                  <button onClick={() => setIsFilterDrawerOpen(true)} className={`p-3 md:p-5 rounded-[18px] md:rounded-[22px] transition-all relative border-2 ${ (filters.sizes.length + filters.status.length + filters.brands.length + filters.categories.length) > 0 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500 hover:bg-slate-200'}`}><SlidersHorizontal className="w-4 h-4 md:w-5 md:h-5" /></button>
                  <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex-[2] md:flex-none md:w-auto px-4 md:px-10 py-3 md:py-5 bg-indigo-600 text-white rounded-[18px] md:rounded-[24px] font-black uppercase text-[10px] md:text-xs shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 md:gap-4"><Plus className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">{t.common.add}</span></button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                <div className="md:col-span-3 relative group">
                    <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input type="text" placeholder={t.common.search} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 md:pl-16 pr-4 md:pr-6 py-3.5 md:py-5 bg-slate-50 dark:bg-[#1E293B] rounded-[18px] md:rounded-[24px] outline-none font-bold text-xs md:text-sm border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-[#0F172A] transition-all" />
                </div>
                <div className="relative">
                    <ArrowUpDown className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-slate-400" />
                    <select value={filters.sortBy} onChange={e => updateGlobalFilters({ ...filters, sortBy: e.target.value as any })} className="w-full pl-10 md:pl-14 pr-4 md:pr-6 py-3.5 md:py-5 bg-slate-50 dark:bg-[#1E293B] rounded-[18px] md:rounded-[24px] outline-none font-black text-[9px] md:text-[10px] uppercase tracking-widest border-2 border-transparent focus:border-indigo-500 appearance-none cursor-pointer">
                        <option value="id_desc">{t.inventory.sort_id_desc}</option>
                        <option value="id_asc">{t.inventory.sort_id_asc}</option>
                        <option value="price_desc">{t.inventory.sort_price_desc}</option>
                        <option value="price_asc">{t.inventory.sort_price_asc}</option>
                    </select>
                </div>
            </div>
        </div>

        <div className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar bg-slate-50/20 dark:bg-black/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                {filteredItems.map(item => {
                    const margin = item.salePrice - item.purchasePrice - (item.boostCost || 0);
                    const rotation = calculateRotation(item);
                    return (
                      <div key={item.id} className="bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-slate-800 rounded-[24px] md:rounded-[32px] overflow-hidden group hover:shadow-2xl hover:translate-y-[-4px] transition-all flex flex-col shadow-sm">
                          <div className="p-3 md:p-4 flex gap-3 md:gap-4 flex-1 items-start">
                              <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 dark:bg-[#0F172A] rounded-[16px] md:rounded-[20px] overflow-hidden flex-shrink-0 relative border border-slate-100/50 dark:border-slate-800">
                                  {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-5 h-5 md:w-6 md:h-6 text-slate-200" /></div>}
                                  <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-slate-900/80 text-white text-[7px] font-black rounded-md uppercase">{item.displayId}</div>
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col gap-1">
                                  <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest truncate">{item.brand}</span>
                                  <h4 className="font-bold text-slate-900 dark:text-white text-[11px] md:text-xs leading-snug whitespace-normal break-words">{item.name}</h4>
                                  <div className="flex items-baseline gap-2 mt-1">
                                      <span className="text-sm md:text-base font-black text-slate-900 dark:text-white">{item.salePrice}€</span>
                                      <span className="text-[8px] bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-100 dark:border-slate-800 font-black text-slate-400">{item.size || 'TU'}</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1.5">
                                      <div className={`px-1.5 md:px-2 py-1 rounded-lg text-[8px] font-black flex items-center gap-1 w-fit border ${margin >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                          <Scale className="w-2.5 h-2.5" /> +{margin.toFixed(2)}€
                                      </div>
                                      {rotation !== null && (
                                          <div className="px-1.5 md:px-2 py-1 rounded-lg text-[8px] font-black flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                                              <Clock className="w-2.5 h-2.5" /> {rotation}{t.inventory.item_card.days}
                                          </div>
                                      )}
                                      <div className="px-1.5 md:px-2 py-1 rounded-lg text-[8px] font-black flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                          {t.status[item.status] || item.status}
                                      </div>
                                      {item.subStatus && item.subStatus !== ItemSubStatus.NONE && (
                                          <div className="px-1.5 md:px-2 py-1 rounded-lg text-[8px] font-black flex items-center gap-1 bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800">
                                              {t.subStatus[item.subStatus] || item.subStatus}
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                          <div className="flex border-t border-slate-50 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30">
                              <button onClick={() => handleEdit(item)} className="flex-1 py-2.5 md:py-3.5 flex items-center justify-center gap-1.5 md:gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-indigo-600 hover:text-white transition-all border-r border-slate-50 dark:border-slate-800/60"><Edit2 className="w-3 h-3" /> {t.common.edit}</button>
                              <button onClick={() => handleDuplicate(item)} className="p-2.5 md:p-3.5 flex items-center justify-center text-slate-500 hover:bg-emerald-600 hover:text-white transition-all border-r border-slate-50 dark:border-slate-800/60"><Copy className="w-3.5 h-3.5" /></button>
                              <button onClick={() => onDelete(item.id)} className="flex-1 py-2.5 md:py-3.5 flex items-center justify-center gap-1.5 md:gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-rose-600 hover:text-white transition-all"><Trash2 className="w-3 h-3" /> {t.common.delete}</button>
                          </div>
                      </div>
                    );
                })}
            </div>
        </div>

        {/* Modal Import CSV */}
        {isCsvModalOpen && (
             <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[500] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 w-full h-[100dvh] sm:h-auto sm:max-w-2xl sm:rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
                    <div className="px-6 md:px-8 py-5 md:py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                           <FileText className="w-5 h-5 text-orange-500" /> Import CSV
                        </h3>
                        <button onClick={() => setIsCsvModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                    </div>
                    <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-3xl border border-orange-200 dark:border-orange-800 flex flex-col items-center justify-center text-center gap-4 group hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all cursor-pointer relative overflow-hidden" onClick={() => fileInputCsvRef.current?.click()}>
                            <div className="w-16 h-16 bg-white dark:bg-orange-900/50 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <FileText className="w-8 h-8 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-orange-950 dark:text-orange-100 uppercase tracking-tighter italic">Sélectionner un fichier CSV</p>
                                <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase mt-1">Ou glisser-déposer ici</p>
                            </div>
                            <input type="file" ref={fileInputCsvRef} className="hidden" accept=".csv" onChange={handleCsvFileSelect} />
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800"></div>
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">OU COLLEZ LE TEXTE</span>
                            <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800"></div>
                        </div>

                        <textarea 
                            value={csvText}
                            onChange={e => setCsvText(e.target.value)}
                            placeholder="Date,Title,Price,Currency&#10;2026-04-04,Levi's 501,29.90,EUR&#10;2026-04-03,Nike Dunk,85.00,EUR"
                            className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 outline-none focus:border-orange-500 font-mono text-xs resize-none"
                        />
                    </div>
                    <div className="p-6 md:p-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3 md:gap-4 shrink-0">
                        <button onClick={() => setIsCsvModalOpen(false)} className="flex-1 px-4 md:px-6 py-3 md:py-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-[10px] md:text-xs hover:bg-slate-50 dark:hover:bg-slate-800">{t.common.cancel}</button>
                        <button 
                            onClick={() => handleCsvImport()} 
                            disabled={!csvText || isCsvLoading}
                            className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-orange-600 text-white rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isCsvLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Importer
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Modal Parser Vinted */}
        {isParserOpen && (
             <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[500] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 w-full h-[100dvh] sm:h-auto sm:max-w-lg sm:rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
                    <div className="px-6 md:px-8 py-5 md:py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                           <Sparkles className="w-5 h-5 text-indigo-500" /> {t.inventory.parser.title}
                        </h3>
                        <button onClick={() => setIsParserOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                    </div>
                    <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                            <p className="text-xs text-indigo-800 dark:text-indigo-200 font-medium">{t.inventory.parser.desc}</p>
                        </div>
                        <textarea 
                            value={parserText}
                            onChange={e => setParserText(e.target.value)}
                            placeholder={t.inventory.parser.placeholder}
                            className="w-full h-40 md:h-48 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 font-medium text-sm resize-none"
                        />
                    </div>
                    <div className="p-6 md:p-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3 md:gap-4 shrink-0">
                        <button onClick={() => setIsParserOpen(false)} className="flex-1 px-4 md:px-6 py-3 md:py-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-[10px] md:text-xs hover:bg-slate-50 dark:hover:bg-slate-800">{t.common.cancel}</button>
                        <button 
                            onClick={handleParseSubmit} 
                            disabled={!parserText || isParsing}
                            className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {t.inventory.parser.btn}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[300] flex items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
             <div className="bg-[#0F172A] w-full max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-[48px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500 sm:border border-slate-800">
                 <div className="px-5 py-5 md:px-8 md:py-8 border-b border-slate-800 flex justify-between items-center bg-[#0F172A] shrink-0">
                     <div className="flex items-center gap-4 md:gap-6">
                          <div className="p-3 md:p-4 bg-indigo-600 text-white rounded-[18px] md:rounded-[22px] shadow-xl"><Plus className="w-5 h-5 md:w-7 md:h-7" /></div>
                          <div>
                              <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-white italic leading-none">{editingItem ? t.inventory.form.edit : t.inventory.form.new}</h2>
                              {editingItem && <span className="text-[9px] md:text-[11px] font-black text-indigo-500 uppercase tracking-widest mt-1 block">{editingItem.displayId}</span>}
                          </div>
                     </div>
                     <button onClick={() => setIsModalOpen(false)} className="p-2 md:p-3 hover:bg-slate-800 rounded-full text-slate-400 transition-all"><X className="w-5 h-5 md:w-7 md:h-7" /></button>
                 </div>

                 <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden bg-[#0F172A]">
                     <div className="flex-1 overflow-y-auto p-5 md:p-12 space-y-6 md:space-y-10 custom-scrollbar">
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                             <div className="md:col-span-1 flex flex-col items-center">
                                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-[0.2em] w-full text-center">{t.inventory.form.image}</label>
                                  <div className="w-full aspect-square bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-700 relative overflow-hidden flex items-center justify-center group shadow-inner">
                                      {imageUrl ? <img src={imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-12 h-12 text-slate-800" />}
                                      <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-4 bg-white text-indigo-600 rounded-2xl shadow-xl">{isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImagePlus className="w-6 h-6" />}</button>
                                      </div>
                                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                  </div>
                             </div>
                             <div className="md:col-span-3 space-y-8">
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                     <div className="bg-slate-900/50 p-6 rounded-[28px] border border-slate-800">
                                         <label className="block text-[9px] font-black uppercase text-slate-500 mb-3 tracking-[0.2em] flex items-center gap-2 justify-between">
                                            <div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-indigo-500" /> ID</div>
                                            <button type="button" onClick={() => setDraftDisplayId(generateNextId())} className="text-[9px] font-black text-indigo-400 hover:text-white flex items-center gap-1"><RefreshCw className="w-3 h-3" /> {t.inventory.form.id_auto}</button>
                                         </label>
                                         <input type="text" value={draftDisplayId} onChange={e => setDraftDisplayId(e.target.value)} placeholder="#000" className="w-full bg-transparent font-black outline-none focus:text-indigo-400 text-xl text-white" />
                                     </div>
                                     <div className="md:col-span-2">
                                         <ModelSelector 
                                           inventory={inventory} 
                                           catalog={catalog}
                                           onAddCatalogItem={onAddCatalogItem}
                                           onDeleteCatalogItem={onDeleteCatalogItem}
                                           initialName={draftName} 
                                           currentBrand={draftBrand}
                                           currentCategory={draftCategory}
                                           onSelect={(id, name, brand, cat) => { 
                                               setDraftName(name || ''); 
                                               if (brand) setDraftBrand(brand); 
                                               if (cat) setDraftCategory(cat); 
                                           }} 
                                         />
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div className="bg-slate-900/50 p-5 rounded-[28px] border border-slate-800 shadow-inner">
                                         <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-[0.2em]">{t.inventory.form.brand}</label>
                                         <div className="relative">
                                              <select 
                                                 value={draftBrand} 
                                                 onChange={e => setDraftBrand(e.target.value)} 
                                                 className="w-full bg-slate-800 border-2 border-slate-700 rounded-[20px] p-4 text-white font-black text-sm outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                                              >
                                                 <option value="">{t.inventory.form.select}</option>
                                                 {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                              </select>
                                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                                         </div>
                                     </div>
                                     <div className="bg-slate-900/50 p-5 rounded-[28px] border border-slate-800 shadow-inner">
                                         <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-[0.2em]">{t.inventory.form.category}</label>
                                         <div className="relative">
                                              <select 
                                                 value={draftCategory} 
                                                 onChange={e => setDraftCategory(e.target.value)} 
                                                 className="w-full bg-slate-800 border-2 border-slate-700 rounded-[20px] p-4 text-white font-black text-sm outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                                              >
                                                 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                              </select>
                                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                                         </div>
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                     <div className="space-y-6">
                                         <div className="bg-slate-900/50 p-6 rounded-[32px] border border-slate-800 shadow-inner">
                                             <label className="block text-[10px] font-black uppercase text-slate-500 mb-4 tracking-[0.2em] flex items-center gap-3"><Tag className="w-4 h-4 text-indigo-500" /> {t.inventory.form.status}</label>
                                             <div className="flex flex-col gap-4">
                                                 <select value={itemStatusInForm} onChange={e => handleStatusChange(e.target.value as ItemStatus)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-[20px] p-4 text-white font-black text-sm outline-none focus:border-indigo-500 cursor-pointer appearance-none">
                                                     {Object.values(ItemStatus).map(s => <option key={s} value={s}>{t.status[s] || s}</option>)}
                                                 </select>
                                                 <select value={subStatusInForm} onChange={e => handleSubStatusChange(e.target.value as ItemSubStatus)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-[20px] p-4 text-white font-black text-sm outline-none focus:border-indigo-500 cursor-pointer appearance-none">
                                                     {Object.values(ItemSubStatus).map(s => <option key={s} value={s}>{t.subStatus[s] || s}</option>)}
                                                 </select>
                                             </div>
                                         </div>
                                         
                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                             {itemStatusInForm !== ItemStatus.TRANSIT ? (
                                                 <div className="bg-slate-900/50 p-4 rounded-[28px] border border-slate-800">
                                                     <label className="block text-[9px] font-black uppercase text-slate-500 mb-3 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {subStatusInForm === ItemSubStatus.ONLINE ? 'Mise en vente' : t.inventory.form.reception}</label>
                                                     <input type="date" value={receptionDate} onChange={e => setReceptionDate(e.target.value)} className="w-full bg-transparent text-white font-black text-xs outline-none" />
                                                 </div>
                                             ) : (
                                                 <div className="bg-slate-900/20 p-4 rounded-[28px] border border-slate-800/50 opacity-50">
                                                     <label className="block text-[9px] font-black uppercase text-slate-500 mb-3 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {subStatusInForm === ItemSubStatus.ONLINE ? 'Mise en vente' : t.inventory.form.reception}</label>
                                                     <div className="w-full bg-transparent text-slate-500 font-black text-xs">En transit...</div>
                                                 </div>
                                             )}
                                             {itemStatusInForm === ItemStatus.SOLD || itemStatusInForm === ItemStatus.PAYMENT_PENDING ? (
                                                 <div className="bg-slate-900/50 p-4 rounded-[28px] border border-slate-800">
                                                     <label className="block text-[9px] font-black uppercase text-slate-500 mb-3 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {t.inventory.form.sale_date}</label>
                                                     <input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} className="w-full bg-transparent text-white font-black text-xs outline-none" />
                                                 </div>
                                             ) : (
                                                 <div className="bg-slate-900/20 p-4 rounded-[28px] border border-slate-800/50 opacity-50">
                                                     <label className="block text-[9px] font-black uppercase text-slate-500 mb-3 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {t.inventory.form.sale_date}</label>
                                                     <div className="w-full bg-transparent text-slate-500 font-black text-xs">Non vendu</div>
                                                 </div>
                                             )}
                                         </div>

                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                             <div className="bg-slate-900/50 p-5 rounded-[28px] border border-slate-800 shadow-inner">
                                                 <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 text-center">{t.inventory.form.size}</label>
                                                 <input value={draftSize} onChange={e => setDraftSize(e.target.value)} className="w-full bg-transparent text-white font-black text-center text-lg outline-none" placeholder="Ex: M" />
                                             </div>
                                             <div className="bg-slate-900/50 p-5 rounded-[28px] border border-slate-800 shadow-inner">
                                                 <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 text-center">{t.inventory.form.condition}</label>
                                                 <select value={draftCondition} onChange={e => setDraftCondition(e.target.value as ItemCondition)} className="w-full bg-transparent text-white font-black text-center text-[10px] outline-none appearance-none cursor-pointer">
                                                     {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                                 </select>
                                             </div>
                                         </div>

                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                             <div className="bg-slate-900/50 p-5 rounded-[28px] border border-slate-800 shadow-inner">
                                                 <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 text-center">Quantité</label>
                                                 <input type="number" min="1" value={draftQuantity} onChange={e => setDraftQuantity(e.target.value)} className="w-full bg-transparent text-white font-black text-center text-lg outline-none" placeholder="1" />
                                             </div>
                                             <div className="bg-slate-900/50 p-5 rounded-[28px] border border-slate-800 shadow-inner">
                                                 <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 text-center">Alerte Stock Bas</label>
                                                 <input type="number" min="0" value={draftMinStockThreshold} onChange={e => setDraftMinStockThreshold(e.target.value)} className="w-full bg-transparent text-white font-black text-center text-lg outline-none" placeholder="0" />
                                             </div>
                                         </div>

                                         <div className="bg-slate-900/50 p-5 rounded-[28px] border border-slate-800 shadow-inner flex items-center justify-between cursor-pointer group" onClick={() => setIsBoosted(!isBoosted)}>
                                              <div className="flex items-center gap-4">
                                                  <div className={`p-3 rounded-2xl transition-colors ${isBoosted ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-600'}`}>
                                                      <Rocket className="w-5 h-5" />
                                                  </div>
                                                  <div className="flex flex-col">
                                                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isBoosted ? 'text-indigo-400' : 'text-slate-500'}`}>{t.inventory.form.boost}</span>
                                                      <span className="text-[9px] font-bold text-slate-600">{t.inventory.form.boost_desc}</span>
                                                  </div>
                                              </div>
                                              
                                              <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                                                  {isBoosted && (
                                                      <div className="relative animate-in slide-in-from-right-4 fade-in duration-300">
                                                          <input 
                                                              type="number" 
                                                              step="0.01" 
                                                              value={boostCostValue} 
                                                              onChange={e => setBoostCostValue(e.target.value)} 
                                                              placeholder="0.00"
                                                              className="w-20 bg-transparent border-b-2 border-indigo-500 text-white font-black text-xl text-right outline-none pb-1 focus:border-indigo-400 transition-colors" 
                                                              autoFocus
                                                              onClick={e => e.stopPropagation()}
                                                          />
                                                          <span className="absolute right-0 -bottom-4 text-[8px] font-black text-slate-500">{t.inventory.form.cost} (€)</span>
                                                      </div>
                                                  )}
                                                  <div 
                                                      onClick={() => setIsBoosted(!isBoosted)}
                                                      className={`w-14 h-8 rounded-full transition-all relative cursor-pointer border-2 ${isBoosted ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-800 border-slate-700'}`}
                                                  >
                                                      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-md ${isBoosted ? 'left-7' : 'left-1 bg-slate-500'}`} />
                                                  </div>
                                              </div>
                                         </div>
                                     </div>

                                     <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[40px] shadow-2xl text-white space-y-6 relative overflow-hidden group">
                                         <DollarSign className="absolute -right-8 -top-8 w-40 h-40 opacity-5 rotate-12" />
                                         <div className="grid grid-cols-2 gap-6 relative z-10">
                                             <div>
                                               <label className="block text-[9px] font-black uppercase opacity-60 mb-2">{t.inventory.form.purchase_price} (€)</label>
                                               <input type="number" step="0.01" value={purchasePriceValue} onChange={e => setPurchasePriceValue(e.target.value)} className="w-full bg-white/10 border-2 border-white/20 rounded-[20px] p-4 font-black outline-none focus:bg-white/20 text-white text-xl" />
                                             </div>
                                             <div>
                                               <label className="block text-[9px] font-black uppercase opacity-60 mb-2">{t.inventory.form.listed_price} (€)</label>
                                               <input type="number" step="0.01" value={displaySalePriceValue} onChange={e => setDisplaySalePriceValue(e.target.value)} className="w-full bg-white/10 border-2 border-white/20 rounded-[20px] p-4 font-black outline-none focus:bg-white/20 text-white text-xl" />
                                             </div>
                                         </div>
                                         <div className="relative z-10 space-y-2">
                                             <label className="block text-[11px] font-black uppercase opacity-80 tracking-[0.4em] text-center">{t.inventory.form.sold_price}</label>
                                             <input type="number" step="0.01" value={salePriceValue} onChange={e => setSalePriceValue(e.target.value)} className="w-full p-6 bg-white text-indigo-700 rounded-[28px] font-black text-4xl text-center outline-none border-[6px] border-indigo-400 shadow-xl" />
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>

                         <div className="bg-slate-900 rounded-[28px] border border-slate-800 p-6 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <Scale className="w-5 h-5 text-indigo-500" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t.inventory.form.est_margin}</span>
                              </div>
                              <div className={`text-3xl font-black ${marginInForm >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {marginInForm.toFixed(2)}€
                              </div>
                         </div>
                     </div>
                     <div className="p-5 md:p-8 border-t border-slate-800 bg-[#0F172A] flex flex-col sm:flex-row gap-3 md:gap-5 shrink-0">
                         <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 md:py-5 bg-slate-800 text-slate-400 rounded-[20px] md:rounded-[28px] font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-slate-700 transition-all">{t.common.cancel}</button>
                         <button type="submit" className="flex-1 py-4 md:py-5 bg-indigo-600 text-white rounded-[20px] md:rounded-[28px] font-black uppercase text-[10px] md:text-xs tracking-[0.3em] shadow-lg hover:bg-indigo-700 transition-all">{t.inventory.form.save_btn}</button>
                     </div>
                 </form>
             </div>
          </div>
        )}

        {isFilterDrawerOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[400] flex justify-end">
              <div className="absolute inset-0" onClick={() => setIsFilterDrawerOpen(false)} />
              <div className="relative w-full max-w-sm h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">{t.inventory.filters}</h3>
                      <button onClick={() => setIsFilterDrawerOpen(false)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl"><X className="w-6 h-6 text-slate-500" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{t.common.status}</label>
                          <div className="grid grid-cols-2 gap-2">
                              {Object.values(ItemStatus).map(s => (
                                  <button key={s} onClick={() => toggleFilter('status', s)} className={`p-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${filters.status.includes(s) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500'}`}>{t.status[s] || s}</button>
                              ))}
                          </div>
                      </div>
                  </div>
                  <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                      <button onClick={() => updateGlobalFilters({ brands: [], categories: [], sizes: [], status: [], dateRange: { start: '', end: '' }, sortBy: 'id_desc', searchTerm: '' })} className="flex-1 py-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black uppercase text-[10px]">{t.common.reset}</button>
                      <button onClick={() => setIsFilterDrawerOpen(false)} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">{t.common.apply}</button>
                  </div>
              </div>
          </div>
        )}
        {isLotModalOpen && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[300] flex items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
             <div className="bg-[#0F172A] w-full max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-[48px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500 sm:border border-slate-800">
                 <div className="px-5 py-5 md:px-8 md:py-8 border-b border-slate-800 flex justify-between items-center bg-[#0F172A] shrink-0">
                     <div className="flex items-center gap-4 md:gap-6">
                          <div className="p-3 md:p-4 bg-emerald-600 text-white rounded-[18px] md:rounded-[22px] shadow-xl"><Package className="w-5 h-5 md:w-7 md:h-7" /></div>
                          <div>
                              <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-white italic leading-none">Ajouter un Lot</h2>
                              <span className="text-[9px] md:text-[11px] font-black text-emerald-500 uppercase tracking-widest mt-1 block">Création multiple</span>
                          </div>
                     </div>
                     <button onClick={() => setIsLotModalOpen(false)} className="p-2 md:p-3 hover:bg-slate-800 rounded-full text-slate-400 transition-all"><X className="w-5 h-5 md:w-7 md:h-7" /></button>
                 </div>

                 <form onSubmit={handleLotSubmit} className="flex-1 flex flex-col overflow-hidden bg-[#0F172A]">
                     <div className="flex-1 overflow-y-auto p-5 md:p-12 space-y-6 md:space-y-10 custom-scrollbar">
                         <div className="bg-emerald-900/20 border border-emerald-800/50 p-4 rounded-2xl mb-2">
                             <p className="text-xs text-emerald-200/70 font-medium leading-relaxed">
                                 Créez rapidement des fiches avec le prix d'achat réparti équitablement. 
                                 <strong className="text-emerald-400"> Laissez le nom, la marque et la taille vides si le lot est mixte</strong>, vous pourrez compléter chaque fiche individuellement plus tard.
                             </p>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-6">
                                 <div className="bg-slate-900/50 p-6 rounded-[28px] border border-slate-800 shadow-inner">
                                     <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-[0.2em]">Nom générique (Optionnel)</label>
                                     <input type="text" value={lotName} onChange={e => setLotName(e.target.value)} placeholder="Ex: Vêtement friperie" className="w-full bg-transparent font-black outline-none focus:text-emerald-400 text-xl text-white" />
                                 </div>
                                 
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <div className="bg-slate-900/50 p-5 rounded-[28px] border border-slate-800 shadow-inner">
                                         <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-[0.2em]">Marque (Optionnel)</label>
                                         <div className="relative">
                                              <select value={lotBrand} onChange={e => setLotBrand(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-[20px] p-4 text-white font-black text-sm outline-none focus:border-emerald-500 cursor-pointer appearance-none">
                                                 <option value="">Mixte / Vide</option>
                                                 {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                              </select>
                                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                                         </div>
                                     </div>
                                     <div className="bg-slate-900/50 p-5 rounded-[28px] border border-slate-800 shadow-inner">
                                         <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-[0.2em]">Catégorie</label>
                                         <div className="relative">
                                              <select value={lotCategory} onChange={e => setLotCategory(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-[20px] p-4 text-white font-black text-sm outline-none focus:border-emerald-500 cursor-pointer appearance-none">
                                                 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                              </select>
                                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                                         </div>
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <div className="bg-slate-900/50 p-5 rounded-[28px] border border-slate-800 shadow-inner">
                                         <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 text-center">Taille (Optionnel)</label>
                                         <input value={lotSize} onChange={e => setLotSize(e.target.value)} className="w-full bg-transparent text-white font-black text-center text-lg outline-none" placeholder="Mixte" />
                                     </div>
                                     <div className="bg-slate-900/50 p-5 rounded-[28px] border border-slate-800 shadow-inner">
                                         <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 text-center">État</label>
                                         <select value={lotCondition} onChange={e => setLotCondition(e.target.value as ItemCondition)} className="w-full bg-transparent text-white font-black text-center text-[10px] outline-none appearance-none cursor-pointer">
                                             {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                         </select>
                                     </div>
                                 </div>
                             </div>

                             <div className="space-y-6">
                                 <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-2xl text-white space-y-6 relative overflow-hidden group">
                                     <Package className="absolute -right-8 -top-8 w-40 h-40 opacity-5 rotate-12" />
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 relative z-10">
                                         <div>
                                           <label className="block text-[9px] font-black uppercase opacity-60 mb-2">Prix total du lot (€)</label>
                                           <input required type="number" step="0.01" min="0" value={lotTotalPrice} onChange={e => setLotTotalPrice(e.target.value)} className="w-full bg-white/10 border-2 border-white/20 rounded-[20px] p-4 font-black outline-none focus:bg-white/20 text-white text-xl" />
                                         </div>
                                         <div>
                                           <label className="block text-[9px] font-black uppercase opacity-60 mb-2">Quantité</label>
                                           <input required type="number" min="1" step="1" value={lotQuantity} onChange={e => setLotQuantity(e.target.value)} className="w-full bg-white/10 border-2 border-white/20 rounded-[20px] p-4 font-black outline-none focus:bg-white/20 text-white text-xl" />
                                         </div>
                                     </div>
                                     <div className="relative z-10 space-y-2">
                                         <label className="block text-[11px] font-black uppercase opacity-80 tracking-[0.4em] text-center">Prix unitaire calculé</label>
                                         <div className="w-full p-4 md:p-6 bg-white text-emerald-700 rounded-[24px] md:rounded-[28px] font-black text-3xl md:text-4xl text-center border-[6px] border-emerald-400 shadow-xl flex items-center justify-center">
                                            {Number(lotQuantity) > 0 && Number(lotTotalPrice) >= 0 
                                                ? (Number(lotTotalPrice) / Number(lotQuantity)).toFixed(2) 
                                                : '0.00'}€
                                         </div>
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <div className="bg-slate-900/50 p-4 rounded-[28px] border border-slate-800">
                                         <label className="block text-[9px] font-black uppercase text-slate-500 mb-3 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Statut du lot</label>
                                         <div className="flex flex-col gap-2">
                                             <select value={lotStatus} onChange={e => setLotStatus(e.target.value as ItemStatus)} className="w-full bg-transparent text-white font-black text-xs outline-none appearance-none cursor-pointer">
                                                 <option value={ItemStatus.IN_STOCK}>En stock</option>
                                                 <option value={ItemStatus.TRANSIT}>En transit</option>
                                             </select>
                                             <select value={lotSubStatus} onChange={e => setLotSubStatus(e.target.value as ItemSubStatus)} className="w-full bg-transparent text-white font-black text-xs outline-none appearance-none cursor-pointer">
                                                 {Object.values(ItemSubStatus).map(s => <option key={s} value={s}>{t.subStatus[s] || s}</option>)}
                                             </select>
                                         </div>
                                     </div>
                                     <div className="bg-slate-900/50 p-4 rounded-[28px] border border-slate-800">
                                         <label className="block text-[9px] font-black uppercase text-slate-500 mb-3 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date d'achat</label>
                                         <input required={lotStatus !== ItemStatus.TRANSIT} type="date" value={lotPurchaseDate} onChange={e => setLotPurchaseDate(e.target.value)} className="w-full bg-transparent text-white font-black text-xs outline-none" />
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                     <div className="p-5 md:p-8 border-t border-slate-800 bg-[#0F172A] flex flex-col sm:flex-row gap-3 md:gap-5 shrink-0">
                         <button type="button" onClick={() => setIsLotModalOpen(false)} className="flex-1 py-4 md:py-5 bg-slate-800 text-slate-400 rounded-[20px] md:rounded-[28px] font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-slate-700 transition-all">{t.common.cancel}</button>
                         <button type="submit" className="flex-1 py-4 md:py-5 bg-emerald-600 text-white rounded-[20px] md:rounded-[28px] font-black uppercase text-[10px] md:text-xs tracking-[0.3em] shadow-lg hover:bg-emerald-700 transition-all">Créer {lotQuantity || 0} articles</button>
                     </div>
                 </form>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;