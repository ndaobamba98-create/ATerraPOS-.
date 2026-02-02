
import React, { useState, useMemo } from 'react';
import { SaleOrder, ERPConfig, Product, ViewType, User } from '../types';
import { 
  FileText, Search, Download, Eye, Printer, X, RotateCcw, Calendar, MapPin, Phone, Trash, QrCode, User as UserIcon, CreditCard, Paperclip, File, Save, CheckCircle2, ShoppingCart, Smartphone, Banknote, Wallet, FileSpreadsheet, Mail, CheckSquare, Square, FileDown, ArrowLeft, ChevronRight, BadgeCheck, Receipt, Hash, UserCircle2, Coins
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const AppLogoDoc = ({ className = "w-16 h-16", customLogo = undefined }) => (
  <div className={`${className} flex items-center justify-center overflow-hidden rounded-xl`}>
    {customLogo ? (
      <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
    ) : (
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#0f172a',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid #1e293b'
      }}>
        <svg viewBox="0 0 100 100" style={{ width: '80%', height: '80%' }} fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="50%" y="55%" dominantBaseline="central" textAnchor="middle" fill="white" fontSize="38" fontWeight="900" letterSpacing="-2">
            TP+
          </text>
          <circle cx="20" cy="20" r="10" fill="#a855f7" opacity="0.8" />
        </svg>
      </div>
    )}
  </div>
);

interface Props {
  sales: SaleOrder[];
  config: ERPConfig;
  onUpdate: (sales: SaleOrder[]) => void;
  products: Product[];
  userRole: string;
  onAddSale: (sale: Partial<SaleOrder>) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  userPermissions: ViewType[];
  t: (key: any) => string;
  allUsers: User[];
}

