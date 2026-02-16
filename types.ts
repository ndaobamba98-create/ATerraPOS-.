
export type Language = 'fr' | 'en' | 'ar';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  initials: string;
  color: string;
  password?: string;
}

export type UserRole = 'admin' | 'cashier' | 'manager' | 'waiter';

export type ViewType = 
  | 'dashboard' | 'pos' | 'sales' | 'inventory' | 'expenses' | 'hr' 
  | 'attendances' | 'settings' | 'invoicing' | 'reports' | 'customers' 
  | 'preparation' | 'manage_inventory' | 'manage_session_closing' | 'manage_sales' | 'manage_hr' | 'manage_customers';

export type AppTheme = 'purple' | 'emerald' | 'blue' | 'rose' | 'amber' | 'slate';

export interface POSLocationCategory {
  id: string;
  name: string;
  icon: string;
  items: string[];
}

export interface POSLocations {
  categories: POSLocationCategory[];
  default: string;
}

export interface ERPConfig {
  companyName: string;
  companySlogan: string;
  companyLogo?: string;
  email: string;
  phone: string;
  address: string;
  registrationNumber: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  dateFormat: string;
  taxRate: number;
  receiptFooter: string;
  autoPrintReceipt: boolean;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  theme: AppTheme;
  categories: string[];
  language: Language;
  showLogoOnInvoice: boolean;
  showSloganOnInvoice: boolean;
  showAddressOnInvoice: boolean;
  showPhoneOnInvoice: boolean;
  showEmailOnInvoice: boolean;
  showRegNumberOnInvoice: boolean;
  showQrCodeOnInvoice: boolean;
  showCashierOnInvoice: boolean;
  wifiName?: string;
  wifiPassword?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number;
  email?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  lowStockThreshold?: number;
  image?: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export type PaymentMethod = 'Bankily' | 'Masrvi' | 'Especes' | 'Sedad' | 'Bimbank' | 'Carte' | 'Mobile' | 'Compte';

export interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
}

export interface EventDetails {
  date: string;
  type: string;
  location: string;
  guests: number;
  notes?: string;
}

export interface SaleOrder {
  id: string;
  customer: string;
  customerId?: string;
  cashierId?: string;
  date: string;
  openedAt?: string;
  total: number;
  status: 'draft' | 'confirmed' | 'delivered' | 'refunded' | 'quotation';
  preparationStatus?: 'pending' | 'preparing' | 'ready' | 'served';
  items?: SaleItem[];
  invoiceStatus?: 'draft' | 'posted' | 'paid' | 'cancelled' | 'refunded';
  paymentMethod?: PaymentMethod;
  amountReceived?: number;
  change?: number;
  orderLocation?: string;
  payments?: PaymentEntry[];
  eventDetails?: EventDetails; // Nouveaux champs pour les réservations
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  paymentMethod: PaymentMethod;
  status: 'paid' | 'pending';
  attachments?: Attachment[];
}

export type ContractType = 'CDI' | 'CDD' | 'Stage' | 'Interim';

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  salary: number;
  status: 'active' | 'absent' | 'on_leave';
  joinDate: string;
  isClockedIn: boolean;
  photo?: string;
  phone?: string;
  email?: string;
  bankAccount?: string;
  contractType?: ContractType;
  contractEndDate?: string;
  trialPeriodMonths?: number;
  attachments?: Attachment[];
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  checkIn: string;
  date: string;
}

export interface CashSession {
  id: string;
  openedAt: string;
  closedAt?: string;
  openingBalance: number;
  expectedBalance: number;
  closingBalance?: number;
  difference?: number;
  status: 'open' | 'closed';
  cashierName: string;
  cashierId: string;
  totalCashSales: number;
}

export interface Lead {
  id: string;
  title: string;
  contact: string;
  stage: 'new' | 'qualified' | 'proposition' | 'won' | 'lost';
  revenue: number;
  priority: 'low' | 'medium' | 'high';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  stage: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  assignedTo?: string;
}

export interface RolePermission {
  role: UserRole;
  permissions: ViewType[];
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'vacation' | 'sick' | 'other';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netPay: number;
  date: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email?: string;
  category: string;
}

export interface Purchase {
  id: string;
  date: string;
  supplierId: string;
  supplierName: string;
  total: number;
  status: 'draft' | 'confirmed' | 'received' | 'cancelled';
  items: SaleItem[];
}
