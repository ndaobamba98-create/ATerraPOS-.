
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, BarChart3, Settings as SettingsIcon, Sun, Moon, IdCard, LogOut, Clock as ClockIcon, FileText, Search, ArrowRight, Users, ChevronLeft, ChevronRight, UserPlus, LogIn, Key, ShieldCheck, ChevronDown, ArrowRightLeft, Bell, X, Check, Trash2, BellOff, Info, AlertTriangle, CheckCircle, Maximize, Minimize, Calendar as CalendarIcon, Shield, UtensilsCrossed, ChefHat, Wifi, Sparkles, Wallet, Trash, Clock, Command, ArrowUpRight, Coffee, UserCircle2, Receipt
} from 'lucide-react';
import { ViewType, Product, SaleOrder, Employee, ERPConfig, AttendanceRecord, User, CashSession, Expense, Customer, UserRole, AppNotification, RolePermission, POSLocations } from './types';
import { INITIAL_PRODUCTS, INITIAL_EMPLOYEES, INITIAL_CONFIG, APP_USERS, INITIAL_CUSTOMERS, POS_LOCATIONS as INITIAL_LOCATIONS } from './constants';
import { translations, TranslationKey } from './translations';
import Dashboard from './components/Dashboard';
import Invoicing from './components/Invoicing';
import Sales from './components/Sales';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import POS from './components/POS';
import Settings from './components/Settings';
import HR from './components/HR';
import Attendances from './components/Attendances';
import Customers from './components/Customers';
import Kitchen from './components/Kitchen';
import Expenses from './components/Expenses';

const loadStored = <T extends unknown>(key: string, initial: T): T => {
  const saved = localStorage.getItem(key);
  if (!saved) return initial;
  try { return JSON.parse(saved); } catch { return initial; }
};

const DEFAULT_PERMISSIONS: RolePermission[] = [
  { role: 'admin', permissions: ['dashboard', 'pos', 'preparation', 'sales', 'inventory', 'expenses', 'invoicing', 'customers', 'reports', 'attendances', 'hr', 'settings', 'manage_inventory', 'manage_session_closing', 'manage_sales', 'manage_hr', 'manage_customers'] },
  { role: 'manager', permissions: ['dashboard', 'pos', 'preparation', 'sales', 'inventory', 'expenses', 'customers', 'reports', 'attendances', 'manage_inventory'] },
  { role: 'cashier', permissions: ['dashboard', 'pos', 'preparation', 'attendances'] },
  { role: 'waiter', permissions: ['pos', 'preparation', 'attendances'] }
];

const PROFILE_COLORS = [
  'from-slate-700 to-slate-900',
  'from-emerald-600 to-emerald-800',
  'from-purple-600 to-purple-800',
  'from-blue-600 to-blue-800',
  'from-rose-600 to-rose-800',
  'from-amber-600 to-amber-800'
];

export const AppLogo = ({ className = "w-14 h-14", iconOnly = false, light = false, customLogo = undefined }) => (
  <div className={`flex items-center ${iconOnly ? 'justify-center' : 'space-x-4'} ${className}`}>
    <div className="relative group shrink-0">
      <div className={`relative w-12 h-12 ${light ? 'bg-white' : 'bg-slate-900'} rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden transform group-hover:rotate-6 transition-transform duration-500`}>
        {customLogo ? (
          <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
        ) : (
          <svg viewBox="0 0 100 100" className="w-9/12 h-9/12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="50%" y="55%" dominantBaseline="central" textAnchor="middle" fill={light ? "#0f172a" : "white"} fontSize="38" fontWeight="900" letterSpacing="-2">
              TP+
            </text>
            <circle cx="20" cy="20" r="10" className="fill-purple-500 opacity-80" />
          </svg>
        )}
      </div>
    </div>
    {!iconOnly && (
      <div className="flex flex-col">
        <span className={`${light ? 'text-slate-900' : 'text-white'} font-black text-xl leading-none uppercase tracking-tighter`}>TerraPOS+</span>
        <span className="text-purple-500 font-black text-[10px] uppercase tracking-[0.4em] mt-0.5">SYSTEM</span>
      </div>
    )}
  </div>
);

