
import { ItemStatus, InventoryItem, Member, ItemCondition } from './types';

export const INITIAL_MEMBERS: Member[] = [
  { id: 'm1', name: 'Associé 1', sharePercentage: 50, isActive: true },
  { id: 'm2', name: 'Associé 2', sharePercentage: 50, isActive: true },
];

export const BRANDS = [
  'Nike',
  'Adidas',
  'Jordan',
  'Levi\'s',
  'Carhartt',
  'Ralph Lauren',
  'Tommy Hilfiger',
  'Lacoste',
  'The North Face',
  'Dickies',
  'Stüssy',
  'Stone Island',
  'Prada',
  'Autre'
];

export const CATEGORIES = [
  'Pantalon', 
  'Pull', 
  'Sweat', 
  'Polo', 
  'T-shirt', 
  'Short', 
  'Veste', 
  'Chaussures', 
  'Accessoires', 
  'Autre'
];

export const CONDITIONS = [
  { value: ItemCondition.NEW_WITH_TAG, label: 'Neuf avec étiquette', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30' },
  { value: ItemCondition.NEW_NO_TAG, label: 'Neuf sans étiquette', color: 'bg-teal-50 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 dark:border dark:border-teal-500/30' },
  { value: ItemCondition.VERY_GOOD, label: 'Très bon état', color: 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 dark:border dark:border-blue-500/30' },
  { value: ItemCondition.GOOD, label: 'Bon état', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border dark:border-indigo-500/30' },
  { value: ItemCondition.SATISFACTORY, label: 'Satisfaisant', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 dark:border dark:border-amber-500/30' },
];

// Liste des tailles standards Vinted
export const SIZES = {
  CLOTHING: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'TU'],
  SHOES: ['36', '36.5', '37', '37.5', '38', '38.5', '39', '40', '40.5', '41', '42', '42.5', '43', '44', '44.5', '45', '46', '47', '48']
};

// Liste des couleurs Vinted avec codes Hex pour l'affichage
export const COLORS = [
  { name: 'Noir', hex: '#000000' },
  { name: 'Blanc', hex: '#FFFFFF', border: true },
  { name: 'Gris', hex: '#808080' },
  { name: 'Crème', hex: '#FFFDD0' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Abricot', hex: '#EB9373' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Corail', hex: '#FF7F50' },
  { name: 'Rouge', hex: '#FF0000' },
  { name: 'Bordeaux', hex: '#800020' },
  { name: 'Rose', hex: '#FFC0CB' },
  { name: 'Violet', hex: '#800080' },
  { name: 'Lilas', hex: '#C8A2C8' },
  { name: 'Bleu clair', hex: '#ADD8E6' },
  { name: 'Bleu', hex: '#0000FF' },
  { name: 'Bleu marine', hex: '#000080' },
  { name: 'Turquoise', hex: '#40E0D0' },
  { name: 'Menthe', hex: '#98FF98' },
  { name: 'Vert', hex: '#008000' },
  { name: 'Kaki', hex: '#6B8E23' },
  { name: 'Marron', hex: '#A52A2A' },
  { name: 'Moutarde', hex: '#FFDB58' },
  { name: 'Jaune', hex: '#FFFF00' },
  { name: 'Argenté', hex: '#C0C0C0' },
  { name: 'Doré', hex: '#FFD700' },
  { name: 'Multicolore', hex: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)' }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: '1',
    name: 'Nike Dunk Low Retro',
    brand: 'Nike',
    size: '43',
    color: 'Blanc',
    condition: ItemCondition.VERY_GOOD,
    purchasePrice: 110,
    displaySalePrice: 180, // Added missing property
    salePrice: 180,
    // Fix: Remove 'offersReceived' property as it is not in the InventoryItem type
    fees: 0,
    shippingCost: 0,
    boostCost: 0,
    status: ItemStatus.SOLD,
    purchaseDate: '2023-10-01',
    saleDate: '2023-10-15',
    category: 'Chaussures'
  },
  {
    id: '2',
    name: 'Carhartt Detroit Jacket',
    brand: 'Carhartt',
    size: 'L',
    color: 'Marron',
    condition: ItemCondition.GOOD,
    purchasePrice: 85,
    displaySalePrice: 150, // Added missing property
    salePrice: 150,
    // Fix: Remove 'offersReceived' property as it is not in the InventoryItem type
    fees: 0,
    shippingCost: 0,
    boostCost: 0,
    status: ItemStatus.IN_STOCK,
    purchaseDate: '2023-11-05',
    category: 'Veste'
  }
];