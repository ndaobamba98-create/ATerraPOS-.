
import React, { useState, useMemo } from 'react';
import { SaleOrder, UserRole, ERPConfig, Product, ViewType, Expense } from '../types';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Eye, 
  ArrowUpRight,
  Zap,
  Package,
  History,
  Monitor,
  FileText,
  IdCard,
  ChevronRight,
  LayoutGrid,
  Users,
  Wifi,
  Copy,
  ArrowDownRight,
  Wallet,
  Coins,
  BarChart3
} from 'lucide-react';
import { CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';

interface Props {
  leads: any[];
  sales: SaleOrder[];
  expenses: Expense[];
  userRole: UserRole;
  config: ERPConfig;
  products: Product[];
  t: (key: any) => string;
  onNavigate: (view: ViewType) => void;
}

const Dashboard: React.FC<Props> = ({ sales, expenses = [], userRole, config, products, t, onNavigate }) => {
  const locale = config.language === 'ar' ? 'ar-SA' : config.language === 'fr' ? 'fr-FR' : 'en-US';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' ' + config.currencySymbol;
  };

  const totalRevenue = useMemo(() => sales.reduce((acc, curr) => curr.status === 'refunded' ? acc - curr.total : acc + curr.total, 0), [sales]);
  const payrollTotal = useMemo(() => expenses.filter(e => e.category === 'Salaires').reduce((acc, curr) => acc + curr.amount, 0), [expenses]);
  const otherExpenses = useMemo(() => expenses.filter(e => e.category !== 'Salaires').reduce((acc, curr) => acc + curr.amount, 0), [expenses]);
  const netProfit = totalRevenue - (payrollTotal + otherExpenses);

  const apps = [
    { id: 'pos', icon: Monitor, label: 'Caisse POS', color: 'bg-emerald-500', desc: 'Vente directe' },
    { id: 'inventory', icon: Package, label: 'Stocks', color: 'bg-orange-500', desc: 'Menu & Logistique' },
    { id: 'expenses', icon: Wallet, label: 'Dépenses', color: 'bg-rose-500', desc: 'Frais & Journal' },
    { id: 'hr', icon: IdCard, label: 'RH & Paie', color: 'bg-slate-700', desc: 'Masse Salariale' },
    { id: 'reports', icon: BarChart3, label: 'Analyses', color: 'bg-indigo-500', desc: 'Rapports' },
  ];

  return (
    <div className="h-full overflow-y-auto space-y-10 animate-fadeIn pb-20 pr-2 scrollbar-hide" dir={config.language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {apps.map((app) => (
          <button key={app.id} onClick={() => onNavigate(app.id as ViewType)} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-purple-500 group transition-all text-center flex flex-col items-center space-y-4">
            <div className={`${app.color} p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}><app.icon size={28} /></div>
            <p className="text-[11px] font-black uppercase text-slate-800 dark:text-white leading-none">{app.label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Revenu Brut" value={formatCurrency(totalRevenue)} icon={TrendingUp} color="bg-emerald-500" trend={`Flux`} />
        <div className="bg-slate-900 p-8 rounded-[3rem] border-2 border-purple-500/30 shadow-2xl flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Résultat Net</p>
            <h4 className="text-2xl font-black text-white tracking-tighter">{formatCurrency(netProfit)}</h4>
          </div>
          <div className="bg-purple-600 p-4 rounded-2xl text-white"><Zap size={24} /></div>
        </div>
        <StatCard title="Masse Salariale" value={formatCurrency(payrollTotal)} icon={Users} color="bg-blue-500" trend="Payé" />
        <StatCard title="Charges" value={formatCurrency(otherExpenses)} icon={ArrowDownRight} color="bg-rose-500" trend="Sorties" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border shadow-sm flex flex-col h-[400px]">
           <h3 className="font-black uppercase text-sm mb-6 flex items-center"><History size={18} className="mr-2"/> Transactions Récentes</h3>
           <div className="flex-1 overflow-y-auto space-y-4">
              {sales.slice(0, 5).map(s => (
                <div key={s.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center"><ArrowUpRight size={18}/></div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase">{s.customer}</span>
                        <span className="text-[10px] text-slate-400">{new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short', timeZone: config.timezone }).format(new Date(s.date))}</span>
                      </div>
                   </div>
                   <span className="font-black text-emerald-600">+{formatCurrency(s.total)}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{title: string, value: string, icon: any, color: string, trend: string}> = ({title, value, icon: Icon, color, trend}) => (
  <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border shadow-sm flex items-start justify-between transition-all hover:-translate-y-1">
    <div className="space-y-3">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h4>
      <p className="text-[10px] font-black uppercase text-slate-400">{trend}</p>
    </div>
    <div className={`${color} p-4 rounded-2xl text-white shadow-xl`}><Icon size={24} /></div>
  </div>
);

export default Dashboard;
