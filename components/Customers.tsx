
import React, { useState, useMemo } from 'react';
import { Customer, ERPConfig, ViewType } from '../types';
import { Users, Search, Plus, Edit3, Trash2, X, Download, Save, Phone, Mail, ArrowUpRight, ArrowDownLeft, FileSpreadsheet, AlertCircle, UserCircle2, CheckSquare, Square } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  customers: Customer[];
  onUpdate: (customers: Customer[]) => void;
  config: ERPConfig;
  userRole: string;
  userPermissions: ViewType[];
  t: (key: any) => string;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

const Customers: React.FC<Props> = ({ customers, onUpdate, config, userRole, userPermissions, t, notify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'debtors' | 'creditors'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const canManage = userPermissions.includes('manage_customers') || userRole === 'admin';

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm);
      
      if (filterType === 'debtors') return matchesSearch && c.balance < 0;
      if (filterType === 'creditors') return matchesSearch && c.balance > 0;
      return matchesSearch;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, searchTerm, filterType]);

  const globalStats = useMemo(() => {
    const totalDettes = Math.abs(customers.filter(c => c.balance < 0).reduce((acc, c) => acc + c.balance, 0));
    const totalCredits = customers.filter(c => c.balance > 0).reduce((acc, c) => acc + c.balance, 0);
    return { totalDettes, totalCredits };
  }, [customers]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCustomers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCustomers.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = () => {
    if (confirm(`Supprimer définitivement les ${selectedIds.length} comptes sélectionnés ?`)) {
      onUpdate(customers.filter(c => !selectedIds.includes(c.id)));
      setSelectedIds([]);
      notify("Suppression", `${selectedIds.length} comptes supprimés avec succès.`, "info");
    }
  };

  const handleOpenAddModal = () => {
    setEditingCustomer({
      id: `C-${Date.now()}`,
      name: '',
      phone: '',
      email: '',
      balance: 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.name || !editingCustomer.phone) return;

    const customerToSave = editingCustomer as Customer;
    const exists = customers.find(c => c.id === customerToSave.id);

    if (exists) {
      onUpdate(customers.map(c => c.id === customerToSave.id ? customerToSave : c));
    } else {
      onUpdate([customerToSave, ...customers]);
    }
    
    setIsModalOpen(false);
    setEditingCustomer(null);
    notify("Compte Client", "Les informations ont été enregistrées.", "success");
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    if (confirm(`Supprimer définitivement le compte de "${name}" ?`)) {
      onUpdate(customers.filter(c => c.id !== id));
      setSelectedIds(prev => prev.filter(i => i !== id));
      notify("Suppression", "Compte client supprimé.", "info");
    }
  };

  const handleExportExcel = () => {
    const data = filteredCustomers.map(c => ({
      'Nom': c.name,
      'Téléphone': c.phone,
      'Email': c.email || 'N/A',
      'Solde': c.balance,
      'État': c.balance === 0 ? 'À JOUR' : c.balance > 0 ? 'CRÉDIT' : 'DETTE'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");
    XLSX.writeFile(workbook, `Liste_Clients_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20 pr-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Comptes Clients</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Gestion des crédits et arriérés clients</p>
        </div>
        <div className="flex items-center space-x-3">
           {selectedIds.length > 0 && canManage && (
             <button onClick={handleBulkDelete} className="bg-rose-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all flex items-center animate-bounce">
               <Trash2 size={16} className="mr-2" /> Supprimer ({selectedIds.length})
             </button>
           )}
           <button onClick={handleExportExcel} className="p-3.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:bg-slate-50 transition-all">
             <FileSpreadsheet size={22} className="text-emerald-600" />
           </button>
           {canManage && (
             <button onClick={handleOpenAddModal} className="bg-purple-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-purple-700 transition-all flex items-center">
               <Plus size={20} className="mr-2" /> Nouveau Compte
             </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm flex items-center space-x-6">
            <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl"><ArrowUpRight size={24}/></div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Crédits Clients</p>
               <p className="text-2xl font-black">{globalStats.totalCredits.toLocaleString()} <span className="text-xs opacity-40">{config.currency}</span></p>
            </div>
         </div>
         <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm flex items-center space-x-6">
            <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl"><ArrowDownLeft size={24}/></div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arriérés (Dettes)</p>
               <p className="text-2xl font-black">{globalStats.totalDettes.toLocaleString()} <span className="text-xs opacity-40">{config.currency}</span></p>
            </div>
         </div>
         <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex items-center space-x-6 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-all"></div>
            <div className="p-4 bg-white/10 rounded-2xl"><Users size={24}/></div>
            <div className="relative z-10">
               <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Total Portefeuille</p>
               <p className="text-2xl font-black">{customers.length} Clients actifs</p>
            </div>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Chercher par nom ou numéro..." className="w-full pl-14 pr-8 py-4 bg-white dark:bg-slate-800 border-none rounded-2xl text-xs font-bold outline-none shadow-sm transition-all focus:ring-2 focus:ring-purple-500" />
          </div>
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border">
             <button onClick={() => setFilterType('all')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterType === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>Tous</button>
             <button onClick={() => setFilterType('debtors')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterType === 'debtors' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}>Débiteurs</button>
             <button onClick={() => setFilterType('creditors')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterType === 'creditors' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Créditeurs</button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-slate-50/20">
                <th className="px-10 py-6 w-12">
                   <button onClick={toggleSelectAll} className="p-1 rounded-md text-slate-400 hover:bg-slate-100">
                      {selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0 ? <CheckSquare size={18} className="text-purple-600" /> : <Square size={18} />}
                   </button>
                </th>
                <th className="px-4 py-6">Profil Client</th>
                <th className="px-10 py-6">Coordonnées</th>
                <th className="px-10 py-6 text-right">Solde Compte</th>
                <th className="px-10 py-6 text-center">État</th>
                {canManage && <th className="px-10 py-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-all group ${selectedIds.includes(c.id) ? 'bg-purple-50/30 dark:bg-purple-900/10' : ''}`}>
                  <td className="px-10 py-6">
                     <button onClick={() => toggleSelect(c.id)} className="p-1 rounded-md text-slate-300 hover:text-purple-600">
                        {selectedIds.includes(c.id) ? <CheckSquare size={18} className="text-purple-600" /> : <Square size={18} />}
                     </button>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center font-black text-lg">
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">{c.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Réf: {c.id.slice(-6)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                        <Phone size={12} className="mr-2 text-slate-400" /> {c.phone}
                      </div>
                      {c.email && (
                        <div className="flex items-center text-[10px] font-bold text-slate-400">
                          <Mail size={12} className="mr-2" /> {c.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <span className={`text-base font-black ${c.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {c.balance.toLocaleString()} <span className="text-[10px] opacity-40">{config.currency}</span>
                    </span>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 ${c.balance === 0 ? 'bg-slate-50 border-slate-100 text-slate-400' : c.balance > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                      {c.balance === 0 ? 'À Jour' : c.balance > 0 ? 'Créditeur' : 'Débiteur'}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => handleOpenEditModal(c)} className="p-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm">
                          <Edit3 size={18} />
                        </button>
                        <button onClick={() => handleDeleteCustomer(c.id, c.name)} className="p-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && (
             <div className="py-20 text-center opacity-30">
                <Users size={64} className="mx-auto mb-4" />
                <p className="font-black uppercase text-sm tracking-[0.2em]">Aucun compte client trouvé</p>
             </div>
          )}
        </div>
      </div>

      {isModalOpen && editingCustomer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 animate-scaleIn">
            <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
               <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg"><UserCircle2 size={24}/></div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Fiche Compte Client</h3>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all"><X size={28}/></button>
            </div>
            
            <form onSubmit={handleSaveCustomer} className="p-10 space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nom complet du client</label>
                  <input required autoFocus value={editingCustomer.name || ''} onChange={e => setEditingCustomer({...editingCustomer, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl font-black outline-none transition-all" placeholder="ex: Sidi El Moctar" />
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Téléphone Mobile</label>
                    <input required value={editingCustomer.phone || ''} onChange={e => setEditingCustomer({...editingCustomer, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl font-black outline-none transition-all" placeholder="44XXXXXX" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Solde Initial</label>
                    <input type="number" value={editingCustomer.balance ?? ''} onChange={e => setEditingCustomer({...editingCustomer, balance: parseFloat(e.target.value) || 0})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl font-black outline-none transition-all text-purple-600" />
                 </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email (Optionnel)</label>
                  <input type="email" value={editingCustomer.email || ''} onChange={e => setEditingCustomer({...editingCustomer, email: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl font-black outline-none transition-all" placeholder="client@domaine.com" />
               </div>

               <div className="bg-slate-900 text-white p-6 rounded-3xl border border-white/10 flex items-center space-x-4">
                  <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl"><AlertCircle size={24}/></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
                    Un solde négatif signifie que le client doit de l'argent à l'établissement. Un solde positif est une avance (crédit).
                  </p>
               </div>

               <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center">
                  <Save size={18} className="mr-3" /> Enregistrer le compte
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
