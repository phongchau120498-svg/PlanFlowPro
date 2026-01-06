import React, { useState } from 'react';
import { CheckSquare, Square, Trash2, AlertCircle, ChevronDown, Calendar, Plus } from 'lucide-react';
import { formatDateKey, getFullDateDisplay } from '../../utils/dateHelpers';
import QuickAddInput from '../tasks/QuickAddInput';

const TodoView = ({ tasks, categories, currentDate, onUpdateTask, onDeleteTask, setEditingTask, quickAddCell, setQuickAddCell, onConfirmQuickAdd, onOpenAddTask, searchQuery, onSaveNewTask }) => {
    const dateStr = formatDateKey(currentDate);
    const todayStr = formatDateKey(new Date());
    
    // Filter tasks
    const todayTasks = tasks.filter(t => t.date === dateStr);
    const overdueTasks = tasks.filter(t => !t.isCompleted && t.date < todayStr).sort((a, b) => new Date(a.date) - new Date(b.date));
    const completedCount = todayTasks.filter(t => t.isCompleted).length;
    const progress = todayTasks.length ? Math.round((completedCount / todayTasks.length) * 100) : 0;
    
    const [isOverdueCollapsed, setIsOverdueCollapsed] = useState(false);

    // STATE CHO FORM THÊM NHANH
    const [quickTitle, setQuickTitle] = useState('');
    const [quickCategory, setQuickCategory] = useState(categories[0]?.id || '');
    const [quickDate, setQuickDate] = useState(formatDateKey(new Date()));

    const handleQuickSubmit = () => {
        if (!quickTitle.trim()) return;
        if (onSaveNewTask) {
            onSaveNewTask({
                title: quickTitle,
                categoryId: quickCategory,
                date: quickDate,
                newCategoryTitle: null
            });
            setQuickTitle(''); // Reset form
        }
    };
    
    const groupedTodayTasks = categories.map(cat => ({
        ...cat,
        tasks: todayTasks.filter(t => t.categoryId === cat.id)
    }));

    return (
        <div className="flex-1 overflow-auto bg-gray-50/30 p-4 md:p-8 animate-in fade-in duration-300 custom-scrollbar">
            <div className="max-w-3xl mx-auto">
                {/* OVERDUE SECTION */}
                {overdueTasks.length > 0 && (
                    <div className="mb-8 animate-in slide-in-from-top-4 duration-300">
                         <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100 shadow-sm">
                            <div className="flex items-center justify-between cursor-pointer mb-2" onClick={() => setIsOverdueCollapsed(!isOverdueCollapsed)}>
                                <div className="flex items-center gap-2 text-rose-700 font-bold">
                                    <AlertCircle size={20} />
                                    <span>Công việc quá hạn ({overdueTasks.length})</span>
                                 </div>
                                <button className="p-1 rounded-full hover:bg-rose-100 text-rose-500 transition-colors">
                                    <ChevronDown size={20} className={`transform transition-transform ${isOverdueCollapsed ? '-rotate-90' : ''}`} />
                                </button>
                            </div>
                            {!isOverdueCollapsed && (
                                <div className="space-y-2 mt-4">
                                    {overdueTasks.map(task => (
                                         <div key={task.id} className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-rose-100 hover:bg-white hover:shadow-md transition-all group cursor-pointer" onDoubleClick={() => setEditingTask(task)}>
                                            <div className="flex-1 min-w-0">
                                                 <div className="font-medium text-gray-800 truncate">{task.title}</div>
                                                 <div className="text-xs text-rose-500 flex items-center gap-1 mt-0.5"><Calendar size={10} /> {task.date.split('-').reverse().join('/')}</div>
                                             </div>
                                             <div className="flex items-center gap-2">
                                                 <button onClick={(e) => { e.stopPropagation(); onUpdateTask({...task, date: todayStr}); }} className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 text-xs font-semibold rounded-lg hover:bg-rose-600 hover:text-white transition-colors">Dời sang hôm nay</button>
                                                 <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                             </div>
                                         </div>
                                    ))}
                                </div>
                            )}
                         </div>
                    </div>
                )}

                {/* Hero Section */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 mb-8 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-50 transition-colors duration-700"></div>
                    <div className="relative z-10 flex items-end justify-between mb-6">
                        <div>
                            <div className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-1 opacity-80">Tổng quan</div>
                             <h2 className="text-3xl font-black text-gray-800 tracking-tight">{getFullDateDisplay(currentDate)}</h2>
                        </div>
                        <div className="text-right">
                             <div className="text-4xl font-black text-gray-900 leading-none tracking-tight">{progress}%</div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Hoàn thành</div>
                        </div>
                    </div>
                    <div className="relative h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out rounded-full" style={{width: `${progress}%`}}></div>
                    </div>
                </div>
                
                {/* --- FORM THÊM NHANH --- */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Plus size={18} className="text-indigo-600"/> Thêm công việc mới
                    </h3>
                    <div className="flex flex-col lg:flex-row gap-4 items-end">
                        <div className="flex-1 w-full space-y-2">
                             <label className="text-xs font-semibold text-gray-400 ml-1">Tên công việc</label>
                             <input 
                                type="text" 
                                value={quickTitle} 
                                onChange={e => setQuickTitle(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && handleQuickSubmit()}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-gray-700 transition-all placeholder-gray-300" 
                                placeholder="Nhập tên việc cần làm..." 
                            />
                        </div>
                         <div className="w-full lg:w-64 space-y-2">
                             <label className="text-xs font-semibold text-gray-400 ml-1">Hạng mục</label>
                             <select 
                                value={quickCategory} 
                                onChange={e => setQuickCategory(e.target.value)} 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-gray-700 cursor-pointer appearance-none"
                            >
                                {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                             </select>
                        </div>
                        <div className="w-full lg:w-48 space-y-2">
                             <label className="text-xs font-semibold text-gray-400 ml-1">Ngày thực hiện</label>
                             <input 
                                type="date" 
                                value={quickDate} 
                                onChange={e => setQuickDate(e.target.value)} 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-gray-700 cursor-pointer" 
                            />
                        </div>
                        <button 
                            onClick={handleQuickSubmit} 
                            className="w-full lg:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Plus size={20} /> <span className="hidden lg:inline">Thêm</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {groupedTodayTasks.map(group => {
                        const isQuickAdding = quickAddCell?.categoryId === group.id && quickAddCell?.dateStr === dateStr;
                        if (group.tasks.length === 0 && !isQuickAdding) return null;
                        return (
                            <div key={group.id} className="animate-in slide-in-from-bottom-2 duration-300 pb-2" onDoubleClick={(e) => { if (isQuickAdding) return; setQuickAddCell({ categoryId: group.id, dateStr }); }}>
                                <div className="flex items-center gap-3 mb-3 pl-2">
                                       <div className={`w-3 h-3 rounded-full ${group.color.value.split(' ')[0].replace('bg-', 'bg-')} ring-2 ring-white shadow-md`}></div>
                                    <h3 className={`text-sm font-bold text-gray-700 tracking-wide`}>{group.title}</h3>
                                    <span className="text-xs text-gray-400 font-bold bg-white border border-gray-100 px-2 py-0.5 rounded-full shadow-sm">{group.tasks.length}</span>
                                </div>
                                <div className="space-y-3">
                                    {group.tasks.map(task => (
                                         <div key={task.id} className={`group flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer ${task.isCompleted ? 'opacity-50' : ''} `} onClick={() => setEditingTask(task)}>
                                            <button onClick={(e) => { e.stopPropagation(); onUpdateTask({ ...task, isCompleted: !task.isCompleted }); }} className={`p-1 rounded-xl transition-colors ${task.isCompleted ? 'text-gray-400 bg-gray-100' : `${group.color.text} bg-gray-50`}`}>
                                                {task.isCompleted ? <CheckSquare size={22}/> : <Square size={22}/>}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                 <div className={`text-base font-semibold truncate ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                    {task.title}
                                                 </div>
                                                {task.description && <div className="text-xs text-gray-400 truncate mt-1">{task.description}</div>}
                                             </div>
                                             <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
                                                <Trash2 size={18} />
                                             </button>
                                        </div>
                                    ))}
                                    {isQuickAdding ? (
                                        <div className="pl-4 border-l-2 border-indigo-100 animate-in fade-in" onClick={e => e.stopPropagation()}>
                                            <QuickAddInput dateStr={dateStr} onConfirm={(title) => onConfirmQuickAdd(title)} onCancel={() => setQuickAddCell(null)} categoryColor={group.color} />
                                        </div>
                                    ) : ( <div className="h-4 w-full" /> )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
export default TodoView;