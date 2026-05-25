import React, { useState, useRef, useMemo, useEffect } from 'react';
import { LayoutGrid, ListTodo, ChevronLeft, ChevronRight, Settings, Search, X, ZoomIn, CalendarDays } from 'lucide-react';
import { getMonday, formatDateKey } from '../../utils/dateHelpers';
import { ZOOM_LEVELS } from '../../constants/theme';

const Header = ({ 
    currentDate, prevWeek, nextWeek, goToToday, onDateSelect, zoomIndex, onZoomChange, 
    viewMode, setViewMode, calendarView, setCalendarView, onOpenAddTask, 
    tasks, categories, onOpenSettings
}) => {
    const startOfWeek = getMonday(currentDate);


    // --- CẬP NHẬT LOGIC CHẤM ĐỎ: DỰA TRÊN END_DATE ---
    const overdueCount = useMemo(() => {
        if (!tasks || !Array.isArray(tasks)) return 0;
        const todayStr = formatDateKey(new Date());
        const validCategoryIds = new Set(categories.map(c => c.id));
        return tasks.filter(t => {
            if (!validCategoryIds.has(t.categoryId)) return false;
            const end = t.endDate || t.date; // So sánh với ngày kết thúc
            return end < todayStr && !t.isCompleted;
        }).length;
    }, [tasks, categories]);



    const buttonBaseClass = "h-9 flex items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all duration-300 px-4";

    return (
      <header className="flex items-center justify-between px-6 py-3 bg-white/70 backdrop-blur-2xl border-b border-gray-200/60 sticky top-0 z-50 h-[72px] transition-all supports-[backdrop-filter]:bg-white/60">
        
        {/* --- TRÁI --- */}
        <div className="flex items-center gap-6 flex-1">
          <div className="flex items-center gap-2.5 group cursor-pointer">
              <div className="p-2 bg-gradient-to-br from-slate-800 to-black rounded-xl shadow-md shadow-slate-200 text-white group-hover:scale-105 transition-transform"><CalendarDays size={18} strokeWidth={2.5} /></div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight hidden lg:block group-hover:text-black transition-colors">PlanFlow</h1>
          </div>
          
          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

          <div className="bg-gray-100/80 p-1 rounded-xl flex items-center border border-gray-200/50">
              <button onClick={() => setViewMode('matrix')} className={`${buttonBaseClass} ${viewMode === 'matrix' ? 'bg-white shadow-sm text-slate-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}><LayoutGrid size={16} /> Lịch biểu</button>
              <button onClick={() => setViewMode('list')} className={`relative ${buttonBaseClass} ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}><ListTodo size={16} /> To-Do
                  {overdueCount > 0 && (
                      <span className="flex h-2 w-2 relative ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                  )}
              </button>
          </div>
        </div>

         {/* --- GIỮA --- */}
        <div className="flex-1 flex justify-center">
             {viewMode === 'matrix' ? (
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm hover:shadow-md transition-all duration-300">
                        <button onClick={prevWeek} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-500 hover:text-black transition-colors"><ChevronLeft size={20} /></button>
                        <div className="relative group px-2 flex items-center justify-center min-w-[150px]">
                            <span className="font-bold text-gray-800 text-sm cursor-pointer hover:text-black transition-colors flex flex-col items-center leading-tight">
                                <span>Tháng {calendarView === 'month' ? currentDate.getMonth() + 1 : startOfWeek.getMonth() + 1}, {calendarView === 'month' ? currentDate.getFullYear() : startOfWeek.getFullYear()}</span>
                            </span>
                            <input type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={formatDateKey(currentDate)} onChange={(e) => e.target.value && onDateSelect(new Date(e.target.value))} />
                        </div>
                        <button onClick={nextWeek} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-500 hover:text-black transition-colors"><ChevronRight size={20} /></button>
                    </div>
                    <button onClick={goToToday} className="h-[44px] px-6 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-200 transition-all transform active:scale-95 flex items-center justify-center" title="Về hôm nay">Hôm nay</button>
                </div>
             ) : (
                 <div className="hidden md:flex items-center gap-2 px-4 h-[44px] bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-sm font-bold uppercase tracking-widest"><ListTodo size={16} /> Danh sách công việc</div>
             )}
        </div>
        
        {/* --- PHẢI --- */}
        <div className="flex items-center gap-4 flex-1 justify-end">
            
            {viewMode === 'matrix' && (
                <div className="hidden md:flex bg-gray-100/80 p-1 rounded-xl border border-gray-200/50 mr-2">
                    <button onClick={() => setCalendarView('week')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${calendarView === 'week' ? 'bg-white shadow-sm text-slate-800' : 'text-gray-500 hover:text-gray-700'}`}>Tuần</button>
                    <button onClick={() => setCalendarView('month')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${calendarView === 'month' ? 'bg-white shadow-sm text-slate-800' : 'text-gray-500 hover:text-gray-700'}`}>Tháng</button>
                </div>
            )}
            
            {viewMode === 'matrix' && calendarView === 'week' && (
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200 hidden lg:flex mr-4">
                     <ZoomIn size={18} className="text-gray-400" />
                    <input type="range" min="0" max={ZOOM_LEVELS.length - 1} step="1" value={zoomIndex} onChange={onZoomChange} className="w-20 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-slate-800 hover:accent-black" />
                </div>
            )}

            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                <button 
                    onClick={onOpenSettings} 
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    title="Cài đặt hệ thống (API Key, v.v.)"
                >
                    <Settings size={18} />
                </button>
            </div>
        </div>
      </header>
    );
};
export default Header;