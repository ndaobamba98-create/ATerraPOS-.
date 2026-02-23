
import React, { useState, useMemo, useEffect } from 'react';
import { Product, SaleOrder, ERPConfig, CashSession, PaymentMethod, Customer, UserRole, User as AppUser, POSLocations } from '../types';
import { 
  Search, Plus, Minus, ChevronLeft, ChevronRight, LayoutGrid, Coins, Utensils, 
  Package, Truck, Wallet, Smartphone, Send, Clock, ClipboardList, 
  LayoutList, CheckCircle2, History, Timer, Save, Banknote, Calculator, X, Lock, Unlock, AlertTriangle, Car, Armchair, Trash2, RotateCcw, ShoppingCart, Eye, ArrowLeft, Users as UsersIcon,
  ArrowRightLeft, Coffee, Trash, Eraser
} from 'lucide-react';

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5];

interface CartItem {
  product: Product;
  qty: number;
}

interface Props {
  products: Product[];
  customers: Customer[];
  onUpdateCustomers: (customers: Customer[]) => void;
  sales: SaleOrder[];
  onSaleComplete: (sale: Partial<SaleOrder>) => void;
  onRefundSale: (id: string) => void;
  onDeleteDraft: (id: string) => void;
  config: ERPConfig;
  session: CashSession | null;
  onOpenSession: (openingBalance: number, cashierId: string) => void;
  onCloseSession: (closingBalance: number) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  userRole: UserRole;
  currentUser: AppUser;
  onUpdateSales: (sales: SaleOrder[]) => void;
  posLocations: POSLocations;
  onUpdateLocations: (locations: POSLocations) => void;
  userPermissions: any;
}