const WelcomeSplash = ({ user, theme }: { user: User, theme: string }) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-slate-950">
      <div className="absolute top-1/4 left-1/4 w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }}></div>
    </div>
    <div className="relative z-10 text-center space-y-8 animate-welcomeScale">
       <div className={`w-32 h-32 mx-auto rounded-[3rem] bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-4xl font-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-white/20 relative`}>
          {user.initials}
          <div className="absolute -top-2 -right-2 bg-white text-slate-900 p-2 rounded-2xl shadow-xl animate-bounce">
            <Sparkles size={20} className="text-purple-600" />
          </div>
       </div>
       <div className="space-y-4">
          <h1 className="text-6xl font-black text-white uppercase tracking-tighter">
            BIENVENUE <span className="text-shimmer italic">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-400 font-black uppercase text-xs tracking-[0.5em]">Initialisation TerraPOS+</p>
       </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [isEntering, setIsEntering] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [signupName, setSignupName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('waiter');

  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => loadStored('darkMode', false));

  const [allUsers, setAllUsers] = useState<User[]>(() => loadStored('allUsers', APP_USERS));
  const [config, setConfig] = useState<ERPConfig>(() => loadStored('config', INITIAL_CONFIG));
  const [posLocations, setPosLocations] = useState<POSLocations>(() => loadStored('pos_locations', INITIAL_LOCATIONS));
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(() => loadStored('rolePermissions', DEFAULT_PERMISSIONS));
  const [products, setProducts] = useState<Product[]>(() => loadStored('products', INITIAL_PRODUCTS));
  const [customers, setCustomers] = useState<Customer[]>(() => loadStored('customers', INITIAL_CUSTOMERS));
  const [sales, setSales] = useState<SaleOrder[]>(() => loadStored('sales', []));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadStored('expenses', []));
  const [sessionHistory, setSessionHistory] = useState<CashSession[]>(() => loadStored('sessionHistory', []));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => loadStored('attendance', []));
  const [employees, setEmployees] = useState<Employee[]>(() => loadStored('employees', INITIAL_EMPLOYEES));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadStored('notifications', []));
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(() => loadStored('currentUser', null));

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const userPermissions = useMemo(() => {
    if (!currentUser) return [];
    const rolePerms = rolePermissions.find(rp => rp.role === currentUser.role);
    return rolePerms ? rolePerms.permissions : [];
  }, [currentUser, rolePermissions]);

  const t = useCallback((key: TranslationKey): string => {
    return (translations[config.language || 'fr'] as any)[key] || key;
  }, [config.language]);

  // --- RECHERCHE GLOBALE LOGIQUE ---
  const globalResults = useMemo(() => {
    if (globalSearchTerm.length < 2) return null;
    const term = globalSearchTerm.toLowerCase();
    
    return {
      products: products.filter(p => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || p.category.toLowerCase().includes(term)).slice(0, 5),
      customers: customers.filter(c => c.name.toLowerCase().includes(term) || c.phone.includes(term)).slice(0, 5),
      sales: sales.filter(s => s.id.toLowerCase().includes(term) || s.customer.toLowerCase().includes(term)).slice(0, 5),
      actions: sidebarItems.filter(item => item.label.toLowerCase().includes(term)).slice(0, 3)
    };
  }, [globalSearchTerm, products, customers, sales]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sidebarItems = useMemo(() => {
    const allItems = [
      { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
      { id: 'pos', icon: UtensilsCrossed, label: currentUser?.role === 'waiter' ? 'Prise de Commande' : t('pos') },
      { id: 'preparation', icon: ChefHat, label: 'Suivi Cuisine' },
      { id: 'sales', icon: ShoppingCart, label: t('sales') },
      { id: 'inventory', icon: Package, label: t('inventory') },
      { id: 'expenses', icon: Wallet, label: t('expenses') },
      { id: 'invoicing', icon: FileText, label: t('invoicing') },
      { id: 'customers', icon: Users, label: t('customer') + 's' },
      { id: 'reports', icon: BarChart3, label: t('reports') },
      { id: 'attendances', icon: ClockIcon, label: t('attendances') },
      { id: 'hr', icon: IdCard, label: t('hr') },
      { id: 'settings', icon: SettingsIcon, label: t('settings') },
    ];
    return allItems.filter(item => userPermissions.includes(item.id as ViewType));
  }, [userPermissions, currentUser, t]);

  useEffect(() => {
    if (!isLocked && !userPermissions.includes(activeView)) {
      setActiveView(currentUser?.role === 'waiter' ? 'pos' : 'dashboard');
    }
  }, [userPermissions, activeView, isLocked, currentUser]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutsideNotif = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) document.addEventListener("mousedown", handleClickOutsideNotif);
    return () => document.removeEventListener("mousedown", handleClickOutsideNotif);
  }, [isNotifOpen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  useEffect(() => { localStorage.setItem('allUsers', JSON.stringify(allUsers)); }, [allUsers]);
  useEffect(() => { localStorage.setItem('config', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('pos_locations', JSON.stringify(posLocations)); }, [posLocations]);
  useEffect(() => { localStorage.setItem('rolePermissions', JSON.stringify(rolePermissions)); }, [rolePermissions]);
  useEffect(() => { localStorage.setItem('products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory)); }, [sessionHistory]);
  useEffect(() => { localStorage.setItem('attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('darkMode', JSON.stringify(darkMode)); }, [darkMode]);
  useEffect(() => { localStorage.setItem('notifications', JSON.stringify(notifications)); }, [notifications]);

  const notifyUser = useCallback((title: string, message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const newNotif: AppNotification = { id: `notif-${Date.now()}`, title, message, timestamp: new Date().toISOString(), type: type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info', read: false };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markAllAsRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })));
  const clearAllNotifications = () => { setNotifications([]); setIsNotifOpen(false); };
  const toggleRead = (id: string) => setNotifications(notifications.map(n => n.id === id ? { ...n, read: !n.read } : n));

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsEntering(true);
    if (user.role === 'waiter') setActiveView('pos');
    setTimeout(() => {
      setIsEntering(false);
      setIsLocked(false);
      setLoginIdentifier('');
      setPasswordInput('');
    }, 2800);
  };

  const handleSaleComplete = (s: Partial<SaleOrder>) => {
    if (s.status === 'confirmed' && !s.id?.startsWith(config.invoicePrefix)) {
      const seqStr = String(config.nextInvoiceNumber).padStart(4, '0');
      const newId = `${config.invoicePrefix}${seqStr}`;
      const completeSale = { ...s, id: newId } as SaleOrder;
      setSales([completeSale, ...sales]);
      setConfig({ ...config, nextInvoiceNumber: config.nextInvoiceNumber + 1 });
      if (currentUser?.role === 'admin' || currentUser?.role === 'cashier') {
        notifyUser("Facture émise", `Commande ${newId} enregistrée.`, 'success');
      }
    } else {
      const finalSale = { ...s, id: s.id || `TMP-${Date.now()}` } as SaleOrder;
      const exists = sales.find(prev => prev.id === finalSale.id);
      if (exists) {
        setSales(sales.map(prev => prev.id === finalSale.id ? finalSale : prev));
      } else {
        setSales([finalSale, ...sales]);
      }
    }
  };

  const handleRefundSale = (id: string) => {
    setSales(prev => prev.map(s => s.id === id ? { ...s, status: 'refunded', invoiceStatus: 'refunded' } as SaleOrder : s));
    notifyUser("Opération annulée", `La commande #${id.slice(-6)} a été annulée.`, "warning");
  };

  const handleDeleteDraft = (id: string) => {
    setSales(prev => prev.filter(s => s.id !== id));
    notifyUser("Brouillon supprimé", "La table a été libérée.", "info");
  };

  const logoutAction = () => {
    setIsLocked(true);
    setCurrentUser(null);
    setIsNotifOpen(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };

  const currentSession = useMemo(() => sessionHistory.find(s => s.status === 'open' && (currentUser?.role === 'admin' ? true : s.cashierId === currentUser?.id || currentUser?.role === 'waiter')), [sessionHistory, currentUser]);

  const renderContent = () => {
    const commonProps = { notify: notifyUser, userPermissions: userPermissions, t, currentUser: currentUser!, allUsers };
    switch (activeView) {
      case 'dashboard': return <Dashboard leads={[]} sales={sales} expenses={expenses} userRole={currentUser!.role} config={config} products={products} t={t} onNavigate={setActiveView} />;
      case 'pos': return <POS products={products} customers={customers} onUpdateCustomers={setCustomers} sales={sales} onSaleComplete={handleSaleComplete} onRefundSale={handleRefundSale} onDeleteDraft={handleDeleteDraft} config={config} session={currentSession || null} onOpenSession={(bal, cid) => setSessionHistory([{id:`S-${Date.now()}`, openedAt: new Date().toISOString(), openingBalance: bal, expectedBalance: bal, totalCashSales: 0, status: 'open', cashierName: currentUser!.name, cashierId: cid} as CashSession, ...sessionHistory])} onCloseSession={bal => setSessionHistory(sessionHistory.map(s => s.id === currentSession?.id ? {...s, status: 'closed', closingBalance: bal} as CashSession : s))} userRole={currentUser!.role} userPermissions={commonProps.userPermissions} onUpdateSales={setSales} posLocations={posLocations} onUpdateLocations={setPosLocations} {...commonProps} />;
      case 'preparation': return <Kitchen sales={sales} onUpdateSales={setSales} config={config} notify={notifyUser} />;
      case 'inventory': return <Inventory products={products} onUpdate={setProducts} config={config} userRole={currentUser!.role} t={t} userPermissions={commonProps.userPermissions} />;
      case 'expenses': return <Expenses expenses={expenses} setExpenses={setExpenses} purchases={[]} onAddPurchase={()=>{}} onDeletePurchase={()=>{}} suppliers={[]} setSuppliers={()=>{}} products={products} config={config} userRole={currentUser!.role} {...commonProps} />;
      case 'sales': return <Sales sales={sales} expenses={expenses} onUpdate={setSales} onRefundSale={handleRefundSale} config={config} products={products} userRole={currentUser!.role} currentUser={currentUser!} onAddSale={handleSaleComplete} {...commonProps} />;
      case 'invoicing': return <Invoicing sales={sales} config={config} onUpdate={setSales} products={products} userRole={currentUser!.role} onAddSale={() => {}} allUsers={allUsers} {...commonProps} />;
      case 'reports': return <Reports sales={sales} expenses={expenses} config={config} products={products} t={t} notify={notifyUser} sessions={sessionHistory} />;
      case 'hr': return <HR employees={employees} onUpdate={setEmployees} attendance={attendance} onUpdateAttendance={setAttendance} config={config} expenses={expenses} onAddExpense={(exp) => setExpenses([exp, ...expenses])} {...commonProps} />;
      case 'attendances': return <Attendances employees={employees} onUpdateEmployees={setEmployees} attendance={attendance} onUpdateAttendance={setAttendance} currentUser={currentUser!} notify={notifyUser} />;
      case 'customers': return <Customers customers={customers} onUpdate={setCustomers} config={config} userRole={currentUser!.role} t={t} userPermissions={commonProps.userPermissions} notify={notifyUser} />;
      case 'settings': return <Settings products={products} onUpdateProducts={setProducts} config={config} onUpdateConfig={setConfig} posLocations={posLocations} onUpdateLocations={setPosLocations} rolePermissions={rolePermissions} onUpdatePermissions={setRolePermissions} currentUser={currentUser!} allUsers={allUsers} onUpdateUsers={setAllUsers} userPermissions={commonProps.userPermissions} t={t} notify={notifyUser} />;
      default: return <Dashboard leads={[]} sales={sales} expenses={expenses} userRole={currentUser!.role} config={config} products={products} t={t} onNavigate={setActiveView} />;
    }
  };

  if (isEntering && currentUser) return <WelcomeSplash user={currentUser} theme={config.theme} />;

  if (isLocked) {
     return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
        </div>
        <div className="mb-8 text-center animate-fadeIn relative z-10">
          <AppLogo className="mx-auto mb-4 scale-[1.3]" iconOnly />
          <h1 className="text-3xl font-black text-white uppercase mt-2 tracking-tighter">TerraPOS+</h1>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.4em] mt-1">Gestion Unifiée MYA D'OR</p>
        </div>
        <div className="w-full max-w-lg px-6 relative z-10">
          <div className={`bg-slate-900/40 backdrop-blur-3xl p-8 md:p-12 rounded-[3.5rem] border-2 border-white/5 shadow-2xl animate-scaleIn ${loginError ? 'animate-shake' : ''}`}>
            {authMode === 'login' ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                const user = allUsers.find(u => 
                  (u.name.toLowerCase() === loginIdentifier.toLowerCase() || u.id === loginIdentifier) && 
                  u.password === passwordInput
                );
                if (user) {
                  handleLoginSuccess(user);
                } else {
                  setLoginError(true);
                  setTimeout(() => setLoginError(false), 500);
                }
              }} className="space-y-8">
                <div className="text-center space-y-2 mb-4">
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Accès Session</h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Connectez-vous pour commencer</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center"><Users size={12} className="mr-2" /> IDENTIFIANT</label>
                    <input 
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={e => setLoginIdentifier(e.target.value)}
                      className="w-full bg-black/40 border-2 border-white/5 focus:border-purple-500 rounded-2xl py-4 px-6 text-white font-bold outline-none transition-all uppercase placeholder:text-slate-700" 
                      placeholder="NOM D'UTILISATEUR"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center"><Key size={12} className="mr-2" /> MOT DE PASSE</label>
                    <input 
                      type="password" 
                      required
                      value={passwordInput} 
                      onChange={e => setPasswordInput(e.target.value)} 
                      className="w-full bg-black/40 border-2 border-white/5 focus:border-purple-500 rounded-2xl py-4 px-6 text-white font-black tracking-[0.5em] outline-none transition-all text-center placeholder:tracking-normal placeholder:text-slate-700" 
                      placeholder="••••" 
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-purple-700 transition-all flex items-center justify-center space-x-3">
                  <span>Ouvrir la session</span>
                  <ArrowRight size={18} />
                </button>
                <div className="text-center pt-4">
                  <button type="button" onClick={() => setAuthMode('signup')} className="text-[10px] font-black uppercase text-slate-500 hover:text-purple-400 transition-colors flex items-center justify-center mx-auto">
                    <UserPlus size={14} className="mr-2"/> Créer un IDENTIFIANT
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!signupName || !signupPassword) return;
                const initials = signupName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                const newUser: User = {
                  id: `U-${Date.now()}`,
                  name: signupName,
                  role: signupRole,
                  password: signupPassword,
                  color: PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)],
                  initials
                };
                setAllUsers([...allUsers, newUser]);
                handleLoginSuccess(newUser);
                setSignupName('');
                setSignupPassword('');
                notifyUser("Compte créé", `Bienvenue ${newUser.name} !`, "success");
              }} className="space-y-6">
                <div className="text-center space-y-2 mb-4">
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Inscription</h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Nouveau collaborateur</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">IDENTIFIANT</label>
                    <input required value={signupName} onChange={e => setSignupName(e.target.value)} className="w-full bg-black/40 border-2 border-transparent focus:border-emerald-500 rounded-2xl py-4 px-6 text-white font-bold outline-none transition-all uppercase" placeholder="IDENTIFIANT" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">MOT DE PASSE</label>
                    <input type="password" required value={signupPassword} onChange={e => setSignupPassword(e.target.value)} className="w-full bg-black/40 border-2 border-transparent focus:border-emerald-500 rounded-2xl py-4 px-6 text-white font-black tracking-[0.5em] outline-none transition-all" placeholder="••••" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">ACCÈS</label>
                    <div className="grid grid-cols-2 gap-3">
                       <button type="button" onClick={() => setSignupRole('waiter')} className={`p-4 rounded-2xl border-2 font-black uppercase text-[10px] transition-all ${signupRole === 'waiter' ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-black/20 border-white/5 text-slate-500'}`}>Serveuse</button>
                       <button type="button" onClick={() => setSignupRole('cashier')} className={`p-4 rounded-2xl border-2 font-black uppercase text-[10px] transition-all ${signupRole === 'cashier' ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-black/20 border-white/5 text-slate-500'}`}>Caissier</button>
                       <button type="button" onClick={() => setSignupRole('manager')} className={`p-4 rounded-2xl border-2 font-black uppercase text-[10px] transition-all ${signupRole === 'manager' ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-black/20 border-white/5 text-slate-500'}`}>Manager</button>
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center space-x-3 mt-4">
                  <span>Enregistrer</span>
                  <ShieldCheck size={18} />
                </button>
                <div className="text-center pt-2">
                  <button type="button" onClick={() => setAuthMode('login')} className="text-[10px] font-black uppercase text-slate-500 hover:text-emerald-400 transition-colors flex items-center justify-center mx-auto">
                    <LogIn size={14} className="mr-2"/> Se connecter
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = currentTime.toLocaleDateString(config.language === 'ar' ? 'ar-SA' : config.language === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const formattedTime = currentTime.toLocaleTimeString(config.language === 'ar' ? 'ar-SA' : config.language === 'fr' ? 'fr-FR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={`flex h-screen overflow-hidden theme-${config.theme} ${darkMode ? 'dark text-slate-100' : 'text-slate-900'}`}>
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-slate-900 transition-all duration-500 ease-in-out flex flex-col z-20 shadow-2xl relative animate-entrySidebar`}>
        <div className="p-6 h-28 flex items-center justify-between border-b border-slate-800">
          <AppLogo className={isSidebarOpen ? "w-full" : "w-10 h-10"} iconOnly={!isSidebarOpen} customLogo={config.companyLogo} />
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="absolute -right-3 top-32 w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-xl z-30 hover:scale-110 active:scale-90 transition-all border-4 border-slate-950">
          {isSidebarOpen ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
        </button>
        <nav className="flex-1 mt-6 space-y-1 px-3 overflow-y-auto scrollbar-hide">
          {sidebarItems.map((item, idx) => (
            <button key={item.id} onClick={() => setActiveView(item.id as ViewType)} className={`w-full flex items-center p-4 rounded-2xl transition-all animate-fadeIn ${activeView === item.id ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon size={22} className={!isSidebarOpen ? 'mx-auto' : ''} />
              {isSidebarOpen && <span className="ml-4 font-bold text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
           <button onClick={logoutAction} className={`w-full flex items-center p-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all font-bold text-sm ${!isSidebarOpen ? 'justify-center' : ''}`}>
             <LogOut size={20} className={isSidebarOpen ? "mr-3" : ""} /> {isSidebarOpen && 'Déconnexion'}
           </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 relative">
        <header className="h-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-10 animate-entryHeader">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-800/50 px-5 py-2.5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-inner group transition-all hover:bg-white dark:hover:bg-slate-800 shrink-0">
               <div className="p-2 bg-purple-600 text-white rounded-xl shadow-lg animate-pulse-subtle">
                  <Clock size={18} />
               </div>
               <div className="flex flex-col">
                  <span className="text-lg font-black text-slate-800 dark:text-white leading-none tracking-tight">{formattedTime}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{formattedDate}</span>
               </div>
            </div>
            
            <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 shrink-0"></div>

            <div className="flex flex-col shrink-0">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white leading-none">{config.companyName}</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{config.companySlogan}</span>
            </div>
          </div>

          {/* RECHERCHE GLOBALE AVEC OVERLAY DE RÉSULTATS */}
          <div className="flex-1 max-w-xl mx-8 relative group hidden md:block" ref={searchContainerRef}>
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              value={globalSearchTerm}
              onFocus={() => setShowSearchResults(true)}
              onChange={(e) => {
                setGlobalSearchTerm(e.target.value);
                setShowSearchResults(true);
              }}
              placeholder="Recherche (Produit, Client, Facture...)"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] py-3.5 pl-14 pr-12 text-xs font-bold outline-none transition-all focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500"
            />
            
            {showSearchResults && globalResults && (
              <div className="absolute top-full left-0 w-full mt-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] z-[200] overflow-hidden animate-scaleIn origin-top">
                <div className="max-h-[550px] overflow-y-auto p-4 scrollbar-hide">
                  
                  {/* SECTION PRODUITS */}
                  {globalResults.products.length > 0 && (
                    <div className="mb-6">
                      <p className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center"><Coffee size={12} className="mr-2"/> Produits & Menu</p>
                      <div className="space-y-1">
                        {globalResults.products.map(p => (
                          <button key={p.id} onClick={() => { setActiveView('inventory'); setShowSearchResults(false); }} className="w-full px-6 py-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl flex items-center justify-between group transition-all">
                             <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center font-black">{p.name[0]}</div>
                                <div className="text-left">
                                   <p className="text-xs font-black uppercase text-slate-800 dark:text-white group-hover:text-purple-600">{p.name}</p>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase">{p.category} • SKU: {p.sku}</p>
                                </div>
                             </div>
                             <span className="text-xs font-black text-slate-900 dark:text-white">{p.price} {config.currencySymbol}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECTION CLIENTS */}
                  {globalResults.customers.length > 0 && (
                    <div className="mb-6">
                      <p className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center"><UserCircle2 size={12} className="mr-2"/> Clients</p>
                      <div className="space-y-1">
                        {globalResults.customers.map(c => (
                          <button key={c.id} onClick={() => { setActiveView('customers'); setShowSearchResults(false); }} className="w-full px-6 py-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl flex items-center justify-between group transition-all">
                             <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center font-black">{c.name[0]}</div>
                                <div className="text-left">
                                   <p className="text-xs font-black uppercase text-slate-800 dark:text-white group-hover:text-emerald-600">{c.name}</p>
                                   <p className="text-[9px] font-bold text-slate-400">{c.phone}</p>
                                </div>
                             </div>
                             <div className="flex flex-col items-end">
                                <span className={`text-[10px] font-black ${c.balance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{c.balance} {config.currencySymbol}</span>
                                <p className="text-[7px] font-black text-slate-300 uppercase">Solde</p>
                             </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECTION VENTES / FACTURES */}
                  {globalResults.sales.length > 0 && (
                    <div className="mb-6">
                      <p className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center"><Receipt size={12} className="mr-2"/> Factures</p>
                      <div className="space-y-1">
                        {globalResults.sales.map(s => (
                          <button key={s.id} onClick={() => { setActiveView('invoicing'); setShowSearchResults(false); }} className="w-full px-6 py-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl flex items-center justify-between group transition-all">
                             <div className="flex items-center space-x-4">
                                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500"><Receipt size={16}/></div>
                                <div className="text-left">
                                   <p className="text-xs font-black font-mono text-purple-600">#{s.id.slice(-8)}</p>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase">{s.customer} • {s.date.split('T')[0]}</p>
                                </div>
                             </div>
                             <span className="text-xs font-black text-slate-900 dark:text-white">{s.total} {config.currencySymbol}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ACTIONS SYSTEME */}
                  {globalResults.actions.length > 0 && (
                    <div>
                      <p className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center"><Command size={12} className="mr-2"/> Modules</p>
                      <div className="grid grid-cols-2 gap-2 p-2">
                        {globalResults.actions.map(action => (
                          <button key={action.id} onClick={() => { setActiveView(action.id as ViewType); setShowSearchResults(false); setGlobalSearchTerm(''); }} className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-purple-600 hover:text-white rounded-2xl transition-all group">
                             <action.icon size={18} className="text-purple-600 group-hover:text-white" />
                             <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!globalResults.products.length && !globalResults.customers.length && !globalResults.sales.length && !globalResults.actions.length) && (
                    <div className="py-20 text-center opacity-30 flex flex-col items-center space-y-4">
                       <Search size={48} />
                       <p className="text-[10px] font-black uppercase tracking-widest">Aucun résultat trouvé</p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Tapez Échap pour fermer</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 shrink-0">
            <button onClick={toggleFullscreen} title="Plein écran" className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl transition-all text-slate-500 hover:text-purple-600 shadow-sm"><Maximize size={20}/></button>
            <button onClick={() => setDarkMode(!darkMode)} title="Mode sombre/clair" className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors text-slate-600 dark:text-slate-400 hover:text-purple-600">{darkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
            <div className="relative" ref={notifRef}>
              <button onClick={() => setIsNotifOpen(!isNotifOpen)} className={`p-3 rounded-xl transition-all relative ${isNotifOpen ? 'bg-purple-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 hover:text-purple-600 shadow-sm'}`}>
                <Bell size={20} className={unreadCount > 0 ? 'animate-swing' : ''} />
                {unreadCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">{unreadCount}</span>}
              </button>
              {isNotifOpen && (
                <div className="absolute top-full right-0 mt-4 w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[100] flex flex-col overflow-hidden animate-scaleIn origin-top-right">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <h3 className="font-black text-sm uppercase tracking-tighter">Notifications</h3>
                    <div className="flex items-center space-x-2">
                       <button onClick={markAllAsRead} className="text-[9px] font-black uppercase text-purple-600 hover:underline">Tout lire</button>
                       <span className="text-slate-300">|</span>
                       <button onClick={clearAllNotifications} className="text-[9px] font-black uppercase text-rose-500 hover:underline">Vider</button>
                    </div>
                  </div>
                  <div className="max-h-[450px] overflow-y-auto scrollbar-hide">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {notifications.map((notif) => (
                          <div key={notif.id} onClick={(e) => { e.stopPropagation(); toggleRead(notif.id); }} className={`p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer relative group ${!notif.read ? 'bg-purple-50/20 dark:bg-purple-900/5' : ''}`}>
                            {!notif.read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-purple-600 rounded-full"></div>}
                            <div className="flex space-x-4">
                               <div className={`p-2.5 rounded-xl shrink-0 ${notif.type === 'success' ? 'bg-emerald-50 text-emerald-600' : notif.type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                 {notif.type === 'success' ? <CheckCircle size={18}/> : notif.type === 'warning' ? <AlertTriangle size={18}/> : <Info size={18}/>}
                               </div>
                               <div className="flex-1 space-y-1">
                                  <h4 className={`text-xs font-black uppercase leading-none ${notif.read ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>{notif.title}</h4>
                                  <p className={`text-[11px] font-medium leading-relaxed ${notif.read ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>{notif.message}</p>
                                  <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center space-y-4 opacity-30">
                        <BellOff size={48} className="mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Aucune notification</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 p-2 pr-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                 <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentUser?.color} flex items-center justify-center text-white font-black shadow-lg text-xs`}>{currentUser?.initials}</div>
                 <div className="flex flex-col"><span className="text-xs font-black dark:text-white leading-tight">{currentUser?.name}</span><span className="text-[8px] font-bold text-purple-600 uppercase tracking-widest">{currentUser?.role}</span></div>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8 scrollbar-hide animate-entryMain">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
