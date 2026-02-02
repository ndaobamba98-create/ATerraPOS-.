
import React, { useState, useMemo } from 'react';
import { ERPConfig } from '../types';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Users, Coffee, Utensils, Zap } from 'lucide-react';

interface Props {
  config: ERPConfig;
  t: (key: any) => string;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  type: 'meeting' | 'delivery' | 'maintenance' | 'service';
  color: string;
  icon: any;
}

const CalendarView: React.FC<Props> = ({ config, t, notify }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const locale = config.language === 'ar' ? 'ar-SA' : config.language === 'fr' ? 'fr-FR' : 'en-US';

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    const firstDayIndex = (date.getDay() + 6) % 7; 
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const baseDate = new Date(2021, 0, 4); // Un Lundi
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
    });
  }, [locale]);

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: config.timezone }).format(currentDate);

  return (
    <div className="flex flex-col h-full space-y-6" dir={config.language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-6 rtl:space-x-reverse">
          <h2 className="text-3xl font-black text-purple-600 uppercase tracking-tighter drop-shadow-sm">
            {monthLabel}
          </h2>
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm text-slate-500"><ChevronLeft size={20}/></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-white dark:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Aujourd'hui</button>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm text-slate-500"><ChevronRight size={20}/></button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-950 rounded-[3rem] border-2 border-slate-50 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 border-b dark:border-slate-800">
          {weekDays.map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{day}</div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
          {daysInMonth.map((day, idx) => {
            const isToday = day && day.toDateString() === new Date().toDateString();
            return (
              <div key={idx} className={`min-h-[120px] p-4 border-r border-b dark:border-slate-800 last:border-r-0 transition-colors ${day ? 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30' : 'bg-slate-50/20 dark:bg-slate-900/10'}`}>
                {day && (
                  <div className="h-full flex flex-col space-y-2">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${isToday ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400'}`}>
                      {day.getDate()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
