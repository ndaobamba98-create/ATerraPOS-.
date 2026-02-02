
import React, { useState, useMemo } from 'react';
import { Task, ERPConfig } from '../types';
import { INITIAL_TASKS } from '../constants';
import { 
  Plus, CheckCircle2, Clock, AlertTriangle, Calendar, User, Search, 
  Trash2, X, Save, Edit3, Grid, List, Layers, MoreHorizontal
} from 'lucide-react';

const TASK_STAGES = [
  { id: 'todo', label: 'À faire', color: 'bg-slate-200 text-slate-600' },
  { id: 'doing', label: 'En cours', color: 'bg-blue-100 text-blue-600' },
  { id: 'done', label: 'Terminé', color: 'bg-emerald-100 text-emerald-600' }
];

const Projects: React.FC<{ config: ERPConfig, notify: any }> = ({ config, notify }) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('erp_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [tasks, searchTerm]);

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask?.title) return;

    const newTask = {
      ...editingTask,
      id: editingTask.id || `T-${Date.now()}`,
      stage: editingTask.stage || 'todo',
      priority: editingTask.priority || 'medium',
      deadline: editingTask.deadline || new Date().toISOString().split('T')[0]
    } as Task;

    const updated = tasks.find(t => t.id === newTask.id)
      ? tasks.map(t => t.id === newTask.id ? newTask : t)
      : [newTask, ...tasks];

    setTasks(updated);
    localStorage.setItem('erp_tasks', JSON.stringify(updated));
    setIsModalOpen(false);
    setEditingTask(null);
    notify("Projets", "Tâche mise à jour.", "success");
  };

  const deleteTask = (id: string) => {
    if (confirm("Supprimer cette tâche ?")) {
      const updated = tasks.filter(t => t.id !== id);
      setTasks(updated);
      localStorage.setItem('erp_tasks', JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20 pr-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Projets & Tâches</h1>
          <p className="text-sm text-slate-500 font-medium">Suivi opérationnel de l'établissement</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Chercher tâche..." className="pl-12 pr-6 py-3 bg-white dark:bg-slate-900 border rounded-2xl text-xs font-bold outline-none" />
          </div>
          <button onClick={() => { setEditingTask({ title: '', stage: 'todo' }); setIsModalOpen(true); }} className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-all">
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {TASK_STAGES.map(stage => (
           <div key={stage.id} className="flex flex-col space-y-4">
              <div className="flex items-center justify-between px-4">
                 <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${stage.color}`}>
                   {stage.label}
                 </span>
                 <span className="text-[10px] font-black text-slate-400">{filteredTasks.filter(t => t.stage === stage.id).length}</span>
              </div>
              
              <div className="bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 min-h-[600px] flex flex-col space-y-4">
                 {filteredTasks.filter(t => t.stage === stage.id).map(task => (
                   <div key={task.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-blue-400 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                         <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-orange-500' : 'bg-blue-400'}`}></div>
                         <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                      </div>
                      <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white leading-tight mb-2">{task.title}</h4>
                      <p className="text-[10px] font-medium text-slate-400 line-clamp-2 mb-4">{task.description}</p>
                      
                      <div className="pt-4 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
                         <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[8px] font-black text-slate-500">
                               {task.assignedTo?.charAt(0)}
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">{task.deadline}</span>
                         </div>
                         <button onClick={() => { setEditingTask(task); setIsModalOpen(true); }} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-500"><Edit3 size={14}/></button>
                      </div>
                   </div>
                 ))}
                 {filteredTasks.filter(t => t.stage === stage.id).length === 0 && (
                   <div className="flex-1 flex flex-col items-center justify-center opacity-20 py-20">
                      <Layers size={40} className="mb-2" />
                      <p className="text-[9px] font-black uppercase">Vide</p>
                   </div>
                 )}
              </div>
           </div>
         ))}
      </div>

      {isModalOpen && editingTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden">
              <div className="p-8 border-b bg-blue-600 text-white flex justify-between items-center">
                 <div className="flex items-center space-x-4">
                    <CheckCircle2 size={24}/>
                    <h3 className="text-xl font-black uppercase tracking-tighter">Fiche Tâche</h3>
                 </div>
                 <button onClick={() => setIsModalOpen(false)}><X size={24}/></button>
              </div>
              <form onSubmit={handleSaveTask} className="p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Titre de la tâche</label>
                    <input required value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-4 px-6 font-bold" placeholder="ex: Commande boissons..." />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Description</label>
                    <textarea value={editingTask.description} onChange={e => setEditingTask({...editingTask, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-4 px-6 font-bold h-24" placeholder="Détails..." />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400">Échéance</label>
                     <input type="date" value={editingTask.deadline} onChange={e => setEditingTask({...editingTask, deadline: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-4 px-6 font-bold" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400">Priorité</label>
                     <select value={editingTask.priority} onChange={e => setEditingTask({...editingTask, priority: e.target.value as any})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-4 px-6 font-bold uppercase text-[10px]">
                        <option value="low">Basse</option>
                        <option value="medium">Moyenne</option>
                        <option value="high">Haute</option>
                     </select>
                   </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">État d'avancement</label>
                    <select value={editingTask.stage} onChange={e => setEditingTask({...editingTask, stage: e.target.value as any})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-4 px-6 font-bold uppercase text-[10px]">
                      {TASK_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                 </div>
                 <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-xs shadow-xl flex items-center justify-center">
                    <Save size={18} className="mr-3" /> Enregistrer la tâche
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
