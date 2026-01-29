import React, { useMemo, useEffect, useState } from 'react';
import { CheckCircle2, Circle, Clock, Trash2, Plus, Calendar as CalendarIcon, AlertCircle, ArrowRight, CalendarDays } from 'lucide-react';

// Import các hàm xử lý ngày tháng
import { formatDateKey, getDayName } from '../../utils/dateHelpers.js';

export default function TodoView({ 
  tasks, 
  categories, 
  // currentDate, <-- BỎ: Không dùng ngày được chọn từ App nữa
  onUpdateTask, 
  setEditingTask, 
  onDeleteTask, 
  onOpenAddTask,
  searchQuery 
}) {
  // --- LUÔN SỬ DỤNG NGÀY HÔM NAY ---
  // Sử dụng state để force re-render khi qua ngày mới (nếu treo máy qua đêm)
  const [today, setToday] = useState(new Date());

  useEffect(() => {
      // Cập nhật lại "Hôm nay" mỗi khi component được mount (chuyển tab)
      setToday(new Date());
  }, []);

  const todayKey = useMemo(() => formatDateKey(today), [today]);
  
  // --- 1. PHÍM TẮT NGẦM (Hidden Feature): Nhấn 'N' để thêm nhanh task ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        // Luôn mở modal thêm việc cho HÔM NAY
        onOpenAddTask({ date: todayKey });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [todayKey, onOpenAddTask]);

  // --- 2. LOGIC TÍNH TOÁN & PHÂN LOẠI (Dựa trên Today) ---
  const { dailyTasks, overdueTasks, progress, completedCount, totalCount } = useMemo(() => {
    const validCategoryIds = new Set(categories.map(c => c.id));

    // Lọc công việc HÔM NAY (Cố định)
    let current = tasks.filter(t => {
      return t.date === todayKey && validCategoryIds.has(t.categoryId);
    });

    // Lọc công việc quá hạn (Luôn hiển thị vì đang xem Hôm nay)
    let overdue = tasks.filter(t => {
        return t.date < todayKey && !t.isCompleted && validCategoryIds.has(t.categoryId);
    });
    
    // Áp dụng Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      current = current.filter(t => t.title.toLowerCase().includes(lowerQuery));
      overdue = overdue.filter(t => t.title.toLowerCase().includes(lowerQuery));
    }

    // Tính toán tiến độ
    const total = current.length;
    const completed = current.filter(t => t.isCompleted).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { 
        dailyTasks: current, 
        overdueTasks: overdue,
        progress: percent, 
        completedCount: completed, 
        totalCount: total 
    };
  }, [tasks, categories, todayKey, searchQuery]);

  // --- 3. NHÓM TASK THEO CATEGORY ---
  const tasksByCategory = useMemo(() => {
    const grouped = {};
    categories.forEach(cat => {
      grouped[cat.id] = dailyTasks.filter(t => t.categoryId === cat.id);
    });
    return grouped;
  }, [dailyTasks, categories]);

  const handleToggleComplete = (task) => {
    onUpdateTask({ ...task, isCompleted: !task.isCompleted });
  };

  const handleMoveToToday = (e, task) => {
      e.stopPropagation();
      onUpdateTask({ ...task, date: todayKey });
  };

  // --- COMPONENT CON: RENDER NHÓM TASK ---
  const TaskGroup = ({ tasks, categoryInfo }) => {
    if (!tasks || tasks.length === 0) return null;

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-6">
        <div className="flex items-center gap-3 mb-3 pl-2">
           <div className={`w-3 h-3 rounded-full ${categoryInfo.color?.value?.split(' ')[0] || 'bg-gray-300'} ring-2 ring-white shadow-sm`}></div>
           <h3 className="font-bold text-gray-700 text-lg">{categoryInfo.title}</h3>
           <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center">
             {tasks.length}
           </span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {tasks.map((task, index) => (
            <div 
              key={task.id}
              onClick={() => setEditingTask(task)}
              className={`group flex items-start gap-4 p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 
                ${index !== tasks.length - 1 ? 'border-b border-gray-100' : ''}
                ${task.isCompleted ? 'bg-gray-50/50' : ''}
              `}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); handleToggleComplete(task); }}
                className="mt-1 flex-shrink-0 transition-transform active:scale-90"
              >
                {task.isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-50" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                )}
              </button>

              <div className="flex-1 min-w-0 pt-0.5">
                <p className={`text-base font-medium leading-snug transition-all duration-300 
                  ${task.isCompleted ? 'text-gray-400 line-through decoration-gray-300' : 'text-slate-700'}`}>
                  {task.title}
                </p>
                {(task.description || task.time) && (
                  <div className="flex items-center gap-3 mt-1.5">
                    {task.time && (
                      <div className="flex items-center gap-1 text-xs text-indigo-500 font-medium bg-indigo-50 px-2 py-0.5 rounded">
                        <Clock size={12} /> {task.time}
                      </div>
                    )}
                    {task.description && (
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{task.description}</p>
                    )}
                  </div>
                )}
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Xóa công việc"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8 custom-scrollbar relative">
      <div className="max-w-3xl mx-auto space-y-8 min-h-screen pb-32">
        
        {/* --- KHU VỰC CẢNH BÁO QUÁ HẠN --- */}
        {overdueTasks.length > 0 && (
            <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 animate-in slide-in-from-top-5 duration-500">
                <div className="flex items-center gap-2 mb-4 text-rose-700">
                    <AlertCircle size={20} />
                    <h3 className="font-bold text-lg">Cần xử lý gấp ({overdueTasks.length})</h3>
                </div>
                <div className="space-y-2">
                    {overdueTasks.map(task => {
                        const catColor = categories.find(c => c.id === task.categoryId)?.color || {};
                        return (
                            <div key={task.id} onClick={() => setEditingTask(task)} className="bg-white p-3.5 rounded-2xl shadow-sm border border-rose-100/50 flex items-center justify-between gap-3 group cursor-pointer hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${catColor.value?.split(' ')[0] || 'bg-gray-400'}`} />
                                    <div className="min-w-0">
                                        <p className="text-slate-700 font-medium truncate">{task.title}</p>
                                        <p className="text-xs text-rose-500 font-medium mt-0.5 flex items-center gap-1">
                                            <CalendarIcon size={10} /> Quá hạn: {task.date.split('-').reverse().slice(0, 2).join('/')}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => handleMoveToToday(e, task)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold rounded-lg transition-colors flex-shrink-0"
                                    title="Dời lịch sang hôm nay"
                                >
                                    <CalendarDays size={14} /> Hôm nay <ArrowRight size={12}/>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* --- HEADER TIẾN ĐỘ --- */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="text-sm font-semibold text-indigo-500 tracking-wider uppercase mb-1">Tổng quan hôm nay</div>
              {/* Sử dụng biến 'today' thay vì 'currentDate' */}
              <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2 capitalize">
                {getDayName(today)}, {today.getDate()}/{today.getMonth() + 1}
              </h2>
              <div className="text-gray-500 mt-1 font-medium">
                  Đã hoàn thành {completedCount}/{totalCount} công việc
              </div>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-slate-800">{progress}%</span>
              <div className="text-xs text-gray-400 font-medium mt-1">HOÀN THÀNH</div>
            </div>
          </div>

          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* --- DANH SÁCH DAILY --- */}
        <div>
          {categories.map(category => (
            <TaskGroup 
              key={category.id} 
              tasks={tasksByCategory[category.id]} 
              categoryInfo={category} 
            />
          ))}
          
          {totalCount === 0 && (
            <div className="text-center py-12 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <CalendarIcon size={32} />
              </div>
              <p className="text-gray-500 font-medium">Hôm nay chưa có công việc nào</p>
            </div>
          )}
        </div>
      </div>

      {/* --- FLOATING ACTION BUTTON --- */}
      <div className="sticky bottom-10 left-0 right-0 flex justify-center z-30 pointer-events-none">
           <button 
              onClick={() => onOpenAddTask({ date: todayKey })} 
              className="
                pointer-events-auto
                group relative flex items-center gap-3 pl-4 pr-6 py-3
                bg-gradient-to-b from-white/80 to-white/40
                backdrop-blur-2xl
                border-t border-white/80 border-b border-white/20 border-x border-white/40
                shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]
                rounded-full transition-all duration-500 ease-out
                hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(99,102,241,0.3)] hover:bg-white/90
                active:scale-95 active:translate-y-0
              "
           >
              <div className="
                flex items-center justify-center w-10 h-10 rounded-full 
                bg-gradient-to-tr from-indigo-600 to-purple-600 text-white
                shadow-lg shadow-indigo-500/30
                transition-transform duration-500 ease-in-out group-hover:rotate-90 group-hover:scale-110
              ">
                <Plus size={20} strokeWidth={2.5} />
              </div>

              <span className="text-slate-700/80 font-bold tracking-wide text-sm group-hover:text-slate-900 transition-colors">
                Thêm công việc
              </span>
           </button>
      </div>
    </div>
  );
}