import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Calendar, LayoutGrid, ListTodo, ChevronLeft, ChevronRight, Search, X, RotateCcw, RotateCw, ZoomIn } from 'lucide-react';
import { getMonday, formatDateKey } from '../../utils/dateHelpers';
import { ZOOM_LEVELS } from '../../constants/theme';

[cite_start]// [cite: 25, 29, 36, 46]
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
              <button onClick={() => setViewMode('matrix')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 ${viewMode === 'matrix' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  <LayoutGrid size={14} /> Lịch biểu
              </button>
              <button onClick={() => setViewMode('list')} className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  <ListTodo size={14} /> To-Do
                  {overdueCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
              </button>
          </div>
        </div>

        {/* Center Section */}
        <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm my-2 md:my-0 hover:shadow-md transition-shadow duration-300">
             <button onClick={prevWeek} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-500 transition-colors"><ChevronLeft size={16} /></button>
            <div className="relative group px-2">
                <span className="font-semibold text-gray-700 text-sm min-w-[120px] text-center block cursor-pointer hover:text-indigo-600 transition-colors">
                    Tháng {startOfWeek.getMonth() + 1}, {startOfWeek.getFullYear()}
                </span>
                <input type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={formatDateKey(currentDate)} onChange={(e) => e.target.value && onDateSelect(new Date(e.target.value))} />
            </div>
            <button onClick={nextWeek} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-500 transition-colors"><ChevronRight size={16} /></button>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <button onClick={goToToday} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-colors">Hôm nay</button>
            {/* Search */}
            <div className="relative hidden md:block group z-[60]" ref={searchRef}>
                <div className={`flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 transition-all w-48 focus-within:w-64 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300`}>
                    <Search size={14} className="text-gray-400 group-focus-within:text-indigo-500 mr-2" />
                    <input type="text" placeholder="Tìm kiếm..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} className="bg-transparent text-xs outline-none w-full placeholder-gray-400 text-gray-700" />
                    {searchQuery && (<button onClick={() => { setSearchQuery(''); setShowDropdown(false); }} className="text-gray-300 hover:text-gray-500"><X size={12} /></button>)}
                </div>
                {showDropdown && searchQuery && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200 p-2">
                        {searchResults.length > 0 ? (
                            searchResults.map(task => (
                                <div key={task.id} onClick={() => { onNavigateToTask(task); setShowDropdown(false); }} className="px-3 py-2.5 hover:bg-indigo-50/80 rounded-xl cursor-pointer transition-colors group/item">
                                    <div className="font-semibold text-xs text-gray-800 group-hover/item:text-indigo-700 truncate">{task.title}</div>
                                    <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5"><Calendar size={10} /> <span>{task.date.split('-').reverse().join('/')}</span></div>
                                </div>
                            ))
                        ) : (<div className="px-4 py-6 text-center text-gray-400 text-xs">Không tìm thấy kết quả</div>)}
                     </div>
                )}
            </div>
            <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
            <div className="flex items-center gap-1">
                <button onClick={onUndo} disabled={!canUndo} className={`p-2 rounded-xl transition-all ${canUndo ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'}`} title="Hoàn tác"><RotateCcw size={16} /></button>
                <button onClick={onRedo} disabled={!canRedo} className={`p-2 rounded-xl transition-all ${canRedo ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'}`} title="Làm lại"><RotateCw size={16} /></button>
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
export default Header;