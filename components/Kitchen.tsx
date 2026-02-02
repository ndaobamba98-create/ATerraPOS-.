
import React, { useMemo, useState, useEffect } from 'react';
import { SaleOrder, ERPConfig } from '../types';
import { ChefHat, CheckCircle2, Clock, MapPin, Package, AlertCircle, Play, CheckCircle, Bell, ArrowRight, Utensils } from 'lucide-react';

interface Props {
  sales: SaleOrder[];
  onUpdateSales: (sales: SaleOrder[]) => void;
  config: ERPConfig;
  notify: any;
}

const Kitchen: React.FC<Props> = ({ sales, onUpdateSales, config, notify }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000); // Update every 10s
    return () => clearInterval(timer);
  }, []);

  const preparationOrders = useMemo(() => {
    return sales
      .filter(s => (s.status === 'confirmed' || s.status === 'draft') && s.preparationStatus !== 'served')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sales]);

  const updateStatus = (id: string, newStatus: SaleOrder['preparationStatus']) => {
    const updated = sales.map(s => {
      if (s.id === id) {
        if (newStatus === 'served') {
          return { ...s, preparationStatus: newStatus, status: 'delivered' as const };
        }
        return { ...s, preparationStatus: newStatus };
      }
      return s;
    });
    onUpdateSales(updated);
    
    if (newStatus === 'ready') {
      notify("Cuisine", `La commande #${id.slice(-6)} est prête !`, "success");
    }
  };

  const getTimerColor = (minutes: number) => {
    if (minutes > 20) return 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 border-rose-100';
    if (minutes > 12) return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-100';
    return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100';
  };

  // Fix: Added React.FC type to internal component to handle the 'key' prop in JSX lists correctly.
  const OrderCard: React.FC<{ order: SaleOrder }> = ({ order }) => {
    const elapsedMs = currentTime.getTime() - new Date(order.date).getTime();
    const elapsedMins = Math.floor(elapsedMs / 60000);
    const colorClass = getTimerColor(elapsedMins);

    return (
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:border-purple-500/30 transition-all">
        <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex flex-col">
            <span className="text-[11px] font-black font-mono text-purple-600">#{order.id.slice(-6)}</span>
            <div className="flex items-center space-x-2">
              <MapPin size={10} className="text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[80px]">{order.orderLocation}</span>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 ${colorClass}`}>
            <Clock size={12} className={elapsedMins > 20 ? 'animate-pulse' : ''} />
            <span className="text-[10px] font-black">{elapsedMins}m</span>
          </div>
        </div>

        <div className="p-5 flex-1 space-y-3">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start">
              <div className="flex space-x-3">
                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">
                  {item.quantity}
                </div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase leading-tight">{item.name}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 flex gap-2">
          {(!order.preparationStatus || order.preparationStatus === 'pending') && (
            <button 
              onClick={() => updateStatus(order.id, 'preparing')}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-purple-900/20 hover:bg-purple-700 transition-all flex items-center justify-center"
            >
              <Play size={14} className="mr-2" /> Préparer
            </button>
          )}
          {order.preparationStatus === 'preparing' && (
            <button 
              onClick={() => updateStatus(order.id, 'ready')}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition-all flex items-center justify-center"
            >
              <CheckCircle size={14} className="mr-2" /> Prêt
            </button>
          )}
          {order.preparationStatus === 'ready' && (
            <button 
              onClick={() => updateStatus(order.id, 'served')}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all flex items-center justify-center"
            >
              <Bell size={14} className="mr-2" /> Servi
            </button>
          )}
        </div>
      </div>
    );
  };

  const columns = [
    { id: 'pending', label: 'Commandes Reçues', icon: AlertCircle, color: 'text-slate-400' },
    { id: 'preparing', label: 'En Cuisson', icon: ChefHat, color: 'text-purple-500' },
    { id: 'ready', label: 'Prêt au Service', icon: Bell, color: 'text-emerald-500' }
  ];

  return (
    <div className="h-full flex flex-col space-y-8 animate-fadeIn pb-10 pr-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Kitchen Display System</h1>
          <p className="text-sm text-slate-500 font-medium">Gestion du flux de production culinaire</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-6 py-3 rounded-[1.5rem] flex items-center space-x-6 shadow-sm">
           <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Temps Moyen: 14m</span>
           </div>
           <div className="w-px h-4 bg-slate-100 dark:bg-slate-800"></div>
           <span className="text-[10px] font-black uppercase text-slate-400">{preparationOrders.length} En cours</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-hidden">
        {columns.map(col => (
          <div key={col.id} className="flex flex-col space-y-4">
            <div className="flex items-center justify-between px-4">
               <div className="flex items-center space-x-3">
                 <div className={`p-2 rounded-lg bg-white dark:bg-slate-900 border shadow-sm ${col.color}`}>
                   <col.icon size={16} />
                 </div>
                 <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">{col.label}</h3>
               </div>
               <span className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-lg text-[10px] font-black text-slate-500">
                 {preparationOrders.filter(o => (!o.preparationStatus && col.id === 'pending') || o.preparationStatus === col.id).length}
               </span>
            </div>

            <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-y-auto scrollbar-hide space-y-4">
               {preparationOrders
                .filter(o => (!o.preparationStatus && col.id === 'pending') || o.preparationStatus === col.id)
                .map(order => <OrderCard key={order.id} order={order} />)
               }
               {preparationOrders.filter(o => (!o.preparationStatus && col.id === 'pending') || o.preparationStatus === col.id).length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4 py-20">
                    <Package size={40} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Rien ici</p>
                 </div>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Kitchen;
