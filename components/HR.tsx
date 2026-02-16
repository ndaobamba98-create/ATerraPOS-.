
import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, ERPConfig, ViewType, Attachment, Payslip, ContractType, Expense } from '../types';
import { 
  Plus, Search, Mail, Phone, Briefcase, Calendar, DollarSign, Users, Clock, FileText, IdCard, 
  Trash2, X, Edit3, Save, Printer, QrCode, Paperclip, FileSignature, Eye, Camera, 
  ArrowLeft, FileDown, CheckCircle2, Ban, Landmark, MapPin, Building, CreditCard, ChevronRight, BadgeCheck, Check, AlertTriangle, UserCheck, Scissors, History, Hash, Upload, ImageIcon, File
} from 'lucide-react';
import { AppLogoDoc } from './Invoicing';

interface Props {
  employees: Employee[];
  onUpdate: (employees: Employee[]) => void;
  attendance: AttendanceRecord[];
  onUpdateAttendance: (attendance: AttendanceRecord[]) => void;
  config: ERPConfig;
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  userPermissions: ViewType[];
}

const HR: React.FC<Props> = ({ employees, onUpdate, attendance, config, expenses, onAddExpense, notify, userPermissions }) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'payroll'>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const [selectedForContract, setSelectedForContract] = useState<Employee | null>(null);
  const [selectedForPayslip, setSelectedForPayslip] = useState<Employee | null>(null);

  const canEdit = userPermissions.includes('manage_hr');
  const locale = config.language === 'ar' ? 'ar-SA' : config.language === 'fr' ? 'fr-FR' : 'en-US';

  const currentMonthName = new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: config.timezone });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'decimal', minimumFractionDigits: 2 }).format(amount) + ' ' + config.currencySymbol;
  };

  const calculatePayrollData = (employee: Employee) => {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    const monthAttendance = attendance.filter(a => {
        const d = new Date(a.date.split('/').reverse().join('-'));
        return d.getMonth() === month && d.getFullYear() === year && a.employeeId === employee.id;
    });

    const workDaysInMonth = 26;
    const dailyRate = employee.salary / workDaysInMonth;
    const hourlyRate = dailyRate / 8;
    const daysWorked = new Set(monthAttendance.map(a => a.date)).size;
    const absenceDays = Math.max(0, workDaysInMonth - daysWorked);
    const absenceDeduction = absenceDays * dailyRate;

    let lateMinutes = 0;
    monthAttendance.forEach(a => {
        const [h, m] = a.checkIn.split(':').map(Number);
        const totalMins = h * 60 + m;
        const limitMins = 8 * 60 + 30;
        if (totalMins > limitMins) lateMinutes += (totalMins - limitMins);
    });
    const lateDeduction = (lateMinutes / 60) * hourlyRate;
    const netSalary = Math.max(0, employee.salary - absenceDeduction - lateDeduction);
    const isPaid = expenses.some(exp => exp.category === 'Salaires' && exp.description.includes(employee.name) && exp.description.includes(currentMonthName));

    return { absenceDays, absenceDeduction, lateMinutes, lateDeduction, netSalary, isPaid };
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.role.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [employees, searchTerm]);

  const handlePaySalary = (employee: Employee) => {
    const payroll = calculatePayrollData(employee);
    if (payroll.isPaid) return notify("Refus", "Salaire déjà réglé.", "warning");

    if (confirm(`Confirmer le paiement de ${formatCurrency(payroll.netSalary)} ?`)) {
      const newExpense: Expense = {
        id: `SAL-${Date.now()}`,
        description: `Salaire - ${employee.name} - ${currentMonthName}`,
        amount: payroll.netSalary,
        date: new Date().toISOString().split('T')[0],
        category: 'Salaires',
        paymentMethod: 'Especes',
        status: 'paid'
      };
      onAddExpense(newExpense);
      notify("Payé", `Salaire de ${employee.name} validé.`, "success");
    }
  };

  const handleEmployeeUpdate = (emp: Employee) => {
    onUpdate(employees.map(e => e.id === emp.id ? emp : e));
    if (selectedForContract?.id === emp.id) setSelectedForContract(emp);
  };

  if (selectedForContract) return <ContractView employee={selectedForContract} config={config} onBack={() => setSelectedForContract(null)} notify={notify} locale={locale} onUpdateEmployee={handleEmployeeUpdate} />;
  if (selectedForPayslip) return <PayslipView employee={selectedForPayslip} payroll={calculatePayrollData(selectedForPayslip)} config={config} onBack={() => setSelectedForPayslip(null)} notify={notify} locale={locale} />;

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10 pr-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
           <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl"><IdCard size={32}/></div>
           <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Ressources Humaines</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">{config.timezone}</p>
           </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-1 rounded-2xl flex shadow-sm">
            {[
              { id: 'directory', label: 'Annuaire', icon: Users },
              { id: 'attendance', label: 'Présences', icon: Clock },
              { id: 'payroll', label: 'Paie', icon: DollarSign }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400'}`}>
                <tab.icon size={14} className="mr-2 inline" /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {activeTab === 'directory' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredEmployees.map(emp => (
              <EmployeeCard key={emp.id} employee={emp} onEdit={() => { setEditingEmployee(emp); setIsModalOpen(true); }} onContract={() => setSelectedForContract(emp)} onPayslip={() => setSelectedForPayslip(emp)} />
            ))}
          </div>
        )}
        {activeTab === 'payroll' && (
           <PayrollTable employees={employees} config={config} onGenerate={(emp: any) => setSelectedForPayslip(emp)} onPay={handlePaySalary} calculatePayroll={calculatePayrollData} locale={locale} formatCurrency={formatCurrency} />
        )}
      </div>

      {isModalOpen && editingEmployee && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-scaleIn">
             <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-xl font-black uppercase tracking-tighter">Fiche Employé</h3>
                <button onClick={() => setIsModalOpen(false)}><X size={28}/></button>
             </div>
             <form onSubmit={(e) => {
               e.preventDefault();
               const emp = { ...editingEmployee, id: editingEmployee.id || `E-${Date.now()}`, isClockedIn: editingEmployee.isClockedIn || false, status: editingEmployee.status || 'active' } as Employee;
               if (employees.find(x => x.id === emp.id)) {
                 onUpdate(employees.map(x => x.id === emp.id ? emp : x));
               } else {
                 onUpdate([...employees, emp]);
               }
               setIsModalOpen(false);
             }} className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Nom complet</label>
                  <input required value={editingEmployee.name || ''} onChange={e => setEditingEmployee({...editingEmployee, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Rôle</label>
                    <input required value={editingEmployee.role || ''} onChange={e => setEditingEmployee({...editingEmployee, role: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Salaire Mensuel</label>
                    <input type="number" required value={editingEmployee.salary || ''} onChange={e => setEditingEmployee({...editingEmployee, salary: parseFloat(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black outline-none text-purple-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Département</label>
                  <input value={editingEmployee.department || ''} onChange={e => setEditingEmployee({...editingEmployee, department: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black outline-none" />
                </div>
                <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-3xl font-black uppercase text-xs shadow-xl">Enregistrer l'agent</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

const EmployeeCard = ({ employee, onEdit, onContract, onPayslip }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-800 p-6 flex flex-col items-center text-center group hover:shadow-2xl transition-all">
    <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 mb-4 flex items-center justify-center text-3xl font-black text-slate-300 uppercase overflow-hidden">
      {employee.photo ? <img src={employee.photo} className="w-full h-full object-cover" /> : employee.name[0]}
    </div>
    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-md line-clamp-1">{employee.name}</h3>
    <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mt-1 mb-6">{employee.role}</p>
    <div className="w-full grid grid-cols-3 gap-2 pt-4 border-t dark:border-slate-800">
      <button onClick={onContract} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-600 transition-colors" title="Contrat & Dossier"><FileSignature size={16} /></button>
      <button onClick={onPayslip} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-600 transition-colors" title="Bulletin de Paie"><DollarSign size={16} /></button>
      <button onClick={onEdit} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 transition-colors" title="Modifier Fiche"><Edit3 size={16} /></button>
    </div>
  </div>
);

const PayrollTable = ({ employees, config, onPay, calculatePayroll, formatCurrency }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-[3rem] border shadow-sm overflow-hidden">
    <table className="w-full text-left">
      <thead className="bg-slate-900 text-white text-[10px] font-black uppercase">
        <tr>
          <th className="px-10 py-6">Agent</th>
          <th className="px-10 py-6">Base</th>
          <th className="px-10 py-6 text-center">Pénalités</th>
          <th className="px-10 py-6 text-center">NET À PAYER</th>
          <th className="px-10 py-6 text-right">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {employees.map((emp: any) => {
          const payroll = calculatePayroll(emp);
          return (
            <tr key={emp.id} className="hover:bg-slate-50">
              <td className="px-10 py-6 font-black uppercase text-xs">{emp.name}</td>
              <td className="px-10 py-6 text-xs text-slate-500">{formatCurrency(emp.salary)}</td>
              <td className="px-10 py-6 text-center text-rose-500 font-bold">-{formatCurrency(payroll.absenceDeduction + payroll.lateDeduction)}</td>
              <td className="px-10 py-6 text-center font-black text-purple-600 text-base">{formatCurrency(payroll.netSalary)}</td>
              <td className="px-10 py-6 text-right">
                <button disabled={payroll.isPaid} onClick={() => onPay(emp)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase ${payroll.isPaid ? 'bg-emerald-50 text-emerald-600 cursor-default' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg'}`}>
                  {payroll.isPaid ? 'Payé ✓' : 'Régler'}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const ContractView = ({ employee, config, onBack, locale, onUpdateEmployee, notify }: any) => {
  const [activeSubTab, setActiveSubTab] = useState<'contract' | 'files'>('contract');

  const handleDownloadPDF = () => {
    const element = document.getElementById('contract-doc-area');
    if (!element) return;
    const opt = { 
      margin: 10, 
      filename: `Contrat_${employee.name.replace(' ', '_')}.pdf`, 
      image: { type: 'jpeg', quality: 1.0 }, 
      html2canvas: { scale: 3, useCORS: true, backgroundColor: '#ffffff' }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };
    // @ts-ignore
    window.html2pdf().set(opt).from(element).save();
    notify("Export PDF", "Contrat en cours de génération...", "success");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAttachment: Attachment = {
          id: `ATT-EMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          url: event.target?.result as string
        };
        const updatedEmployee = {
          ...employee,
          attachments: [...(employee.attachments || []), newAttachment]
        };
        onUpdateEmployee(updatedEmployee);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    const updatedEmployee = {
      ...employee,
      attachments: employee.attachments?.filter((a: Attachment) => a.id !== id)
    };
    onUpdateEmployee(updatedEmployee);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm no-print">
        <div className="flex items-center space-x-5">
          <button onClick={onBack} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 transition-all">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter">Dossier RH : {employee.name}</h2>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mt-2">
               <button onClick={() => setActiveSubTab('contract')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'contract' ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-400'}`}>Le Contrat</button>
               <button onClick={() => setActiveSubTab('files')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'files' ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-400'}`}>Documents joints ({employee.attachments?.length || 0})</button>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {activeSubTab === 'contract' ? (
            <>
              <button onClick={handleDownloadPDF} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center hover:bg-emerald-700 transition-all">
                <FileDown size={20} className="mr-3" /> Exporter PDF
              </button>
              <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center hover:bg-black transition-all">
                <Printer size={20} className="mr-3" /> Imprimer
              </button>
            </>
          ) : (
            <label className="bg-purple-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center hover:bg-purple-700 transition-all cursor-pointer">
              <Plus size={20} className="mr-3" /> Ajouter un fichier
              <input type="file" multiple className="hidden" onChange={handleFileUpload} />
            </label>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-10">
        {activeSubTab === 'contract' ? (
          <div className="bg-slate-100 p-10 min-h-full flex justify-center">
            <div id="contract-doc-area" className="bg-white text-slate-950 p-20 shadow-2xl w-[210mm] min-h-[297mm] font-serif relative" dir={locale === 'ar-SA' ? 'rtl' : 'ltr'}>
               {/* Filigrane discret */}
               <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-45 select-none">
                  <span className="text-8xl font-black uppercase tracking-[1em]">{config.companyName}</span>
               </div>

               <div className="flex justify-between items-start mb-16 relative">
                  <div className="space-y-1">
                     <AppLogoDoc className="w-16 h-16 mb-4" customLogo={config.companyLogo} />
                     <h1 className="text-sm font-black uppercase text-slate-900">{config.companyName}</h1>
                     <p className="text-[10px] font-bold text-slate-500 uppercase">{config.address}</p>
                     <p className="text-[10px] font-bold text-slate-500">{config.phone}</p>
                  </div>
                  <div className="text-right rtl:text-left pt-6">
                     <p className="text-xs font-bold uppercase text-slate-400">Fait à Nouakchott, le</p>
                     <p className="text-sm font-black">{new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date())}</p>
                  </div>
               </div>

               <div className="text-center mb-16">
                  <h2 className="text-3xl font-black uppercase tracking-[0.3em] border-y-2 border-black py-6 inline-block px-12">Contrat de Travail</h2>
                  <p className="text-xs font-bold mt-4 uppercase text-slate-500 tracking-widest">A durée indéterminée (CDI)</p>
               </div>

               <div className="space-y-10 text-sm leading-relaxed text-justify">
                  <section>
                    <h3 className="font-black uppercase mb-3 border-b border-slate-200 pb-1 flex items-center"><UserCheck size={16} className="mr-2"/> Article 1 - Les Parties</h3>
                    <p>Le présent contrat est conclu entre <strong>{config.companyName}</strong>, représenté par la direction, ci-après dénommé "L'EMPLOYEUR", et <strong>M./Mme {employee.name}</strong>, demeurant à Nouakchott, ci-après dénommé(e) "L'EMPLOYÉ(E)".</p>
                  </section>

                  <section>
                    <h3 className="font-black uppercase mb-3 border-b border-slate-200 pb-1 flex items-center"><Briefcase size={16} className="mr-2"/> Article 2 - Fonctions et Qualification</h3>
                    <p>L'employé est recruté en qualité de <strong>{employee.role}</strong> au sein du département <strong>{employee.department || 'Opérations'}</strong>. Dans le cadre de ses fonctions, il/elle s'engage à respecter les consignes de sécurité, d'hygiène et le règlement intérieur de l'établissement.</p>
                  </section>

                  <section>
                    <h3 className="font-black uppercase mb-3 border-b border-slate-200 pb-1 flex items-center"><DollarSign size={16} className="mr-2"/> Article 3 - Rémunération</h3>
                    <p>En contrepartie de l'exécution de ses missions, l'employé percevra une rémunération mensuelle forfaitaire brute de <strong>{employee.salary.toLocaleString()} {config.currency}</strong>. Cette rémunération sera versée à la fin de chaque mois calendaire.</p>
                  </section>

                  <section>
                    <h3 className="font-black uppercase mb-3 border-b border-slate-200 pb-1 flex items-center"><Clock size={16} className="mr-2"/> Article 4 - Durée et Lieu de travail</h3>
                    <p>Le présent contrat prend effet le <strong>{new Date(employee.joinDate).toLocaleDateString(locale)}</strong>. Le lieu de travail principal est fixé au siège de l'établissement sis à {config.address}.</p>
                  </section>

                  <div className="pt-24 grid grid-cols-2 gap-20">
                     <div className="text-center space-y-16">
                        <p className="text-[10px] font-black uppercase underline tracking-widest">Signature de l'Employé</p>
                        <div className="h-24 border-b border-dashed border-slate-300"></div>
                        <p className="text-[10px] font-bold text-slate-400 italic">Précédée de la mention "Lu et approuvé"</p>
                     </div>
                     <div className="text-center space-y-16">
                        <p className="text-[10px] font-black uppercase underline tracking-widest">Cachet de l'Employeur</p>
                        <div className="h-24 border-b border-dashed border-slate-300"></div>
                        <p className="text-[10px] font-bold text-slate-900 font-mono">Pour {config.companyName}</p>
                     </div>
                  </div>
               </div>

               <div className="absolute bottom-10 left-0 right-0 px-20 flex justify-between items-end opacity-40">
                  <div className="text-[8px] font-mono">
                     Généré par TerraPOS+ System v2.5<br/>
                     ID Dossier : {employee.id}
                  </div>
                  <QrCode size={40} />
               </div>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto py-10 space-y-8 animate-fadeIn">
             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {employee.attachments?.map((file: Attachment) => (
                  <div key={file.id} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm group hover:border-purple-300 hover:shadow-xl transition-all flex flex-col items-center">
                     <div className="w-full aspect-square bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 overflow-hidden relative">
                        {file.type.startsWith('image/') ? (
                           <img src={file.url} className="w-full h-full object-cover" />
                        ) : (
                           <File size={48} className="text-slate-300" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                           <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-3 bg-white rounded-xl text-slate-900 hover:scale-110 transition-transform"><Eye size={20}/></a>
                           <button onClick={() => removeAttachment(file.id)} className="p-3 bg-rose-600 rounded-xl text-white hover:scale-110 transition-transform"><Trash2 size={20}/></button>
                        </div>
                     </div>
                     <p className="text-[10px] font-black uppercase text-center truncate w-full px-2">{file.name}</p>
                     <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{file.type.split('/')[1]}</span>
                  </div>
                ))}
                
                <label className="aspect-[4/5] md:aspect-auto border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 hover:text-purple-600 hover:border-purple-300 transition-all cursor-pointer group">
                   <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl mb-4 group-hover:bg-purple-50 transition-colors">
                      <Upload size={32} />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ajouter un document</span>
                   <p className="text-[8px] mt-1 text-slate-400">(ID, CV, Attestation...)</p>
                   <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                </label>
             </div>

             {(!employee.attachments || employee.attachments.length === 0) && (
                <div className="py-20 text-center opacity-30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
                   <Paperclip size={64} className="mx-auto mb-4" />
                   <h3 className="text-sm font-black uppercase tracking-widest">Le dossier est vide</h3>
                   <p className="text-xs mt-1">Numérisez les documents d'identité et de formation ici.</p>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

const PayslipView = ({ employee, payroll, config, onBack, locale }: any) => {
  const handleDownloadPDF = () => {
    const element = document.getElementById('payslip-area');
    if (!element) return;
    const opt = { 
      margin: 10, 
      filename: `Bulletin_${employee.name.replace(' ', '_')}.pdf`, 
      image: { type: 'jpeg', quality: 0.98 }, 
      html2canvas: { scale: 3, useCORS: true, backgroundColor: '#ffffff' }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };
    // @ts-ignore
    window.html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between no-print bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] border shadow-sm">
           <button onClick={onBack} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 transition-all"><ArrowLeft size={22} /></button>
           <div className="flex items-center space-x-3">
              <button onClick={handleDownloadPDF} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center hover:bg-emerald-700 transition-all"><FileDown size={20} className="mr-3" /> PDF</button>
              <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center hover:bg-black transition-all"><Printer size={20} className="mr-3" /> Imprimer</button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 flex justify-center scrollbar-hide" dir={locale === 'ar-SA' ? 'rtl' : 'ltr'}>
          <div id="payslip-area" className="bg-white text-slate-950 p-16 shadow-2xl w-[210mm] font-sans border-t-8 border-purple-600">
             <div className="flex justify-between items-start border-b-2 border-slate-100 pb-10 mb-10">
                <div className="space-y-1">
                   <AppLogoDoc className="w-12 h-12 mb-4" customLogo={config.companyLogo} />
                   <h2 className="text-lg font-black uppercase">{config.companyName}</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">{config.address}</p>
                </div>
                <div className="text-right rtl:text-left">
                   <h1 className="text-2xl font-black uppercase tracking-widest text-purple-600">Bulletin de Paie</h1>
                   <p className="text-xs font-bold text-slate-400 mt-1">Période : {new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date())}</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-10 mb-16">
                <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                   <h3 className="text-[10px] font-black uppercase text-purple-600 border-b pb-2">Informations Salarié</h3>
                   <div className="space-y-2">
                      <div className="flex justify-between text-xs"><span className="text-slate-400 uppercase font-bold">Nom</span><span className="font-black uppercase">{employee.name}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-400 uppercase font-bold">Matricule</span><span className="font-mono font-bold">#{employee.id.slice(-6)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-400 uppercase font-bold">Poste</span><span className="font-bold">{employee.role}</span></div>
                   </div>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                   <h3 className="text-[10px] font-black uppercase text-purple-600 border-b pb-2">Détails Présence</h3>
                   <div className="space-y-2">
                      <div className="flex justify-between text-xs"><span className="text-slate-400 uppercase font-bold">Jours Absences</span><span className="font-bold text-rose-600">{payroll.absenceDays} j</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-400 uppercase font-bold">Minutes Retard</span><span className="font-bold text-rose-600">{payroll.lateMinutes} m</span></div>
                   </div>
                </div>
             </div>

             <table className="w-full mb-16">
                <thead className="bg-slate-900 text-white text-[10px] font-black uppercase">
                   <tr>
                      <th className="px-6 py-4 text-left rtl:text-right">Rubrique</th>
                      <th className="px-6 py-4 text-center">Base</th>
                      <th className="px-6 py-4 text-right">Retenue</th>
                      <th className="px-6 py-4 text-right">Montant</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                   <tr>
                      <td className="px-6 py-5 font-bold uppercase">Salaire de Base</td>
                      <td className="px-6 py-5 text-center">{employee.salary.toLocaleString()}</td>
                      <td className="px-6 py-5 text-right">-</td>
                      <td className="px-6 py-5 text-right font-bold">{employee.salary.toLocaleString()}</td>
                   </tr>
                   {payroll.absenceDeduction > 0 && (
                     <tr>
                        <td className="px-6 py-5 text-slate-500 italic">Retenue pour Absences</td>
                        <td className="px-6 py-5 text-center">-</td>
                        <td className="px-6 py-5 text-right text-rose-500">-{payroll.absenceDeduction.toLocaleString()}</td>
                        <td className="px-6 py-5 text-right">-</td>
                     </tr>
                   )}
                   {payroll.lateDeduction > 0 && (
                     <tr>
                        <td className="px-6 py-5 text-slate-500 italic">Pénalités Retards</td>
                        <td className="px-6 py-5 text-center">-</td>
                        <td className="px-6 py-5 text-right text-rose-500">-{payroll.lateDeduction.toLocaleString()}</td>
                        <td className="px-6 py-5 text-right">-</td>
                     </tr>
                   )}
                </tbody>
             </table>

             <div className="flex justify-end">
                <div className="w-80 bg-slate-900 text-white p-8 rounded-3xl shadow-xl space-y-6">
                   <div className="flex justify-between items-center opacity-60">
                      <span className="text-[10px] font-black uppercase">Total Bruts</span>
                      <span className="text-sm font-bold">{employee.salary.toLocaleString()}</span>
                   </div>
                   <div className="h-px bg-white/10"></div>
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-purple-400">Net à Payer</span>
                      <span className="text-2xl font-black">{payroll.netSalary.toLocaleString()} {config.currencySymbol}</span>
                   </div>
                </div>
             </div>

             <div className="mt-20 flex justify-between items-end border-t pt-10 opacity-50">
                <p className="text-[9px] font-medium max-w-xs uppercase">Document certifié conforme par {config.companyName}. Conservez ce bulletin sans limitation de durée.</p>
                <QrCode size={32} />
             </div>
          </div>
        </div>
    </div>
  );
};

export default HR;