const POS: React.FC<Props> = ({ products, customers, config, session, onOpenSession, onCloseSession, onSaleComplete, onRefundSale, onDeleteDraft, notify, sales, userRole, currentUser, onUpdateSales, posLocations, onUpdateLocations, userPermissions }) => {
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isResumingDraft, setIsResumingDraft] = useState<string | null>(null);
  const [draftStartTime, setDraftStartTime] = useState<string | null>(null);
  
  const [isClosingSession, setIsClosingSession] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSource, setTransferSource] = useState<{table: string, saleId: string} | null>(null);
  const [billetage, setBilletage] = useState<Record<number, number>>({});
  
  const [isAddTableOpen, setIsAddTableOpen] = useState<{ isOpen: boolean, categoryId: string | null }>({ isOpen: false, categoryId: null });
  const [newTableName, setNewTableName] = useState('');

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const isWaiter = userRole === 'waiter';
  const activeDrafts = useMemo(() => sales.filter(s => s.status === 'draft'), [sales]);
  
  const availableLocations = useMemo(() => {
    const occupied = new Set(activeDrafts.map(d => d.orderLocation));
    const all: string[] = [];
    posLocations.categories.forEach(cat => {
      cat.items.forEach(item => {
        if (!occupied.has(item)) all.push(item);
      });
    });
    return all;
  }, [posLocations, activeDrafts]);

  const recentSales = useMemo(() => 
    sales.filter(s => s.status !== 'draft' && s.status !== 'quotation')
         .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
         .slice(0, 20)
  , [sales]);

  const countedTotal = useMemo(() => {
    return Object.entries(billetage).reduce((acc: number, [denom, qty]) => acc + (parseInt(denom) * (qty as number)), 0);
  }, [billetage]);

  const updateBilletage = (denom: number, delta: number) => {
    setBilletage(prev => ({
      ...prev,
      [denom]: Math.max(0, (prev[denom] || 0) + delta)
    }));
  };

  const handleOpenSessionWithBilletage = () => {
    onOpenSession(countedTotal, currentUser.id);
    setBilletage({});
    notify("Session Ouverte", `Fond de caisse initial : ${countedTotal} ${config.currency}`, "success");
  };

  const handleCloseSessionWithBilletage = () => {
    onCloseSession(countedTotal);
    setBilletage({});
    setIsClosingSession(false);
    notify("Session Clôturée", `Le rapport de caisse a été généré.`, "info");
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName || !isAddTableOpen.categoryId) return;
    
    const updated = {
      ...posLocations,
      categories: posLocations.categories.map((cat) => {
        if (cat.id === isAddTableOpen.categoryId) {
          return { ...cat, items: [...cat.items, newTableName] };
        }
        return cat;
      })
    };
    
    onUpdateLocations(updated);
    setNewTableName('');
    setIsAddTableOpen({ isOpen: false, categoryId: null });
    notify("Plan de salle", `Nouvel emplacement "${newTableName}" ajouté.`, "success");
  };

  const getTableStatus = (loc: string) => {
    const draft = activeDrafts.find(d => d.orderLocation === loc);
    return draft ? { isOccupied: true, sale: draft } : { isOccupied: false };
  };

  const handleSelectLocation = (loc: string) => {
    const status = getTableStatus(loc);
    setActiveLocation(loc);
    
    if (status.isOccupied && status.sale) {
      const items: CartItem[] = (status.sale.items || []).map(si => {
        const product = products.find(p => p.id === si.productId);
        return {
          product: product || { id: si.productId, name: si.name, price: si.price, stock: 0, category: 'N/A', sku: '', image: undefined },
          qty: si.quantity
        };
      });
      setLocalCart(items);
      setIsResumingDraft(status.sale.id);
      setDraftStartTime(status.sale.openedAt || status.sale.date);
      if (status.sale.customerId) {
        const cust = customers.find(c => c.id === status.sale.customerId);
        if (cust) setSelectedCustomer(cust);
      }
    } else {
      setLocalCart([]);
      setIsResumingDraft(null);
      setDraftStartTime(null);
      setSelectedCustomer(null);
    }
  };

  const handleStartTransfer = (e: React.MouseEvent | null, loc: string, saleId: string) => {
    if (e) e.stopPropagation();
    setTransferSource({ table: loc, saleId });
    setIsTransferModalOpen(true);
  };

  const handleTransfer = (newLoc: string) => {
    const targetSaleId = transferSource ? transferSource.saleId : isResumingDraft;
    const sourceTable = transferSource ? transferSource.table : activeLocation;

    if (!targetSaleId || !sourceTable) return;
    
    const updatedSales = sales.map(s => {
      if (s.id === targetSaleId) {
        return { 
          ...s, 
          orderLocation: newLoc,
          customer: s.customer === sourceTable ? newLoc : s.customer 
        };
      }
      return s;
    });

    onUpdateSales(updatedSales);
    notify("Transfert réussi", `Commande déplacée de ${sourceTable} vers ${newLoc}`, "success");
    
    if (activeLocation === sourceTable) {
        setActiveLocation(newLoc);
    }
    
    setIsTransferModalOpen(false);
    setTransferSource(null);
  };

  const handleQuickDelete = (e: React.MouseEvent | null, loc: string, saleId: string) => {
    if (e) e.stopPropagation();
    if (confirm(`Voulez-vous vraiment SUPPRIMER la commande de la ${loc} et libérer l'emplacement ?`)) {
        onDeleteDraft(saleId);
        if (activeLocation === loc) {
            setLocalCart([]);
            setActiveLocation(null);
            setIsResumingDraft(null);
        }
        notify("Commande supprimée", `La ${loc} est maintenant libre.`, "info");
    }
  };

  const handleCancelOrder = () => {
    if (!activeLocation) return;
    
    const status = getTableStatus(activeLocation);
    const saleId = isResumingDraft || (status.isOccupied ? status.sale?.id : null);

    if (localCart.length > 0 || saleId) {
      if (!confirm("⚠️ ACTION IRRÉVERSIBLE : Voulez-vous vraiment SUPPRIMER cette commande et libérer la table ?")) return;
    }

    if (saleId) {
      onDeleteDraft(saleId);
    }
    
    setLocalCart([]);
    setActiveLocation(null);
    setIsResumingDraft(null);
    notify("Commande Supprimée", "Le ticket a été effacé et la table est libre.", "warning");
  };

  const clearCartOnly = () => {
    if (localCart.length > 0) {
      if (confirm("Vider tous les articles du ticket ?")) {
        setLocalCart([]);
        notify("Panier vidé", "Tous les articles ont été retirés.", "info");
      }
    }
  };

  const categories = useMemo(() => ['Tous', ...config.categories], [config.categories]);
  
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === 'Tous' || p.category === activeCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, search, activeCategory]);

  const total = useMemo(() => localCart.reduce((acc, item) => acc + (item.product.price * item.qty), 0), [localCart]);

  const addToCart = (p: Product) => {
    const exists = localCart.find(item => item.product.id === p.id);
    if (exists) {
      setLocalCart(localCart.map(item => item.product.id === p.id ? {...item, qty: item.qty + 1} : item));
    } else {
      setLocalCart([...localCart, {product: p, qty: 1}]);
    }
  };

  const adjustQty = (productId: string, delta: number) => {
    setLocalCart(localCart.map(item => {
      if (item.product.id === productId) return { ...item, qty: Math.max(0, item.qty + delta) };
      return item;
    }).filter(item => item.qty > 0));
  };

  const removeItemFromCart = (productId: string) => {
    setLocalCart(localCart.filter(item => item.product.id !== productId));
    notify("Article retiré", "Le plat a été supprimé du ticket.", "info");
  };

  const handleProcessOrder = (method: PaymentMethod | null) => {
    if (!activeLocation || (localCart.length === 0 && !isResumingDraft)) return;
    
    const saleData: Partial<SaleOrder> = {
      id: isResumingDraft || `FAC-${Date.now()}`,
      total,
      customer: selectedCustomer ? selectedCustomer.name : activeLocation,
      customerId: selectedCustomer?.id,
      items: localCart.map(i => ({ productId: i.product.id, name: i.product.name, quantity: i.qty, price: i.product.price })),
      orderLocation: activeLocation,
      date: new Date().toISOString(),
      openedAt: draftStartTime || new Date().toISOString(),
      status: (isWaiter || !method) ? 'draft' : 'confirmed', 
      preparationStatus: 'pending',
      paymentMethod: method || undefined,
      cashierId: currentUser.id,
      payments: method ? [{ method, amount: total }] : []
    };

    if (isResumingDraft) {
      const updatedSales = sales.map(s => s.id === isResumingDraft ? { ...s, ...saleData } as SaleOrder : s);
      onUpdateSales(updatedSales);
    } else {
      onSaleComplete(saleData);
    }

    if (method) {
        setLocalCart([]);
        setActiveLocation(null);
        notify("Vente Encaissée", `Paiement ${method} validé.`, "success");
    } else {
        notify("Cuisine Alertée", `Commande #${saleData.id?.slice(-6)} envoyée en préparation.`, "info");
        setActiveLocation(null);
        setLocalCart([]);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Utensils': return <Utensils size={24} />;
      case 'Armchair': return <Armchair size={24} />;
      case 'Package': return <Package size={24} />;
      case 'Truck': return <Truck size={24} />;
      case 'Car': return <Car size={24} />;
      default: return <LayoutGrid size={24} />;
    }
  };

  const BilletageView = ({ title, onConfirm, onCancel, expected, opening }: { title: string, onConfirm: () => void, onCancel?: () => void, expected?: number, opening?: number }) => (
    <div className="h-full flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[4rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row">
        <div className="p-12 md:w-3/5 space-y-8">
           <div className="flex items-center space-x-4">
              <div className="p-4 bg-purple-600 text-white rounded-3xl shadow-lg"><Calculator size={32}/></div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">{title}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Comptage physique des espèces</p>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DENOMINATIONS.map(denom => (
                <div key={denom} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl flex items-center justify-between border border-transparent hover:border-purple-200 transition-all">
                   <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 font-black text-xs text-purple-600">
                        {denom}
                      </div>
                      <span className="text-[10px] font-black text-slate-400">X</span>
                   </div>
                   <div className="flex items-center space-x-3">
                      <button onClick={() => updateBilletage(denom, -1)} className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-slate-400 hover:text-rose-500"><Minus size={16}/></button>
                      <input 
                        type="number" 
                        value={billetage[denom] || 0} 
                        onChange={(e) => setBilletage({...billetage, [denom]: parseInt(e.target.value) || 0})}
                        className="w-12 text-center bg-transparent font-black text-sm outline-none"
                      />
                      <button onClick={() => updateBilletage(denom, 1)} className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-slate-400 hover:text-purple-600"><Plus size={16}/></button>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-slate-900 md:w-2/5 p-12 text-white flex flex-col justify-between">
           <div className="space-y-8">
              <div>
                 <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Total Compté</p>
                 <h3 className="text-5xl font-black tracking-tighter">{countedTotal.toLocaleString()} <span className="text-sm opacity-40">{config.currency}</span></h3>
              </div>

              {expected !== undefined && opening !== undefined && (
                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-5">
                   <div className="flex justify-between items-center opacity-70">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Fond de caisse initial</span>
                      <span className="text-xs font-black">{opening.toLocaleString()} {config.currency}</span>
                   </div>
                   <div className="flex justify-between items-center opacity-70">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Ventes espèces</span>
                      <span className="text-xs font-black">{(expected - opening).toLocaleString()} {config.currency}</span>
                   </div>
                   <div className="h-px bg-white/10 my-2"></div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-purple-400 uppercase">Total théorique attendu</span>
                      <span className="text-md font-black">{expected.toLocaleString()} {config.currency}</span>
                   </div>
                   <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <span className="text-[11px] font-black uppercase">Écart constaté</span>
                      <span className={`text-lg font-black ${countedTotal - expected < 0 ? 'text-rose-500' : countedTotal - expected > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {countedTotal - expected > 0 ? '+' : ''}{(countedTotal - expected).toLocaleString()}
                      </span>
                   </div>
                </div>
              )}
           </div>

           <div className="space-y-4">
              <button 
                onClick={onConfirm}
                className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-900/40 transition-all flex items-center justify-center space-x-3"
              >
                <CheckCircle2 size={20}/>
                <span>Valider le comptage</span>
              </button>
              {onCancel && (
                <button onClick={onCancel} className="w-full py-5 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all">Annuler</button>
              )}
           </div>
        </div>
      </div>
    </div>
  );

  const LocationGroup: React.FC<{ title: string; categoryId: string; items: string[]; iconName: string }> = ({ title, categoryId, items, iconName }) => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 border-l-4 border-purple-600 pl-4">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">{title}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-6">
        {items.map(loc => {
           const status = getTableStatus(loc);
           const itemCount = status.isOccupied ? (status.sale?.items?.reduce((acc, i) => acc + i.quantity, 0) || 0) : 0;
           
           let durationStr = "";
           if (status.isOccupied && status.sale?.openedAt) {
               const diff = now.getTime() - new Date(status.sale.openedAt).getTime();
               const mins = Math.floor(diff / 60000);
               const hrs = Math.floor(mins / 60);
               durationStr = hrs > 0 ? `${hrs}h${mins%60}m` : `${mins}m`;
           }

           return (
             <button 
               key={loc} 
               onClick={() => handleSelectLocation(loc)} 
               className={`relative w-32 h-32 mx-auto rounded-[2.5rem] border-2 transition-all flex flex-col items-center justify-center space-y-2 group shadow-sm
                 ${status.isOccupied 
                   ? 'bg-blue-600 border-blue-400 text-white shadow-lg scale-105 z-10 animate-pulse-subtle' 
                   : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md'}`}
             >
               <div className={`absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest shadow-md border-2 border-white dark:border-slate-900
                 ${status.isOccupied ? 'bg-rose-600 text-white' : 'bg-emerald-50 text-white'}`}>
                 {status.isOccupied ? 'Occupé' : 'Libre'}
               </div>

               {status.isOccupied ? (
                 <div className="flex flex-col items-center">
                   <div className="mb-1 text-white">{getIcon(iconName)}</div>
                   <div className="flex items-center space-x-1 bg-blue-700/50 px-2 py-0.5 rounded-full text-[7px] font-black uppercase">
                     <Clock size={7} /> <span>{durationStr}</span>
                   </div>
                   
                   <div className="absolute top-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => handleQuickDelete(e, loc, status.sale!.id)}
                        className="p-1.5 bg-rose-500 hover:bg-rose-700 text-white rounded-lg shadow-lg transition-all"
                        title="Annuler la commande"
                      >
                        <Trash2 size={12} />
                      </button>
                      <button 
                        onClick={(e) => handleStartTransfer(e, loc, status.sale!.id)}
                        className="p-1.5 bg-white text-blue-600 hover:bg-blue-50 rounded-lg shadow-lg transition-all"
                        title="Transférer la table"
                      >
                        <ArrowRightLeft size={12} />
                      </button>
                   </div>
                 </div>
               ) : (
                <div className="text-slate-200 dark:text-slate-800 group-hover:text-emerald-500 transition-colors">
                  {getIcon(iconName)}
                </div>
               )}
               
               <span className={`font-black uppercase text-[9px] tracking-widest px-2 text-center truncate w-full ${status.isOccupied ? 'text-white' : 'text-slate-400'}`}>
                 {loc}
               </span>
               
               {status.isOccupied && (
                 <>
                   <div className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white w-7 h-7 rounded-xl text-[9px] font-black border-2 border-white flex items-center justify-center shadow-lg transform rotate-12">
                     {itemCount}
                   </div>
                   <div className="absolute -bottom-2.5 bg-white text-blue-600 px-3 py-1 rounded-full text-[8px] font-black border-2 border-blue-600 shadow-xl whitespace-nowrap">
                     {status.sale?.total.toLocaleString()} {config.currency}
                   </div>
                 </>
               )}
             </button>
           );
        })}
        <button 
           onClick={() => setIsAddTableOpen({ isOpen: true, categoryId })}
           className="w-32 h-32 mx-auto rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-2 text-slate-300 hover:text-purple-500 hover:border-purple-500 transition-all bg-transparent group"
        >
           <Plus size={24} className="group-hover:scale-125 transition-transform" />
           <span className="font-black uppercase text-[8px] tracking-widest">Ajouter</span>
        </button>
      </div>
    </div>
  );

  if (!session) {
    if (isWaiter) {
      return (
        <div className="h-full flex items-center justify-center p-8">
          <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl text-center space-y-6 max-w-md">
             <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto"><Lock size={48}/></div>
             <h2 className="text-2xl font-black uppercase tracking-tighter">Caisse Fermée</h2>
             <p className="text-sm font-medium text-slate-500 uppercase tracking-widest leading-relaxed">Attendez l'ouverture de la session par le caissier.</p>
          </div>
        </div>
      );
    }
    return <BilletageView title="Ouverture de Caisse" onConfirm={handleOpenSessionWithBilletage} />;
  }

  if (isClosingSession) {
    return (
      <BilletageView 
        title="Clôture de Caisse" 
        expected={session.expectedBalance} 
        opening={session.openingBalance}
        onConfirm={handleCloseSessionWithBilletage} 
        onCancel={() => setIsClosingSession(false)} 
      />
    );
  }

  if (isHistoryOpen) {
    return (
      <div className="h-full flex flex-col space-y-8 animate-fadeIn pr-2 overflow-y-auto scrollbar-hide pb-20">
         <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm sticky top-0 z-[100] backdrop-blur-xl">
           <div className="flex items-center space-x-5">
              <button onClick={() => setIsHistoryOpen(false)} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 transition-all">
                <ArrowLeft size={24} />
              </button>
              <div>
                 <h2 className="text-xl font-black uppercase tracking-tighter">Dernières Ventes</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Historique récent de la caisse</p>
              </div>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-5">Heure</th>
                <th className="px-8 py-5">Référence</th>
                <th className="px-8 py-5">Client / Zone</th>
                <th className="px-8 py-5 text-right">Total</th>
                <th className="px-8 py-5 text-center">Paiement</th>
                <th className="px-8 py-5 text-center">Statut</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentSales.map(s => (
                <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${s.status === 'refunded' ? 'bg-rose-50/20 grayscale-[0.5]' : ''}`}>
                  <td className="px-8 py-6 text-[10px] font-bold text-slate-400">{new Date(s.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</td>
                  <td className="px-8 py-6 font-mono text-xs font-black text-purple-600">#{s.id.slice(-8)}</td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                       <span className="text-xs font-black uppercase">{s.customer}</span>
                       <span className="text-[9px] font-bold text-slate-400 uppercase">{s.orderLocation || 'Comptoir'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-sm">
                    <span className={s.status === 'refunded' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}>
                      {s.total.toLocaleString()} {config.currency}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-[10px] font-black uppercase text-slate-400">{s.paymentMethod || 'Espèces'}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${s.status === 'refunded' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {s.status === 'refunded' ? 'Annulée' : 'Validée'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {s.status !== 'refunded' && (userRole === 'admin' || userRole === 'manager' || userRole === 'cashier') && (
                      <button 
                        onClick={() => { if(confirm("Annuler définitivement cette vente ?")) onRefundSale(s.id); }}
                        className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm"
                        title="Annuler la vente"
                      >
                        <RotateCcw size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!activeLocation) {
    return (
      <div className="h-full flex flex-col space-y-10 animate-fadeIn pr-2 overflow-y-auto scrollbar-hide pb-20">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm sticky top-0 z-[100] backdrop-blur-xl">
           <div className="flex items-center space-x-5">
              <div className="p-4 bg-blue-600 text-white rounded-3xl shadow-xl shadow-blue-900/20"><LayoutGrid size={32}/></div>
              <div>
                 <h2 className="text-xl font-black uppercase tracking-tighter">Plan de Salle</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{currentUser.name} en session</p>
              </div>
           </div>
           
           <div className="flex items-center space-x-4">
              <button onClick={() => setIsHistoryOpen(true)} className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-slate-200 transition-all flex items-center space-x-2">
                <History size={24}/>
                <span className="text-[10px] font-black uppercase hidden md:inline">Historique</span>
              </button>
              {!isWaiter && (
                <button onClick={() => { setBilletage({}); setIsClosingSession(true); }} className="px-8 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all flex items-center">
                  <Lock size={16} className="mr-2"/> Clôturer Caisse
                </button>
              )}
              <div className="h-12 w-px bg-slate-100 dark:border-slate-800"></div>
              <div className="text-right flex flex-col">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activité</span>
                 <span className="text-2xl font-black text-blue-600 tracking-tighter">{activeDrafts.length} Commandes</span>
              </div>
           </div>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-9 space-y-20 pb-20">
              {posLocations.categories.map((cat) => (
                <LocationGroup key={cat.id} categoryId={cat.id} title={cat.name} items={cat.items} iconName={cat.icon} />
              ))}
          </div>

          <div className="hidden lg:flex lg:col-span-3 flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden h-[fit-content] sticky top-36">
             <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center space-x-3">
                   <ClipboardList size={20} className="text-blue-600"/>
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">En attente</h3>
                </div>
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black">{activeDrafts.length}</span>
             </div>
             <div className="max-h-[500px] overflow-y-auto p-6 space-y-4 scrollbar-hide">
                {activeDrafts.map(draft => (
                  <button key={draft.id} onClick={() => handleSelectLocation(draft.orderLocation || "")} className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent hover:border-blue-500 transition-all flex items-center justify-between group shadow-sm text-left">
                     <div className="space-y-1">
                        <span className="text-sm font-black uppercase text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{draft.orderLocation}</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{draft.total.toLocaleString()} {config.currency}</p>
                     </div>
                     <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-all"/>
                  </button>
                ))}
             </div>
          </div>
        </div>

        {isAddTableOpen.isOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden animate-scaleIn">
               <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                  <h3 className="text-lg font-black uppercase tracking-tighter">Nouvel Emplacement</h3>
                  <button onClick={() => setIsAddTableOpen({ isOpen: false, categoryId: null })}><X size={24}/></button>
               </div>
               <form onSubmit={handleAddLocation} className="p-10 space-y-6">
                  <input required autoFocus value={newTableName} onChange={e => setNewTableName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black outline-none border-2 border-transparent focus:border-purple-500 transition-all" placeholder="ex: Table 12, Livraison..." />
                  <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-3xl font-black uppercase text-xs shadow-xl transition-all">Ajouter au plan</button>
               </form>
            </div>
          </div>
        )}

        {isTransferModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-scaleIn">
               <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center space-x-4">
                     <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><ArrowRightLeft size={24}/></div>
                     <div>
                        <h3 className="text-xl font-black uppercase tracking-tighter">Transférer Commande</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source : {transferSource ? transferSource.table : activeLocation}</p>
                     </div>
                  </div>
                  <button onClick={() => { setIsTransferModalOpen(false); setTransferSource(null); }}><X size={28} className="text-slate-400 hover:text-rose-500"/></button>
               </div>
               <div className="p-10 space-y-6">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sélectionner la table de destination (Libres uniquement)</p>
                  <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                     {availableLocations.map(loc => (
                       <button 
                          key={loc}
                          onClick={() => handleTransfer(loc)}
                          className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent hover:border-blue-500 hover:bg-white dark:hover:bg-slate-700 transition-all text-center group"
                       >
                          <span className="text-[11px] font-black uppercase truncate block group-hover:text-blue-600">{loc}</span>
                       </button>
                     ))}
                     {availableLocations.length === 0 && (
                       <div className="col-span-3 py-10 text-center opacity-40 italic text-xs font-bold">Aucune table libre disponible.</div>
                     )}
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full grid grid-cols-12 gap-8 overflow-hidden animate-fadeIn">
      <div className="col-span-12 lg:col-span-8 flex flex-col space-y-6 overflow-hidden">
        <div className="flex items-center space-x-4">
          <button onClick={() => { handleProcessOrder(null); setActiveLocation(null); }} className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 transition-all">
            <ChevronLeft size={28} />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Chercher un produit..." className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-900 rounded-3xl text-md font-bold shadow-sm focus:ring-4 focus:ring-purple-500/10 border-none outline-none" />
          </div>
        </div>

        <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase whitespace-nowrap transition-all border-2 ${activeCategory === cat ? 'bg-purple-600 border-purple-600 text-white shadow-xl' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}>{cat}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 scrollbar-hide pb-10">
          {filteredProducts.map(p => (
            <button key={p.id} onClick={() => addToCart(p)} className="bg-white dark:bg-slate-900 p-0 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-left flex flex-col justify-between hover:border-purple-500 hover:shadow-xl transition-all h-64 group relative overflow-hidden">
              <div className="h-32 w-full bg-slate-50 dark:bg-slate-800 overflow-hidden relative">
                {p.image ? (
                  <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <Coffee size={32} />
                  </div>
                )}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-lg">
                   <span className="text-[7px] font-black text-white uppercase tracking-widest">{p.category}</span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <h4 className="text-[11px] font-black uppercase leading-tight text-slate-800 dark:text-white group-hover:text-purple-600 transition-colors line-clamp-2">{p.name}</h4>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-black text-slate-900 dark:text-white tracking-tighter">{p.price.toLocaleString()} <span className="text-[7px] opacity-40 font-bold ml-0.5">{config.currency}</span></span>
                  <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-300 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm"><Plus size={14} /></div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4 flex flex-col overflow-hidden">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col flex-1">
          <div className={`p-6 border-b dark:border-slate-800 text-white flex items-center justify-between ${isResumingDraft ? 'bg-blue-600' : 'bg-slate-900'}`}>
            <div className="flex items-center space-x-4">
               <div className="p-2.5 rounded-xl bg-white/20 shadow-lg"><LayoutGrid size={22}/></div>
               <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">{activeLocation}</h3>
                  <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest">En service</p>
               </div>
            </div>
            
            <div className="flex items-center space-x-2">
               {isResumingDraft && (
                 <button 
                   onClick={() => handleStartTransfer(null, activeLocation!, isResumingDraft!)} 
                   className="px-3 py-2 bg-blue-500 hover:bg-white hover:text-blue-600 text-white rounded-xl transition-all flex items-center space-x-2 shadow-inner border border-white/20"
                   title="Transférer la table"
                 >
                    <ArrowRightLeft size={16} />
                    <span className="text-[8px] font-black uppercase hidden xl:inline">Transférer</span>
                 </button>
               )}
               <button 
                 onClick={handleCancelOrder} 
                 className="px-3 py-2 bg-rose-600 hover:bg-white hover:text-rose-600 text-white rounded-xl transition-all flex items-center space-x-2 shadow-inner border border-white/20"
                 title="Supprimer la commande"
               >
                  <Trash2 size={16} />
                  <span className="text-[8px] font-black uppercase hidden xl:inline">Supprimer</span>
               </button>
            </div>
          </div>

          {localCart.length > 0 && (
             <div className="px-6 py-3 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{localCart.length} Article(s)</span>
                <button 
                   onClick={clearCartOnly}
                   className="flex items-center space-x-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                   title="Vider le panier"
                >
                   <Eraser size={14} />
                   <span className="text-[9px] font-black uppercase">Vider tout</span>
                </button>
             </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
            {localCart.map(item => (
              <div key={item.product.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-transparent hover:border-purple-200 transition-all group">
                <div className="flex flex-col flex-1 min-w-0 pr-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase truncate text-slate-800 dark:text-white">{item.product.name}</span>
                    <button 
                      onClick={() => removeItemFromCart(item.product.id)}
                      className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      title="Supprimer l'article"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 mt-0.5">{(item.product.price * item.qty).toLocaleString()} {config.currency}</span>
                </div>
                <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl p-1 shadow-md border border-slate-100 dark:border-slate-800 shrink-0">
                  <button onClick={() => adjustQty(item.product.id, -1)} className="p-2 text-slate-400 hover:text-rose-500"><Minus size={16}/></button>
                  <span className="px-3 text-sm font-black w-10 text-center text-slate-900 dark:text-white">{item.qty}</span>
                  <button onClick={() => addToCart(item.product)} className="p-2 text-slate-400 hover:text-purple-600"><Plus size={16}/></button>
                </div>
              </div>
            ))}
            {localCart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 text-center space-y-4">
                <ShoppingCart size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest">Panier vide</p>
              </div>
            )}
          </div>

          <div className="p-8 bg-slate-950 text-white rounded-t-3xl space-y-8 shadow-[0_-20px_40px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total</span>
              <span className="text-4xl font-black tracking-tighter">{total.toLocaleString()} <span className="text-sm font-bold text-purple-500">{config.currency}</span></span>
            </div>

            {isWaiter ? (
               <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => handleProcessOrder(null)} className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center space-x-2"><Save size={18} /><span>Attente</span></button>
                 <button disabled={localCart.length === 0} onClick={() => handleProcessOrder(null)} className="py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-xl transition-all flex items-center justify-center space-x-2"><Send size={18} /><span>Cuisine</span></button>
               </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <button disabled={localCart.length === 0} onClick={() => handleProcessOrder('Especes')} className="py-4 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black uppercase text-[8px] flex flex-col items-center space-y-2 shadow-lg"><Coins size={20}/><span>Espèces</span></button>
                <button disabled={localCart.length === 0} onClick={() => handleProcessOrder('Masrvi')} className="py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black uppercase text-[8px] flex flex-col items-center space-y-2 shadow-lg"><Wallet size={20}/><span>Masrvi</span></button>
                <button disabled={localCart.length === 0} onClick={() => handleProcessOrder('Bankily')} className="py-4 bg-orange-600 hover:bg-orange-700 rounded-2xl font-black uppercase text-[8px] flex flex-col items-center space-y-2 shadow-lg"><Smartphone size={20}/><span>Bankily</span></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
