
import { Product, Employee, ERPConfig, User, Customer, Lead, Task } from './types';

export const APP_USERS: User[] = [
  { id: 'U001', name: 'Bamba Ndao', role: 'admin', initials: 'BN', color: 'from-slate-700 to-slate-900', password: '1234' },
  { id: 'U002', name: 'Amy Ndaw', role: 'cashier', initials: 'AN', color: 'from-emerald-600 to-emerald-800', password: '0000' },
  { id: 'U003', name: 'Fama', role: 'waiter', initials: 'F', color: 'from-purple-600 to-purple-800', password: '1111' },
];

export const INITIAL_CONFIG: ERPConfig = {
  companyName: "FAST FOOD MYA D'OR",
  companySlogan: "Le goût qui vaut de l'or",
  email: 'restaurationsfastfoodmyador@gmail.com',
  phone: '+222 43 85 27 44',
  address: "À côté de l'Hôpital Basra, Nouakchott",
  registrationNumber: 'RC-NKC-2025-B123',
  currency: 'MRU',
  currencySymbol: 'UM',
  timezone: 'Africa/Nouakchott',
  dateFormat: 'DD/MM/YYYY',
  taxRate: 0,
  receiptFooter: 'Merci de votre visite chez MYA D\'OR !',
  autoPrintReceipt: true,
  invoicePrefix: 'FAC/2025/',
  nextInvoiceNumber: 1,
  theme: 'purple',
  categories: [
    'Petit Déjeuner', 'Déjeuner', 'Dîner', 'Fast Food & Snack', 'Crêpes', 'Gaufres', 'Boissons', 'Desserts', 'Menus & Formules', 'Suppléments'
  ],
  language: 'fr',
  showLogoOnInvoice: true,
  showSloganOnInvoice: true,
  showAddressOnInvoice: true,
  showPhoneOnInvoice: true,
  showEmailOnInvoice: true,
  showRegNumberOnInvoice: true,
  showQrCodeOnInvoice: true,
  // Added missing required property from ERPConfig interface
  showCashierOnInvoice: true,
  wifiName: "MYA_DOR_GUEST",
  wifiPassword: "MyaDorWiFi2025"
};

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'C001', name: 'Client de passage', phone: '00000000', balance: 0 },
];

