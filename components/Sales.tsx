
import React, { useState, useMemo } from 'react';
import { SaleOrder, ERPConfig, Product, Expense, ViewType, PaymentMethod, User, SaleItem } from '../types';
import { 
  ShoppingCart, Filter, Download, Plus, CheckCircle2, Clock, Truck, X, Printer, Mail, 
  RotateCcw, Calendar, Trash2, AlertTriangle, Banknote, FileText, Search, 
  Package, PlusCircle, MinusCircle, QrCode, CreditCard, Smartphone, Wallet, 
  FileDown, Eye, ArrowUpRight, ArrowDownLeft, Edit3, Save, History, UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  sales: SaleOrder[];
  expenses?: Expense[];
  onUpdate: (sales: SaleOrder[]) => void;
  onRefundSale: (saleId: string) => void;
  config: ERPConfig;
  products: Product[];
  userRole: string;
  currentUser: User;
  onAddSale: (sale: Partial<SaleOrder>) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  userPermissions: any;
  t: (key: any) => string;
}

const Sales: React.FC<Props> = ({ sales, expenses = [], onUpdate, onRefundSale, config, products, userRole, currentUser, notify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSale, setEditingSale] = useState<SaleOrder | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const date = s.date.substring(0, 10);
      const matchesSearch = s.customer.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = date >= startDate && date <= endDate;
      return matchesSearch && matchesDate;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [sales, searchTerm, startDate, endDate]);

  const handleUpdateSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;

    const updatedTotal = editingSale.items?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0;
    const finalSale = { ...editingSale, total: updatedTotal };

    onUpdate(sales.map(s => s.id === finalSale.id ? finalSale : s));
    setEditingSale(null);
    notify("Vente modifiée", `La commande #${finalSale.id.slice(-6)} a été mise à jour.`, "success");
  };

  const adjustItemQty = (productId: string, delta: number) => {
    if (!editingSale) return;
    const updatedItems = editingSale.items?.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }) || [];
    setEditingSale({ ...editingSale, items: updatedItems });
  };

  const removeItem = (productId: string) => {
    if (!editingSale) return;
    setEditingSale({
      ...editingSale,
      items: editingSale.items?.filter(i => i.productId !== productId)
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24 pr-2">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center space-x-6">
           <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl"><History size={28} /></div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Journal des Ventes</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Gestion, annulation et rectification des tickets</p>
           </div>
        </div>
        
        <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <Calendar size={16} className="text-purple-600 ml-2" />
           <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-[10px] font-black uppercase outline-none" />
           <span className="text-slate-300">→</span>
           <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-[10px] font-black uppercase outline-none" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex-1">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30">
          <div className="relative w-full max-w-xl">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher un ticket (Client, N°...)" className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-slate-800 border-none rounded-2xl text-xs font-bold outline-none shadow-sm focus:ring-2 focus:ring-purple-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
               <tr className="bg-slate-900 text-white">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Date / Heure</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Référence</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Client / Zone</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Paiement</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Total TTC</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group ${sale.status === 'refunded' ? 'bg-rose-50/10 grayscale-[0.3]' : ''}`}>
                  <td className="px-8 py-6">
                    <div className="flex flex-col text-[10px] font-black uppercase text-slate-400">
                      <span>{sale.date.split('T')[0]}</span>
                      <span className="text-[9px] text-slate-300">{new Date(sale.date).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-mono font-black text-purple-600">
                    <span className={sale.status === 'refunded' ? 'line-through text-rose-400' : ''}>#{sale.id.slice(-8)}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                       <span className={`text-sm font-black uppercase ${sale.status === 'refunded' ? 'line-through text-slate-300' : 'text-slate-800 dark:text-slate-200'}`}>{sale.customer}</span>
                       <span className="text-[9px] font-bold text-slate-400 uppercase">{sale.orderLocation || 'Comptoir'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[8px] font-black uppercase text-slate-500">
                      {sale.paymentMethod || 'Non défini'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-sm">
                    <span className={sale.status === 'refunded' ? 'text-rose-300 line-through' : 'text-slate-900 dark:text-white'}>
                      {sale.total.toLocaleString()} {config.currency}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                       {sale.status !== 'refunded' && (
                         <>
                           {canEdit && (
                             <button onClick={() => setEditingSale(sale)} className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm" title="Modifier la commande">
                               <Edit3 size={18} />
                             </button>
                           )}
                           <button onClick={() => { if(confirm("Confirmer le remboursement intégral de cette vente ?")) onRefundSale(sale.id); }} className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm" title="Rembourser / Annuler">
                             <RotateCcw size={18} />
                           </button>
                         </>
                       )}
                       {sale.status === 'refunded' && (
                         <span className="text-[8px] font-black text-rose-500 uppercase bg-rose-50 px-2 py-1 rounded-md border border-rose-100">ANNULÉ / AVOIR</span>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALE D'ÉDITION DE VENTE */}
      {editingSale && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-scaleIn">
             <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center space-x-4">
                   <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><Edit3 size={24}/></div>
                   <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter">Rectifier Vente</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase">#{editingSale.id.slice(-8)}</p>
                   </div>
                </div>
                <button onClick={() => setEditingSale(null)}><X size={28} className="text-slate-400 hover:text-rose-500"/></button>
             </div>
             
             <form onSubmit={handleUpdateSale} className="p-10 space-y-6">
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-4 scrollbar-hide">
                   {editingSale.items?.map((item) => (
                     <div key={item.productId} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex-1">
                           <p className="text-xs font-black uppercase text-slate-800 dark:text-white">{item.name}</p>
                           <p className="text-[10px] font-bold text-slate-400">Prix Unit: {item.price} {config.currency}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                           <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl p-1 shadow-sm border">
                              <button type="button" onClick={() => adjustItemQty(item.productId, -1)} className="p-1.5 text-slate-400 hover:text-rose-500"><MinusCircle size={18}/></button>
                              <span className="px-3 font-black text-sm">{item.quantity}</span>
                              <button type="button" onClick={() => adjustItemQty(item.productId, 1)} className="p-1.5 text-slate-400 hover:text-blue-600"><PlusCircle size={18}/></button>
                           </div>
                           <button type="button" onClick={() => removeItem(item.productId)} className="text-rose-300 hover:text-rose-600"><Trash2 size={18}/></button>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400">Mode de paiement</label>
                      <select 
                        value={editingSale.paymentMethod} 
                        onChange={e => setEditingSale({...editingSale, paymentMethod: e.target.value as any})}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold border-none outline-none"
                      >
                         <option value="Especes">Espèces</option>
                         <option value="Bankily">Bankily</option>
                         <option value="Masrvi">Masrvi</option>
                         <option value="Carte">Carte Bancaire</option>
                      </select>
                   </div>
                   <div className="text-right flex flex-col justify-end">
                      <p className="text-[10px] font-black uppercase text-slate-400">Nouveau Total</p>
                      <p className="text-3xl font-black text-blue-600">
                        {editingSale.items?.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()} <span className="text-sm">{config.currency}</span>
                      </p>
                   </div>
                </div>

                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-xs shadow-xl flex items-center justify-center">
                   <Save size={18} className="mr-3" /> Enregistrer les rectifications
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
