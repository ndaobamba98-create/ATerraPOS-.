
import React, { useState, useMemo } from 'react';
import { Expense, Supplier, ERPConfig, Purchase, Product, Attachment } from '../types';
import { 
  Plus, Search, Download, Trash2, Edit3, X, Wallet, Calendar, Banknote, 
  ArrowDownRight, PieChart as PieIcon, ShoppingBag, Eye, Printer, 
  ArrowRight, TrendingDown, Coffee, Truck, Zap, ChevronRight, BarChart2, Paperclip, FileText, Image as ImageIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import * as XLSX from 'xlsx';

interface Props {
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  purchases: Purchase[];
  onAddPurchase: (purchase: Purchase) => void;
  onDeletePurchase: (id: string) => void;
  suppliers: Supplier[];
  setSuppliers: (suppliers: Supplier[]) => void;
  products: Product[];
  config: ERPConfig;
  userRole: string;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  t: (key: any) => string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Achats Marchandises': '#8b5cf6',
  'Salaires': '#3b82f6',
  'Loyer': '#ef4444',
  'Électricité/Eau': '#10b981',
  'Maintenance': '#f59e0b',
  'Marketing': '#ec4899',
  'Divers': '#64748b'
};

const Expenses: React.FC<Props> = ({ expenses, setExpenses, config, notify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Tous');
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  
  // Nouveaux états pour le filtrage par date
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Début du mois par défaut
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Partial<Expense> | null>(null);

  const expenseCategories: Expense['category'][] = ['Loyer', 'Électricité/Eau', 'Salaires', 'Marketing', 'Maintenance', 'Divers', 'Achats Marchandises'];

  const stats = useMemo(() => {
    const now = new Date();
    const monthlyExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const spentMonth = monthlyExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    const catMap: Record<string, number> = {};
    monthlyExpenses.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });
    const categoryChartData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

    return { month: spentMonth, categoryChartData };
  }, [expenses]);

  const barChartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const total = expenses
        .filter(e => e.date === dateStr)
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { 
        date: d.toLocaleDateString('fr-FR', { weekday: 'short' }), 
        amount: total
      };
    }).reverse();
  }, [expenses]);

  const filteredExpenses = useMemo(() => expenses.filter(exp => 
    (exp.description.toLowerCase().includes(searchTerm.toLowerCase()) || exp.category.toLowerCase().includes(searchTerm.toLowerCase())) && 
    (categoryFilter === 'Tous' || exp.category === categoryFilter) &&
    (exp.date >= startDate && exp.date <= endDate)
  ).sort((a, b) => b.date.localeCompare(a.date)), [expenses, searchTerm, categoryFilter, startDate, endDate]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingExpense) return;
    
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAttachment: Attachment = {
          id: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          url: event.target?.result as string
        };
        setEditingExpense(prev => ({
          ...prev,
          attachments: [...(prev?.attachments || []), newAttachment]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setEditingExpense(prev => ({
      ...prev,
      attachments: prev?.attachments?.filter(a => a.id !== id)
    }));
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editingExpense.description || !editingExpense.amount) return;

    const isEdit = !!editingExpense.id;
    const expenseData = { 
      ...editingExpense, 
      id: editingExpense.id || `EXP-${Date.now()}`, 
      date: editingExpense.date || new Date().toISOString().split('T')[0],
      paymentMethod: editingExpense.paymentMethod || 'Especes',
      status: 'paid',
      attachments: editingExpense.attachments || []
    } as Expense;

    if (isEdit) {
      setExpenses(expenses.map(exp => exp.id === expenseData.id ? expenseData : exp));
      notify("Écriture mise à jour", "La dépense et ses justificatifs ont été modifiés.", "success");
    } else {
      setExpenses([expenseData, ...expenses]);
      notify("Dépense Enregistrée", `${expenseData.amount.toLocaleString()} ${config.currency}`, "success");
    }

    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense({ ...expense });
    setIsExpenseModalOpen(true);
  };

  const openAddModal = () => {
    setEditingExpense({ 
      date: new Date().toISOString().split('T')[0], 
      category: 'Divers', 
      paymentMethod: 'Especes',
      description: '',
      attachments: []
    });
    setIsExpenseModalOpen(true);
  };

  return (
    <div className="h-full space-y-8 animate-fadeIn pb-10 pr-2 overflow-y-auto scrollbar-hide">
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Journal de Caisse</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Contrôle des charges et flux financiers</p>
        </div>
        
        <div className="flex items-center space-x-3">
           <button 
             onClick={() => setShowDetailedStats(!showDetailedStats)}
             className={`p-3 border rounded-2xl transition-all shadow-sm flex items-center space-x-2 text-[10px] font-black uppercase ${showDetailedStats ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-slate-800 text-slate-400'}`}
           >
             <BarChart2 size={18} />
             <span>{showDetailedStats ? 'Fermer Analyses' : 'Voir Analyses'}</span>
           </button>
           <button 
             onClick={openAddModal}
             className="bg-rose-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase shadow-xl hover:bg-rose-700 transition-all flex items-center"
           >
             <Plus size={18} className="mr-2" /> Sortie Rapide
           </button>
        </div>
      </div>

      {showDetailedStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slideDown">
           <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Répartition du Mois</h3>
                 <PieIcon size={18} className="text-purple-500" />
              </div>
              <div className="h-56 relative">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={stats.categoryChartData}
                       innerRadius={65}
                       outerRadius={85}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {stats.categoryChartData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#cbd5e1'} />
                       ))}
                     </Pie>
                     <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Total</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{stats.month.toLocaleString()}</span>
                 </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                 {stats.categoryChartData.slice(0, 4).map(c => (
                   <div key={c.name} className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: CATEGORY_COLORS[c.name]}}></div>
                      <span className="text-[9px] font-bold text-slate-500 truncate uppercase">{c.name}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8">Détails par Charge</h3>
              <div className="space-y-4 max-h-72 overflow-y-auto pr-2 scrollbar-hide">
                 {stats.categoryChartData.sort((a,b)=>b.value - a.value).map(c => (
                    <div key={c.name} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-slate-800 dark:text-white">{c.name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{((c.value / stats.month) * 100).toFixed(1)}% des frais</span>
                       </div>
                       <span className="text-sm font-black text-slate-900 dark:text-white">{c.value.toLocaleString()}</span>
                    </div>
                 ))}
              </div>
           </div>

           <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8">Flux Quotidien (7j)</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}} dy={10} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                    <Bar dataKey="amount" radius={[4, 4, 4, 4]} barSize={14}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.amount > 0 ? '#e11d48' : '#e2e8f0'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-8 border-b flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Chercher un frais..." className="w-full pl-12 pr-6 py-3 bg-white dark:bg-slate-800 border rounded-2xl text-xs outline-none focus:ring-2 focus:ring-rose-500" />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
             {/* Filtre Plage de Dates */}
             <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-2 px-4 rounded-2xl border shadow-sm">
                <Calendar size={16} className="text-rose-500" />
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-[10px] font-black uppercase outline-none" />
                <span className="text-slate-300">→</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-[10px] font-black uppercase outline-none" />
             </div>

             <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-6 py-3 bg-white dark:bg-slate-800 border rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none min-w-[180px]">
               <option value="Tous">Toutes les catégories</option>
               {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-slate-50/20">
                <th className="px-10 py-6">Date</th>
                <th className="px-10 py-6">Désignation</th>
                <th className="px-10 py-6">Catégorie</th>
                <th className="px-10 py-6 text-center">PJ</th>
                <th className="px-10 py-6 text-right">Montant Sorti</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map((e, index) => {
                const todayStr = new Date().toISOString().split('T')[0];
                const isNewDate = index === 0 || e.date !== filteredExpenses[index - 1].date;
                return (
                  <React.Fragment key={e.id}>
                    {isNewDate && (
                      <tr className="bg-slate-50 dark:bg-slate-800/30">
                        <td colSpan={6} className="px-10 py-3 text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] bg-slate-100/50 dark:bg-slate-800">
                          {e.date === todayStr ? "Aujourd'hui" : new Date(e.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </td>
                      </tr>
                    )}
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group">
                      <td className="px-10 py-6 text-[10px] font-black text-slate-400 font-mono">{e.date.split('-').reverse().join('/')}</td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase">{e.description}</span>
                          <span className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{e.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest" style={{color: CATEGORY_COLORS[e.category]}}>
                          {e.category}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-center">
                        {e.attachments && e.attachments.length > 0 && (
                          <div className="flex justify-center">
                             <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg shadow-sm">
                               <Paperclip size={14} />
                             </div>
                          </div>
                        )}
                      </td>
                      <td className="px-10 py-6 text-right font-black text-rose-600 text-base">-{e.amount.toLocaleString()}</td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(e)} className="p-2.5 text-slate-400 hover:text-purple-600 transition-colors"><Edit3 size={16} /></button>
                          <button onClick={() => {if(confirm("Supprimer cette écriture ?")) setExpenses(expenses.filter(item => item.id !== e.id))}} className="p-2.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
              {filteredExpenses.length === 0 && (
                <tr>
                   <td colSpan={6} className="py-20 text-center opacity-30">
                      <Wallet size={48} className="mx-auto mb-4" />
                      <p className="font-black uppercase text-xs tracking-widest">Aucune dépense trouvée pour cette période</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isExpenseModalOpen && editingExpense && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 animate-scaleIn">
            <div className={`p-8 ${editingExpense.id ? 'bg-purple-600' : 'bg-rose-600'} text-white flex justify-between items-center transition-colors`}>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-2xl"><Banknote size={24}/></div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">{editingExpense.id ? 'Modifier l\'écriture' : 'Sortie de Caisse'}</h3>
                  <p className="text-[10px] font-black uppercase opacity-60">Référence comptable</p>
                </div>
              </div>
              <button onClick={() => { setIsExpenseModalOpen(false); setEditingExpense(null); }} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={28}/></button>
            </div>
            
            <form onSubmit={handleSaveExpense} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Objet de la dépense</label>
                <input 
                  required 
                  autoFocus 
                  value={editingExpense.description || ''} 
                  onChange={e => setEditingExpense({...editingExpense, description: e.target.value})} 
                  placeholder="ex: Réparation clim, Achat gaz..." 
                  className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl font-bold outline-none transition-all ${editingExpense.id ? 'focus:border-purple-500' : 'focus:border-rose-500'}`} 
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Montant ({config.currency})</label>
                  <input 
                    type="number" 
                    required 
                    value={editingExpense.amount ?? ''} 
                    onChange={e => setEditingExpense({...editingExpense, amount: parseFloat(e.target.value) || 0})} 
                    className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl font-black text-2xl outline-none transition-all ${editingExpense.id ? 'text-purple-600 focus:border-purple-500' : 'text-rose-600 focus:border-rose-500'}`} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Catégorie</label>
                  <select 
                    value={editingExpense.category} 
                    onChange={e => setEditingExpense({...editingExpense, category: e.target.value as any})} 
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none appearance-none"
                  >
                    {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* SECTION PIÈCES JOINTES */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center">
                    <Paperclip size={14} className="mr-2" /> Justificatifs (Reçu, Facture)
                  </label>
                  <label className="cursor-pointer bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-[10px] font-black text-purple-600 uppercase hover:bg-purple-600 hover:text-white transition-all">
                    Ajouter
                    <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {editingExpense.attachments?.map((file) => (
                     <div key={file.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between group">
                        <div className="flex items-center space-x-3 overflow-hidden">
                           {file.type.startsWith('image/') ? <ImageIcon size={16} className="text-purple-500 shrink-0" /> : <FileText size={16} className="text-blue-500 shrink-0" />}
                           <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold truncate hover:text-purple-600">{file.name}</a>
                        </div>
                        <button type="button" onClick={() => removeAttachment(file.id)} className="p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14}/></button>
                     </div>
                   ))}
                </div>
              </div>

              <button type="submit" className={`w-full py-5 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center ${editingExpense.id ? 'bg-purple-600' : 'bg-rose-600'}`}>
                {editingExpense.id ? 'Mettre à jour' : 'Confirmer la Sortie'} <ArrowRight size={18} className="ml-3" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
