
import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, ERPConfig, ViewType, Attachment, Payslip, ContractType, Expense } from '../types';
import { 
  Plus, Search, Mail, Phone, Briefcase, Calendar, DollarSign, Users, Clock, FileText, IdCard, 
  Trash2, X, Edit3, Save, Printer, QrCode, Paperclip, FileSignature, Eye, Camera, 
  ArrowLeft, FileDown, CheckCircle2, Ban, Landmark, MapPin, Building, CreditCard, ChevronRight, BadgeCheck, Check, AlertTriangle, UserCheck, Scissors, History, Hash
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

  if (selectedForContract) return <ContractView employee={selectedForContract} config={config} onBack={() => setSelectedForContract(null)} notify={notify} locale={locale} />;
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
    </div>
  );
};

const EmployeeCard = ({ employee, onEdit, onContract, onPayslip }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-800 p-6 flex flex-col items-center text-center group hover:shadow-2xl transition-all">
    <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 mb-4 flex items-center justify-center text-3xl font-black text-slate-300 uppercase">{employee.name[0]}</div>
    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-md">{employee.name}</h3>
    <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mt-1 mb-6">{employee.role}</p>
    <div className="w-full grid grid-cols-3 gap-2 pt-4 border-t dark:border-slate-800">
      <button onClick={onContract} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-600"><FileSignature size={16} /></button>
      <button onClick={onPayslip} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-600"><DollarSign size={16} /></button>
      <button onClick={onEdit} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900"><Edit3 size={16} /></button>
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

const ContractView = ({ employee, config, onBack, locale }: any) => (
    <div className="h-full space-y-6">
        <button onClick={onBack} className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border"><ArrowLeft/></button>
        <div className="bg-white p-20 shadow-2xl max-w-4xl mx-auto font-serif" dir={locale === 'ar-SA' ? 'rtl' : 'ltr'}>
            <h1 className="text-3xl font-black text-center uppercase border-b-2 border-black pb-10 mb-10">Contrat de Travail</h1>
            <p className="mb-6">Date de rédaction : {new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(new Date())}</p>
            <p className="mb-10 leading-relaxed">Entre <strong>{config.companyName}</strong>, sise à <strong>{config.address}</strong> et l'agent <strong>{employee.name}</strong>.</p>
            <p className="mb-4">Il a été convenu d'un salaire mensuel de {employee.salary} {config.currencySymbol}.</p>
        </div>
    </div>
);

const PayslipView = ({ employee, payroll, config, onBack, locale }: any) => (
    <div className="h-full space-y-6">
        <button onClick={onBack} className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border"><ArrowLeft/></button>
        <div className="bg-white p-10 shadow-2xl max-w-2xl mx-auto border" dir={locale === 'ar-SA' ? 'rtl' : 'ltr'}>
            <div className="flex justify-between items-start border-b pb-6 mb-6">
                <h2 className="text-xl font-black uppercase">Bulletin de Paie</h2>
                <span className="text-xs font-bold text-slate-400">{new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date())}</span>
            </div>
            <div className="space-y-4">
                <div className="flex justify-between"><span className="text-slate-400 uppercase text-[10px] font-black">Employé</span><span className="font-bold">{employee.name}</span></div>
                <div className="flex justify-between border-t pt-4 font-black"><span className="text-purple-600">Net à payer</span><span className="text-xl">{payroll.netSalary.toLocaleString()} {config.currencySymbol}</span></div>
            </div>
        </div>
    </div>
);

export default HR;