const Invoicing: React.FC<Props> = ({ sales, config, onUpdate, products, userRole, onAddSale, notify, userPermissions, t, allUsers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewedInvoice, setViewedInvoice] = useState<SaleOrder | null>(null);

  const invoices = useMemo(() => sales.map(s => ({ ...s, invoiceStatus: s.invoiceStatus || 'posted' })), [sales]);
  
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => 
      inv.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
      inv.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  const locale = config.language === 'ar' ? 'ar-SA' : config.language === 'fr' ? 'fr-FR' : 'en-US';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: config.currency, currencyDisplay: 'symbol' }).format(amount).replace(config.currency, config.currencySymbol);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short', timeZone: config.timezone }).format(new Date(dateStr));
  };

  const handleExportGlobalExcel = () => {
    const data = filteredInvoices.map(inv => ({
      'Référence': inv.id,
      'Date': formatDate(inv.date),
      'Client': inv.customer,
      'Total': inv.total,
      'Mode': inv.paymentMethod || 'Espèces',
      'Statut': inv.invoiceStatus === 'refunded' ? 'AVOIR' : 'FACTURE'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Journal");
    XLSX.writeFile(workbook, `Journal_Factures_${Date.now()}.xlsx`);
  };

  if (viewedInvoice) {
    return (
      <InvoiceSinglePageView 
        sale={viewedInvoice} 
        config={config} 
        onBack={() => setViewedInvoice(null)} 
        notify={notify} 
        allUsers={allUsers}
      />
    );
  }

  return (
    <div className="h-full flex flex-col space-y-8 animate-fadeIn pb-10 pr-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
           <div className="p-4 bg-purple-600 text-white rounded-3xl shadow-xl shadow-purple-900/20"><Receipt size={32} /></div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Facturation</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Audit et gestion des pièces comptables</p>
           </div>
        </div>
        <button onClick={handleExportGlobalExcel} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center group">
          <FileSpreadsheet size={18} className="mr-3 text-emerald-600 group-hover:scale-110 transition-transform" /> Export Master Excel
        </button>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-900/30">
           <div className="relative w-full max-w-xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher par numéro, client ou montant..." className="w-full pl-14 pr-8 py-4 bg-white dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl text-xs font-bold outline-none shadow-sm transition-all" />
           </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-slate-50/20">
                <th className="px-10 py-6">Document</th>
                <th className="px-10 py-6">Date d'émission</th>
                <th className="px-10 py-6">Client / Bénéficiaire</th>
                <th className="px-10 py-6 text-right">Montant TTC</th>
                <th className="px-10 py-6 text-center">Statut Fiscal</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-all group">
                  <td className="px-10 py-6">
                    <div className="flex items-center space-x-3">
                       <div className={`p-2 rounded-lg ${inv.invoiceStatus === 'refunded' ? 'bg-rose-50 text-rose-500' : 'bg-purple-50 text-purple-600'}`}>
                          <FileText size={18} />
                       </div>
                       <span className="font-black text-slate-900 dark:text-white font-mono text-xs uppercase tracking-tighter">#{inv.id.slice(-8)}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{formatDate(inv.date).split(' à ')[0]}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase mt-0.5">{formatDate(inv.date).split(' à ')[1]}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center space-x-3">
                       <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">{inv.customer.charAt(0)}</div>
                       <span className="font-black uppercase text-xs text-slate-800 dark:text-slate-100 tracking-tight">{inv.customer}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-black text-sm text-slate-900 dark:text-white">{formatCurrency(inv.total)}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{inv.paymentMethod || 'Espèces'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 ${inv.invoiceStatus === 'refunded' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                      {inv.invoiceStatus === 'refunded' ? 'Avoir' : 'Facture'}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button onClick={() => setViewedInvoice(inv)} className="p-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm group-hover:scale-110" title="Consulter">
                      <Eye size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const InvoiceSinglePageView = ({ sale, config, onBack, notify, allUsers }: { sale: SaleOrder, config: ERPConfig, onBack: () => void, notify: any, allUsers: User[] }) => {
  const isRefund = sale.invoiceStatus === 'refunded';
  const locale = config.language === 'ar' ? 'ar-SA' : config.language === 'fr' ? 'fr-FR' : 'en-US';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'decimal', minimumFractionDigits: 2 }).format(amount) + ' ' + config.currencySymbol;
  };

  const cashierName = useMemo(() => {
    if (!sale.cashierId) return "N/A";
    const user = allUsers.find(u => u.id === sale.cashierId);
    return user ? user.name : "N/A";
  }, [sale.cashierId, allUsers]);

  const handleDownloadPDF = () => {
    const element = document.getElementById('invoice-print-area');
    if (!element) return;
    const opt = { 
      margin: 0, 
      filename: `Facture_${sale.id.slice(-8)}.pdf`, 
      image: { type: 'jpeg', quality: 1.0 }, 
      html2canvas: { scale: 4, useCORS: true, backgroundColor: '#ffffff' }, 
      jsPDF: { unit: 'mm', format: 'a6', orientation: 'portrait' } 
    };
    // @ts-ignore
    window.html2pdf().set(opt).from(element).save();
    notify("Facture A6", "Le document format poche est généré.", "success");
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10">
      <div className="flex items-center justify-between no-print bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-5">
          <button onClick={onBack} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 transition-all">
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-xl font-black uppercase tracking-tighter">{isRefund ? 'Avoir' : 'Facture'} #{sale.id.slice(-8)} (Format A6)</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleDownloadPDF} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center">
            <FileDown size={20} className="mr-3" /> PDF A6
          </button>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center">
            <Printer size={20} className="mr-3" /> Imprimer
          </button>
        </div>
      </div>

      <div className="flex-1 flex justify-center overflow-y-auto scrollbar-hide py-4" dir={config.language === 'ar' ? 'rtl' : 'ltr'}>
        <div id="invoice-print-area" className="bg-white text-slate-950 shadow-2xl relative flex flex-col print:shadow-none font-sans" style={{ width: '105mm', height: '148mm', padding: '6mm', boxSizing: 'border-box' }}>
          <div className={`absolute top-0 left-0 right-0 h-1 ${isRefund ? 'bg-rose-600' : 'bg-emerald-600'}`}></div>

          <div className="flex justify-between items-start border-b border-slate-200 pb-2 mb-2">
            <div className="flex items-start space-x-2 rtl:space-x-reverse">
              {config.showLogoOnInvoice && <AppLogoDoc className="w-8 h-8" customLogo={config.companyLogo} />}
              <div className="space-y-0.5">
                <h1 className="text-[9px] font-black uppercase text-slate-900 leading-tight">{config.companyName}</h1>
                <div className="space-y-0">
                  {config.showAddressOnInvoice && <p className="text-[5.5px] font-bold text-slate-500 uppercase leading-tight flex items-center"><MapPin size={6} className="mr-0.5"/> {config.address}</p>}
                  {config.showPhoneOnInvoice && <p className="text-[5.5px] font-bold text-slate-500 uppercase leading-tight flex items-center"><Phone size={6} className="mr-0.5"/> {config.phone}</p>}
                  {config.showEmailOnInvoice && <p className="text-[5.5px] font-bold text-slate-500 lowercase leading-tight flex items-center"><Mail size={6} className="mr-0.5"/> {config.email}</p>}
                </div>
              </div>
            </div>
            <div className="text-right rtl:text-left">
              <h2 className="text-[9px] font-black uppercase">{isRefund ? 'Avoir' : 'Facture'}</h2>
              <p className="text-[7px] font-mono font-black">#{sale.id.slice(-8)}</p>
              <p className="text-[5.5px] font-bold text-slate-400 mt-1">{new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeZone: config.timezone }).format(new Date(sale.date))}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
               <div>
                  <p className="text-[5px] font-black text-slate-400 uppercase">Client</p>
                  <h3 className="text-[7px] font-black uppercase truncate">{sale.customer}</h3>
               </div>
               {config.showCashierOnInvoice && (
                 <div>
                    <p className="text-[5px] font-black text-slate-400 uppercase">Caissier</p>
                    <h3 className="text-[6.5px] font-bold uppercase truncate">{cashierName}</h3>
                 </div>
               )}
            </div>
            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 text-right rtl:text-left flex flex-col justify-between">
               <div>
                  <p className="text-[5px] font-black text-slate-400 uppercase mb-0.5">Mode de Paiement</p>
                  <span className="text-[7px] font-black text-purple-600 uppercase">{sale.paymentMethod || 'Espèces'}</span>
               </div>
               <div>
                  <p className="text-[5px] font-black text-slate-400 uppercase mb-0.5">Zone / Table</p>
                  <span className="text-[6.5px] font-bold uppercase">{sale.orderLocation || 'Comptoir'}</span>
               </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <table className="w-full text-[6.5px] border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-1.5 py-1 text-left rtl:text-right uppercase">Désignation</th>
                  <th className="px-1 py-1 text-center uppercase">Qté</th>
                  <th className="px-1.5 py-1 text-right rtl:text-left uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-1.5 py-1 font-black uppercase truncate max-w-[50mm]">{item.name}</td>
                    <td className="px-1 py-1 text-center font-black">x{item.quantity}</td>
                    <td className="px-1.5 py-1 text-right rtl:text-left font-black">{formatCurrency(item.quantity * item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-900 pt-2 mt-auto">
             <div className="flex justify-between items-end">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                   {config.showQrCodeOnInvoice && <div className="p-0.5 border border-slate-900 rounded"><QrCode size={18} /></div>}
                   <p className="text-[5px] font-bold text-slate-400 max-w-[40mm]">TerraPOS+ Système v2.5.<br/>Document certifié conforme.</p>
                </div>
                <div className="bg-slate-900 text-white p-2 rounded-lg shadow-sm min-w-[35mm] text-right rtl:text-left">
                   <p className="text-[5px] font-black text-purple-400 uppercase tracking-widest mb-0.5">TOTAL À PAYER</p>
                   <div className="text-[12px] font-black font-mono leading-none">{formatCurrency(sale.total)}</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoicing;
