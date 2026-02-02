
import React, { useState, useMemo } from 'react';
import { Product, ERPConfig, UserRole, ViewType, RolePermission, User, POSLocations, POSLocationCategory, AppTheme, Language } from '../types';
import { 
  Save, Plus, Trash2, Building2, Layers, ShieldCheck, X, 
  FileText, Hash, Info, Printer, DollarSign, BellRing, Users, UserPlus, 
  Mail, Phone, MapPin, Percent, Tag, Bell, Check, QrCode, PackageCheck, Shield, CheckSquare, Square, Edit3, Key, Utensils, Globe,
  ChevronDown, Palette, Wifi, Clock, UserCircle, Upload, ImageIcon, RotateCcw, Package, Search, Lock, ShieldAlert, Eye, EyeOff, UserCheck, Settings as SettingsIcon, Coffee, Pizza, LayoutGrid,
  AlertTriangle, Camera, Share2, Facebook, Instagram, Twitter, ShieldEllipsis, CheckCircle2
} from 'lucide-react';

interface Props {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  config: ERPConfig;
  onUpdateConfig: (config: ERPConfig) => void;
  posLocations: POSLocations;
  onUpdateLocations: (locations: POSLocations) => void;
  rolePermissions: RolePermission[];
  onUpdatePermissions: (perms: RolePermission[]) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  userPermissions: ViewType[];
  t: (key: any) => string;
  currentUser: User;
  allUsers: User[];
  onUpdateUsers: (users: User[]) => void;
}

const THEMES: { id: AppTheme, color: string, label: string }[] = [
  { id: 'purple', color: 'bg-purple-600', label: 'Améthyste' },
  { id: 'emerald', color: 'bg-emerald-600', label: 'Émeraude' },
  { id: 'blue', color: 'bg-blue-600', label: 'Océan' },
  { id: 'rose', color: 'bg-rose-600', label: 'Rubis' },
  { id: 'amber', color: 'bg-amber-600', label: 'Ambre' },
  { id: 'slate', color: 'bg-slate-700', label: 'Anthracite' }
];

const ALL_PERMISSION_KEYS: { id: ViewType; label: string; category: string }[] = [
  { id: 'dashboard', label: 'Tableau de Bord', category: 'Général' },
  { id: 'pos', label: 'Point de Vente', category: 'Ventes' },
  { id: 'preparation', label: 'Suivi Cuisine (KDS)', category: 'Ventes' },
  { id: 'sales', label: 'Journal des Ventes', category: 'Ventes' },
  { id: 'manage_sales', label: 'Modifier les Ventes', category: 'Ventes' },
  { id: 'inventory', label: 'Gestion du Menu', category: 'Stocks' },
  { id: 'manage_inventory', label: 'Modifier les Stocks', category: 'Stocks' },
  { id: 'expenses', label: 'Journal de Caisse', category: 'Finance' },
  { id: 'invoicing', label: 'Module Facturation', category: 'Finance' },
  { id: 'manage_session_closing', label: 'Clôture de Caisse', category: 'Finance' },
  { id: 'hr', label: 'Gestion RH', category: 'RH' },
  { id: 'manage_hr', label: 'Modifier les Employés', category: 'RH' },
  { id: 'attendances', label: 'Pointages Présences', category: 'RH' },
  { id: 'customers', label: 'Fichier Clients', category: 'Clients' },
  { id: 'manage_customers', label: 'Modifier les Clients', category: 'Clients' },
  { id: 'reports', label: 'Analyses & Rapports', category: 'Analyses' },
  { id: 'settings', label: 'Paramètres Système', category: 'Admin' },
];

