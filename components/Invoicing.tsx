
import React, { useState, useMemo } from 'react';
import { SaleOrder, ERPConfig, Product, ViewType, User } from '../types';
import { 
  FileText, Search, Download, Eye, Printer, X, RotateCcw, Calendar, MapPin, Phone, Trash, QrCode, User as UserIcon, CreditCard, Paperclip, File, Save, CheckCircle2, ShoppingCart, Smartphone, Banknote, Wallet, FileSpreadsheet, Mail, CheckSquare, Square, FileDown, ArrowLeft, ChevronRight, BadgeCheck, Receipt, Hash, UserCircle2, Coins, FileSignature, AlertCircle, Users
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
      'Statut': inv.status === 'quotation' ? 'DEVIS' : (inv.invoiceStatus === 'refunded' ? 'AVOIR' : 'FACTURE')
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Journal");
    XLSX.writeFile(workbook, `Journal_Comptable_${Date.now()}.xlsx`);
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
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Factures & Devis</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Audit et exportation des documents commerciaux</p>
           </div>
        </div>
        <button onClick={handleExportGlobalExcel} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center group">
          <FileSpreadsheet size={18} className="mr-3 text-emerald-600 group-hover:scale-110 transition-transform" /> Journal Complet Excel
        </button>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-900/30">
           <div className="relative w-full max-w-xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Chercher un document (N°, Client...)" className="w-full pl-14 pr-8 py-4 bg-white dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl text-xs font-bold outline-none shadow-sm transition-all" />
           </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-slate-50/20">
                <th className="px-10 py-6">Type</th>
                <th className="px-10 py-6">Référence</th>
                <th className="px-10 py-6">Émission</th>
                <th className="px-10 py-6">Bénéficiaire</th>
                <th className="px-10 py-6 text-right">Total TTC</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-all group">
                  <td className="px-10 py-6">
                    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${inv.status === 'quotation' ? 'bg-blue-50 text-blue-600' : (inv.invoiceStatus === 'refunded' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600')}`}>
                       {inv.status === 'quotation' ? (inv.eventDetails ? 'Résa' : 'Devis') : (inv.invoiceStatus === 'refunded' ? 'Avoir' : 'Facture')}
                    </span>
                  </td>
                  <td className="px-10 py-6 font-black font-mono text-xs uppercase tracking-tighter">#{inv.id.slice(-8)}</td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col text-[10px] font-bold">
                      <span className="text-slate-800 dark:text-slate-200">{new Date(inv.date).toLocaleDateString()}</span>
                      <span className="text-slate-400 uppercase">{new Date(inv.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 font-black uppercase text-xs text-slate-800 dark:text-slate-100">{inv.customer}</td>
                  <td className="px-10 py-6 text-right font-black text-sm text-slate-900 dark:text-white">{formatCurrency(inv.total)}</td>
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
  const isQuotation = sale.status === 'quotation';
  const isRefund = sale.invoiceStatus === 'refunded';
  const locale = config.language === 'ar' ? 'ar-SA' : config.language === 'fr' ? 'fr-FR' : 'en-US';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'decimal', minimumFractionDigits: 2 }).format(amount) + ' ' + config.currencySymbol;
  };

  const cashierName = useMemo(() => {
    if (!sale.cashierId) return "Direction";
    const user = allUsers.find(u => u.id === sale.cashierId);
    return user ? user.name : "N/A";
  }, [sale.cashierId, allUsers]);

  const handleDownloadA4 = () => {
    const element = document.getElementById('invoice-print-area');
    if (!element) return;
    const opt = { 
      margin: 10, 
      filename: `${isQuotation ? 'Devis' : 'Facture'}_${sale.id.slice(-8)}.pdf`, 
      image: { type: 'jpeg', quality: 1.0 }, 
      html2canvas: { scale: 3, useCORS: true, backgroundColor: '#ffffff' }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };
    // @ts-ignore
    window.html2pdf().set(opt).from(element).save();
    notify("Export PDF", `Le document A4 est en cours de téléchargement.`, "success");
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10">
      <div className="flex items-center justify-between no-print bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-5">
          <button onClick={onBack} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 transition-all">
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-xl font-black uppercase tracking-tighter">
             {isQuotation ? (sale.eventDetails ? 'Réservation' : 'Devis Proforma') : (isRefund ? 'Avoir' : 'Facture')} #{sale.id.slice(-8)}
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleDownloadA4} className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center">
            <FileDown size={20} className="mr-3" /> Exporter PDF A4
          </button>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center">
            <Printer size={20} className="mr-3" /> Imprimer
          </button>
        </div>
      </div>

      <div className="flex-1 flex justify-center overflow-y-auto scrollbar-hide py-10" dir={config.language === 'ar' ? 'rtl' : 'ltr'}>
        <div id="invoice-print-area" className="bg-white text-slate-950 shadow-2xl relative flex flex-col print:shadow-none p-20 font-serif" style={{ width: '210mm', minHeight: '297mm' }}>
          
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-10 mb-10">
            <div className="space-y-4">
              <AppLogoDoc className="w-20 h-20" customLogo={config.companyLogo} />
              <div>
                <h1 className="text-xl font-black uppercase text-slate-900">{config.companyName}</h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{config.companySlogan}</p>
              </div>
              <div className="space-y-1 text-xs font-medium text-slate-600">
                <p className="flex items-center"><MapPin size={12} className="mr-2"/> {config.address}</p>
                <p className="flex items-center"><Phone size={12} className="mr-2"/> {config.phone}</p>
                <p className="flex items-center"><Mail size={12} className="mr-2"/> {config.email}</p>
                <p className="font-bold">NIF/RC: {config.registrationNumber}</p>
              </div>
            </div>
            <div className="text-right rtl:text-left space-y-4">
              <h2 className={`text-4xl font-black uppercase tracking-tighter ${isQuotation ? 'text-blue-600' : 'text-slate-900'}`}>
                {isQuotation ? (sale.eventDetails ? 'Réservation' : 'Devis') : (isRefund ? 'Avoir' : 'Facture')}
              </h2>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Numéro Document</p>
                <p className="text-lg font-black font-mono">#{sale.id.slice(-8)}</p>
              </div>
              <div className="text-xs font-bold text-slate-600">
                 <p>Date d'émission : {new Date(sale.date).toLocaleDateString(locale, {dateStyle:'long'})}</p>
                 {isQuotation && <p className="text-rose-500 mt-2">Valable jusqu'au : {new Date(new Date(sale.date).getTime() + 15*24*60*60*1000).toLocaleDateString(locale, {dateStyle:'long'})}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-20 mb-10">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] border-b pb-2">Destinataire / Client</p>
              <div className="space-y-2">
                 <h3 className="text-lg font-black uppercase">{sale.customer}</h3>
                 <p className="text-xs font-medium text-slate-500">Document généré pour le compte du client suscité.</p>
              </div>
            </div>
            <div className="space-y-4">
               <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] border-b pb-2">Informations de Paiement</p>
               <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase">Mode de règlement</span><span className="font-black uppercase">{sale.paymentMethod || 'Espèces'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase">Émis par</span><span className="font-black uppercase">{cashierName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase">Statut Fiscal</span><span className="font-black uppercase">{isQuotation ? 'NON COMPTABILISÉ' : 'ACQUITTÉE'}</span></div>
               </div>
            </div>
          </div>

          {/* BLOC ÉVÉNEMENT SPÉCIFIQUE SUR LE DOCUMENT PDF */}
          {sale.eventDetails && (
            <div className="mb-10 p-8 bg-slate-50 rounded-[2rem] border-2 border-slate-900/10 flex items-start gap-10">
               <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[120px]">
                  <p className="text-[10px] font-black text-purple-600 uppercase mb-2">Événement</p>
                  <p className="text-xl font-black text-slate-900">{new Date(sale.eventDetails.date).getDate()}</p>
                  <p className="text-[9px] font-black uppercase text-slate-400">{new Date(sale.eventDetails.date).toLocaleDateString(locale, {month:'short', year:'numeric'})}</p>
               </div>
               <div className="grid grid-cols-2 gap-x-12 gap-y-4 flex-1">
                  <div className="flex items-center gap-3">
                     <FileSignature size={16} className="text-slate-400"/>
                     <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Prestation</span>
                        <span className="text-xs font-black uppercase">{sale.eventDetails.type}</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <Users size={16} className="text-slate-400"/>
                     <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Nombre de convives</span>
                        <span className="text-xs font-black">{sale.eventDetails.guests} Personnes</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 col-span-2">
                     <MapPin size={16} className="text-slate-400"/>
                     <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Lieu de la réception</span>
                        <span className="text-xs font-black uppercase">{sale.eventDetails.location || 'À définir'}</span>
                     </div>
                  </div>
               </div>
            </div>
          )}

          <div className="flex-1">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-6 py-4 text-left rtl:text-right text-[10px] font-black uppercase tracking-widest">Désignation des Articles</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest">Qté</th>
                  <th className="px-6 py-4 text-right rtl:text-left text-[10px] font-black uppercase tracking-widest">P.U HT</th>
                  <th className="px-6 py-4 text-right rtl:text-left text-[10px] font-black uppercase tracking-widest">Total TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {sale.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-5 font-black uppercase text-sm text-slate-800">{item.name}</td>
                    <td className="px-6 py-5 text-center font-black text-sm">{item.quantity}</td>
                    <td className="px-6 py-5 text-right rtl:text-left font-medium text-sm">{item.price.toLocaleString()}</td>
                    <td className="px-6 py-5 text-right rtl:text-left font-black text-sm">{(item.quantity * item.price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 border-t-4 border-slate-900 pt-10">
             <div className="flex justify-between items-start">
                <div className="space-y-6">
                   <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 max-w-sm">
                      <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed">
                         {isQuotation 
                           ? "Ce devis est une estimation proforma et ne constitue pas une facture définitive. Les prix sont valables 15 jours. Un acompte de 30% est requis pour valider la réservation." 
                           : config.receiptFooter}
                      </p>
                   </div>
                   <div className="flex items-center space-x-4">
                      <QrCode size={64} className="opacity-80" />
                      <div className="text-[8px] font-mono text-slate-400">
                         CERTIFIÉ PAR TERRAPOS+<br/>
                         ID AUTH: {sale.id}<br/>
                         VERIFICATION DIGITALE ACTIVE
                      </div>
                   </div>
                </div>
                
                <div className="w-80 space-y-3">
                   <div className="flex justify-between items-center text-sm px-4">
                      <span className="text-slate-400 font-bold uppercase">Total Net</span>
                      <span className="font-bold">{formatCurrency(sale.total)}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm px-4">
                      <span className="text-slate-400 font-bold uppercase">TVA (0%)</span>
                      <span className="font-bold">0.00</span>
                   </div>
                   <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex justify-between items-center mt-6">
                      <span className="text-xs font-black uppercase tracking-widest text-purple-400">{isQuotation ? 'Total Devis' : 'Net à Payer'}</span>
                      <span className="text-2xl font-black font-mono">{formatCurrency(sale.total)}</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="mt-16 pt-10 border-t border-slate-100 flex justify-between items-center">
             <div className="text-center space-y-10 w-48">
                <p className="text-[9px] font-black uppercase underline tracking-widest">Cachet Client</p>
                <div className="h-16"></div>
             </div>
             <div className="text-center space-y-10 w-48">
                <p className="text-[9px] font-black uppercase underline tracking-widest">La Direction</p>
                <div className="h-16"></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoicing;
