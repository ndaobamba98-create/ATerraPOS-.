
import React, { useState, useMemo } from 'react';
import { SaleOrder, ERPConfig, Product, Expense, ViewType, PaymentMethod, User, SaleItem, EventDetails } from '../types';
import { 
  ShoppingCart, Filter, Download, Plus, Minus, CheckCircle2, Clock, Truck, X, Printer, Mail, 
  RotateCcw, Calendar, Trash2, AlertTriangle, Banknote, FileText, Search, 
  Package, PlusCircle, MinusCircle, QrCode, CreditCard, Smartphone, Wallet, 
  FileDown, Eye, ArrowUpRight, ArrowDownLeft, Edit3, Save, History, UserCheck, FileCheck, FileSignature, MapPin, Users, Info
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

const Sales: React.FC<Props> = ({ sales, expenses = [], onUpdate, onRefundSale, config, products, userRole, currentUser, onAddSale, notify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSale, setEditingSale] = useState<Partial<SaleOrder> | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'confirmed' | 'quotation'>('all');

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const date = s.date.substring(0, 10);
      const matchesSearch = s.customer.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = date >= startDate && date <= endDate;
      const matchesType = activeFilter === 'all' || (activeFilter === 'confirmed' && s.status !== 'quotation') || (activeFilter === 'quotation' && s.status === 'quotation');
      return matchesSearch && matchesDate && matchesType;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [sales, searchTerm, startDate, endDate, activeFilter]);

  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;

    const updatedTotal = editingSale.items?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0;
    const finalSale = { 
      ...editingSale, 
      total: updatedTotal,
      date: editingSale.date || new Date().toISOString(),
      status: editingSale.status || 'quotation',
      customer: editingSale.customer || 'Client Divers'
    } as SaleOrder;

    if (sales.find(s => s.id === finalSale.id)) {
      onUpdate(sales.map(s => s.id === finalSale.id ? finalSale : s));
      notify("Document mis à jour", `Le document ${finalSale.id} a été enregistré.`, "success");
    } else {
      onAddSale(finalSale);
      notify("Devis Créé", `Nouveau devis enregistré.`, "success");
    }
    setEditingSale(null);
  };

  const convertToInvoice = (sale: SaleOrder) => {
    if (confirm("Transformer ce devis en facture confirmée ?")) {
      const updatedSale: SaleOrder = { 
        ...sale, 
        status: 'confirmed', 
        invoiceStatus: 'posted',
        date: new Date().toISOString() 
      };
      onUpdate(sales.map(s => s.id === sale.id ? updatedSale : s));
      notify("Conversion réussie", "Le devis est maintenant une facture confirmée.", "success");
    }
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

  const addItemToSale = (p: Product) => {
    if (!editingSale) return;
    const items = [...(editingSale.items || [])];
    const exists = items.find(i => i.productId === p.id);
    if (exists) {
      exists.quantity += 1;
    } else {
      items.push({ productId: p.id, name: p.name, quantity: 1, price: p.price });
    }
    setEditingSale({ ...editingSale, items });
  };

  const startEventReservation = () => {
    setEditingSale({ 
      id: `RES-${Date.now()}`, 
      status: 'quotation', 
      items: [], 
      customer: '', 
      date: new Date().toISOString(),
      eventDetails: {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'Mariage',
        location: '',
        guests: 50,
        notes: ''
      }
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24 pr-2">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center space-x-6">
           <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl"><History size={28} /></div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Ventes & Réservations</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Gestion du cycle commercial et événementiel</p>
           </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border shadow-sm">
             <button onClick={() => setActiveFilter('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Tous</button>
             <button onClick={() => setActiveFilter('quotation')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeFilter === 'quotation' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Devis / Resa</button>
             <button onClick={() => setActiveFilter('confirmed')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeFilter === 'confirmed' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Factures</button>
          </div>
          <button onClick={startEventReservation} className="bg-purple-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center hover:bg-purple-700">
             <PlusCircle size={18} className="mr-2" /> Réserver Événement
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex-1">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-md">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher (Client, N°...)" className="w-full pl-12 pr-6 py-3 bg-white dark:bg-slate-800 border-none rounded-2xl text-xs font-bold outline-none shadow-sm" />
          </div>
          <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 p-2 rounded-2xl border shadow-sm">
             <Calendar size={14} className="text-purple-600 ml-2" />
             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-[9px] font-black uppercase outline-none" />
             <span className="text-slate-300">→</span>
             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-[9px] font-black uppercase outline-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
               <tr className="bg-slate-900 text-white">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Document</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Client</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Catégorie</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Total TTC</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                       <span className="text-xs font-mono font-black text-purple-600">#{sale.id.slice(-8)}</span>
                       <span className="text-[9px] font-bold text-slate-400">{new Date(sale.date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-black uppercase text-slate-800 dark:text-slate-200">{sale.customer}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${sale.status === 'quotation' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                        {sale.status === 'quotation' ? (sale.eventDetails ? 'Réservation' : 'Devis') : 'Facture'}
                      </span>
                      {sale.eventDetails && (
                        <span className="text-[7px] font-black text-slate-400 uppercase mt-1">🗓 {new Date(sale.eventDetails.date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-sm">
                    {sale.total.toLocaleString()} {config.currency}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                       {sale.status === 'quotation' && (
                         <button onClick={() => convertToInvoice(sale)} className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm" title="Convertir en Facture">
                           <FileCheck size={18} />
                         </button>
                       )}
                       <button onClick={() => setEditingSale(sale)} className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm" title="Modifier">
                         <Edit3 size={18} />
                       </button>
                       {sale.status !== 'refunded' && sale.status !== 'quotation' && (
                         <button onClick={() => { if(confirm("Annuler cette vente ?")) onRefundSale(sale.id); }} className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm">
                           <RotateCcw size={18} />
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALE D'ÉDITION DE DEVIS / VENTE / RÉSERVATION */}
      {editingSale && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-scaleIn flex flex-col md:flex-row h-[92vh]">
             {/* Panneau de gauche: Sélection produits */}
             <div className="w-full md:w-1/3 border-r dark:border-slate-800 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                <div className="p-6 border-b dark:border-slate-800 bg-white dark:bg-slate-800/30">
                   <h3 className="font-black uppercase text-xs mb-4">Articles du Menu</h3>
                   <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <input type="text" placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs border-none shadow-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 gap-2 scrollbar-hide">
                   {products.map(p => (
                     <button key={p.id} onClick={() => addItemToSale(p)} className="p-3 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-between hover:border-purple-400 border-2 border-transparent transition-all group text-left shadow-sm">
                        <div className="flex flex-col min-w-0">
                           <span className="text-[10px] font-black uppercase truncate text-slate-700 dark:text-white group-hover:text-purple-600">{p.name}</span>
                           <span className="text-[8px] font-bold text-slate-400">{p.price} {config.currency}</span>
                        </div>
                        <Plus size={14} className="text-slate-300 group-hover:text-purple-600 shrink-0 ml-2"/>
                     </button>
                   ))}
                </div>
             </div>

             {/* Panneau de droite: Détails du document */}
             <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
                <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                   <div>
                      <h3 className="text-lg font-black uppercase tracking-tighter">
                         {editingSale.status === 'quotation' ? (editingSale.eventDetails ? 'Réservation Événement' : 'Nouveau Devis') : 'Édition Facture'}
                      </h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Document #{editingSale.id?.slice(-8)}</p>
                   </div>
                   <button onClick={() => setEditingSale(null)} className="p-2 hover:bg-rose-50 rounded-full transition-colors"><X size={24} className="text-slate-400"/></button>
                </div>
                
                <form onSubmit={handleSaveSale} className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Bénéficiaire</label>
                         <input required value={editingSale.customer} onChange={e => setEditingSale({...editingSale, customer: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-xs" placeholder="Nom du client..." />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Émission du document</label>
                         <input type="date" value={editingSale.date?.split('T')[0]} onChange={e => setEditingSale({...editingSale, date: new Date(e.target.value).toISOString()})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-xs" />
                      </div>
                   </div>

                   {/* SECTION ÉVÉNEMENT SPÉCIFIQUE */}
                   {editingSale.eventDetails && (
                     <div className="p-5 bg-purple-50 dark:bg-purple-900/10 rounded-3xl border border-purple-100 dark:border-purple-800/50 space-y-4">
                        <div className="flex items-center space-x-2 text-purple-600 mb-2">
                           <FileSignature size={16} />
                           <h4 className="text-[10px] font-black uppercase tracking-widest">Détails de la Réservation</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <div className="space-y-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase">Date Événement</label>
                              <div className="relative">
                                <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400"/>
                                <input type="date" value={editingSale.eventDetails.date} onChange={e => setEditingSale({...editingSale, eventDetails: {...editingSale.eventDetails!, date: e.target.value}})} className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 rounded-lg text-[10px] font-bold outline-none" />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase">Type</label>
                              <select value={editingSale.eventDetails.type} onChange={e => setEditingSale({...editingSale, eventDetails: {...editingSale.eventDetails!, type: e.target.value}})} className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-lg text-[10px] font-bold outline-none">
                                 <option>Mariage</option><option>Baptême</option><option>Anniversaire</option><option>Séminaire</option><option>Autre</option>
                              </select>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase">Convives</label>
                              <div className="relative">
                                <Users size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400"/>
                                <input type="number" value={editingSale.eventDetails.guests} onChange={e => setEditingSale({...editingSale, eventDetails: {...editingSale.eventDetails!, guests: parseInt(e.target.value)}})} className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 rounded-lg text-[10px] font-bold outline-none" />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase">Lieu</label>
                              <div className="relative">
                                <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400"/>
                                <input placeholder="Salle..." value={editingSale.eventDetails.location} onChange={e => setEditingSale({...editingSale, eventDetails: {...editingSale.eventDetails!, location: e.target.value}})} className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 rounded-lg text-[10px] font-bold outline-none" />
                              </div>
                           </div>
                        </div>
                     </div>
                   )}

                   <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                      <p className="text-[9px] font-black uppercase text-slate-400 border-b pb-2 flex items-center justify-between">
                         Lignes de Commande
                         <span className="text-purple-600">{editingSale.items?.length || 0} Article(s)</span>
                      </p>
                      {editingSale.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border group hover:border-purple-200 transition-colors">
                           <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black uppercase truncate">{item.name}</p>
                              <p className="text-[8px] font-bold text-slate-400">{item.price} {config.currency}</p>
                           </div>
                           <div className="flex items-center space-x-3">
                              <button type="button" onClick={() => adjustItemQty(item.productId, -1)} className="p-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm hover:text-rose-500"><Minus size={12}/></button>
                              <span className="font-black text-xs w-4 text-center">{item.quantity}</span>
                              <button type="button" onClick={() => adjustItemQty(item.productId, 1)} className="p-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm hover:text-purple-600"><Plus size={12}/></button>
                              <button type="button" onClick={() => setEditingSale({...editingSale, items: editingSale.items?.filter(i => i.productId !== item.productId)})} className="text-slate-300 hover:text-rose-500 ml-2 transition-colors"><Trash2 size={14}/></button>
                           </div>
                        </div>
                      ))}
                      {editingSale.items?.length === 0 && (
                        <div className="h-48 flex flex-col items-center justify-center opacity-20">
                           <ShoppingCart size={32}/>
                           <p className="text-[9px] font-black uppercase mt-2">Aucun article</p>
                        </div>
                      )}
                   </div>

                   <div className="pt-6 border-t dark:border-slate-800 flex items-center justify-between">
                      <div className="flex flex-col">
                         <span className="text-[9px] font-black uppercase text-slate-400">Total {editingSale.status === 'quotation' ? 'Estimé' : 'HT'}</span>
                         <span className="text-2xl font-black text-purple-600">{(editingSale.items?.reduce((acc, i) => acc + i.price * i.quantity, 0) || 0).toLocaleString()} <span className="text-xs">{config.currency}</span></span>
                      </div>
                      <div className="flex items-center space-x-3">
                         <button type="button" onClick={() => setEditingSale(null)} className="px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black uppercase text-[9px]">Annuler</button>
                         <button type="submit" className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center hover:bg-black">
                            <Save size={18} className="mr-3" /> Enregistrer le document
                         </button>
                      </div>
                   </div>
                </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