const Settings: React.FC<Props> = ({ config, onUpdateConfig, posLocations, onUpdateLocations, notify, allUsers, onUpdateUsers, products, onUpdateProducts, rolePermissions, onUpdatePermissions, t }) => {
  const [activeTab, setActiveTab] = useState<'company' | 'billing' | 'users' | 'access' | 'zones' | 'regional' | 'menu'>('company');
  const [formConfig, setFormConfig] = useState<ERPConfig>(config);
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productSearch, setProductSearch] = useState('');

  const handleSaveAll = () => {
    onUpdateConfig(formConfig);
    notify("Configuration", "Tous les réglages ont été synchronisés.", 'success');
  };

  const updateConfigField = (field: keyof ERPConfig, value: any) => {
    setFormConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      updateConfigField('companyLogo', event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addZone = () => {
    const name = prompt("Nom de la nouvelle zone (ex: Terrasse, Étage) :");
    if (!name) return;
    const newZone: POSLocationCategory = {
      id: `zone-${Date.now()}`,
      name,
      icon: 'Utensils',
      items: []
    };
    onUpdateLocations({ ...posLocations, categories: [...posLocations.categories, newZone] });
    notify("Espaces", `Zone "${name}" créée.`, "success");
  };

  const removeZone = (id: string) => {
    if (confirm("Supprimer cette zone et toutes ses tables ?")) {
      onUpdateLocations({ ...posLocations, categories: posLocations.categories.filter(c => c.id !== id) });
    }
  };

  const addTableToZone = (zoneId: string) => {
    const tableName = prompt("Nom de la table (ex: T12) :");
    if (!tableName) return;
    const updated = {
      ...posLocations,
      categories: posLocations.categories.map(c => 
        c.id === zoneId ? { ...c, items: [...c.items, tableName] } : c
      )
    };
    onUpdateLocations(updated);
  };

  const removeTableFromZone = (zoneId: string, tableName: string) => {
    const updated = {
      ...posLocations,
      categories: posLocations.categories.map(c => 
        c.id === zoneId ? { ...c, items: c.items.filter(t => t !== tableName) } : c
      )
    };
    onUpdateLocations(updated);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.name || !editingUser?.role) return;
    
    const userData = {
      ...editingUser,
      id: editingUser.id || `U-${Date.now()}`,
      initials: editingUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
      color: editingUser.color || 'from-slate-700 to-slate-900',
    } as User;

    if (allUsers.find(u => u.id === userData.id)) {
      onUpdateUsers(allUsers.map(u => u.id === userData.id ? userData : u));
      notify("Équipe", `Compte de ${userData.name} mis à jour.`, "success");
    } else {
      onUpdateUsers([...allUsers, userData]);
      notify("Équipe", `Nouveau membre ${userData.name} ajouté.`, "success");
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const deleteUser = (id: string) => {
    if (confirm("Supprimer ce membre de l'équipe ?")) {
      onUpdateUsers(allUsers.filter(u => u.id !== id));
      notify("Équipe", "Membre retiré.", "info");
    }
  };

  const togglePermission = (role: UserRole, permId: ViewType) => {
    if (role === 'admin') return;
    const updatedPermissions = rolePermissions.map(rp => {
      if (rp.role === role) {
        const hasPerm = rp.permissions.includes(permId);
        return {
          ...rp,
          permissions: hasPerm 
            ? rp.permissions.filter(p => p !== permId) 
            : [...rp.permissions, permId]
        };
      }
      return rp;
    });
    onUpdatePermissions(updatedPermissions);
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
        p.category.toLowerCase().includes(productSearch.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, productSearch]);

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.category) return;

    const productData = {
      ...editingProduct,
      id: editingProduct.id || `P-${Date.now()}`,
      sku: editingProduct.sku || `SKU-${Date.now().toString().slice(-4)}`,
      price: editingProduct.price || 0,
      stock: editingProduct.stock || 0
    } as Product;

    if (products.find(p => p.id === productData.id)) {
      onUpdateProducts(products.map(p => p.id === productData.id ? productData : p));
      notify("Menu", `${productData.name} mis à jour.`, "success");
    } else {
      onUpdateProducts([...products, productData]);
      notify("Menu", `${productData.name} ajouté à la carte.`, "success");
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const deleteProduct = (id: string) => {
    if (confirm("Supprimer ce plat de la carte ?")) {
      onUpdateProducts(products.filter(p => p.id !== id));
      notify("Menu", "Article supprimé.", "info");
    }
  };

  const toggleDocFlag = (field: keyof ERPConfig) => {
    updateConfigField(field, !formConfig[field]);
  };

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, typeof ALL_PERMISSION_KEYS> = {};
    ALL_PERMISSION_KEYS.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-24 pr-2" dir={config.language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
           <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl"><SettingsIcon size={32}/></div>
           <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Administration</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Pilotage global de TerraPOS+</p>
           </div>
        </div>
        <button onClick={handleSaveAll} className="bg-purple-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-purple-700 active:scale-95 transition-all flex items-center">
          <Save size={20} className="mr-3 rtl:ml-3"/> Appliquer les changements
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[750px]">
        <div className="w-full md:w-72 bg-slate-50 dark:bg-slate-800/30 border-r border-slate-100 dark:border-slate-800 p-8 space-y-2 shrink-0">
           {[
             { id: 'company', label: 'Établissement', icon: Building2 },
             { id: 'menu', label: 'Menu & Plats', icon: Coffee },
             { id: 'users', label: 'Équipe', icon: Users },
             { id: 'access', label: 'Accès & Sécurité', icon: ShieldEllipsis },
             { id: 'zones', label: 'Espaces & Tables', icon: Utensils },
             { id: 'billing', label: 'Documents', icon: FileText },
             { id: 'regional', label: 'Régional & Taxe', icon: Globe },
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`w-full flex items-center p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-md translate-x-2 rtl:-translate-x-2' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
             >
               <tab.icon size={18} className="mr-4 rtl:ml-4" />
               {tab.label}
             </button>
           ))}
        </div>

        <div className="flex-1 p-10 overflow-y-auto scrollbar-hide bg-white dark:bg-slate-900">
          {activeTab === 'company' && (
            <div className="space-y-12 animate-fadeIn">
               <div className="flex flex-col lg:flex-row gap-12">
                  <div className="w-full lg:w-1/3 flex flex-col items-center space-y-6">
                     <div className="relative group">
                        <div className="w-48 h-48 rounded-[3rem] bg-slate-100 dark:bg-slate-800 border-4 border-slate-50 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                           {formConfig.companyLogo ? (
                             <img src={formConfig.companyLogo} className="w-full h-full object-cover" alt="Logo" />
                           ) : (
                             <Building2 size={64} className="text-slate-300" />
                           )}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[3rem] opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                           <Upload size={32} className="text-white" />
                           <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </label>
                     </div>
                     <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-slate-400">Identité Visuelle</p>
                        <h4 className="text-sm font-black uppercase mt-1">{formConfig.companyName || 'Votre Enseigne'}</h4>
                     </div>
                     <div className="w-full p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl space-y-4">
                        <p className="text-[10px] font-black uppercase text-slate-400 flex items-center"><Palette size={14} className="mr-2"/> Thème Système</p>
                        <div className="grid grid-cols-3 gap-3">
                           {THEMES.map(theme => (
                             <button key={theme.id} onClick={() => updateConfigField('theme', theme.id)} className={`h-10 rounded-xl ${theme.color} border-4 transition-all ${formConfig.theme === theme.id ? 'border-white dark:border-slate-900 scale-110 shadow-lg' : 'border-transparent opacity-60'}`} />
                           ))}
                        </div>
                     </div>
                  </div>
                  <div className="flex-1 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nom commercial</label>
                           <input value={formConfig.companyName} onChange={e => updateConfigField('companyName', e.target.value)} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-slate-800 dark:text-white" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Slogan / Baseline</label>
                           <input value={formConfig.companySlogan} onChange={e => updateConfigField('companySlogan', e.target.value)} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-slate-500" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Numéro Registre / Fiscal</label>
                           <input value={formConfig.registrationNumber} onChange={e => updateConfigField('registrationNumber', e.target.value)} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-mono text-xs font-black" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Téléphone Principal</label>
                           <input value={formConfig.phone} onChange={e => updateConfigField('phone', e.target.value)} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Adresse Physique</label>
                        <div className="relative">
                           <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                           <input value={formConfig.address} onChange={e => updateConfigField('address', e.target.value)} className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="space-y-10 animate-fadeIn">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter">Gestion de la Carte</h3>
                    <p className="text-[10px] text-slate-500 uppercase mt-1">Créez et modifiez vos articles de vente</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Chercher un plat..." className="pl-12 pr-6 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold outline-none shadow-sm" />
                    </div>
                    <button onClick={() => { setEditingProduct({ name: '', category: config.categories[0] }); setIsProductModalOpen(true); }} className="bg-purple-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center hover:bg-purple-700 transition-all">
                       <Plus size={20} className="mr-2"/> Ajouter un Plat
                    </button>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[2.5rem] overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-white">
                       <tr className="text-[10px] font-black uppercase tracking-widest">
                          <th className="px-8 py-5">Article</th>
                          <th className="px-8 py-5">Catégorie</th>
                          <th className="px-8 py-5 text-right">Prix</th>
                          <th className="px-8 py-5 text-right">Stock</th>
                          <th className="px-8 py-5 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                       {filteredProducts.map(p => (
                         <tr key={p.id} className="hover:bg-slate-50/50 group transition-all">
                            <td className="px-8 py-4">
                               <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                    <Coffee size={20}/>
                                  </div>
                                  <span className="text-xs font-black uppercase">{p.name}</span>
                               </div>
                            </td>
                            <td className="px-8 py-4">
                               <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black uppercase">{p.category}</span>
                            </td>
                            <td className="px-8 py-4 text-right font-black text-xs">{p.price.toLocaleString()} {config.currency}</td>
                            <td className="px-8 py-4 text-right">
                               <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${p.stock < 10 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>{p.stock}</span>
                            </td>
                            <td className="px-8 py-4 text-right">
                               <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setEditingProduct(p); setIsProductModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={16}/></button>
                                  <button onClick={() => deleteProduct(p.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-10 animate-fadeIn">
               <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter">Équipe & Staff</h3>
                    <p className="text-[10px] text-slate-500 uppercase mt-1">Gérez vos collaborateurs et leurs comptes d'accès</p>
                  </div>
                  <button onClick={() => { setEditingUser({ name: '', role: 'waiter' }); setIsUserModalOpen(true); }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center hover:bg-black transition-all">
                     <UserPlus size={20} className="mr-2"/> Ajouter un Membre
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allUsers.map(user => (
                    <div key={user.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-50 dark:border-slate-800 hover:shadow-2xl transition-all group relative overflow-hidden">
                       <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${user.color} opacity-10 blur-3xl`}></div>
                       <div className="flex flex-col items-center text-center space-y-6">
                          <div className={`w-24 h-24 rounded-[2.5rem] bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-3xl font-black shadow-xl`}>
                            {user.initials}
                          </div>
                          <div>
                             <h4 className="text-md font-black uppercase leading-tight">{user.name}</h4>
                             <p className="text-[9px] font-bold text-purple-600 uppercase tracking-[0.2em] mt-1">{user.role}</p>
                          </div>
                          <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>
                          <div className="flex items-center space-x-3">
                             <button onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-600 transition-colors"><Edit3 size={18}/></button>
                             <button onClick={() => deleteUser(user.id)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'access' && (
            <div className="space-y-10 animate-fadeIn">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter">Matrice de Sécurité</h3>
                    <p className="text-[10px] text-slate-500 uppercase mt-1">Définition granulaire des droits par rôle opérationnel</p>
                  </div>
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center">
                    <ShieldCheck size={20} className="mr-3" />
                    <span className="text-[10px] font-black uppercase">Protection Active</span>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[2.5rem] overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-white sticky top-0 z-10">
                       <tr className="text-[10px] font-black uppercase tracking-widest">
                          <th className="px-8 py-6 w-1/3">Fonctionnalité Système</th>
                          <th className="px-6 py-6 text-center">Manager</th>
                          <th className="px-6 py-6 text-center">Caissier</th>
                          <th className="px-6 py-6 text-center">Serveur</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                       {Object.entries(groupedPermissions).map(([category, perms]) => (
                         <React.Fragment key={category}>
                           <tr className="bg-slate-50 dark:bg-slate-800/50">
                              <td colSpan={4} className="px-8 py-3 text-[9px] font-black uppercase tracking-widest text-purple-600 bg-purple-50/30 dark:bg-purple-900/10">
                                {category}
                              </td>
                           </tr>
                           {(perms as any[]).map(perm => (
                             <tr key={perm.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-4">
                                   <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase">{perm.label}</span>
                                </td>
                                {(['manager', 'cashier', 'waiter'] as UserRole[]).map(role => {
                                  const rolePerms = rolePermissions.find(rp => rp.role === role)?.permissions || [];
                                  const isActive = rolePerms.includes(perm.id);
                                  return (
                                    <td key={role} className="px-6 py-4 text-center">
                                       <button 
                                          onClick={() => togglePermission(role, perm.id)}
                                          className={`p-2 rounded-lg transition-all ${isActive ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'text-slate-200 dark:text-slate-700 hover:text-slate-400'}`}
                                       >
                                          {isActive ? <CheckSquare size={22} /> : <Square size={22} />}
                                       </button>
                                    </td>
                                  );
                                })}
                             </tr>
                           ))}
                         </React.Fragment>
                       ))}
                    </tbody>
                  </table>
               </div>
               
               <div className="p-6 bg-slate-900 text-white rounded-3xl border border-white/10 flex items-start space-x-4">
                  <ShieldAlert size={24} className="text-amber-500 shrink-0"/>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Note de sécurité</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
                      Le rôle <strong>Administrateur</strong> conserve un accès total et illimité à toutes les fonctions de TerraPOS+ pour prévenir tout blocage du système. Les modifications sont appliquées instantanément pour tous les utilisateurs connectés.
                    </p>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'zones' && (
            <div className="space-y-10 animate-fadeIn">
               <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter">Plan de Salle</h3>
                    <p className="text-[10px] text-slate-500 uppercase mt-1">Organisez vos zones de service et vos tables</p>
                  </div>
                  <button onClick={addZone} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center hover:bg-black transition-all">
                     <Plus size={20} className="mr-2"/> Créer une Zone
                  </button>
               </div>
               <div className="grid grid-cols-1 gap-8">
                  {posLocations.categories.map((zone) => (
                    <div key={zone.id} className="bg-slate-50 dark:bg-slate-800/30 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 space-y-6">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                             <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-purple-600 border border-slate-100 dark:border-slate-800">
                                <Utensils size={24}/>
                             </div>
                             <div>
                                <h4 className="text-md font-black uppercase text-slate-800 dark:text-white leading-none">{zone.name}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{zone.items.length} Table(s) active(s)</p>
                             </div>
                          </div>
                          <div className="flex items-center space-x-2">
                             <button onClick={() => addTableToZone(zone.id)} className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition-all"><Plus size={18}/></button>
                             <button onClick={() => removeZone(zone.id)} className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={18}/></button>
                          </div>
                       </div>
                       <div className="flex flex-wrap gap-4">
                          {zone.items.map((table) => (
                             <div key={table} className="bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center group">
                                <span className="text-xs font-black uppercase mr-4">{table}</span>
                                <button onClick={() => removeTableFromZone(zone.id, table)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14}/></button>
                             </div>
                          ))}
                          {zone.items.length === 0 && (
                            <div className="w-full py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl opacity-40 italic text-xs">Cette zone est vide.</div>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-12 animate-fadeIn">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                     <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center">
                        <FileText size={14} className="mr-2" /> Structure des Factures A6
                     </h3>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Préfixe Numérotation</label>
                           <input value={formConfig.invoicePrefix} onChange={e => updateConfigField('invoicePrefix', e.target.value)} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-mono text-lg font-black text-purple-600" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Prochain Numéro</label>
                           <input type="number" value={formConfig.nextInvoiceNumber} onChange={e => updateConfigField('nextInvoiceNumber', parseInt(e.target.value))} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Pied de page</label>
                           <textarea value={formConfig.receiptFooter} onChange={e => updateConfigField('receiptFooter', e.target.value)} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold h-32" />
                        </div>
                     </div>
                  </div>
                  <div className="space-y-8">
                     <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center">
                        <Eye size={14} className="mr-2" /> Options d'affichage
                     </h3>
                     <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] p-8 grid grid-cols-1 gap-4 border border-slate-100 dark:border-slate-800">
                        {[
                          { id: 'showLogoOnInvoice', label: 'Afficher le Logo' },
                          { id: 'showAddressOnInvoice', label: 'Coordonnées Établissement' },
                          { id: 'showPhoneOnInvoice', label: 'Numéro de Téléphone' },
                          { id: 'showQrCodeOnInvoice', label: 'Code QR de vérification' },
                          { id: 'showCashierOnInvoice', label: 'Nom du Caissier' },
                          { id: 'autoPrintReceipt', label: 'Impression Automatique' },
                        ].map((opt) => (
                           <button key={opt.id} onClick={() => toggleDocFlag(opt.id as any)} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-50 dark:border-slate-800 group hover:border-purple-300 transition-all">
                              <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">{opt.label}</span>
                              <div className={`w-12 h-6 rounded-full transition-all relative ${formConfig[opt.id as keyof ERPConfig] ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${formConfig[opt.id as keyof ERPConfig] ? 'right-1' : 'left-1'}`}></div>
                              </div>
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'regional' && (
            <div className="space-y-12 animate-fadeIn">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center">
                      <Globe size={14} className="mr-2" /> Localisation & Langue
                    </h3>
                    <div className="space-y-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Langue du système</label>
                         <select value={formConfig.language} onChange={e => updateConfigField('language', e.target.value)} className="w-full px-5 py-4 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl font-bold uppercase text-xs">
                           <option value="fr">Français (FR)</option>
                           <option value="en">English (US)</option>
                           <option value="ar">العربية (AR)</option>
                         </select>
                       </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center">
                      <DollarSign size={14} className="mr-2" /> Monétaire & Fiscalité
                    </h3>
                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Code Devise</label>
                            <input value={formConfig.currency} onChange={e => updateConfigField('currency', e.target.value)} className="w-full px-5 py-4 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl font-black uppercase" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Symbole</label>
                            <input value={formConfig.currencySymbol} onChange={e => updateConfigField('currencySymbol', e.target.value)} className="w-full px-5 py-4 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl font-black text-center text-xl" />
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-scaleIn">
             <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-xl font-black uppercase tracking-tighter">Fiche Collaborateur</h3>
                <button onClick={() => setIsUserModalOpen(false)}><X size={28}/></button>
             </div>
             <form onSubmit={handleSaveUser} className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Nom complet</label>
                  <input required value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black outline-none border-2 border-transparent focus:border-purple-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Rôle (Rattachement Permissions)</label>
                  <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black uppercase text-xs">
                     <option value="waiter">Serveur / Serveuse</option>
                     <option value="cashier">Caissier / Caissière</option>
                     <option value="manager">Manager</option>
                     <option value="admin">Administrateur</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Mot de passe session</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black outline-none" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
                       {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                    </button>
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-3xl font-black uppercase text-xs shadow-xl transition-all">Enregistrer</button>
             </form>
          </div>
        </div>
      )}

      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-scaleIn">
             <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-xl font-black uppercase tracking-tighter">Édition de l'Article</h3>
                <button onClick={() => setIsProductModalOpen(false)}><X size={28}/></button>
             </div>
             <form onSubmit={handleSaveProduct} className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Désignation du plat</label>
                  <input required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black outline-none border-2 border-transparent focus:border-purple-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Catégorie</label>
                    <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black text-xs uppercase">
                       {config.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Prix de vente</label>
                    <input type="number" value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Code SKU (Référence interne)</label>
                  <input value={editingProduct.sku || ''} onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-mono text-xs font-black" />
                </div>
                <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-3xl font-black uppercase text-xs shadow-xl transition-all">Valider l'Article</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
