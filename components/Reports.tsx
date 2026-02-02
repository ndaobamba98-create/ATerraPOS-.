
import React, { useState, useMemo } from 'react';
import { SaleOrder, ERPConfig, Product, Expense, CashSession } from '../types';
// Fixed missing TrendingDown import from lucide-react
import { 
  BarChart3, TrendingUp, TrendingDown, Calendar, Download, Zap, ShoppingCart, FileText, 
  ArrowDownRight, ArrowUpRight, Banknote, Eye, FileSpreadsheet, Trophy, 
  PieChart as PieIcon, DollarSign, Monitor, Lock, ChevronRight, Clock, 
  Send, Scale, Target, Percent, AlertCircle, FileDown, Layers, LayoutGrid
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Cell, Pie, AreaChart, Area, Legend
} from 'recharts';
import * as XLSX from 'xlsx';

interface Props {
  sales: SaleOrder[];
  expenses: Expense[];
  products: Product[];
  config: ERPConfig;
  t: (key: any) => string;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  sessions: CashSession[];
  simulateEmailSend?: (subject: string, body: string, trigger: any) => void;
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899', '#64748b'];

const Reports: React.FC<Props> = ({ sales, expenses = [], products, config, t, notify, sessions, simulateEmailSend }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'products' | 'sessions'>('overview');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Filtres de données
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const d = s.date.substring(0, 10);
      return d >= startDate && d <= endDate;
    });
  }, [sales, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => e.date >= startDate && e.date <= endDate);
  }, [expenses, startDate, endDate]);

  const validSales = useMemo(() => filteredSales.filter(s => s.status !== 'refunded'), [filteredSales]);

  // Métriques Clés
  const metrics = useMemo(() => {
    const revenue = validSales.reduce((a, b) => a + b.total, 0);
    const costs = filteredExpenses.reduce((a, b) => a + b.amount, 0);
    const ordersCount = validSales.length;
    const avgBasket = ordersCount > 0 ? revenue / ordersCount : 0;
    const refundTotal = filteredSales.filter(s => s.status === 'refunded').reduce((a, b) => a + b.total, 0);
    
    return { revenue, costs, net: revenue - costs, ordersCount, avgBasket, refundTotal };
  }, [validSales, filteredSales, filteredExpenses]);

  // Données Graphiques
  const revenueByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    validSales.forEach(s => {
      s.items?.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cat = prod?.category || 'Non classé';
        data[cat] = (data[cat] || 0) + (item.quantity * item.price);
      });
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [validSales, products]);

  const dailyTrend = useMemo(() => {
    const trend: Record<string, { date: string, rev: number, exp: number }> = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().split('T')[0];
      trend[iso] = { date: iso.split('-').slice(1).reverse().join('/'), rev: 0, exp: 0 };
    }
    validSales.forEach(s => {
      const iso = s.date.substring(0, 10);
      if (trend[iso]) trend[iso].rev += s.total;
    });
    filteredExpenses.forEach(e => {
      if (trend[e.date]) trend[e.date].exp += e.amount;
    });
    return Object.values(trend);
  }, [validSales, filteredExpenses, startDate, endDate]);

  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string, qty: number, rev: number }> = {};
    validSales.forEach(s => {
      s.items?.forEach(i => {
        if (!counts[i.productId]) counts[i.productId] = { name: i.name, qty: 0, rev: 0 };
        counts[i.productId].qty += i.quantity;
        counts[i.productId].rev += i.quantity * i.price;
      });
    });
    return Object.values(counts).sort((a, b) => b.rev - a.rev).slice(0, 5);
  }, [validSales]);

  const handleExportExcel = () => {
    const data = validSales.map(s => ({
      'Date': s.date,
      'Référence': s.id,
      'Client': s.customer,
      'Total': s.total,
      'Paiement': s.paymentMethod
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventes");
    XLSX.writeFile(wb, `Rapport_TerraPOS_${startDate}_${endDate}.xlsx`);
    notify("Export réussi", "Le fichier Excel est prêt.", "success");
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-export-area');
    if (!element) return;
    const opt = { margin: 10, filename: `Rapport_Analyse.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } };
    // @ts-ignore
    window.html2pdf().set(opt).from(element).save();
    notify("Export PDF", "Génération du rapport en cours...", "info");
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-fadeIn pb-20 pr-2">
      {/* Header Statistique */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 no-print">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Business Intelligence</h1>
          <p className="text-sm text-slate-500 font-medium">Analyse complète des performances {config.companyName}</p>
        </div>
        <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-1.5 rounded-3xl border shadow-sm">
           {[
             { id: 'overview', label: 'Global', icon: LayoutGrid },
             { id: 'finance', label: 'Trésorerie', icon: DollarSign },
             { id: 'products', label: 'Menu', icon: Layers },
             { id: 'sessions', label: 'Caisses', icon: Monitor }
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)} 
               className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/20' : 'text-slate-400 hover:text-slate-600'}`}
             >
               <tab.icon size={14} className="mr-2" />
               {tab.label}
             </button>
           ))}
        </div>
      </div>

      {/* Barre de Filtres Date */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-6 no-print">
        <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-800 px-6 py-3 rounded-2xl">
          <Calendar size={18} className="text-purple-600" />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent font-black text-xs outline-none uppercase" />
          <span className="text-slate-300">→</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent font-black text-xs outline-none uppercase" />
        </div>
        
        <div className="flex items-center space-x-3 ml-auto">
           <button onClick={handleDownloadPDF} className="p-4 bg-white dark:bg-slate-800 border-2 rounded-2xl text-slate-400 hover:text-rose-600 transition-all">
             <FileDown size={22}/>
           </button>
           <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center hover:bg-emerald-700">
             <FileSpreadsheet size={18} className="mr-3"/> Exporter Excel
           </button>
        </div>
      </div>

      <div id="report-export-area" className="flex-1 space-y-8">
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
             {/* Cards Principales */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="CA Net (Validé)" value={metrics.revenue} unit={config.currency} icon={TrendingUp} color="bg-emerald-500" trend="+12.4%" />
                <KPICard title="Dépenses Total" value={metrics.costs} unit={config.currency} icon={TrendingDown} color="bg-rose-500" trend="+5.2%" />
                <KPICard title="Profit Net" value={metrics.net} unit={config.currency} icon={DollarSign} color="bg-purple-600" trend="Sain" />
                <KPICard title="Panier Moyen" value={metrics.avgBasket} unit={config.currency} icon={Target} color="bg-blue-500" trend="Engagement" />
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Graphique de Tendances */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border shadow-sm flex flex-col h-[450px]">
                   <div className="flex items-center justify-between mb-10">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Flux de Trésorerie (Recettes vs Dépenses)</h3>
                   </div>
                   <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={dailyTrend}>
                            <defs>
                               <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                               <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                            <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="rev" name="Recettes" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                            <Area type="monotone" dataKey="exp" name="Dépenses" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorExp)" />
                            <Legend verticalAlign="top" align="right" height={36}/>
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* Distribution par Catégorie */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border shadow-sm flex flex-col items-center">
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-10 self-start">Source des Revenus</h3>
                   <div className="h-64 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie data={revenueByCategory} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                               {revenueByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                         </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total CA</span>
                         <span className="text-xl font-black text-slate-900 dark:text-white">{metrics.revenue.toLocaleString()}</span>
                      </div>
                   </div>
                   <div className="mt-8 w-full space-y-3">
                      {revenueByCategory.slice(0, 4).map((c, i) => (
                        <div key={c.name} className="flex items-center justify-between">
                           <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                              <span className="text-[10px] font-black uppercase text-slate-500">{c.name}</span>
                           </div>
                           <span className="text-[10px] font-black">{((c.value/metrics.revenue)*100).toFixed(0)}%</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Top Produits & Annulations */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border shadow-sm">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center"><Trophy className="mr-2 text-amber-500" size={16}/> Top 5 Ventes (Valeur)</h3>
                   </div>
                   <div className="space-y-6">
                      {topProducts.map((p, i) => (
                        <div key={p.name} className="flex items-center justify-between group">
                           <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-slate-400">0{i+1}</div>
                              <div>
                                 <p className="text-xs font-black uppercase group-hover:text-purple-600 transition-colors">{p.name}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase">{p.qty} Unités vendues</p>
                              </div>
                           </div>
                           <span className="text-sm font-black">{p.rev.toLocaleString()} <span className="text-[8px] opacity-40">{config.currency}</span></span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border shadow-sm flex flex-col justify-between">
                   <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center"><AlertCircle className="mr-2 text-rose-500" size={16}/> Pertes & Annulations</h3>
                      <div className="p-6 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
                         <div>
                            <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Total Remboursements</p>
                            <p className="text-2xl font-black text-rose-600">-{metrics.refundTotal.toLocaleString()} {config.currency}</p>
                         </div>
                         <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-rose-500">
                            <Percent size={24}/>
                         </div>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                         Les annulations représentent <strong>{((metrics.refundTotal / (metrics.revenue + metrics.refundTotal)) * 100).toFixed(1)}%</strong> du volume de transactions brut sur la période sélectionnée.
                      </p>
                   </div>
                   <button onClick={() => setActiveTab('finance')} className="mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center hover:bg-black">
                      Détails de facturation <ChevronRight size={14} className="ml-2"/>
                   </button>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border shadow-sm overflow-hidden animate-fadeIn">
             <table className="w-full text-left">
                <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                   <tr>
                      <th className="px-10 py-5">Écriture</th>
                      <th className="px-10 py-5">Libellé</th>
                      <th className="px-10 py-5 text-right">Crédit (IN)</th>
                      <th className="px-10 py-5 text-right">Débit (OUT)</th>
                      <th className="px-10 py-5 text-center">Date</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {/* Ici on pourrait mélanger Ventes et Dépenses chronologiquement */}
                   {validSales.slice(0, 15).map(s => (
                     <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-10 py-4 font-mono text-xs text-emerald-600 font-bold">#{s.id.slice(-6)}</td>
                        <td className="px-10 py-4 text-xs font-bold uppercase">{s.customer}</td>
                        <td className="px-10 py-4 text-right font-black text-emerald-500">+{s.total}</td>
                        <td className="px-10 py-4 text-right font-black text-slate-300">-</td>
                        <td className="px-10 py-4 text-center text-[10px] font-bold text-slate-400">{s.date.split(' ')[0]}</td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
             {sessions.map(s => (
                <div key={s.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border shadow-sm space-y-6">
                   <div className="flex justify-between items-start">
                      <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center"><Clock size={24}/></div>
                      <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${s.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{s.status}</span>
                   </div>
                   <div>
                      <h4 className="font-black uppercase text-sm">{s.cashierName}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session {s.id.slice(-6)}</p>
                   </div>
                   <div className="grid grid-cols-2 gap-4 py-4 border-y dark:border-slate-800">
                      <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase">Espèces Ventées</p>
                         <p className="text-md font-black">{s.totalCashSales} <span className="text-[10px] opacity-40">{config.currency}</span></p>
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase">Écart Final</p>
                         <p className={`text-md font-black ${s.difference && s.difference < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{s.difference || 0}</p>
                      </div>
                   </div>
                   <div className="flex items-center text-[9px] font-bold text-slate-400 space-x-2">
                      <Calendar size={10}/> <span>Ouvert le {new Date(s.openedAt).toLocaleDateString('fr-FR')}</span>
                   </div>
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

const KPICard = ({ title, value, unit, icon: Icon, color, trend }: any) => (
  <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between group transition-all hover:shadow-xl">
    <div className="flex justify-between items-start mb-6">
       <div className={`${color} p-4 rounded-2xl text-white shadow-lg group-hover:rotate-6 transition-transform`}>
          <Icon size={24}/>
       </div>
       <div className="flex flex-col items-end">
          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{trend}</span>
          <ArrowUpRight size={14} className="text-emerald-500" />
       </div>
    </div>
    <div>
       <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
       <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
         {typeof value === 'number' ? value.toLocaleString() : value} <span className="text-xs opacity-40 font-bold ml-1">{unit}</span>
       </h4>
    </div>
  </div>
);

export default Reports;
