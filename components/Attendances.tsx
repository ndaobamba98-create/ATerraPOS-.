
import React, { useState, useEffect, useMemo } from 'react';
import { Employee, AttendanceRecord, User } from '../types';
import { Clock, LogIn, LogOut, CheckCircle2, History, Timer } from 'lucide-react';

interface Props {
  employees: Employee[];
  onUpdateEmployees: (employees: Employee[]) => void;
  attendance: AttendanceRecord[];
  onUpdateAttendance: (attendance: AttendanceRecord[]) => void;
  currentUser: User;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

const Attendances: React.FC<Props> = ({ employees, onUpdateEmployees, attendance, onUpdateAttendance, currentUser, notify }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentEmployee = useMemo(() => 
    employees.find(e => e.name === currentUser.name) || employees[0]
  , [employees, currentUser.name]);

  const handleClockIn = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('fr-FR');
    
    const newRecord: AttendanceRecord = {
      id: `ATT-${Date.now()}`,
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      checkIn: timeStr,
      date: dateStr
    };
    
    onUpdateAttendance([newRecord, ...attendance]);
    onUpdateEmployees(employees.map(e => e.id === currentEmployee.id ? { ...e, isClockedIn: true, status: 'active' } : e));
    notify("Pointage Entrée", `Bienvenue ${currentEmployee.name} !`, 'success');
  };

  const handleClockOut = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    const updatedAttendance = attendance.map(rec => {
      if (rec.employeeId === currentEmployee.id && !rec.checkOut) {
        return { ...rec, checkOut: timeStr };
      }
      return rec;
    });
    
    onUpdateAttendance(updatedAttendance);
    onUpdateEmployees(employees.map(e => e.id === currentEmployee.id ? { ...e, isClockedIn: false, status: 'absent' } : e));
    notify("Pointage Départ", `Au revoir ${currentEmployee.name}.`, 'warning');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pb-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Pointages</h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Enregistrement des présences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-10 flex flex-col items-center justify-between min-h-[500px] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-purple-600"></div>
          
          <div className="text-center space-y-4">
            <div className="text-5xl font-black text-slate-800 dark:text-white font-mono tracking-tighter">
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>

          <div className="flex flex-col items-center space-y-6">
            <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-black shadow-2xl ${currentEmployee?.isClockedIn ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'}`}>
              {currentEmployee?.name[0]}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white">{currentEmployee?.name}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentEmployee?.role}</p>
            </div>
          </div>

          <div className="w-full">
            {currentEmployee?.isClockedIn ? (
              <button onClick={handleClockOut} className="w-full py-6 bg-rose-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all">Pointer Départ</button>
            ) : (
              <button onClick={handleClockIn} className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all">Pointer Entrée</button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex-1 flex flex-col">
          <h3 className="text-sm font-black uppercase tracking-tight mb-8">Derniers logs</h3>
          <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide">
            {attendance.filter(a => a.employeeId === currentEmployee?.id).slice(0, 10).map((log) => (
              <div key={log.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center justify-between border dark:border-slate-700">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400">{log.date}</span>
                  <div className="flex space-x-3 mt-1">
                    <span className="text-xs font-black text-emerald-500">IN: {log.checkIn}</span>
                    {log.checkOut && <span className="text-xs font-black text-rose-500">OUT: {log.checkOut}</span>}
                  </div>
                </div>
                {log.checkOut ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Timer size={16} className="text-emerald-500 animate-pulse" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendances;
