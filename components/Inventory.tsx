
import React, { useState, useMemo } from 'react';
import { Product, ERPConfig, ViewType } from '../types';
import { Package, Search, Plus, Edit3, Trash2, AlertTriangle, X, Download, Save, Tag, Bell, AlertCircle, Filter, Coffee } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  products: Product[];
  onUpdate: (products: Product[]) => void;
  config: ERPConfig;
  userRole: string;
  userPermissions: ViewType[];
  t: (key: any) => string;
}

const Inventory: React.FC<Props> = ({ products, onUpdate, config, userRole, userPermissions, t }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const canManage = userPermissions.includes('manage_inventory');
  
  const categories = useMemo(() => [...config.categories].sort((a, b) => a.localeCompare(b)), [config.categories]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.category.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesAlert = !showOnlyAlerts || p.stock <= (p.lowStockThreshold || 10);
        
        return matchesSearch && matchesAlert;
      })
      .sort((a, b) => {
        if (!showOnlyAlerts) {
          const aAlert = a.stock <= (a.lowStockThreshold || 10);
          const bAlert = b.stock <= (b.lowStockThreshold || 10);
          if (aAlert && !bAlert) return -1;
          if (!aAlert && bAlert) return 1;
        }
        return a.name.localeCompare(b.name);
      });
  }, [products, searchTerm, showOnlyAlerts]);

  const handleDelete = () => {
    if (deleteConfirm) {
      onUpdate(products.filter(p => p.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct({
      id: `P${Date.now()}`,
      name: '',
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      category: categories[0] || 'Divers',
      price: 0,
      stock: 0,
      lowStockThreshold: 10
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name) return;

    const productToSave = editingProduct as Product;
    const exists = products.find(p => p.id === productToSave.id);

    if (exists) {
      onUpdate(products.map(p => p.id === productToSave.id ? productToSave : p));
    } else {
      onUpdate([...products, productToSave].sort((a, b) => a.name.localeCompare(b.name)));
    }
    
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleExportExcel = () => {
    const dataToExport = filteredProducts.map(p => ({
      'Désignation': p.name,
      'Code SKU': p.sku,
      'Catégorie': p.category,
      'Prix': p.price,
      'Stock': p.stock,
      'Seuil Alerte': p.lowStockThreshold || 10
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventaire");
    XLSX.writeFile(workbook, `Stock_MYA_DOR_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-black uppercase">Fiche Produit</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Désignation</label>
                  <input required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} placeholder="Nom du produit..." className="w-full px-4 py-3 border-2 rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold outline-none focus:border-accent" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Prix ({config.currency})</label>
                    <input type="number" required value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} placeholder="Prix..." className="w-full px-4 py-3 border-2 rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Catégorie</label>
                    <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full px-4 py-3 border-2 rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold outline-none">
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Stock Actuel</label>
                    <input type="number" required value={editingProduct.stock || 0} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value) || 0})} className="w-full px-4 py-3 border-2 rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-rose-500 tracking-widest flex items-center">
                      <Bell size={10} className="mr-1" /> Seuil d'Alerte
                    </label>
                    <input type="number" required value={editingProduct.lowStockThreshold || 0} onChange={e => setEditingProduct({...editingProduct, lowStockThreshold: parseInt(e.target.value) || 0})} className="w-full px-4 py-3 border-2 border-rose-100 dark:border-rose-900/30 rounded-xl dark:bg-slate-800 font-black text-rose-600 outline-none focus:border-rose-500" />
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-accent text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all hover:opacity-90">Enregistrer le produit</button>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-3xl p-8 flex flex-col items-center border border-rose-100 shadow-2xl animate-scaleIn">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={32} /></div>
            <p className="text-center font-black uppercase text-xs tracking-widest mb-8">Supprimer "{deleteConfirm.name}" ?</p>
            <div className="grid grid-cols-2 gap-3 w-full">
              <button onClick={() => setDeleteConfirm(null)} className="py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold uppercase text-[10px] tracking-widest">Annuler</button>
              <button onClick={handleDelete} className="py-3 bg-rose-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Gestion du Menu</h1>
          <p className="text-sm text-slate-500 font-medium">Articles et stocks disponibles</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowOnlyAlerts(!showOnlyAlerts)}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center shadow-sm ${showOnlyAlerts ? 'bg-rose-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-800 hover:bg-slate-50'}`}
          >
            <AlertCircle size={14} className="mr-2" />
            Alertes Stock
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent" />
          </div>
          {canManage && <button onClick={handleOpenAddModal} className="bg-accent text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center hover:opacity-90"><Plus size={18} className="mr-2" /> Nouveau Plat</button>}
          <button onClick={handleExportExcel} className="p-2.5 bg-white dark:bg-slate-800 border rounded-xl shadow-sm hover:bg-slate-50 transition-all"><Download size={18}/></button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-accent text-white border-b border-slate-100 dark:border-slate-800">
            <tr className="text-[10px] font-black uppercase tracking-widest">
              <th className="px-8 py-5">Aperçu</th>
              <th className="px-8 py-5">Désignation</th>
              <th className="px-8 py-5">Catégorie</th>
              <th className="px-8 py-5 text-center">Stock</th>
              <th className="px-8 py-5 text-right">Prix</th>
              {canManage && <th className="px-8 py-5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredProducts.map((p) => {
              const isLowStock = p.stock <= (p.lowStockThreshold || 10);
              return (
                <tr key={p.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group ${isLowStock ? 'bg-rose-50/20 dark:bg-rose-900/5' : ''}`}>
                  <td className="px-8 py-6">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                      {p.image ? (
                        <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                      ) : (
                        <Coffee size={18} className="text-slate-300" />
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center">
                       {isLowStock && <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-3 animate-pulse shadow-[0_0_8px_#ef4444]"></div>}
                       <span className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-accent">{p.category}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-3 py-1 rounded-xl text-xs font-black ${isLowStock ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 ring-1 ring-rose-500/20' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-accent">{p.price.toLocaleString()} {config.currency}</td>
                  {canManage && (
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEditModal(p)} className="p-2 text-slate-400 hover:text-accent transition-colors"><Edit3 size={16} /></button>
                        <button onClick={() => setDeleteConfirm({ id: p.id, name: p.name })} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="py-20 text-center opacity-30">
                  <Package size={48} className="mx-auto mb-4" />
                  <p className="font-black uppercase text-sm tracking-widest">{showOnlyAlerts ? "Aucune alerte de stock" : "Aucun article trouvé"}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
