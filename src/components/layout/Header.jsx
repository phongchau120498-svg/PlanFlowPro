import React, { useState, useRef, useMemo, useEffect } from 'react';
import { LayoutGrid, ListTodo, ChevronLeft, ChevronRight, Search, X, ZoomIn, CalendarDays } from 'lucide-react';
import { getMonday, formatDateKey } from '../../utils/dateHelpers';
import { ZOOM_LEVELS } from '../../constants/theme';

const Header = ({ 
    currentDate, prevWeek, nextWeek, goToToday, onDateSelect, zoomIndex, onZoomChange, 
    viewMode, setViewMode, onOpenAddTask, 
    searchQuery, setSearchQuery, tasks, onNavigateToTask,
    categories 
}) => {
    const startOfWeek = getMonday(currentDate);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef(null);
    const searchInputRef = useRef(null); 

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus(); 
                setShowDropdown(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // --- LOGIC ĐẾM TASK QUÁ HẠN (GIỮ NGUYÊN TỪ BẢN TỐI ƯU TRƯỚC) ---
    const overdueCount = useMemo(() => {
        if (!tasks || !Array.isArray(tasks)) return 0;
        
        const todayStr = formatDateKey(new Date());
        
        // Danh sách các Hạng mục đang tồn tại (để lọc task ma)
        const validCategoryIds = new Set(categories.map(c => c.id));

        return tasks.filter(t => 
            t.date && 
            t.date < todayStr && 
            !t.isCompleted &&
            validCategoryIds.has(t.categoryId) 
        ).length;
    }, [tasks, categories]);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim() || !tasks) return [];
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

    // Class chung cho các nút để đảm bảo chiều cao bằng nhau
    const buttonBaseClass = "h-9 flex items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all duration-300 px-4";

    return (
      <header className="flex items-center justify-between px-6 py-3 bg-white/70 backdrop-blur-2xl border-b border-gray-200/60 sticky top-0 z-50 h-[72px] transition-all supports-[backdrop-filter]:bg-white/60">
        
        {/* --- TRÁI: Logo & View Switcher --- */}
        <div className="flex items-center gap-6 flex-1">
          {/* Logo */}
          <div className="flex items-center gap-2.5 group cursor-pointer">
              <div className="p-2 bg-gradient-to-br from-slate-800 to-black rounded-xl shadow-md shadow-slate-200 text-white group-hover:scale-105 transition-transform">
                <CalendarDays size={18} strokeWidth={2.5} />
              </div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight hidden lg:block group-hover:text-black transition-colors">PlanFlow</h1>
          </div>
          
          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

          {/* View Switcher: Cân đối chiều cao */}
          <div className="bg-gray-100/80 p-1 rounded-xl flex items-center border border-gray-200/50">
              <button 
                  onClick={() => setViewMode('matrix')} 
                  className={`${buttonBaseClass} ${viewMode === 'matrix' ? 'bg-white shadow-sm text-slate-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
              >
                  <LayoutGrid size={16} /> Lịch biểu
              </button>
              <button 
                  onClick={() => setViewMode('list')} 
                  className={`relative ${buttonBaseClass} ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
              >
                  <ListTodo size={16} /> To-Do
                  {overdueCount > 0 && (
                      <span className="flex h-2 w-2 relative ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                  )}
              </button>
          </div>
        </div>

        {/* --- GIỮA: Điều hướng --- */}
        <div className="flex-1 flex justify-center">
             {viewMode === 'matrix' ? (
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm hover:shadow-md transition-all duration-300">
                        {/* Nút mũi tên: size to hơn chút (w-9 h-9) để cân với chiều cao nút chữ */}
                        <button onClick={prevWeek} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-500 hover:text-black transition-colors"><ChevronLeft size={20} /></button>
                        
                        <div className="relative group px-2 flex items-center justify-center min-w-[150px]">
                            <span className="font-bold text-gray-800 text-sm cursor-pointer hover:text-black transition-colors flex flex-col items-center leading-tight">
                                <span>Tháng {startOfWeek.getMonth() + 1}, {startOfWeek.getFullYear()}</span>
                            </span>
                            <input type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={formatDateKey(currentDate)} onChange={(e) => e.target.value && onDateSelect(new Date(e.target.value))} />
                        </div>

                        <button onClick={nextWeek} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-500 hover:text-black transition-colors"><ChevronRight size={20} /></button>
                    </div>
                    
                    {/* Nút Hôm nay: Bỏ icon đồng hồ, size chữ text-sm bằng các nút khác */}
                    <button 
                        onClick={goToToday} 
                        className="h-[44px] px-6 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-200 transition-all transform active:scale-95 flex items-center justify-center" 
                        title="Về hôm nay"
                    >
                        Hôm nay
                    </button>
                </div>
             ) : (
                 <div className="hidden md:flex items-center gap-2 px-4 h-[44px] bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-sm font-bold uppercase tracking-widest">
                     <ListTodo size={16} /> Danh sách công việc
                 </div>
             )}
        </div>
        
        {/* --- PHẢI: Search --- */}
        <div className="flex items-center gap-4 flex-1 justify-end">
            <div className="relative group z-[60]" ref={searchRef}>
                <div className={`flex items-center bg-gray-100 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl px-3 h-[44px] transition-all w-48 focus-within:w-64 focus-within:bg-white focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-slate-100`}>
                    <Search size={18} className="text-gray-400 group-focus-within:text-slate-800 mr-2 transition-colors" />
                    <input ref={searchInputRef} type="text" placeholder="Tìm kiếm..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} className="bg-transparent text-sm outline-none w-full placeholder-gray-400 text-gray-700 font-medium" />
                    {!searchQuery && <div className="text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 ml-2 hidden lg:block">⌘K</div>}
                    {searchQuery && (<button onClick={() => { setSearchQuery(''); setShowDropdown(false); }} className="text-gray-300 hover:text-gray-500"><X size={16} /></button>)}
                </div>
                
                {showDropdown && searchQuery && (
                    <div className="absolute top-full right-0 mt-3 w-80 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl max-h-96 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200 p-2">
                        {searchResults.length > 0 ? (
                            searchResults.map(task => (
                                <div key={task.id} onClick={() => { onNavigateToTask(task); setShowDropdown(false); }} className="px-3 py-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group/item border-b border-gray-50 last:border-0">
                                    <div className="font-semibold text-sm text-gray-800 group-hover/item:text-black truncate">{task.title}</div>
                                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                                        <span className={`w-2 h-2 rounded-full ${categories.find(c => c.id === task.categoryId)?.color?.value.split(' ')[0] || 'bg-gray-300'}`}></span>
                                        <span>{task.date.split('-').reverse().join('/')}</span>
                                    </div>
                                </div>
                            ))
                        ) : (<div className="px-4 py-8 text-center text-gray-400 text-sm">Không tìm thấy kết quả</div>)}
                     </div>
                )}
            </div>
            
            {viewMode === 'matrix' && (
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200 hidden lg:flex">
                     <ZoomIn size={18} className="text-gray-400" />
                    <input type="range" min="0" max={ZOOM_LEVELS.length - 1} step="1" value={zoomIndex} onChange={onZoomChange} className="w-20 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-slate-800 hover:accent-black" />
                </div>
            )}
        </div>
      </header>
    );
};
export default Header;