export const INITIAL_PRODUCTS: Product[] = [
  // --- PETIT DÉJEUNER ---
  { id: 'PD001', name: 'OMELETTE SIMPLE', sku: 'PD-01', price: 40, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD002', name: 'OMELETTE FROMAGE', sku: 'PD-02', price: 50, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD003', name: 'OMELETTE FRMG JAMBON', sku: 'PD-03', price: 70, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD004', name: 'NIÉBÉ', sku: 'PD-04', price: 20, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD005', name: 'PETIT POIS (PD)', sku: 'PD-05', price: 20, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD006', name: 'SANDWICH (PETIT)', sku: 'PD-06', price: 50, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD007', name: 'SANDWICH (GRAND)', sku: 'PD-07', price: 80, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD008', name: 'CAFÉ TOUBA (PD)', sku: 'PD-08', price: 10, stock: 999, category: 'Petit Déjeuner' },
  { id: 'PD009', name: 'CAFÉ AU LAIT (PD)', sku: 'PD-09', price: 15, stock: 999, category: 'Petit Déjeuner' },

  // --- DÉJEUNER ---
  { id: 'DEJ01', name: 'RIZ AU POISSONS', sku: 'DEJ-01', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DEJ02', name: 'MAFÉ', sku: 'DEJ-02', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DEJ03', name: 'SOUPE KANDIA', sku: 'DEJ-03', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DEJ04', name: 'YASSA POISSON', sku: 'DEJ-04', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DEJ05', name: 'YASSA POULET / VIANDE', sku: 'DEJ-05', price: 70, stock: 999, category: 'Déjeuner' },
  { id: 'DEJ06', name: 'ATHIÉKÉ POISSON', sku: 'DEJ-06', price: 50, stock: 999, category: 'Déjeuner' },
  { id: 'DEJ07', name: 'ATHIÉKÉ POULET', sku: 'DEJ-07', price: 80, stock: 999, category: 'Déjeuner' },

  // --- DÎNER ---
  { id: 'DIN01', name: 'SOUPOU', sku: 'DIN-01', price: 80, stock: 999, category: 'Dîner' },
  { id: 'DIN02', name: 'POISSON BRAISÉ (PETIT)', sku: 'DIN-02', price: 50, stock: 999, category: 'Dîner' },
  { id: 'DIN03', name: 'POISSON BRAISÉ (GRAND)', sku: 'DIN-03', price: 80, stock: 999, category: 'Dîner' },
  { id: 'DIN04', name: 'SANDWICH DÎNER (PETIT)', sku: 'DIN-04', price: 30, stock: 999, category: 'Dîner' },
  { id: 'DIN05', name: 'SANDWICH DÎNER (GRAND)', sku: 'DIN-05', price: 50, stock: 999, category: 'Dîner' },
  { id: 'DIN06', name: 'VERMICELLE', sku: 'DIN-06', price: 50, stock: 999, category: 'Dîner' },
  { id: 'DIN07', name: 'PETIT POIS (DÎNER)', sku: 'DIN-07', price: 50, stock: 999, category: 'Dîner' },
  { id: 'DIN08', name: 'COUS COUS', sku: 'DIN-08', price: 50, stock: 999, category: 'Dîner' },

  // --- FAST FOOD & SNACK ---
  { id: 'FF001', name: 'POULET COMPLET', sku: 'FF-01', price: 400, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF002', name: 'POULET 1/2', sku: 'FF-02', price: 200, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF003', name: 'POULET 1/4', sku: 'FF-03', price: 80, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF004', name: 'PIZZA', sku: 'FF-04', price: 150, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF005', name: 'MINI PIZZA', sku: 'FF-05', price: 15, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF006', name: 'FATAYA', sku: 'FF-06', price: 10, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF007', name: 'NÉME', sku: 'FF-07', price: 15, stock: 999, category: 'Fast Food & Snack' },
  { id: 'FF008', name: 'ROUSSOL', sku: 'FF-08', price: 10, stock: 999, category: 'Fast Food & Snack' },
  { id: 'SN001', name: 'KEBAB', sku: 'SN-01', price: 50, stock: 999, category: 'Fast Food & Snack' },
  { id: 'SN002', name: 'KEBAB SPÉCIAL', sku: 'SN-02', price: 70, stock: 999, category: 'Fast Food & Snack' },
  { id: 'SN003', name: 'TACOS', sku: 'SN-03', price: 100, stock: 999, category: 'Fast Food & Snack' },
  { id: 'SN004', name: 'TACOS MIXTE', sku: 'SN-04', price: 150, stock: 999, category: 'Fast Food & Snack' },
  { id: 'SN005', name: 'KFC (6 PIÈCES)', sku: 'SN-05', price: 200, stock: 999, category: 'Fast Food & Snack' },
  { id: 'SN006', name: 'POUTINE', sku: 'SN-06', price: 100, stock: 999, category: 'Fast Food & Snack' },
  { id: 'SN007', name: 'HAMBURGER', sku: 'SN-07', price: 100, stock: 999, category: 'Fast Food & Snack' },
  { id: 'SN008', name: 'CHAWARMA', sku: 'SN-08', price: 100, stock: 999, category: 'Fast Food & Snack' },
  { id: 'SN009', name: 'SANDWICH AMÉRICAIN', sku: 'SN-09', price: 80, stock: 999, category: 'Fast Food & Snack' },

  // --- CRÊPES ---
  { id: 'CR001', name: 'CRÊPE SIMPLE', sku: 'CR-01', price: 40, stock: 999, category: 'Crêpes' },
  { id: 'CR002', name: 'CRÊPE MIEL', sku: 'CR-02', price: 50, stock: 999, category: 'Crêpes' },
  { id: 'CR003', name: 'CRÊPE MIEL BANANE', sku: 'CR-03', price: 70, stock: 999, category: 'Crêpes' },
  { id: 'CR004', name: 'CRÊPE CHOCOLAT', sku: 'CR-04', price: 80, stock: 999, category: 'Crêpes' },
  { id: 'CR005', name: 'CRÊPE CHOCOLAT BANANE', sku: 'CR-05', price: 90, stock: 999, category: 'Crêpes' },
  { id: 'CR006', name: 'CRÊPE NUTELLA', sku: 'CR-06', price: 100, stock: 999, category: 'Crêpes' },
  { id: 'CR007', name: 'CRÊPE NUTELLA BANANE', sku: 'CR-07', price: 120, stock: 999, category: 'Crêpes' },
  { id: 'CR008', name: 'CRÊPE FROMAGE (SALÉE)', sku: 'CR-08', price: 70, stock: 999, category: 'Crêpes' },
  { id: 'CR009', name: 'CRÊPE FROMAGE JAMBON (SALÉE)', sku: 'CR-09', price: 120, stock: 999, category: 'Crêpes' },
  { id: 'CR010', name: 'CRÊPE POULET FROMAGE (SALÉE)', sku: 'CR-10', price: 150, stock: 999, category: 'Crêpes' },
  { id: 'CR011', name: 'CRÊPE VIANDE FRMG (SALÉE)', sku: 'CR-11', price: 160, stock: 999, category: 'Crêpes' },

  // --- GAUFRES ---
  { id: 'GA001', name: 'GAUFRE SIMPLE', sku: 'GA-01', price: 40, stock: 999, category: 'Gaufres' },
  { id: 'GA002', name: 'GAUFRE MIEL', sku: 'GA-02', price: 50, stock: 999, category: 'Gaufres' },
  { id: 'GA003', name: 'GAUFRE MIEL BANANE', sku: 'GA-03', price: 70, stock: 999, category: 'Gaufres' },
  { id: 'GA004', name: 'GAUFRE CHOCOLAT', sku: 'GA-04', price: 80, stock: 999, category: 'Gaufres' },
  { id: 'GA005', name: 'GAUFRE CHOCOLAT BANANE', sku: 'GA-05', price: 90, stock: 999, category: 'Gaufres' },
  { id: 'GA006', name: 'GAUFRE NUTELLA', sku: 'GA-06', price: 100, stock: 999, category: 'Gaufres' },
  { id: 'GA007', name: 'GAUFRE NUTELLA BANANE', sku: 'GA-07', price: 120, stock: 999, category: 'Gaufres' },

  // --- BOISSONS ---
  { id: 'BD001', name: 'SODA (BOUTEILLE/CAN)', sku: 'BD-01', price: 20, stock: 999, category: 'Boissons' },
  { id: 'BD002', name: 'JUS (BOUTEILLE/CAN)', sku: 'BD-02', price: 30, stock: 999, category: 'Boissons' },
  { id: 'BD003', name: 'MOJITO', sku: 'BD-03', price: 50, stock: 999, category: 'Boissons' },
  { id: 'BD004', name: 'EAU PM', sku: 'BD-04', price: 10, stock: 999, category: 'Boissons' },
  { id: 'BD005', name: 'CAFÉ TOUBA (CHAUD)', sku: 'BD-05', price: 10, stock: 999, category: 'Boissons' },
  { id: 'BD006', name: 'EXPRESSO', sku: 'BD-06', price: 50, stock: 999, category: 'Boissons' },
  { id: 'BD007', name: 'NOUS NOUS', sku: 'BD-07', price: 40, stock: 999, category: 'Boissons' },
  { id: 'BD008', name: 'CAPUCCINO', sku: 'BD-08', price: 70, stock: 999, category: 'Boissons' },
  { id: 'BD009', name: 'ICE COFFEE', sku: 'BD-09', price: 70, stock: 999, category: 'Boissons' },
  { id: 'BD010', name: 'CHOCOLAT CHAUD', sku: 'BD-10', price: 100, stock: 999, category: 'Boissons' },
  { id: 'BD011', name: 'THÉ', sku: 'BD-11', price: 70, stock: 999, category: 'Boissons' },

  // --- DESSERTS ---
  { id: 'DS001', name: 'MILK SHAKE', sku: 'DS-01', price: 100, stock: 999, category: 'Desserts' },
  { id: 'DS002', name: 'SALADE DE FRUITS', sku: 'DS-02', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS003', name: 'BISCUIT / CACKE', sku: 'DS-03', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS004', name: 'JUS BOUYE', sku: 'DS-04', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS005', name: 'JUS BISAP', sku: 'DS-05', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS006', name: 'JUS GINGEMBRE', sku: 'DS-06', price: 30, stock: 999, category: 'Desserts' },
  { id: 'DS007', name: 'THIAKRY / NGALAKH', sku: 'DS-07', price: 30, stock: 999, category: 'Desserts' },

  // --- MENUS & FORMULES ---
  { id: 'MN001', name: 'POULET TERANGA PLUS', sku: 'MN-01', price: 550, stock: 999, category: 'Menus & Formules' },
  { id: 'MN002', name: 'FORMULE EXPRESS', sku: 'MN-02', price: 250, stock: 999, category: 'Menus & Formules' },
  { id: 'MN003', name: 'MENU TERANGA', sku: 'MN-03', price: 200, stock: 999, category: 'Menus & Formules' },
  { id: 'MN004', name: 'MENU GONAL', sku: 'MN-04', price: 250, stock: 999, category: 'Menus & Formules' },
  { id: 'MN005', name: 'MENU COUCHANT', sku: 'MN-05', price: 320, stock: 999, category: 'Menus & Formules' },
  { id: 'MN006', name: 'MENU BONJOUR', sku: 'MN-06', price: 200, stock: 999, category: 'Menus & Formules' },

  // --- SUPPLÉMENTS ---
  { id: 'SP001', name: 'FRITES (PORTION)', sku: 'SP-01', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP002', name: 'CUISSE POULET', sku: 'SP-02', price: 50, stock: 999, category: 'Suppléments' },
  { id: 'SP003', name: 'KFC LA PIÈCE', sku: 'SP-03', price: 40, stock: 999, category: 'Suppléments' },
  { id: 'SP004', name: 'BANANE (SUPP)', sku: 'SP-04', price: 20, stock: 999, category: 'Suppléments' },
  { id: 'SP005', name: 'MIEL (SUPP)', sku: 'SP-05', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP006', name: 'FROMAGE (SUPP)', sku: 'SP-06', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP007', name: 'JAMBON (SUPP)', sku: 'SP-07', price: 30, stock: 999, category: 'Suppléments' },
  { id: 'SP008', name: 'CHOCOLAT (SUPP)', sku: 'SP-08', price: 20, stock: 999, category: 'Suppléments' },
  { id: 'SP009', name: 'NUTELLA (SUPP)', sku: 'SP-09', price: 30, stock: 999, category: 'Suppléments' }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'E001', name: 'Bamba Ndao', role: 'Administrateur', department: 'Direction', salary: 0, status: 'active', joinDate: '2025-01-01', isClockedIn: false },
  { id: 'E002', name: 'Amy Ndaw', role: 'Caissière', department: 'Salle', salary: 0, status: 'active', joinDate: '2025-01-01', isClockedIn: false },
];

export const INITIAL_LEADS: Lead[] = [
  { id: 'L001', title: 'Contrat Cantine', contact: 'Ecole Primaire A', stage: 'new', revenue: 5000, priority: 'high' }
];

export const INITIAL_TASKS: Task[] = [
  { id: 'T001', title: 'Réviser Menu', description: 'Ajouter des plats végétariens', stage: 'todo', priority: 'medium', deadline: '2025-02-15' }
];

export const POS_LOCATIONS = {
  categories: [
    { id: 'tables', name: 'Salles', icon: 'Utensils', items: ['Table 1', 'Table 2', 'Table 3', 'Table 4'] },
    { id: 'stools', name: 'Tabourets', icon: 'Armchair', items: ['Tabouret 1', 'Tabouret 2', 'Tabouret 3', 'Tabouret 4'] },
    { id: 'takeaway', name: 'À Emporter', icon: 'Package', items: ['Emporter 1', 'Emporter 2'] },
    { id: 'logistics', name: 'Livraison & Parking', icon: 'Truck', items: ['Livraison 1', 'Voiture 1'] }
  ],
  default: 'Comptoir'
};
