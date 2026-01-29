import React, { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { Plus, GripVertical, CornerDownLeft, Trash2, Palette, ChevronRight as ChevronRightIcon, X, Check } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import { COLORS, ZOOM_LEVELS, INITIAL_DATA } from './constants/theme';
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
import CategoryModal from './components/tasks/CategoryModal';

export default function App() {
  // --- 1. STATE & CONFIG ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('matrix');
  const [boardData, setBoardData, undo, redo, canUndo, canRedo] = useUndoableState(INITIAL_DATA);
  const { categories, tasks } = boardData;
  
  // Giao diện Matrix
  const [zoomIndex, setZoomIndex] = useState(2); 
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const dayWidth = ZOOM_LEVELS[zoomIndex];
  
  // Drag & Drop State
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState(null); 

  // Copy/Paste State
  const [copiedTask, setCopiedTask] = useState(null);

  // Modal & Interaction State
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

  // Category Creation State
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Refs
  const scrollContainerRef = useRef(null);
  const previousDateRef = useRef(currentDate);
  const viewCenterDayIndexRef = useRef(null);
  const scrollActionRef = useRef('jump');
  const isProgrammaticScroll = useRef(false);
  const lastScrollTimeRef = useRef(0);

  // --- 2. HÀM TIỆN ÍCH ---
  const addToast = (message, type = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // --- 3. FETCH DỮ LIỆU ---
  useEffect(() => {
    const fetchData = async () => {
        const { data: catData, error: catError } = await supabase.from('categories').select('*').order('position', { ascending: true });
        const { data: taskData, error: taskError } = await supabase.from('tasks').select('*');

        if (catError || taskError) {
            console.error('Lỗi tải dữ liệu:', catError || taskError);
            addToast('Lỗi tải dữ liệu từ server', 'error');
        } else {
            const mappedTasks = (taskData || []).map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                date: t.date,
                isCompleted: t.is_completed,
                categoryId: t.category_id,
                repeat: t.repeat,
                seriesId: t.series_id,
                time: t.time
            }));

            const mappedCategories = (catData || []).map(c => ({
                id: c.id,
                title: c.title,
                color: c.color,
                collapsed: c.collapsed,
                position: c.position || 0
            }));

            setBoardData({ categories: mappedCategories, tasks: mappedTasks });
        }
    };
    fetchData();
  }, []);

  // --- 4. PHÍM TẮT ---
  useEffect(() => {
    const handleKeyDown = (e) => {
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) return;
        if (showAddTaskModal || showRecurringModal || editingTask || editingCategory) return;

        if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); if (canUndo) { undo(); addToast('Đã hoàn tác ↩️'); } }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); if (canRedo) { redo(); addToast('Đã làm lại ↪️'); } }
        
        if (e.key === 'Delete' && selectedTaskId) { e.preventDefault(); handleDeleteTask(selectedTaskId); }
        if (e.key === 'Escape') setSelectedTaskId(null);

        if (e.key === 'n' || e.key === 'N') {
            e.preventDefault();
            handleOpenAddTask({ date: formatDateKey(currentDate) });
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, selectedTaskId, showAddTaskModal, showRecurringModal, editingTask, editingCategory, undo, redo, currentDate]);

  // Copy Paste Logic
  useEffect(() => {
      const handleCopyPaste = async (e) => {
          if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) return;
          if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
              if (selectedTaskId) {
                  const taskToCopy = tasks.find(t => t.id === selectedTaskId);
                  if (taskToCopy) {
                      setCopiedTask(taskToCopy);
                      addToast('Đã sao chép công việc 📋', 'info');
                      navigator.clipboard.writeText(taskToCopy.title).catch(() => {});
                  }
              }
          }
          if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
              if (!hoveredCell) return; 
              try {
                  const text = await navigator.clipboard.readText();
                  if (text && (text.includes('\n') || (copiedTask && text !== copiedTask.title) || !copiedTask)) {
                      e.preventDefault();
                      handleBatchPaste(text, hoveredCell);
                      return;
                  }
              } catch (err) {}
              if (copiedTask) {
                  e.preventDefault();
                  handlePasteInternalTask(copiedTask, hoveredCell);
              }
          }
      };
      window.addEventListener('keydown', handleCopyPaste);
      return () => window.removeEventListener('keydown', handleCopyPaste);
  }, [selectedTaskId, hoveredCell, copiedTask, tasks]);

  const handleBatchPaste = async (text, targetCell) => {
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length === 0) return;
      const newTasks = [];
      const { categoryId, dateStr } = targetCell;
      lines.forEach((line, index) => {
          newTasks.push({
              id: `paste-${Date.now()}-${index}`,
              category_id: categoryId,
              date: dateStr,
              title: line.trim(),
              description: '',
              is_completed: false,
              repeat: 'none',
              series_id: null
          });
      });
      const mappedNewTasks = newTasks.map(t => ({ ...t, id: t.id, categoryId: t.category_id, isCompleted: t.is_completed, seriesId: t.series_id }));
      setBoardData(prev => ({ ...prev, tasks: [...prev.tasks, ...mappedNewTasks] }));
      const { error } = await supabase.from('tasks').insert(newTasks);
      if (error) { console.error(error); addToast('Lỗi dán dữ liệu', 'error'); } else { addToast(`Đã dán ${lines.length} công việc mới`, 'success'); }
  };

  const handlePasteInternalTask = async (originalTask, targetCell) => {
      const { categoryId, dateStr } = targetCell;
      const newId = `paste-internal-${Date.now()}`;
      const newTask = { ...originalTask, id: newId, categoryId: categoryId, date: dateStr, isCompleted: false, seriesId: null };
      setBoardData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
      const dbTask = { id: newId, category_id: categoryId, date: dateStr, title: newTask.title, description: newTask.description, is_completed: false, repeat: newTask.repeat, series_id: null };
      await supabase.from('tasks').insert([dbTask]);
      addToast('Đã dán công việc', 'success');
  };

  // --- 5. LOGIC SCROLL & VIEW ---
  useEffect(() => {
      if (viewMode === 'matrix') {
          const today = new Date();
          setCurrentDate(today);
          previousDateRef.current = today;
          scrollActionRef.current = 'jump';
          setTimeout(() => { if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = 7 * dayWidth; }, 10);
      }
  }, [viewMode, dayWidth]);

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
      const now = Date.now();
      if (now - lastScrollTimeRef.current < 50) return;
      lastScrollTimeRef.current = now;
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
      setTimeout(() => { isProgrammaticScroll.current = false; scrollActionRef.current = 'maintain'; }, 100); 
  }, [currentDate, dayWidth]);

  useEffect(() => { if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = 7 * dayWidth; }, []);

  // --- 6. LOGIC TASK (OPTIMISTIC UPDATES) ---
  const handleGenerateRepeats = async (baseTask, repeatType) => {
      if (!baseTask || !repeatType || repeatType === 'none') return;
      const seriesId = baseTask.seriesId || `series-${Date.now()}`;
      const newTasks = [];
      const startDate = new Date(baseTask.date);
      const count = 12; // Tạo trước 12 lần lặp
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
      const mappedNewTasks = newTasks.map(t => ({ ...t, isCompleted: false, categoryId: t.category_id, seriesId: t.series_id }));
      const updatedBase = { ...baseTask, seriesId, repeat: repeatType };
      
      // Update State: Thêm task mới vào
      setBoardData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === baseTask.id ? updatedBase : t).concat(mappedNewTasks) }));
      addToast('Đã tạo lịch trình lặp lại', 'success');

      // Update DB
      await supabase.from('tasks').insert(newTasks);
      await supabase.from('tasks').update({ series_id: seriesId, repeat: repeatType }).eq('id', baseTask.id);
  };

  const handleUpdateTask = async (updatedTask) => {
      const originalTask = tasks.find(t => t.id === updatedTask.id);
      if (!originalTask) return;
      
      const hasSeries = !!originalTask.seriesId || (originalTask.repeat && originalTask.repeat !== 'none');
      
      // Kiểm tra thay đổi nội dung quan trọng
      const isContentChanged = originalTask.title !== updatedTask.title || 
                               originalTask.description !== updatedTask.description || 
                               originalTask.date !== updatedTask.date || 
                               originalTask.repeat !== updatedTask.repeat ||
                               originalTask.categoryId !== updatedTask.categoryId;

      if (hasSeries && isContentChanged) {
          setPendingUpdate({ originalTask, updatedTask });
          setShowRecurringModal(true);
      } else {
          setBoardData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === updatedTask.id ? updatedTask : t) }));
          const { error } = await supabase.from('tasks').update({
              title: updatedTask.title, description: updatedTask.description, date: updatedTask.date, is_completed: updatedTask.isCompleted, repeat: updatedTask.repeat, category_id: updatedTask.categoryId 
          }).eq('id', updatedTask.id);
          if (error) {
               console.error('Sync Error:', error);
               setBoardData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === updatedTask.id ? originalTask : t) }));
               addToast('Lỗi đồng bộ, đã hoàn tác', 'error');
          }
      }
  };

  const handleConfirmRecurringUpdate = async (mode) => {
      if (!pendingUpdate) return;
      const { originalTask, updatedTask } = pendingUpdate;
      setShowRecurringModal(false);
      setPendingUpdate(null);
      
      if (mode === 'single') {
           // Tách task này ra khỏi chuỗi (series_id = null)
           setBoardData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === updatedTask.id ? updatedTask : t) }));
           addToast('Đã cập nhật', 'success');
           await supabase.from('tasks').update({
               title: updatedTask.title, description: updatedTask.description, date: updatedTask.date, is_completed: updatedTask.isCompleted, repeat: updatedTask.repeat, category_id: updatedTask.categoryId, series_id: null
           }).eq('id', updatedTask.id);

      } else if (mode === 'future') {
          // --- LOGIC MỚI: XỬ LÝ KHI THAY ĐỔI CHẾ ĐỘ LẶP ---
          const isRepeatTypeChanged = originalTask.repeat !== updatedTask.repeat;

          if (isRepeatTypeChanged) {
              // TRƯỜNG HỢP 1: THAY ĐỔI KIỂU LẶP (VD: Daily -> Weekly, hoặc Daily -> None)
              // 1. Xóa các task tương lai cũ trong State
              setBoardData(prev => ({
                  ...prev,
                  tasks: prev.tasks.filter(t => {
                      // Giữ lại chính nó
                      if (t.id === updatedTask.id) return true;
                      // Giữ lại task khác series
                      if (t.seriesId !== originalTask.seriesId) return true;
                      // Giữ lại task quá khứ của series
                      return t.date <= originalTask.date;
                  }).map(t => t.id === updatedTask.id ? updatedTask : t) // Cập nhật task hiện tại
              }));

              // 2. Xóa các task tương lai cũ trong DB
              await supabase.from('tasks').delete()
                  .eq('series_id', originalTask.seriesId)
                  .gt('date', originalTask.date);

              // 3. Cập nhật task hiện tại trong DB
              // Lưu ý: Nếu user chọn "None", ta ngắt series_id luôn. Nếu chọn kiểu khác, ta giữ series_id để tái sinh.
              const newSeriesId = updatedTask.repeat === 'none' ? null : originalTask.seriesId;
              
              await supabase.from('tasks').update({ 
                  ...updatedTask, 
                  series_id: newSeriesId 
              }).eq('id', updatedTask.id);

              // 4. Nếu có kiểu lặp mới (khác 'none'), TẠO RA TASK MỚI
              if (updatedTask.repeat !== 'none') {
                  await handleGenerateRepeats(updatedTask, updatedTask.repeat);
              } else {
                  addToast('Đã dừng lặp lại và xóa các việc sau này', 'success');
              }

          } else {
              // TRƯỜNG HỢP 2: CHỈ SỬA NỘI DUNG/NGÀY (Vẫn giữ kiểu lặp cũ)
              // Logic cũ: Dời ngày tịnh tiến
              const dateDiff = new Date(updatedTask.date) - new Date(originalTask.date);
              const dayDiff = Math.round(dateDiff / (1000 * 60 * 60 * 24));
              
              setBoardData(prev => ({
                  ...prev,
                  tasks: prev.tasks.map(t => {
                      if (t.seriesId !== originalTask.seriesId) return t;
                      if (t.date < originalTask.date) return t;
                      let newDate = t.date;
                      if (dayDiff !== 0) { const d = new Date(t.date); d.setDate(d.getDate() + dayDiff); newDate = formatDateKey(d); }
                      return { ...t, title: updatedTask.title, description: updatedTask.description, date: newDate, categoryId: updatedTask.categoryId, repeat: updatedTask.repeat };
                  })
              }));
              
              await supabase.from('tasks').update({
                   title: updatedTask.title, description: updatedTask.description, date: updatedTask.date, is_completed: updatedTask.isCompleted, repeat: updatedTask.repeat, category_id: updatedTask.categoryId 
              }).eq('id', updatedTask.id);
              
              addToast('Đã cập nhật chuỗi công việc', 'success');
          }
      }
  };

  const handleSaveNewTask = async ({ title, date, categoryId, newCategoryTitle }) => {
      let finalCategoryId = categoryId;
      let newCategories = [...categories];
      let newCategoryObj = null;
      if (newCategoryTitle) {
          const newCatId = `cat-${Date.now()}`;
          newCategoryObj = { id: newCatId, title: newCategoryTitle, color: COLORS[Math.floor(Math.random() * COLORS.length)], collapsed: false, position: categories.length };
          newCategories.push(newCategoryObj);
          finalCategoryId = newCatId;
      }
      const newId = `new-${Date.now()}`; 
      const localTask = { id: newId, categoryId: finalCategoryId, date: date, title: title, description: '', isCompleted: false, repeat: 'none', seriesId: null };
      setBoardData(prev => ({ categories: newCategories, tasks: [...prev.tasks, localTask] }));
      setShowAddTaskModal(false);
      addToast('Đã lưu công việc!', 'success');
      try {
          if (newCategoryObj) await supabase.from('categories').insert([newCategoryObj]);
          const dbTask = { id: newId, category_id: finalCategoryId, date: date, title: title, description: '', is_completed: false, repeat: 'none', series_id: null };
          const { error } = await supabase.from('tasks').insert([dbTask]);
          if (error) throw error;
      } catch (error) {
          console.error("Lỗi lưu:", error);
          setBoardData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== newId), categories: newCategoryObj ? prev.categories.filter(c => c.id !== newCategoryObj.id) : prev.categories }));
          addToast('Lỗi lưu dữ liệu - Đã hoàn tác', 'error');
      }
  };

  const handleDeleteTask = async (taskId) => { 
      const originalTasks = [...tasks];
      setBoardData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) })); 
      setEditingTask(null);
      addToast('Đã xóa công việc 🗑️');
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) {
        setBoardData(prev => ({ ...prev, tasks: originalTasks }));
        addToast('Lỗi xóa công việc - Đã khôi phục', 'error'); 
      }
  };

  const handleSaveCategory = async () => {
    if (newCategoryName && newCategoryName.trim()) {
        const newCat = { id: `cat-${Date.now()}`, title: newCategoryName.trim(), color: COLORS[Math.floor(Math.random() * COLORS.length)], collapsed: false, position: categories.length };
        setBoardData(prev => ({ ...prev, categories: [...prev.categories, newCat] }));
        setNewCategoryName(''); 
        setIsCreatingCategory(false);
        addToast('Đã thêm hạng mục', 'success');
        const { error } = await supabase.from('categories').insert([newCat]);
        if (error) {
              console.error(error);
              setBoardData(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== newCat.id) })); 
              addToast('Lỗi server', 'error');
        }
    }
  };

  const handleDeleteCategory = async (catId) => { 
        const originalData = { ...boardData };
        setBoardData(prev => ({ tasks: prev.tasks.filter(t => t.categoryId !== catId), categories: prev.categories.filter(c => c.id !== catId) }));
        setEditingCategory(null); 
        addToast('Đã xóa hạng mục');
        const { error } = await supabase.from('categories').delete().eq('id', catId);
        if (error) { setBoardData(originalData); addToast('Lỗi xóa hạng mục - Đã khôi phục', 'error'); }
  };

  const handleUpdateCategory = async (updatedCat) => { 
      setBoardData(prev => ({ ...prev, categories: prev.categories.map(c => c.id === updatedCat.id ? updatedCat : c) }));
      await supabase.from('categories').update({ title: updatedCat.title, color: updatedCat.color }).eq('id', updatedCat.id);
  };

  const toggleCategoryCollapse = async (catId) => {
      const cat = categories.find(c => c.id === catId);
      if (cat) {
          const newCollapsedState = !cat.collapsed;
          setBoardData(prev => ({ ...prev, categories: prev.categories.map(c => c.id === catId ? { ...c, collapsed: newCollapsedState } : c) }));
          await supabase.from('categories').update({ collapsed: newCollapsedState }).eq('id', catId);
      }
  };

  const handleCategoryDragStart = (e, index) => { setDraggedCategoryIndex(index); e.dataTransfer.effectAllowed = "move"; };
  const handleCategoryDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  
  const handleCategoryDrop = async (e, dropIndex) => {
      e.preventDefault();
      if (draggedCategoryIndex === null || draggedCategoryIndex === dropIndex) return;
      const newCategories = [...categories];
      const [movedCategory] = newCategories.splice(draggedCategoryIndex, 1);
      newCategories.splice(dropIndex, 0, movedCategory);
      const orderedCategories = newCategories.map((cat, index) => ({ ...cat, position: index }));
      setBoardData(prev => ({ ...prev, categories: orderedCategories }));
      setDraggedCategoryIndex(null);
      addToast('Đã sắp xếp lại thứ tự hạng mục', 'success');
      const updates = orderedCategories.map(c => ({ id: c.id, title: c.title, color: c.color, collapsed: c.collapsed, position: c.position }));
      await supabase.from('categories').upsert(updates);
  };

  const startResizingSidebar = (e) => { e.preventDefault(); const startX = e.clientX; const startWidth = sidebarWidth;
    const onMouseMove = (ev) => setSidebarWidth(Math.max(150, Math.min(500, startWidth + (ev.clientX - startX)))); const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp); }; document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp); };
  
  // --- TỐI ƯU KÉO THẢ: XỬ LÝ GHOST IMAGE ---
  const handleDragStart = (e, task) => { 
    e.stopPropagation(); 
    setDraggedTask(task); 
    e.dataTransfer.effectAllowed = 'move'; 
    e.dataTransfer.setData('text/plain', JSON.stringify(task)); 

    setTimeout(() => {
        if (e.target) {
            e.target.style.opacity = '0.4'; 
            e.target.style.transform = 'scale(0.95)'; 
            e.target.style.filter = 'grayscale(0.5)'; 
        }
    }, 0);
  };

  const handleDragEnd = (e) => { 
      if (e.target) {
          e.target.style.opacity = '1'; 
          e.target.style.transform = 'none'; 
          e.target.style.filter = 'none';
      }
      setDraggedTask(null); 
  };

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  
  const handleDrop = (e, categoryId, dateStr) => { e.preventDefault();
      if (draggedTask) { 
          const draggedEl = document.querySelector(`[draggable="true"][style*="opacity: 0.4"]`); 
          if (draggedEl) {
              draggedEl.style.opacity = '1';
              draggedEl.style.transform = 'none';
              draggedEl.style.filter = 'none';
          }
      }
      if (!draggedTask) return; 
      handleUpdateTask({ ...draggedTask, categoryId, date: dateStr });
      setDraggedTask(null); 
  };

  const handleConfirmQuickAdd = (title) => { if (!title || !title.trim()) { setQuickAddCell(null); return; } 
    handleSaveNewTask({ title: title.trim(), date: quickAddCell.dateStr, categoryId: quickAddCell.categoryId });
    setQuickAddCell(null); 
  };
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
      return tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [tasks, searchQuery]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-slate-800" onClick={() => setSelectedTaskId(null)}>
      
      <Header 
        currentDate={currentDate} prevWeek={prevWeek} nextWeek={nextWeek} goToToday={goToToday} onDateSelect={handleDateSelect} zoomIndex={zoomIndex} onZoomChange={handleZoomChange} onUndo={undo} canUndo={canUndo} onRedo={redo} canRedo={canRedo} viewMode={viewMode} setViewMode={setViewMode} onOpenAddTask={handleOpenAddTask} searchQuery={searchQuery} setSearchQuery={setSearchQuery} tasks={tasks} onNavigateToTask={handleNavigateToTask} 
        categories={categories} 
      />
      
      {viewMode === 'list' ? (
          <TodoView 
            tasks={tasks} categories={categories} currentDate={currentDate} onUpdateTask={handleUpdateTask} setEditingTask={setEditingTask} onDeleteTask={handleDeleteTask} onOpenAddTask={handleOpenAddTask} quickAddCell={quickAddCell} setQuickAddCell={setQuickAddCell} onConfirmQuickAdd={handleConfirmQuickAdd} searchQuery={searchQuery} onSaveNewTask={handleSaveNewTask}
          />
      ) : (
          <div className="flex-1 overflow-hidden relative flex flex-col">
            <div ref={scrollContainerRef} className="flex-1 overflow-auto custom-scrollbar" onScroll={handleScroll}>
              <div className="inline-block min-w-full">
                
                {/* --- HEADER NGÀY THÁNG --- */}
                <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md flex border-b border-gray-200/60 shadow-sm transition-all">
                  <div className="sticky left-0 z-50 bg-white/95 backdrop-blur-md border-r border-gray-200/60 p-4 flex items-center font-bold text-gray-500 bg-gray-50/50 box-border group" style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
                    Hạng Mục / Deadline
                    <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500 group-hover:bg-gray-300 transition-colors z-30" onMouseDown={startResizingSidebar} />
                  </div>
                  {visibleDays.map((day, index) => {
                        const dayKey = formatDateKey(day);
                        const isTodayDate = dayKey === formatDateKey(new Date()); 
                        const isMonday = index % 7 === 0;
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                        return (
                          <div key={dayKey} style={{ width: dayWidth, minWidth: dayWidth }} className={`flex-shrink-0 p-3 text-center flex flex-col justify-center transition-all duration-200 ease-out relative ${isTodayDate ? 'bg-indigo-50/50' : (isWeekend ? 'bg-slate-50/50' : 'bg-white')}`}>
                            {isMonday && (<div className="absolute top-0 left-0 right-0 -mt-1 text-[10px] font-bold text-indigo-400 uppercase tracking-widest text-center">Tuần {day.getDate()} - {new Date(day.getTime() + 6*86400000).getDate()}/{day.getMonth() + 1}</div>)}
                            <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isTodayDate ? 'text-indigo-600' : 'text-gray-400'}`}>{getDayName(day)}</span>
                            <span className={`text-2xl font-light w-10 h-10 flex items-center justify-center mx-auto rounded-full transition-all ${isTodayDate ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-700'}`}>{formatDateDisplay(day)}</span>
                          </div>
                        );
                  })}
                </div>

                {/* --- ROWS --- */}
                {categories.map((category, index) => (
                  <div 
                    key={category.id} 
                    /* ĐÃ SỬA: Tăng độ đậm border từ gray-100 lên gray-300 */
                    className={`flex border-b border-gray-300 group ${draggedCategoryIndex === index ? 'opacity-40 border-dashed border-indigo-400' : ''}`}
                    onDragOver={handleCategoryDragOver}
                    onDrop={(e) => handleCategoryDrop(e, index)}
                  >
                    {/* SIDEBAR CELL */}
                    <div 
                        draggable 
                        onDragStart={(e) => handleCategoryDragStart(e, index)}
                        className={`sticky left-0 z-30 bg-white/95 backdrop-blur-sm border-r border-gray-200/60 p-4 flex flex-col justify-center group-hover:bg-gray-50 transition-colors border-l-4 ${category.color.value.replace('bg-', 'border-').split(' ')[0]} shadow-[4px_0_24px_rgba(0,0,0,0.02)]`} 
                        style={{ width: sidebarWidth, minWidth: sidebarWidth, borderLeftColor: category.color?.hex || '#ccc' }}
                    >
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
                            <div className="text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-700" title="Kéo để sắp xếp"><GripVertical size={14}/></div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-2 ml-6">
                        <span className={`w-2 h-2 rounded-full ${category.color.value.split(' ')[0].replace('bg-', 'bg-')}`}></span>
                      </div>
                      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500 z-30" onMouseDown={startResizingSidebar} />
                    </div>

                    {/* TASK CELLS */}
                    {!category.collapsed && visibleDays.map((day) => {
                        const dateStr = formatDateKey(day);
                        const cellTasks = filteredMatrixTasks.filter(t => t.categoryId === category.id && t.date === dateStr);
                        const isToday = dateStr === formatDateKey(new Date());
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                        return (
                            <div 
                                key={`${category.id}-${dateStr}`} 
                                style={{ width: dayWidth, minWidth: dayWidth }} 
                                className={`
                                    flex-shrink-0 min-h-[120px] p-2 transition-all duration-300 group/cell relative
                                    ${isToday ? 'bg-indigo-50/40' : (isWeekend ? 'bg-slate-50/30' : 'bg-transparent')} 
                                    hover:bg-gray-50/80 cursor-pointer
                                `}
                                onDragOver={handleDragOver} 
                                onDrop={(e) => handleDrop(e, category.id, dateStr)} 
                                onMouseEnter={() => setHoveredCell({ categoryId: category.id, dateStr })} 
                                onMouseLeave={() => setHoveredCell(null)} 
                                onClick={() => setSelectedTaskId(null)} 
                                onDoubleClick={(e) => { handleOpenAddTask({ date: dateStr, categoryId: category.id }); }}
                            >
                                <div className="flex flex-col gap-2 h-full relative z-10">
                                    {cellTasks.map((task) => (
                                        <div className="pointer-events-auto" key={task.id}>
                                            <TaskCard 
                                                task={task} 
                                                categoryColor={category.color} 
                                                dayWidth={dayWidth} 
                                                isSelected={selectedTaskId === task.id} 
                                                isHighlighted={highlightedTaskId === task.id} 
                                                onSelect={setSelectedTaskId} 
                                                onUpdate={handleUpdateTask} 
                                                onDelete={handleDeleteTask} 
                                                onDragStart={handleDragStart} 
                                                onDragEnd={handleDragEnd} 
                                                setEditingTask={setEditingTask} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {category.collapsed && <div className="flex-1 bg-gray-50/50 flex items-center justify-center text-gray-400 text-sm italic">Đã thu gọn</div>}
                  </div>
                ))}
                
                {/* Khu vực tạo Category mới */}
                <div className="flex border-b border-gray-300 group">
                    <div className="sticky left-0 z-30 bg-white/95 backdrop-blur-sm border-r border-gray-200/60 flex flex-col justify-center border-l-4 border-transparent shadow-[4px_0_24px_rgba(0,0,0,0.02)]" style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
                        {isCreatingCategory ? (
                            <div className="p-3 m-2 bg-white border border-indigo-200 rounded-xl shadow-lg animate-in zoom-in-95 duration-200">
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveCategory();
                                        if (e.key === 'Escape') setIsCreatingCategory(false);
                                    }}
                                    placeholder="Tên hạng mục..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setIsCreatingCategory(false)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"><X size={16}/></button>
                                    <button onClick={handleSaveCategory} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1"><Check size={14}/> Lưu</button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setIsCreatingCategory(true)} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold transition-colors w-full p-4">
                                <div className="p-1 rounded-md bg-gray-100 group-hover:bg-indigo-100 text-gray-500 group-hover:text-indigo-600 transition-colors">
                                    <Plus size={16} />
                                </div>
                                <span>Thêm hạng mục mới</span>
                            </button>
                        )}
                    </div>
                    {visibleDays.map((day) => (
                        <div key={`empty-${formatDateKey(day)}`} style={{ width: dayWidth, minWidth: dayWidth }} className="flex-shrink-0 border-r border-transparent bg-gray-50/20" />
                    ))}
                </div>

              </div>
            </div>
          </div>
      )}

      {editingTask && <TaskModal task={editingTask} onClose={() => setEditingTask(null)} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} categories={categories} onGenerateRepeats={handleGenerateRepeats} />}
      {showAddTaskModal && <AddTaskModal onClose={() => setShowAddTaskModal(false)} onSave={handleSaveNewTask} categories={categories} initialDate={newTaskDefaults.date} initialCategoryId={newTaskDefaults.categoryId} />}
      {editingCategory && <CategoryModal category={editingCategory} onClose={() => setEditingCategory(null)} onUpdate={handleUpdateCategory} onDelete={handleDeleteCategory} />}
      {showRecurringModal && <RecurringUpdateModal onClose={() => setShowRecurringModal(false)} onConfirm={handleConfirmRecurringUpdate} />}
      <ToastContainer toasts={toasts} />
    </div>
  );
}