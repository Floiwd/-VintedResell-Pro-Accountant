
export enum ItemStatus {
  TRANSIT = 'EN_TRANSIT',
  IN_STOCK = 'EN_STOCK',
  PAYMENT_PENDING = 'ATTENTE_PAIEMENT',
  SOLD = 'VENDU',
  PENDING = 'EN_COURS',
  RETURNED = 'RETOURNÉ'
}

export enum ItemCondition {
  NEW_WITH_TAG = 'NEUF_ETIQUETTE',
  NEW_NO_TAG = 'NEUF_SANS_ETIQUETTE',
  VERY_GOOD = 'TRES_BON_ETAT',
  GOOD = 'BON_ETAT',
  SATISFACTORY = 'SATISFAISANT'
}

export interface InventoryItem {
  id: string;
  displayId?: string;
  catalogId?: string;
  name: string;
  brand: string;
  size?: string;
  color?: string;
  condition?: ItemCondition;
  purchasePrice: number;
  displaySalePrice: number;
  salePrice: number;
  fees: number;
  shippingCost: number;
  boostCost: number;
  status: ItemStatus;
  purchaseDate: string;
  receptionDate?: string;
  postedDate?: string;
  saleDate?: string;
  category: string;
  imageUrl?: string;
}

export interface Member {
  id: string;
  name: string;
  sharePercentage: number;
  isActive?: boolean;
}

export interface FinancialTransfer {
  id: string;
  amount: number;
  date: string;
  type: 'WITHDRAWAL' | 'DEPOSIT' | 'ADJUSTMENT';
  description: string;
  memberId?: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  frequency: 'MONTHLY' | 'YEARLY' | 'WEEKLY';
  nextDueDate: string;
  active: boolean;
}

export interface CatalogItem { 
  id: string; 
  name: string; 
  brand: string; 
  category: string; 
}

export interface FilterState {
    brands: string[];
    categories: string[];
    sizes: string[];
    status: ItemStatus[];
    dateRange: { start: string; end: string };
    sortBy?: 'date_desc' | 'date_asc' | 'price_desc' | 'price_asc' | 'rotation_asc' | 'rotation_desc' | 'id_asc' | 'id_desc';
    searchTerm?: string;
}

export interface AppState {
  inventory: InventoryItem[];
  members: Member[];
  transfers: FinancialTransfer[];
  recurringExpenses: RecurringExpense[];
  cashThreshold?: number;
  monthlyGoal?: number;
  nextItemNumber: number;
  sharedWith: string[];
  filters?: FilterState;
  catalog: CatalogItem[];
}

export interface AiInsightData {
    analysis: string;
    strategies: string[];
    precautions: string[];
    chartData: { name: string; value: number }[];
}
