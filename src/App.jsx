import React, { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Calendar, GripVertical, AlignLeft, Clock, Trash2, CheckSquare, Square, CalendarPlus, CornerDownLeft, Palette, ZoomIn, ArrowRight, RotateCcw, RotateCw, Flag, LayoutGrid, ListTodo, Repeat, Save, Search, Bell, ChevronDown, AlertCircle, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { supabase } from './supabaseClient';
// --- DESIGN SYSTEM: Apple-inspired Pastel Palette ---
const COLORS = [
  { name: 'Classic Gray', value: 'bg-gray-50 border-gray-200', text: 'text-gray-700', ring: 'ring-gray-400' },
  { name: 'Ocean Blue', value: 'bg-blue-50 border-blue-200', text: 'text-blue-700', ring: 'ring-blue-400' },
  { name: 'Sage Green', value: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', ring: 'ring-emerald-400' },
  { name: 'Sunny Yellow', value: 'bg-amber-50 border-amber-200', text: 'text-amber-700', ring: 'ring-amber-400' },
  { name: 'Rose Red', value: 'bg-rose-50 border-rose-200', text: 'text-rose-700', ring: 'ring-rose-400' },
  { name: 'Lavender', value: 'bg-violet-50 border-violet-200', text: 'text-violet-700', ring: 'ring-violet-400' },
  { name: 'Peach', value: 'bg-orange-50 border-orange-200', text: 'text-orange-700', ring: 'ring-orange-400' },
  { name: 'Blush Pink', value: 'bg-pink-50 border-pink-200', text: 'text-pink-700', ring: 'ring-pink-400' },
];

const ZOOM_LEVELS = [120, 160, 200, 240, 280]; 

// --- Helper Functions ---
const formatDateKey = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getMonday = (d) => {
  d = new Date(d);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
  return new Date(d.setDate(diff));
};

const getInfiniteWeekWindow = (currentDate) => {
    const currentMonday = getMonday(currentDate);
    const startDate = new Date(currentMonday);
    startDate.setDate(startDate.getDate() - 7); 

    const days = [];
    for (let i = 0; i < 21; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        days.push(d);
    }
    return days;
};

const formatDateDisplay = (date) => {
    return date.getDate();
};

const getDayName = (date) => {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return days[date.getDay()];
};

const getFullDateDisplay = (date) => {
    return `Thứ ${date.getDay() === 0 ? 'CN' : date.getDay() + 1}, ${date.getDate()}/${date.getMonth() + 1}`;
}

const generateGoogleCalendarLink = (task) => {
  const startTime = task.date.replace(/-/g, '') + 'T090000';
  const endTime = task.date.replace(/-/g, '') + 'T100000';
  const details = encodeURIComponent(`${task.description || ''} \n\n[PlanFlow App]`);
  const title = encodeURIComponent(`DEADLINE: ${task.title}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}`;
};

// --- Initial Data ---
const INITIAL_DATA = {
    categories: [
        { id: 'cat-1', title: '🎨 Thiết kế UI/UX', color: COLORS[1], collapsed: false }, 
        { id: 'cat-2', title: '💻 Phát triển Frontend', color: COLORS[2], collapsed: false }, 
        { id: 'cat-3', title: '⚙️ Backend & API', color: COLORS[5], collapsed: false }, 
        { id: 'cat-4', title: '🚀 Marketing & Content', color: COLORS[6], collapsed: false }, 
    ],
    tasks: [
        { 
            id: 't-1', 
            categoryId: 'cat-1', 
            date: formatDateKey(new Date()), 
            title: 'Phác thảo Wireframe', 
            description: 'Vẽ phác thảo màn hình Dashboard và trang Login.',
            isCompleted: false,
            repeat: 'none',
            seriesId: null
        },
    ]
};

// --- Custom Hook: Undoable State ---
const useUndoableState = (initialValue) => {
    const [history, setHistory] = useState([]);
    const [future, setFuture] = useState([]);
    const [state, setState] = useState(initialValue);

    const setStateWithHistory = useCallback((newStateOrUpdater) => {
        setHistory((prev) => [...prev, state]);
        setFuture([]); 
        setState((prev) => typeof newStateOrUpdater === 'function' ? newStateOrUpdater(prev) : newStateOrUpdater);
    }, [state]);

    const undo = useCallback(() => {
        if (history.length === 0) return;
        const previousState = history[history.length - 1];
        const newHistory = history.slice(0, -1);
        setFuture((prev) => [state, ...prev]); 
        setHistory(newHistory);
        setState(previousState);
    }, [history, state]);

    const redo = useCallback(() => {
        if (future.length === 0) return;
        const nextState = future[0];
        const newFuture = future.slice(1);
        setHistory((prev) => [...prev, state]); 
        setFuture(newFuture);
        setState(nextState);
    }, [future, state]);

    return [state, setStateWithHistory, undo, redo, history.length > 0, future.length > 0];
};

// --- TOAST NOTIFICATION COMPONENT ---
const ToastContainer = ({ toasts }) => {
    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 z-[100] pointer-events-none">
            {toasts.map(toast => (
                <div key={toast.id} className="bg-gray-900/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    {toast.type === 'success' && <CheckSquare size={18} className="text-emerald-400" />}
                    {toast.type === 'info' && <Bell size={18} className="text-blue-400" />}
                    <span className="text-sm font-medium tracking-wide">{toast.message}</span>
                </div>
            ))}
        </div>
    );
};

// --- HEADER COMPONENT ---
const Header = ({ 
    currentDate, prevWeek, nextWeek, goToToday, onDateSelect, zoomIndex, onZoomChange, 
    onUndo, canUndo, onRedo, canRedo, viewMode, setViewMode, onOpenAddTask, 
    searchQuery, setSearchQuery, tasks, onNavigateToTask 
}) => {
    const startOfWeek = getMonday(currentDate);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef(null);

    const overdueCount = useMemo(() => {
        const todayStr = formatDateKey(new Date());
        return tasks.filter(t => !t.isCompleted && t.date < todayStr).length;
    }, [tasks]);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [tasks, searchQuery]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <header className="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-white/85 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 transition-all">
        {/* Left Section */}
        <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-200 text-white">
                <Calendar size={20} strokeWidth={2.5} />
              </div>
              <h1 className="text-lg font-bold text-gray-800 tracking-tight hidden lg:block">PlanFlow</h1>
          </div>
          
          <div className="bg-gray-100/50 p-1 rounded-2xl flex items-center border border-gray-200/50">
              <button 
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-300
                    ${viewMode === 'matrix' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  <LayoutGrid size={14} /> Lịch biểu
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-300
                    ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  <ListTodo size={14} /> To-Do
                  {overdueCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
              </button>
          </div>
        </div>

        {/* Center Section: Navigation */}
        <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm my-2 md:my-0 hover:shadow-md transition-shadow duration-300">
            <button onClick={prevWeek} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-500 transition-colors">
              <ChevronLeft size={16} />
            </button>
            
            <div className="relative group px-2">
                <span className="font-semibold text-gray-700 text-sm min-w-[140px] text-center block cursor-pointer hover:text-indigo-600 transition-colors">
                    Tháng {startOfWeek.getMonth() + 1}, {startOfWeek.getFullYear()}
                </span>
                <input 
                    type="date"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    value={formatDateKey(currentDate)}
                    onChange={(e) => e.target.value && onDateSelect(new Date(e.target.value))}
                />
            </div>

            <button onClick={nextWeek} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-500 transition-colors">
              <ChevronRight size={16} />
            </button>
        </div>
        
        {/* Right Section: Search & Tools */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <button onClick={goToToday} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-colors">
                Hôm nay
            </button>

            {/* Spotlight Search */}
            <div className="relative hidden md:block group z-[60]" ref={searchRef}>
                <div className={`flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 transition-all w-48 focus-within:w-64 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300`}>
                    <Search size={14} className="text-gray-400 group-focus-within:text-indigo-500 mr-2" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm..." 
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        className="bg-transparent text-xs outline-none w-full placeholder-gray-400 text-gray-700"
                    />
                    {searchQuery && (
                        <button onClick={() => { setSearchQuery(''); setShowDropdown(false); }} className="text-gray-300 hover:text-gray-500">
                            <X size={12} />
                        </button>
                    )}
                </div>

                {showDropdown && searchQuery && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200 p-2">
                        {searchResults.length > 0 ? (
                            searchResults.map(task => (
                                <div 
                                    key={task.id}
                                    onClick={() => {
                                        onNavigateToTask(task);
                                        setShowDropdown(false);
                                    }}
                                    className="px-3 py-2.5 hover:bg-indigo-50/80 rounded-xl cursor-pointer transition-colors group/item"
                                >
                                    <div className="font-semibold text-xs text-gray-800 group-hover/item:text-indigo-700 truncate">{task.title}</div>
                                    <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                                        <Calendar size={10} /> 
                                        <span>{task.date.split('-').reverse().join('/')}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-6 text-center text-gray-400 text-xs">
                                Không tìm thấy kết quả
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

            <div className="flex items-center gap-1">
                <button onClick={onUndo} disabled={!canUndo} className={`p-2 rounded-xl transition-all ${canUndo ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'}`} title="Hoàn tác">
                    <RotateCcw size={16} />
                </button>
                <button onClick={onRedo} disabled={!canRedo} className={`p-2 rounded-xl transition-all ${canRedo ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'}`} title="Làm lại">
                    <RotateCw size={16} />
                </button>
            </div>

            {viewMode === 'matrix' && (
                <div className="flex items-center gap-2 px-2 hidden lg:flex">
                    <ZoomIn size={14} className="text-gray-400" />
                    <input type="range" min="0" max={ZOOM_LEVELS.length - 1} step="1" value={zoomIndex} onChange={onZoomChange} className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>
            )}
        </div>
      </header>
    );
};

// --- TASK CARD COMPONENT ---
const TaskCard = ({ task, categoryColor, dayWidth, isHighlighted, onSelect, onUpdate, onDelete, onDragStart, setEditingTask }) => {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task)}
            onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingTask(task);
            }}
            style={{ width: `${dayWidth - 12}px` }} 
            className={`
                group relative p-2.5 rounded-xl border border-transparent cursor-grab active:cursor-grabbing 
                transition-all duration-300 ease-out select-none z-10 
                ${isHighlighted ? 'ring-2 ring-amber-400 ring-offset-2 scale-105 shadow-xl z-30' : 'hover:z-20 hover:scale-[1.02] hover:shadow-lg'}
                ${task.isCompleted 
                    ? 'bg-gray-50 border-gray-100 opacity-60 grayscale' 
                    : `${categoryColor.value} shadow-sm`
                }
            `}
        >
            <div className="flex items-start gap-2.5 overflow-hidden">
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onUpdate({ ...task, isCompleted: !task.isCompleted });
                    }}
                    className={`flex-shrink-0 transition-colors mt-0.5 rounded-md hover:bg-black/5 p-0.5
                        ${task.isCompleted ? 'text-gray-400' : categoryColor.text}`}
                >
                    {task.isCompleted ? <CheckSquare size={16}/> : <Square size={16}/>}
                </button>
                
                <div className="flex-1 min-w-0">
                     <div className={`text-xs font-semibold leading-snug break-words
                        ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}
                    `}>
                        {task.title}
                    </div>
                    
                    {(task.repeat !== 'none' || task.time) && !task.isCompleted && (
                        <div className="flex items-center gap-2 mt-1.5">
                            {task.time && (
                                <span className="flex items-center gap-0.5 text-[10px] font-mono bg-white/50 px-1 rounded text-gray-600">
                                    {task.time}
                                </span>
                            )}
                            {task.repeat !== 'none' && (
                                <span className="flex items-center gap-0.5 text-[10px] opacity-60">
                                    <Repeat size={10} />
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                }}
                className="absolute top-1 right-1 p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-all opacity-0 group-hover:opacity-100 scale-90 hover:scale-110 shadow-sm"
                title="Xóa nhanh"
            >
                <X size={14} />
            </button>
        </div>
    );
};

// --- TODO LIST COMPONENT ---
const TodoView = ({ tasks, categories, currentDate, onUpdateTask, onDeleteTask, setEditingTask, quickAddCell, setQuickAddCell, onConfirmQuickAdd, onOpenAddTask, searchQuery }) => {
    const dateStr = formatDateKey(currentDate);
    const todayStr = formatDateKey(new Date());
    
    // Filter tasks
    const todayTasks = tasks.filter(t => t.date === dateStr);
    const overdueTasks = tasks.filter(t => !t.isCompleted && t.date < todayStr).sort((a, b) => new Date(a.date) - new Date(b.date));

    const completedCount = todayTasks.filter(t => t.isCompleted).length;
    const progress = todayTasks.length ? Math.round((completedCount / todayTasks.length) * 100) : 0;
    
    const [isOverdueCollapsed, setIsOverdueCollapsed] = useState(false);

    const groupedTodayTasks = categories.map(cat => ({
        ...cat,
        tasks: todayTasks.filter(t => t.categoryId === cat.id)
    })).filter(group => group.tasks.length > 0); 

    return (
        <div className="flex-1 overflow-auto bg-gray-50/30 p-4 md:p-8 animate-in fade-in duration-300 custom-scrollbar">
            <div className="max-w-3xl mx-auto">
                
                {/* OVERDUE SECTION */}
                {overdueTasks.length > 0 && (
                    <div className="mb-8 animate-in slide-in-from-top-4 duration-300">
                         <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100 shadow-sm">
                            <div 
                                className="flex items-center justify-between cursor-pointer mb-2"
                                onClick={() => setIsOverdueCollapsed(!isOverdueCollapsed)}
                            >
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
                                        <div 
                                            key={task.id} 
                                            className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-rose-100 hover:bg-white hover:shadow-md transition-all group cursor-pointer"
                                            onDoubleClick={() => setEditingTask(task)} 
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-800 truncate">{task.title}</div>
                                                <div className="text-xs text-rose-500 flex items-center gap-1 mt-0.5">
                                                    <Calendar size={10} /> {task.date.split('-').reverse().join('/')}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onUpdateTask({...task, date: todayStr});
                                                    }} 
                                                    className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 text-xs font-semibold rounded-lg hover:bg-rose-600 hover:text-white transition-colors"
                                                >
                                                    Dời sang hôm nay
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteTask(task.id);
                                                    }}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
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

                <div className="space-y-6">
                    {groupedTodayTasks.map(group => {
                        const isQuickAdding = quickAddCell?.categoryId === group.id && quickAddCell?.dateStr === dateStr;
                        // Hide empty categories unless adding
                        if (group.tasks.length === 0 && !isQuickAdding) return null;

                        return (
                            <div 
                                key={group.id} 
                                className="animate-in slide-in-from-bottom-2 duration-300 pb-2" 
                                onDoubleClick={(e) => {
                                    if (isQuickAdding) return;
                                    setQuickAddCell({ categoryId: group.id, dateStr });
                                }}
                            >
                                <div className="flex items-center gap-3 mb-3 pl-2">
                                    <div className={`w-3 h-3 rounded-full ${group.color.value.split(' ')[0].replace('bg-', 'bg-')} ring-2 ring-white shadow-md`}></div>
                                    <h3 className={`text-sm font-bold text-gray-700 tracking-wide`}>{group.title}</h3>
                                    <span className="text-xs text-gray-400 font-bold bg-white border border-gray-100 px-2 py-0.5 rounded-full shadow-sm">{group.tasks.length}</span>
                                </div>
                                
                                <div className="space-y-3 min-h-[20px]">
                                    {group.tasks.length === 0 && !isQuickAdding && (
                                         <div className="h-8 border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-300 pointer-events-none italic">Nhấp đúp để thêm công việc</div>
                                    )}

                                    {group.tasks.map(task => (
                                        <div 
                                            key={task.id} 
                                            className={`group flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer
                                                ${task.isCompleted ? 'opacity-50' : ''}
                                            `}
                                            onClick={() => setEditingTask(task)}
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onUpdateTask({ ...task, isCompleted: !task.isCompleted });
                                                }}
                                                className={`p-1 rounded-xl transition-colors ${task.isCompleted ? 'text-gray-400 bg-gray-100' : `${group.color.text} bg-gray-50`}`}
                                            >
                                                {task.isCompleted ? <CheckSquare size={22}/> : <Square size={22}/>}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-base font-semibold truncate ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                    {task.title}
                                                </div>
                                                {task.description && <div className="text-xs text-gray-400 truncate mt-1">{task.description}</div>}
                                            </div>
                                            
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteTask(task.id);
                                                }}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Quick Add Area */}
                                    {isQuickAdding && (
                                        <div className="pl-4 border-l-2 border-indigo-100 animate-in fade-in" onClick={e => e.stopPropagation()}>
                                            <QuickAddInput 
                                                dateStr={dateStr}
                                                onConfirm={(title) => onConfirmQuickAdd(title)}
                                                onCancel={() => setQuickAddCell(null)}
                                                categoryColor={group.color}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* BIG Add new Task Button - CENTERED & PRIMARY */}
                    <button 
                        onClick={() => onOpenAddTask({ date: dateStr })}
                        className="w-full py-5 mt-8 bg-white border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-3xl flex items-center justify-center gap-3 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50/50 transition-all group shadow-sm hover:shadow-md"
                    >
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus size={24} className="text-indigo-600" />
                        </div>
                        <span className="text-lg font-bold">Thêm công việc cho hôm nay</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MODALS & INPUTS (Polished) ---

const AddTaskModal = ({ onClose, onSave, categories, initialDate, initialCategoryId }) => {
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState(initialCategoryId || categories[0]?.id);
    const [date, setDate] = useState(initialDate || formatDateKey(new Date()));
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [newCategoryTitle, setNewCategoryTitle] = useState('');

    const handleSave = () => {
        if (!title.trim()) return;
        onSave({ title, date, categoryId: isNewCategory ? null : categoryId, newCategoryTitle: isNewCategory ? newCategoryTitle : null });
    };

    return (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-0 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col border border-white/50">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">Thêm công việc mới</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Hạng mục</label>
                        {!isNewCategory ? (
                            <div className="relative">
                                <select 
                                    value={categoryId}
                                    onChange={(e) => e.target.value === 'NEW' ? setIsNewCategory(true) : setCategoryId(e.target.value)}
                                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white text-gray-700 transition-all appearance-none font-semibold text-sm"
                                >
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.title}</option>)}
                                    <option disabled>──────────</option>
                                    <option value="NEW">+ Tạo hạng mục mới...</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input type="text" placeholder="Tên hạng mục..." value={newCategoryTitle} onChange={(e) => setNewCategoryTitle(e.target.value)} className="flex-1 px-5 py-3 border border-indigo-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10" autoFocus />
                                <button onClick={() => setIsNewCategory(false)} className="px-5 py-3 text-gray-500 hover:bg-gray-100 rounded-2xl font-semibold">Hủy</button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Tên công việc</label>
                        <input type="text" placeholder="Ví dụ: Họp team marketing..." value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-lg font-semibold placeholder-gray-300 transition-all" autoFocus={!isNewCategory} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Hạn chót</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-gray-700 font-semibold" />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 text-gray-500 hover:bg-white hover:shadow-sm rounded-2xl font-bold transition-all text-sm">Hủy</button>
                    <button onClick={handleSave} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm">Lưu công việc</button>
                </div>
            </div>
        </div>
    );
};

const QuickAddInput = ({ dateStr, onConfirm, onCancel, categoryColor }) => {
    const inputRef = useRef(null);
    const [title, setTitle] = useState('');
    useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);
    const handleKeyDown = (e) => { if (e.key === 'Enter') onConfirm(title); else if (e.key === 'Escape') onCancel(); };

    return (
        <div className={`p-4 bg-white rounded-2xl border-2 shadow-xl animate-in fade-in zoom-in-95 duration-200 ${categoryColor.text} border-current z-50 relative min-w-[200px]`}>
            <input ref={inputRef} type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-base font-medium text-gray-800 placeholder-gray-400 border-none p-0 focus:ring-0 leading-tight mb-3" placeholder="Nhập tên việc..." onKeyDown={handleKeyDown} />
             <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                 <div className="flex items-center gap-1 text-[10px] opacity-50 font-medium"><CornerDownLeft size={10} /> <span>Enter lưu</span></div>
                 <button onClick={() => onConfirm(title)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 shadow-md font-medium transition-all">Thêm</button>
            </div>
        </div>
    );
};

const TaskModal = ({ task, onClose, onUpdate, onDelete, categories, onGenerateRepeats }) => {
  if (!task) return null;

  const [localTask, setLocalTask] = useState(task);
  const category = categories.find(c => c.id === localTask.categoryId);
  const currentCategoryColor = category ? category.color : COLORS[0];

  useEffect(() => { setLocalTask(task); }, [task.id]);

  const handleSaveAndClose = () => {
      if (localTask.repeat !== task.repeat && localTask.repeat !== 'none') {
           onGenerateRepeats(localTask, localTask.repeat);
      }
      onUpdate(localTask);
      onClose();
  };

  useEffect(() => {
      const handleKeyDown = (e) => {
          if (e.key === 'Escape') handleSaveAndClose();
          if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') handleSaveAndClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localTask]);

  const handleAddToGoogleCalendar = () => {
    const url = generateGoogleCalendarLink(localTask);
    window.open(url, '_blank');
  };

  const handleRepeatChange = (e) => {
      const newRepeat = e.target.value;
      setLocalTask(prev => ({ ...prev, repeat: newRepeat }));
      if (newRepeat !== 'none') {
          onGenerateRepeats(localTask, newRepeat);
      }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={handleSaveAndClose}>
      <div className="bg-white w-full max-w-2xl h-[85vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/50" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentCategoryColor.value} border shadow-sm`}>{category?.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAddToGoogleCalendar} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Google Calendar"><CalendarPlus size={20} /></button>
             <button onClick={() => { onDelete(localTask.id); onClose(); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Xóa"><Trash2 size={20} /></button>
            <button onClick={handleSaveAndClose} className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-200 rounded-xl transition-all"><X size={22} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           <div className="mb-6 flex items-center justify-between">
                <button onClick={() => setLocalTask(prev => ({...prev, isCompleted: !prev.isCompleted}))} className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border shadow-sm ${localTask.isCompleted ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>
                    {localTask.isCompleted ? <CheckSquare size={20}/> : <Square size={20}/>}
                    {localTask.isCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                </button>
                
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                    <Repeat size={16} className="text-indigo-500" />
                    <select value={localTask.repeat || 'none'} onChange={handleRepeatChange} className="text-sm bg-transparent border-none focus:ring-0 text-gray-600 font-medium cursor-pointer">
                        <option value="none">Không lặp lại</option>
                        <option value="daily">Hàng ngày</option>
                        <option value="weekly">Hàng tuần</option>
                        <option value="monthly">Hàng tháng</option>
                    </select>
                </div>
           </div>

          <input type="text" value={localTask.title} onChange={(e) => setLocalTask(prev => ({...prev, title: e.target.value}))} className={`w-full text-4xl font-bold border-none focus:ring-0 placeholder-gray-300 p-0 mb-8 bg-transparent tracking-tight leading-tight ${localTask.isCompleted ? 'text-gray-400 line-through decoration-2' : 'text-gray-900'}`} placeholder="Tên công việc..." autoFocus />

          <div className="flex items-center gap-6 mb-8 text-sm border-b border-gray-100 pb-6">
            <div className="flex items-center gap-3 text-gray-500 font-medium">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Clock size={18} /></div>
                <input type="date" value={localTask.date} onChange={(e) => setLocalTask(prev => ({...prev, date: e.target.value}))} className="bg-transparent border-none focus:ring-0 p-0 text-gray-800 font-bold" />
            </div>
          </div>

          <div className="flex items-start gap-4 text-gray-500">
              <div className="mt-1 p-2 bg-gray-50 rounded-lg text-gray-400"><AlignLeft size={18} /></div>
              <div className="flex-1">
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Chi tiết</span>
                  <textarea value={localTask.description} onChange={(e) => setLocalTask(prev => ({...prev, description: e.target.value}))} className="w-full min-h-[300px] p-0 text-gray-700 bg-transparent border-none focus:ring-0 text-base leading-relaxed placeholder-gray-300 resize-none" placeholder="Nhập chi tiết công việc, ghi chú, hoặc danh sách việc cần làm..." />
              </div>
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button onClick={handleSaveAndClose} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] active:scale-[0.98]"><Save size={18}/> Lưu thay đổi</button>
        </div>
      </div>
    </div>
  );
};

const RecurringUpdateModal = ({ onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600"><Repeat size={24} /></div>
                    <h3 className="text-lg font-bold text-gray-800">Cập nhật chuỗi công việc</h3>
                    <p className="text-sm text-gray-500 mt-2">Thay đổi này áp dụng cho...</p>
                </div>
                <div className="space-y-3">
                    <button onClick={() => onConfirm('single')} className="w-full py-3 px-4 bg-white border border-gray-200 hover:border-indigo-500 hover:text-indigo-600 rounded-xl text-gray-700 font-medium transition-all shadow-sm flex items-center justify-center gap-2">Chỉ công việc này</button>
                    <button onClick={() => onConfirm('future')} className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-medium transition-all shadow-md flex items-center justify-center gap-2">Các công việc tiếp theo</button>
                    <button onClick={onClose} className="w-full py-2 text-gray-400 hover:text-gray-600 text-sm">Hủy bỏ</button>
                </div>
            </div>
        </div>
    );
};

// --- APP COMPONENT ---
export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddingCategory, setIsAddingCategory] = useState(false); 
  const [viewMode, setViewMode] = useState('matrix');
  const [boardData, setBoardData, undo, redo, canUndo, canRedo] = useUndoableState(INITIAL_DATA);
  const { categories, tasks } = boardData;
  
  // States
  const [zoomIndex, setZoomIndex] = useState(2); 
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const dayWidth = ZOOM_LEVELS[zoomIndex];
  
  const [draggedTask, setDraggedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [quickAddCell, setQuickAddCell] = useState(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskDefaults, setNewTaskDefaults] = useState({}); 
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); // Added Search
  const [toasts, setToasts] = useState([]); // Added Toasts
  const [highlightedTaskId, setHighlightedTaskId] = useState(null); // Added Highlight

  const scrollContainerRef = useRef(null);
  const previousDateRef = useRef(currentDate);
  const viewCenterDayIndexRef = useRef(null);
  const scrollActionRef = useRef('jump'); 
  const isProgrammaticScroll = useRef(false);

  // Toast Helper
  const addToast = (message, type = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // --- REPEAT TASK GENERATION ---
  const handleGenerateRepeats = (baseTask, repeatType) => {
      if (!baseTask || !repeatType || repeatType === 'none') return;
      const seriesId = baseTask.seriesId || `series-${Date.now()}`;
      let updatedBaseTask = { ...baseTask, seriesId, repeat: repeatType };
      const newTasks = [];
      const startDate = new Date(baseTask.date);
      const count = 12; 
      for (let i = 1; i <= count; i++) {
          const nextDate = new Date(startDate);
          if (repeatType === 'daily') nextDate.setDate(startDate.getDate() + i);
          else if (repeatType === 'weekly') nextDate.setDate(startDate.getDate() + (i * 7));
          else if (repeatType === 'monthly') nextDate.setMonth(startDate.getMonth() + i);
          newTasks.push({ ...baseTask, id: `${baseTask.id}-rep-${Date.now()}-${i}`, date: formatDateKey(nextDate), repeat: repeatType, seriesId: seriesId, isCompleted: false });
      }
      setBoardData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === baseTask.id ? updatedBaseTask : t).concat(newTasks) }));
      addToast('Đã tạo lịch trình lặp lại', 'success');
  };

  const handleZoomChange = (e) => {
      const newIndex = parseInt(e.target.value);
      if (scrollContainerRef.current) {
          const { scrollLeft, clientWidth } = scrollContainerRef.current;
          const centerPixel = scrollLeft + clientWidth / 2;
          viewCenterDayIndexRef.current = centerPixel / dayWidth; 
      }
      setZoomIndex(newIndex);
  };

  useLayoutEffect(() => {
      if (scrollContainerRef.current && viewCenterDayIndexRef.current !== null) {
          const { clientWidth } = scrollContainerRef.current;
          const newScrollLeft = (viewCenterDayIndexRef.current * dayWidth) - (clientWidth / 2);
          scrollContainerRef.current.scrollLeft = newScrollLeft;
          viewCenterDayIndexRef.current = null;
      }
  }, [dayWidth]);

  const visibleDays = useMemo(() => getInfiniteWeekWindow(currentDate), [currentDate]);

  const handleScroll = useCallback(() => {
      if (!scrollContainerRef.current || isProgrammaticScroll.current) return;
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollCenter = scrollLeft + clientWidth / 2;
      const dayIndex = Math.floor(scrollCenter / dayWidth);
      if (dayIndex >= 0 && dayIndex < visibleDays.length) {
          const centerDate = visibleDays[dayIndex];
          const currentMonday = getMonday(currentDate);
          if (dayIndex < 7) {
              const prevMonday = new Date(currentMonday); prevMonday.setDate(prevMonday.getDate() - 7);
              if (previousDateRef.current.getTime() === currentDate.getTime()) { previousDateRef.current = currentDate; scrollActionRef.current = 'maintain'; setCurrentDate(prevMonday); }
          } else if (dayIndex >= 14) {
              const nextMonday = new Date(currentMonday); nextMonday.setDate(nextMonday.getDate() + 7);
              if (previousDateRef.current.getTime() === currentDate.getTime()) { previousDateRef.current = currentDate; scrollActionRef.current = 'maintain'; setCurrentDate(nextMonday); }
          }
      }
  }, [currentDate, visibleDays, dayWidth]);

  useLayoutEffect(() => {
      if (!scrollContainerRef.current) return;
      const prevDate = previousDateRef.current;
      const action = scrollActionRef.current;
      isProgrammaticScroll.current = true;
      if (action === 'jump') { 
          const todayKey = formatDateKey(currentDate);
          const index = visibleDays.findIndex(d => formatDateKey(d) === todayKey);
          if (index !== -1) scrollContainerRef.current.scrollLeft = index * dayWidth;
          previousDateRef.current = currentDate; 
      } 
      else if (action === 'maintain') {
          if (currentDate > prevDate) scrollContainerRef.current.scrollLeft -= 7 * dayWidth;
          else scrollContainerRef.current.scrollLeft += 7 * dayWidth;
          previousDateRef.current = currentDate;
      }
      setTimeout(() => { isProgrammaticScroll.current = false; scrollActionRef.current = 'maintain'; }, 50);
  }, [currentDate, dayWidth]);

  // Initial Scroll logic - Also trigger on ViewMode switch
  useEffect(() => {
      if (scrollContainerRef.current && viewMode === 'matrix') {
          const todayKey = formatDateKey(currentDate);
          const index = visibleDays.findIndex(d => formatDateKey(d) === todayKey);
          if (index !== -1) {
             // Use setTimeout to allow DOM to settle after view switch
             setTimeout(() => {
                 if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = index * dayWidth;
             }, 0);
          }
      }
  }, [viewMode]); 

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e) => {
        if (editingTask || showRecurringModal || showAddTaskModal) return;
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); addToast('Đã hoàn tác'); }
        if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo(); addToast('Đã làm lại'); }
        if (e.key === 'Delete' && selectedTaskId) handleDeleteTask(selectedTaskId);
        if (e.key === 'Escape') setSelectedTaskId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskId, editingTask, showRecurringModal, showAddTaskModal, undo, redo]);

  // --- Handlers ---
  const handleUpdateTask = (updatedTask) => {
      const originalTask = tasks.find(t => t.id === updatedTask.id);
      if (!originalTask) return;
      const hasSeries = !!originalTask.seriesId;
      const isContentChanged = originalTask.title !== updatedTask.title || originalTask.description !== updatedTask.description || originalTask.date !== updatedTask.date || originalTask.repeat !== updatedTask.repeat; 

      if (hasSeries && isContentChanged) {
          setPendingUpdate({ originalTask, updatedTask });
          setShowRecurringModal(true);
      } else {
          setBoardData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === updatedTask.id ? updatedTask : t) }));
      }
  };

  const handleConfirmRecurringUpdate = (mode) => {
      if (!pendingUpdate) return;
      const { originalTask, updatedTask } = pendingUpdate;
      if (mode === 'single') {
          setBoardData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === updatedTask.id ? updatedTask : t) }));
      } else if (mode === 'future') {
          const dateDiff = new Date(updatedTask.date) - new Date(originalTask.date); 
          const dayDiff = Math.round(dateDiff / (1000 * 60 * 60 * 24));
          setBoardData(prev => ({
              ...prev,
              tasks: prev.tasks.map(t => {
                  if (t.seriesId !== originalTask.seriesId) return t;
                  if (t.date < originalTask.date) return t;
                  let newDate = t.date;
                  if (dayDiff !== 0) { const d = new Date(t.date); d.setDate(d.getDate() + dayDiff); newDate = formatDateKey(d); }
                  return { ...t, title: updatedTask.title, description: updatedTask.description, date: newDate };
              })
          }));
      }
      setShowRecurringModal(false);
      setPendingUpdate(null);
      addToast('Đã cập nhật chuỗi công việc', 'success');
  };

  const handleSaveNewTask = ({ title, date, categoryId, newCategoryTitle }) => {
      let finalCategoryId = categoryId;
      let newCategories = [...categories];
      if (newCategoryTitle) {
          const newCat = { id: `cat-${Date.now()}`, title: newCategoryTitle, color: COLORS[Math.floor(Math.random() * COLORS.length)], collapsed: false };
          newCategories.push(newCat);
          finalCategoryId = newCat.id;
      }
      const newTask = { id: `new-${Date.now()}`, categoryId: finalCategoryId, date: date, title: title, description: '', isCompleted: false, repeat: 'none', seriesId: null };
      setBoardData(prev => ({ categories: newCategories, tasks: [...prev.tasks, newTask] }));
      setShowAddTaskModal(false);
      addToast('Đã thêm công việc mới', 'success');
  };

  const handleDeleteTask = (taskId) => { setBoardData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) })); setEditingTask(null); addToast('Đã xóa công việc'); };
  const handleDeleteCategory = (catId) => { setBoardData(prev => ({ tasks: prev.tasks.filter(t => t.categoryId !== catId), categories: prev.categories.filter(c => c.id !== catId) })); setEditingCategory(null); addToast('Đã xóa hạng mục'); };
  const handleUpdateCategory = (updatedCat) => setBoardData(prev => ({ ...prev, categories: prev.categories.map(c => c.id === updatedCat.id ? updatedCat : c) }));
  
  const toggleCategoryCollapse = (catId) => {
      setBoardData(prev => ({ ...prev, categories: prev.categories.map(c => c.id === catId ? { ...c, collapsed: !c.collapsed } : c) }));
  };

  const startResizingSidebar = (e) => { e.preventDefault(); const startX = e.clientX; const startWidth = sidebarWidth; const onMouseMove = (ev) => setSidebarWidth(Math.max(150, Math.min(500, startWidth + (ev.clientX - startX)))); const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); }; document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp); };
  const handleDragStart = (e, task) => { setDraggedTask(task); e.dataTransfer.effectAllowed = 'move'; e.target.style.opacity = '0.5'; };
  const handleDragEnd = (e) => { e.target.style.opacity = '1'; setDraggedTask(null); };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e, categoryId, dateStr) => { e.preventDefault(); if (!draggedTask) return; setBoardData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === draggedTask.id ? { ...t, categoryId, date: dateStr } : t) })); setDraggedTask(null); };
  const handleConfirmQuickAdd = (title) => { if (!title || !title.trim()) { setQuickAddCell(null); return; } const newTask = { id: `new-${Date.now()}`, categoryId: quickAddCell.categoryId, date: quickAddCell.dateStr, title: title.trim(), description: '', isCompleted: false, repeat: 'none' }; setBoardData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] })); setQuickAddCell(null); addToast('Đã thêm công việc', 'success'); };

  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); previousDateRef.current = currentDate; scrollActionRef.current = 'jump'; setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); previousDateRef.current = currentDate; scrollActionRef.current = 'jump'; setCurrentDate(d); };
  const goToToday = () => { previousDateRef.current = currentDate; scrollActionRef.current = 'jump'; setCurrentDate(new Date()); };
  const handleDateSelect = (date) => { previousDateRef.current = currentDate; scrollActionRef.current = 'jump'; setCurrentDate(date); };
  const handleOpenAddTask = (defaults = {}) => { setNewTaskDefaults(defaults); setShowAddTaskModal(true); };

  const handleNavigateToTask = (task) => {
      const targetDate = new Date(task.date);
      setCurrentDate(targetDate);
      previousDateRef.current = targetDate;
      scrollActionRef.current = 'jump';
      
      setHighlightedTaskId(task.id);
      setTimeout(() => setHighlightedTaskId(null), 2000); 
      setSearchQuery(''); 
  };

  const filteredMatrixTasks = useMemo(() => {
      if (!searchQuery) return tasks;
      return tasks;
  }, [tasks, searchQuery]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-slate-800" onClick={() => setSelectedTaskId(null)}>
      <Header currentDate={currentDate} prevWeek={prevWeek} nextWeek={nextWeek} goToToday={goToToday} onDateSelect={handleDateSelect} zoomIndex={zoomIndex} onZoomChange={handleZoomChange} onUndo={undo} canUndo={canUndo} onRedo={redo} canRedo={canRedo} viewMode={viewMode} setViewMode={setViewMode} onOpenAddTask={handleOpenAddTask} searchQuery={searchQuery} setSearchQuery={setSearchQuery} tasks={tasks} onNavigateToTask={handleNavigateToTask} />
      
      {viewMode === 'list' ? (
          <TodoView tasks={tasks} categories={categories} currentDate={currentDate} onUpdateTask={handleUpdateTask} setEditingTask={setEditingTask} onDeleteTask={handleDeleteTask} onOpenAddTask={handleOpenAddTask} quickAddCell={quickAddCell} setQuickAddCell={setQuickAddCell} onConfirmQuickAdd={handleConfirmQuickAdd} searchQuery={searchQuery} />
      ) : (
          <div className="flex-1 overflow-hidden relative flex flex-col">
            <div ref={scrollContainerRef} className="flex-1 overflow-auto custom-scrollbar" onScroll={handleScroll}>
              <div className="inline-block min-w-full">
                <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm flex border-b border-gray-200 shadow-sm transition-all">
                  <div className="sticky left-0 z-50 bg-white/95 backdrop-blur-sm border-r border-gray-200 p-4 flex items-center font-bold text-gray-500 bg-gray-50 box-border group" style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
                    Hạng Mục / Deadline
                    <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500 group-hover:bg-gray-300 transition-colors z-30" onMouseDown={startResizingSidebar} />
                  </div>
                  {visibleDays.map((day, index) => {
                    const dayKey = formatDateKey(day); const isTodayDate = dayKey === formatDateKey(new Date()); const isMonday = index % 7 === 0;
                    return (<div key={dayKey} style={{ width: dayWidth, minWidth: dayWidth }} className={`flex-shrink-0 p-3 text-center border-r border-gray-100 flex flex-col justify-center transition-all duration-200 ease-out relative ${isTodayDate ? 'bg-indigo-50/50' : 'bg-white'}`}>
                        {isMonday && (<div className="absolute top-0 left-0 right-0 -mt-1 text-[10px] font-bold text-indigo-400 uppercase tracking-widest text-center">Tuần {day.getDate()} - {new Date(day.getTime() + 6*86400000).getDate()}/{day.getMonth() + 1}</div>)}
                        <span className={`text-xs uppercase font-bold mb-1 ${isTodayDate ? 'text-indigo-600' : 'text-gray-400'}`}>{getDayName(day)}</span>
                        <span className={`text-xl font-bold w-8 h-8 flex items-center justify-center mx-auto rounded-full ${isTodayDate ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-800'}`}>{formatDateDisplay(day)}</span></div>);
                  })}
                </div>
                {categories.map((category) => (
                  <div key={category.id} className="flex border-b border-gray-200 group">
                    <div className={`sticky left-0 z-30 bg-white/95 backdrop-blur-sm border-r border-gray-200 p-4 flex flex-col justify-center group-hover:bg-gray-50 transition-colors border-l-4 ${category.color.value.replace('bg-', 'border-').split(' ')[0]}`} style={{ width: sidebarWidth, minWidth: sidebarWidth, borderLeftColor: 'var(--tw-border-opacity)' }}>
                      <div className="font-semibold text-gray-800 flex items-center justify-between group/header overflow-hidden">
                        <div className="flex items-center gap-2 truncate pr-2 cursor-pointer" onDoubleClick={() => setEditingCategory(category)}>
                             <button onClick={(e) => { e.stopPropagation(); toggleCategoryCollapse(category.id); }} className="text-gray-400 hover:text-indigo-600 transition-colors">
                                 {category.collapsed ? <ChevronRightIcon size={16} /> : <CornerDownLeft size={16} className="rotate-0" />}
                             </button>
                             <span className="truncate hover:underline decoration-dashed underline-offset-4">{category.title}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                            <button onClick={() => handleDeleteCategory(category.id)} className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                            <button onClick={() => setEditingCategory(category)} className={`p-1 rounded hover:bg-gray-200 ${category.color.text}`}><Palette size={14}/></button>
                            <div className="text-gray-400 cursor-grab active:cursor-grabbing"><GripVertical size={14}/></div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-2 ml-6"><span className={`w-2 h-2 rounded-full ${category.color.value.split(' ')[0].replace('bg-', 'bg-')}`}></span>{tasks.filter(t => t.categoryId === category.id && !t.isCompleted).length} tasks</div>
                      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500 z-30" onMouseDown={startResizingSidebar} />
                    </div>
                    {!category.collapsed && visibleDays.map((day) => {
                      const dateStr = formatDateKey(day); const cellTasks = filteredMatrixTasks.filter(t => t.categoryId === category.id && t.date === dateStr); const isQuickAdding = quickAddCell?.categoryId === category.id && quickAddCell?.dateStr === dateStr;
                      return (<div key={`${category.id}-${dateStr}`} style={{ width: dayWidth, minWidth: dayWidth }} className={`flex-shrink-0 min-h-[120px] p-2 border-r border-gray-100 transition-colors ${dateStr === formatDateKey(new Date()) ? 'bg-indigo-50/30' : ''} hover:bg-gray-50/60 cursor-pointer relative overflow-visible`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, category.id, dateStr)} onMouseEnter={() => setHoveredCell({ categoryId: category.id, dateStr })} onMouseLeave={() => setHoveredCell(null)} onClick={() => setSelectedTaskId(null)} onDoubleClick={(e) => { handleOpenAddTask({ date: dateStr, categoryId: category.id }); }}>
                          <div className="flex flex-col gap-2 h-full pointer-events-none">{cellTasks.map((task) => (<div className="pointer-events-auto" key={task.id}><TaskCard task={task} categoryColor={category.color} dayWidth={dayWidth} isSelected={selectedTaskId === task.id} isHighlighted={highlightedTaskId === task.id} onSelect={setSelectedTaskId} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} onDragStart={handleDragStart} setEditingTask={setEditingTask} /></div>))}</div></div>);
                    })}
                    {category.collapsed && <div className="flex-1 bg-gray-50/50 flex items-center justify-center text-gray-400 text-sm italic">Đã thu gọn</div>}
                  </div>
                ))}
                
                {/* Add Category Row at Bottom of Matrix View */}
                <div className="sticky left-0 z-10 p-4 border-r border-gray-200 bg-white/95 backdrop-blur-sm border-t" style={{ width: sidebarWidth }}>
                    {isAddingCategory ? (
                        <div className="animate-in fade-in duration-200">
                            <input 
                                autoFocus
                                type="text"
                                placeholder="Nhập tên hạng mục..."
                                className="w-full text-sm px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-2"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (e.target.value.trim()) {
                                            setBoardData(prev => ({ ...prev, categories: [...prev.categories, { id: `cat-${Date.now()}`, title: e.target.value.trim(), color: COLORS[Math.floor(Math.random() * COLORS.length)] }] }));
                                            setIsAddingCategory(false);
                                        }
                                    } else if (e.key === 'Escape') {
                                        setIsAddingCategory(false);
                                    }
                                }}
                                onBlur={() => setIsAddingCategory(false)}
                            />
                            <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                <CornerDownLeft size={10}/> Enter để lưu
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsAddingCategory(true)}
                            className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium w-full"
                        >
                            <Plus size={16}/> Thêm hàng mới
                        </button>
                    )}
                </div>

              </div>
            </div>
            
            {/* Floating Action Button (FAB) */}
            <div className="absolute bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5 duration-500">
                 <button 
                    onClick={() => handleOpenAddTask()}
                    className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-xl shadow-indigo-300 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    title="Thêm công việc mới"
                 >
                     <Plus size={28} />
                 </button>
            </div>
          </div>
      )}

      {editingTask && <TaskModal task={editingTask} onClose={() => setEditingTask(null)} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} categories={categories} onGenerateRepeats={handleGenerateRepeats} />}
      {showAddTaskModal && <AddTaskModal onClose={() => setShowAddTaskModal(false)} onSave={handleSaveNewTask} categories={categories} initialDate={newTaskDefaults.date} initialCategoryId={newTaskDefaults.categoryId} />}
      {editingCategory && <CategoryModal category={editingCategory} onClose={() => setEditingCategory(null)} onUpdate={handleUpdateCategory} onDelete={handleDeleteCategory} />}
      {showRecurringModal && <RecurringUpdateModal onClose={() => setShowRecurringModal(false)} onConfirm={handleConfirmRecurringUpdate} />}
      
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}