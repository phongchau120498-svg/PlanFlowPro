import React, { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { Plus, GripVertical, CornerDownLeft, Trash2, Palette, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import { COLORS, ZOOM_LEVELS } from './constants/theme';
import { formatDateKey, getMonday, getInfiniteWeekWindow, getDayName, formatDateDisplay } from './utils/dateHelpers';
import { useUndoableState } from './hooks/useUndoableState';

// Components
import Header from './components/layout/Header';
import ToastContainer from './components/common/ToastContainer';
import TodoView from './components/views/TodoView';
import TaskCard from './components/tasks/TaskCard';
import TaskModal from './components/tasks/TaskModal';
import AddTaskModal from './components/tasks/AddTaskModal';
import RecurringUpdateModal from './components/tasks/RecurringUpdateModal';

// Initial Data
const INITIAL_DATA = {
    categories: [
        { id: 'cat-1', title: '🎨 Thiết kế UI/UX', color: COLORS[1], collapsed: false }, 
        { id: 'cat-2', title: '💻 Phát triển Frontend', color: COLORS[2], collapsed: false }, 
        { id: 'cat-3', title: '⚙️ Backend & API', color: COLORS[5], collapsed: false }, 
        { id: 'cat-4', title: '🚀 Marketing & Content', color: COLORS[6], collapsed: false }, 
    ],
    tasks: []
};

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
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
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]); 
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);

  const scrollContainerRef = useRef(null);
  const previousDateRef = useRef(currentDate);
  const viewCenterDayIndexRef = useRef(null);
  const scrollActionRef = useRef('jump');
  const isProgrammaticScroll = useRef(false);

  useEffect(() => {
    const fetchTasks = async () => {
        const { data, error } = await supabase.from('tasks').select('*');
        if (error) {
            console.error('Lỗi tải dữ liệu:', error);
            addToast('Lỗi kết nối Server', 'error');
        } else if (data) {
            const mappedTasks = data.map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                date: t.date,
                isCompleted: t.is_completed,
                categoryId: t.category_id,
                repeat: t.repeat,
                seriesId: t.series_id
            }));
           setBoardData(prev => ({ ...prev, tasks: mappedTasks }));
        }
    };
    fetchTasks();
  }, []);

  const addToast = (message, type = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const handleGenerateRepeats = async (baseTask, repeatType) => {
      if (!baseTask || !repeatType || repeatType === 'none') return;
      const seriesId = baseTask.seriesId || `series-${Date.now()}`;
      
      const newTasks = [];
      const startDate = new Date(baseTask.date);
      const count = 12; 
      for (let i = 1; i <= count; i++) {
          const nextDate = new Date(startDate);
          if (repeatType === 'daily') nextDate.setDate(startDate.getDate() + i);
          else if (repeatType === 'weekly') nextDate.setDate(startDate.getDate() + (i * 7));
          else if (repeatType === 'monthly') nextDate.setMonth(startDate.getMonth() + i);
          
          newTasks.push({ 
              id: `${baseTask.id}-rep-${Date.now()}-${i}`,
              category_id: baseTask.categoryId,
              date: formatDateKey(nextDate), 
              title: baseTask.title,
              description: baseTask.description,
              is_completed: false,
              repeat: repeatType, 
              series_id: seriesId, 
          });
      }

      const { error } = await supabase.from('tasks').insert(newTasks);
      if(!error) {
           const mappedNewTasks = newTasks.map(t => ({
                ...t, isCompleted: false, categoryId: t.category_id, seriesId: t.series_id
           }));
           const updatedBase = { ...baseTask, seriesId, repeat: repeatType };
           await supabase.from('tasks').update({ series_id: seriesId, repeat: repeatType }).eq('id', baseTask.id);
           setBoardData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === baseTask.id ? updatedBase : t).concat(mappedNewTasks) }));
           addToast('Đã tạo lịch trình lặp lại', 'success');
      }
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
      if (action === 'jump') { scrollContainerRef.current.scrollLeft = 7 * dayWidth; previousDateRef.current = currentDate; } 
      else if (action === 'maintain') {
          if (currentDate > prevDate) scrollContainerRef.current.scrollLeft -= 7 * dayWidth;
          else scrollContainerRef.current.scrollLeft += 7 * dayWidth;
          previousDateRef.current = currentDate;
      }
      setTimeout(() => { isProgrammaticScroll.current = false; scrollActionRef.current = 'maintain'; }, 50);
  }, [currentDate, dayWidth]);

  useEffect(() => { if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = 7 * dayWidth; }, []);

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

  const handleUpdateTask = async (updatedTask) => {
      const originalTask = tasks.find(t => t.id === updatedTask.id);
      if (!originalTask) return;
      const hasSeries = !!originalTask.seriesId;
      const isContentChanged = originalTask.title !== updatedTask.title || originalTask.description !== updatedTask.description || originalTask.date !== updatedTask.date || originalTask.repeat !== updatedTask.repeat; 

      if (hasSeries && isContentChanged) {
          setPendingUpdate({ originalTask, updatedTask });
          setShowRecurringModal(true);
      } else {
          const { error } = await supabase.from('tasks').update({
              title: updatedTask.title,
              description: updatedTask.description,
              date: updatedTask.date,
              is_completed: updatedTask.isCompleted,
              repeat: updatedTask.repeat,
              category_id: updatedTask.categoryId 
          }).eq('id', updatedTask.id);
          if (!error) {
               setBoardData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === updatedTask.id ? updatedTask : t) }));
          }
      }
  };

  const handleConfirmRecurringUpdate = async (mode) => {
      if (!pendingUpdate) return;
      const { originalTask, updatedTask } = pendingUpdate;
      if (mode === 'single') {
          handleUpdateTask(updatedTask);
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

  const handleSaveNewTask = async ({ title, date, categoryId, newCategoryTitle }) => {
      let finalCategoryId = categoryId;
      let newCategories = [...categories];
      if (newCategoryTitle) {
          const newCat = { id: `cat-${Date.now()}`, title: newCategoryTitle, color: COLORS[Math.floor(Math.random() * COLORS.length)], collapsed: false };
          newCategories.push(newCat);
          finalCategoryId = newCat.id;
      }
      
      const newId = `new-${Date.now()}`;
      const dbTask = { id: newId, category_id: finalCategoryId, date: date, title: title, description: '', is_completed: false, repeat: 'none', series_id: null };
      const { error } = await supabase.from('tasks').insert([dbTask]);

      if (!error) {
          const localTask = { ...dbTask, categoryId: dbTask.category_id, isCompleted: dbTask.is_completed, seriesId: dbTask.series_id };
          setBoardData(prev => ({ categories: newCategories, tasks: [...prev.tasks, localTask] }));
          setShowAddTaskModal(false);
          addToast('Đã lưu vào đám mây!', 'success');
      } else {
          console.error(error);
          addToast('Lỗi lưu dữ liệu', 'error');
      }
  };

  // --- HÀM THÊM HẠNG MỤC MỚI ---
  const handleAddCategory = () => {
    const title = prompt("Nhập tên hạng mục mới:");
    if (title && title.trim()) {
        const newCat = { 
            id: `cat-${Date.now()}`, 
            title: title.trim(), 
            color: COLORS[Math.floor(Math.random() * COLORS.length)], 
            collapsed: false 
        };
        // Lưu tạm vào state (vì chưa có bảng categories trong Supabase)
        setBoardData(prev => ({ ...prev, categories: [...prev.categories, newCat] }));
        addToast('Đã thêm hạng mục tạm thời', 'success');
    }
  };

  const handleDeleteTask = async (taskId) => { 
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (!error) {
        setBoardData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) })); 
        setEditingTask(null);
        addToast('Đã xóa công việc'); 
      }
  };

  const handleDeleteCategory = (catId) => { setBoardData(prev => ({ tasks: prev.tasks.filter(t => t.categoryId !== catId), categories: prev.categories.filter(c => c.id !== catId) }));
        setEditingCategory(null); addToast('Đã xóa hạng mục'); };
  const handleUpdateCategory = (updatedCat) => setBoardData(prev => ({ ...prev, categories: prev.categories.map(c => c.id === updatedCat.id ? updatedCat : c) }));
  const toggleCategoryCollapse = (catId) => {
      setBoardData(prev => ({ ...prev, categories: prev.categories.map(c => c.id === catId ? { ...c, collapsed: !c.collapsed } : c) }));
  };

  const startResizingSidebar = (e) => { e.preventDefault(); const startX = e.clientX; const startWidth = sidebarWidth;
    const onMouseMove = (ev) => setSidebarWidth(Math.max(150, Math.min(500, startWidth + (ev.clientX - startX)))); const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp); }; document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp); };
  const handleDragStart = (e, task) => { setDraggedTask(task); e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5'; };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const handleDrop = (e, categoryId, dateStr) => { e.preventDefault();
      if (!draggedTask) return; 
      handleUpdateTask({ ...draggedTask, categoryId, date: dateStr });
      setDraggedTask(null); 
  };
  const handleConfirmQuickAdd = (title) => { if (!title || !title.trim()) { setQuickAddCell(null); return; } 
    handleSaveNewTask({ title: title.trim(), date: quickAddCell.dateStr, categoryId: quickAddCell.categoryId });
    setQuickAddCell(null); 
  };
  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); previousDateRef.current = currentDate; scrollActionRef.current = 'jump';
    setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); previousDateRef.current = currentDate;
    scrollActionRef.current = 'jump'; setCurrentDate(d); };
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
          <TodoView 
            tasks={tasks} 
            categories={categories} 
            currentDate={currentDate} 
            onUpdateTask={handleUpdateTask} 
            setEditingTask={setEditingTask} 
            onDeleteTask={handleDeleteTask} 
            onOpenAddTask={handleOpenAddTask} 
            quickAddCell={quickAddCell} 
            setQuickAddCell={setQuickAddCell} 
            onConfirmQuickAdd={handleConfirmQuickAdd} 
            searchQuery={searchQuery}
            onSaveNewTask={handleSaveNewTask} // Truyền hàm lưu xuống TodoView
          />
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
                        const dayKey = formatDateKey(day);
                        const isTodayDate = dayKey === formatDateKey(new Date()); const isMonday = index % 7 === 0;
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
                        const dateStr = formatDateKey(day);
                        const cellTasks = filteredMatrixTasks.filter(t => t.categoryId === category.id && t.date === dateStr);
                        return (<div key={`${category.id}-${dateStr}`} style={{ width: dayWidth, minWidth: dayWidth }} className={`flex-shrink-0 min-h-[120px] p-2 border-r border-gray-100 transition-colors ${dateStr === formatDateKey(new Date()) ? 'bg-indigo-50/30' : ''} hover:bg-gray-50/60 cursor-pointer relative overflow-visible`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, category.id, dateStr)} onMouseEnter={() => setHoveredCell({ categoryId: category.id, dateStr })} onMouseLeave={() => setHoveredCell(null)} onClick={() => setSelectedTaskId(null)} onDoubleClick={(e) => { handleOpenAddTask({ date: dateStr, categoryId: category.id }); }}>
                          <div className="flex flex-col gap-2 h-full pointer-events-none">{cellTasks.map((task) => (<div className="pointer-events-auto" key={task.id}><TaskCard task={task} categoryColor={category.color} dayWidth={dayWidth} isSelected={selectedTaskId === task.id} isHighlighted={highlightedTaskId === task.id} onSelect={setSelectedTaskId} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} onDragStart={handleDragStart} setEditingTask={setEditingTask} /></div>))}</div></div>);
                    })}
                    {category.collapsed && <div className="flex-1 bg-gray-50/50 flex items-center justify-center text-gray-400 text-sm italic">Đã thu gọn</div>}
                  </div>
                ))}
                
                {/* --- DÒNG THÊM HẠNG MỤC MỚI (NEW) --- */}
                <div className="flex border-b border-gray-200 group">
                    <div className="sticky left-0 z-30 bg-white/95 backdrop-blur-sm border-r border-gray-200 p-4 flex items-center group-hover:bg-gray-50 transition-colors border-l-4 border-transparent" style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
                        <button onClick={handleAddCategory} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold transition-colors w-full py-2">
                            <div className="p-1 rounded-md bg-gray-100 group-hover:bg-indigo-100 text-gray-500 group-hover:text-indigo-600 transition-colors">
                                <Plus size={16} />
                            </div>
                            <span>Thêm hạng mục mới</span>
                        </button>
                    </div>
                    {visibleDays.map((day) => (
                        <div key={`empty-${formatDateKey(day)}`} style={{ width: dayWidth, minWidth: dayWidth }} className="flex-shrink-0 border-r border-gray-100 bg-gray-50/20" />
                    ))}
                </div>

              </div>
            </div>
            
            {/* FAB */}
            <div className="absolute bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5 duration-500">
                 <button onClick={() => handleOpenAddTask()} className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-xl shadow-indigo-300 flex items-center justify-center transition-all hover:scale-110 active:scale-95" title="Thêm công việc mới">
                      <Plus size={28} />
                 </button>
            </div>
          </div>
      )}

      {editingTask && <TaskModal task={editingTask} onClose={() => setEditingTask(null)} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} categories={categories} onGenerateRepeats={handleGenerateRepeats} />}
      {showAddTaskModal && <AddTaskModal onClose={() => setShowAddTaskModal(false)} onSave={handleSaveNewTask} categories={categories} initialDate={newTaskDefaults.date} initialCategoryId={newTaskDefaults.categoryId} />}
      {showRecurringModal && <RecurringUpdateModal onClose={() => setShowRecurringModal(false)} onConfirm={handleConfirmRecurringUpdate} />}
      <ToastContainer toasts={toasts} />
    </div>
  );
}