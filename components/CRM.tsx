
import React, { useState, useMemo } from 'react';
import { Lead, ERPConfig } from '../types';
import { INITIAL_LEADS } from '../constants';
import { 
  Trophy, Search, Plus, Target, DollarSign, Filter, ChevronRight, 
  Mail, Phone, AlertCircle, TrendingUp, CheckCircle, Clock, X, Save, Edit3, Trash2
} from 'lucide-react';

const STAGES = [
  { id: 'new', label: 'Nouveau', color: 'bg-slate-400' },
  { id: 'qualified', label: 'Qualifié', color: 'bg-blue-500' },
  { id: 'proposition', label: 'Proposition', color: 'bg-purple-600' },
  { id: 'won', label: 'Gagné', color: 'bg-emerald-500' },
  { id: 'lost', label: 'Perdu', color: 'bg-rose-500' }
];

const CRM: React.FC<{ config: ERPConfig, notify: any }> = ({ config, notify }) => {
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('erp_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Partial<Lead> | null>(null);

  const filteredLeads = useMemo(() => {
    return leads.filter(l => 
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.contact.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leads, searchTerm]);

  const totalRevenue = useMemo(() => 
    leads.filter(l => l.stage !== 'lost').reduce((acc, curr) => acc + curr.revenue, 0)
  , [leads]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead?.title) return;
    
    const newLead = { 
      ...editingLead, 
      id: editingLead.id || `L-${Date.now()}`,
      stage: editingLead.stage || 'new',
      revenue: editingLead.revenue || 0,
      priority: editingLead.priority || 'medium'
    } as Lead;

    const updated = leads.find(l => l.id === newLead.id)
      ? leads.map(l => l.id === newLead.id ? newLead : l)
      : [newLead, ...leads];

    setLeads(updated);
    localStorage.setItem('erp_leads', JSON.stringify(updated));
    setIsModalOpen(false);
    setEditingLead(null);
    notify("CRM", "Opportunité enregistrée.", "success");
  };

  const deleteLead = (id: string) => {
    if (confirm("Supprimer cette opportunité ?")) {
      const updated = leads.filter(l => l.id !== id);
      setLeads(updated);
      localStorage.setItem('erp_leads', JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20 pr-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">CRM & Ventes</h1>
          <p className="text-sm text-slate-500 font-medium">Pipeline des opportunités commerciales</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] shadow-xl flex items-center space-x-6">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Pipeline Total</span>
              <span className="text-xl font-black">{totalRevenue.toLocaleString()} {config.currency}</span>
            </div>
            <div className="w-px h-8 bg-slate-800"></div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Won Deals</span>
              <span className="text-xl font-black">{leads.filter(l => l.stage === 'won').length}</span>
            </div>
          </div>
          <button onClick={() => { setEditingLead({ title: '', stage: 'new', revenue: 0 }); setIsModalOpen(true); }} className="bg-purple-600 text-white p-4 rounded-2xl shadow-lg hover:bg-purple-700 transition-all">
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-full">
        {STAGES.map(stage => (
          <div key={stage.id} className="flex flex-col space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${stage.color}`}></div>
                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{stage.label}</h3>
              </div>
              <span className="text-[10px] font-black text-slate-400">{filteredLeads.filter(l => l.stage === stage.id).length}</span>
            </div>
            
            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 min-h-[500px] flex flex-col space-y-3">
              {filteredLeads.filter(l => l.stage === stage.id).map(lead => (
                <div key={lead.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-purple-300 group transition-all">
                   <div className="flex flex-col space-y-3">
                      <div className="flex justify-between items-start">
                         <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white leading-tight">{lead.title}</h4>
                         <button onClick={() => deleteLead(lead.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">{lead.contact}</p>
                        <p className="text-[9px] font-black text-purple-600">{lead.revenue.toLocaleString()} {config.currency}</p>
                      </div>
                      <div className="pt-3 border-t border-slate-50 dark:border-slate-700 flex justify-between items-center">
                         <div className="flex items-center space-x-2">
                            <Phone size={10} className="text-slate-400"/>
                            <Mail size={10} className="text-slate-400"/>
                         </div>
                         <button onClick={() => { setEditingLead(lead); setIsModalOpen(true); }} className="text-[9px] font-black uppercase text-accent hover:underline">Gérer</button>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && editingLead && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden">
             <div className="p-8 border-b bg-purple-600 text-white flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <Target size={24} />
                  <h3 className="text-xl font-black uppercase tracking-tighter">Détail Opportunité</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)}><X size={24}/></button>
             </div>
             <form onSubmit={handleSave} className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Objet de l'opportunité</label>
                  <input required value={editingLead.title} onChange={e => setEditingLead({...editingLead, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-4 px-6 font-bold" placeholder="Nom du contrat..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Contact</label>
                    <input value={editingLead.contact} onChange={e => setEditingLead({...editingLead, contact: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-4 px-6 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">CA Espéré</label>
                    <input type="number" value={editingLead.revenue} onChange={e => setEditingLead({...editingLead, revenue: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-4 px-6 font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Étape du Pipeline</label>
                  <select value={editingLead.stage} onChange={e => setEditingLead({...editingLead, stage: e.target.value as any})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-4 px-6 font-bold uppercase text-[10px]">
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-[1.5rem] font-black uppercase text-xs shadow-xl flex items-center justify-center">
                   <Save size={18} className="mr-3" /> Enregistrer les données
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRM;
