import React, { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { Plus, GripVertical, CornerDownLeft, Trash2, Palette, ChevronRight as ChevronRightIcon, X, Check } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import { COLORS, ZOOM_LEVELS, INITIAL_DATA } from './constants/theme';
import { formatDateKey, getMonday, getInfiniteWeekWindow, getDayName, formatDateDisplay, getMonthGridDays } from './utils/dateHelpers';
import { useUndoableState } from './hooks/useUndoableState';

import Header from './components/layout/Header';
import ToastContainer from './components/common/ToastContainer';
import ConfirmModal from './components/common/ConfirmModal';
import ContextMenu from './components/common/ContextMenu';
import TodoView from './components/views/TodoView';
import MonthView from './components/views/MonthView'; // IMPORTER THÊM MONTHVIEW MỚI
import TaskCard from './components/tasks/TaskCard';
import TaskModal from './components/tasks/TaskModal';
import AddTaskModal from './components/tasks/AddTaskModal';
import RecurringUpdateModal from './components/tasks/RecurringUpdateModal';
import CategoryModal from './components/tasks/CategoryModal';
import AIAssistant from './components/ai/AIAssistant';
import SettingsAI from './components/ai/SettingsAI';

const isMultiDayFeatureEnabled = import.meta.env.VITE_ENABLE_MULTIDAY === 'true' ||
    (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('multiday') === 'true');

const parseDateStr = (dateStr) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const GhostCard = ({ task, empty }) => (
    <div className="px-3 py-3 mb-2 border border-transparent rounded-2xl opacity-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        <div className="flex flex-row gap-3">
            <div className="flex flex-col items-center gap-1.5 pt-0.5 min-w-[24px]">
                <div className="w-[20px] h-[20px]"></div>
                {task?.time && <div className="text-[9px] w-full px-0.5">&nbsp;</div>}
                {task?.repeat && task.repeat !== 'none' && !empty && <div className="w-3 h-3"></div>}
                {task?.description && !empty && <div className="w-3 h-3"></div>}
            </div>
            <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                <div className="leading-snug break-words">
                    <span className="text-[15px] font-semibold">{empty ? '\u00A0' : (task?.title || '\u00A0')}</span>
                </div>
            </div>
        </div>
    </div>
);

export default function App() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('matrix');
    const [calendarView, setCalendarView] = useState('week');

    const [boardData, setBoardData, undo, redo, canUndo, canRedo] = useUndoableState(INITIAL_DATA);
    const { categories, tasks } = boardData;

    const [zoomIndex, setZoomIndex] = useState(2);
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const dayWidth = ZOOM_LEVELS[zoomIndex];

    const [draggedTask, setDraggedTask] = useState(null);
    const [draggedTaskOffset, setDraggedTaskOffset] = useState(0);
    const [draggedCategoryIndex, setDraggedCategoryIndex] = useState(null);
    const [copiedTask, setCopiedTask] = useState(null);

    const [editingTask, setEditingTask] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [quickAddCell, setQuickAddCell] = useState(null);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [newTaskDefaults, setNewTaskDefaults] = useState({});
    const [pendingUpdate, setPendingUpdate] = useState(null);
    const [showRecurringModal, setShowRecurringModal] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [hoveredCell, setHoveredCell] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [highlightedTaskId, setHighlightedTaskId] = useState(null);

    const [confirmDialog, setConfirmDialog] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showAISettings, setShowAISettings] = useState(false);

    useEffect(() => {
        // Đảm bảo gỡ class dark nếu nó đang tồn tại
        document.documentElement.classList.remove('dark');
    }, []);

    const scrollContainerRef = useRef(null);
    const previousDateRef = useRef(currentDate);
    const viewCenterDayIndexRef = useRef(null);
    const scrollActionRef = useRef('jump');
    const isProgrammaticScroll = useRef(false);
    const lastScrollTimeRef = useRef(0);

    const addToast = (message, type = 'info') => {
        const id = Date.now(); setToasts(prev => [...prev, { id, message, type }]); setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    // 1. Hàm lấy dữ liệu (Bỏ useCallback để hàm không bị dính dependency gây re-render)
    const fetchBoardData = async () => {
        const { data: catData, error: catError } = await supabase.from('categories').select('*').order('position', { ascending: true });
        const { data: taskData, error: taskError } = await supabase.from('tasks').select('*');

        if (catError || taskError) { addToast('Lỗi tải dữ liệu', 'error'); }
        else {
            const mappedTasks = (taskData || []).map(t => ({
                id: t.id, title: t.title, description: t.description, date: t.date, endDate: t.end_date || t.date, time: t.time, isCompleted: t.is_completed, categoryId: t.category_id, repeat: t.repeat, seriesId: t.series_id
            }));
            const mappedCategories = (catData || []).map(c => ({ id: c.id, title: c.title, color: c.color, collapsed: c.collapsed, position: c.position || 0 }));
            setBoardData({ categories: mappedCategories, tasks: mappedTasks });
        }
    };

    // 2. Gọi dữ liệu lần đầu tiên (Chỉ chạy đúng 1 lần khi load app)
    useEffect(() => {
        fetchBoardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 3. Tự động kiểm tra qua ngày và đồng bộ dữ liệu khi anh vào lại tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const now = new Date();

                // Nếu qua ngày mới, tự động cập nhật lại ngày cho hệ thống
                setCurrentDate(prevDate => {
                    if (formatDateKey(now) !== formatDateKey(prevDate)) {
                        return now;
                    }
                    return prevDate;
                });

                // Tự động gọi lại Supabase để kéo công việc mới nhất về
                fetchBoardData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) return;
            if (showAddTaskModal || showRecurringModal || editingTask || editingCategory || confirmDialog) return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); if (canUndo) { undo(); addToast('Đã hoàn tác ↩️'); } }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); if (canRedo) { redo(); addToast('Đã làm lại ↪️'); } }
            if (e.key === 'Delete' && selectedTaskId) { e.preventDefault(); handleDeleteTask(selectedTaskId); }
            if (e.key === 'Escape') { setSelectedTaskId(null); setContextMenu(null); }
            if (e.key === 'n' || e.key === 'N') { e.preventDefault(); handleOpenAddTask({ date: formatDateKey(currentDate) }); }
        };
        window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canUndo, canRedo, selectedTaskId, showAddTaskModal, showRecurringModal, editingTask, editingCategory, undo, redo, currentDate, confirmDialog]);

    useEffect(() => {
        const handleCopyPaste = async (e) => {
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) return;
            if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
                if (selectedTaskId) {
                    const taskToCopy = tasks.find(t => t.id === selectedTaskId);
                    if (taskToCopy) { setCopiedTask(taskToCopy); addToast('Đã sao chép 📋', 'info'); navigator.clipboard.writeText(taskToCopy.title).catch(() => { }); }
                }
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
                if (!hoveredCell) return;
                try { const text = await navigator.clipboard.readText(); if (text && (text.includes('\n') || (copiedTask && text !== copiedTask.title) || !copiedTask)) { e.preventDefault(); handleBatchPaste(text, hoveredCell); return; } } catch (err) { }
                if (copiedTask) { e.preventDefault(); handlePasteInternalTask(copiedTask, hoveredCell); }
            }
        };
        window.addEventListener('keydown', handleCopyPaste); return () => window.removeEventListener('keydown', handleCopyPaste);
    }, [selectedTaskId, hoveredCell, copiedTask, tasks]);

    const handleBatchPaste = async (text, targetCell) => {
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== ''); if (lines.length === 0) return;
        const newTasks = []; const { categoryId, dateStr } = targetCell;
        lines.forEach((line, index) => { newTasks.push({ id: `paste-${Date.now()}-${index}`, category_id: categoryId, date: dateStr, end_date: dateStr, title: line.trim(), description: '', time: null, is_completed: false, repeat: 'none', series_id: null }); });
        const mappedNewTasks = newTasks.map(t => ({ ...t, id: t.id, categoryId: t.category_id, endDate: t.end_date, isCompleted: t.is_completed, seriesId: t.series_id }));
        setBoardData(prev => ({ ...prev, tasks: [...prev.tasks, ...mappedNewTasks] }));
        await supabase.from('tasks').insert(newTasks); addToast(`Đã dán ${lines.length} công việc`, 'success');
    };

    const handlePasteInternalTask = async (originalTask, targetCell) => {
        const { categoryId, dateStr } = targetCell; const newId = `paste-internal-${Date.now()}`;
        const newTask = { ...originalTask, id: newId, categoryId: categoryId, date: dateStr, endDate: dateStr, isCompleted: false, seriesId: null };
        setBoardData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
        const dbTask = { id: newId, category_id: categoryId, date: dateStr, end_date: dateStr, title: newTask.title || '', description: newTask.description || null, time: newTask.time || null, is_completed: false, repeat: newTask.repeat || 'none', series_id: null };
        await supabase.from('tasks').insert([dbTask]); addToast('Đã dán công việc', 'success');
    };

    useEffect(() => {
        if (viewMode === 'matrix' && calendarView === 'week') {
            const today = new Date(); setCurrentDate(today); previousDateRef.current = today; scrollActionRef.current = 'jump';
            setTimeout(() => { if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = 7 * dayWidth; }, 10);
        }
    }, [viewMode, calendarView, dayWidth]);

    const handleZoomChange = (e) => {
        const newIndex = parseInt(e.target.value);
        if (scrollContainerRef.current && calendarView === 'week') {
            const { scrollLeft, clientWidth } = scrollContainerRef.current;
            viewCenterDayIndexRef.current = (scrollLeft + clientWidth / 2) / dayWidth;
        }
        setZoomIndex(newIndex);
    };

    useLayoutEffect(() => {
        if (scrollContainerRef.current && viewCenterDayIndexRef.current !== null && calendarView === 'week') {
            const { clientWidth } = scrollContainerRef.current;
            scrollContainerRef.current.scrollLeft = (viewCenterDayIndexRef.current * dayWidth) - (clientWidth / 2);
            viewCenterDayIndexRef.current = null;
        }
    }, [dayWidth, calendarView]);

    const visibleDays = useMemo(() => getInfiniteWeekWindow(currentDate), [currentDate]);
    const monthGridDays = useMemo(() => getMonthGridDays(currentDate), [currentDate]);

    const handleScroll = useCallback(() => {
        if (calendarView !== 'week' || !scrollContainerRef.current || isProgrammaticScroll.current) return;
        const now = Date.now(); if (now - lastScrollTimeRef.current < 50) return; lastScrollTimeRef.current = now;
        const { scrollLeft, clientWidth } = scrollContainerRef.current;
        const dayIndex = Math.floor((scrollLeft + clientWidth / 2) / dayWidth);
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
    }, [currentDate, visibleDays, dayWidth, calendarView]);

    useLayoutEffect(() => {
        if (calendarView !== 'week' || !scrollContainerRef.current) return;
        const prevDate = previousDateRef.current; const action = scrollActionRef.current; isProgrammaticScroll.current = true;
        if (action === 'jump') { scrollContainerRef.current.scrollLeft = 7 * dayWidth; previousDateRef.current = currentDate; }
        else if (action === 'maintain') {
            if (currentDate > prevDate) scrollContainerRef.current.scrollLeft -= 7 * dayWidth;
            else scrollContainerRef.current.scrollLeft += 7 * dayWidth;
            previousDateRef.current = currentDate;
        }
        setTimeout(() => { isProgrammaticScroll.current = false; scrollActionRef.current = 'maintain'; }, 100);
    }, [currentDate, dayWidth, calendarView]);

    useEffect(() => { if (scrollContainerRef.current && viewMode === 'matrix' && calendarView === 'week') scrollContainerRef.current.scrollLeft = 7 * dayWidth; }, []);

    const validCategoryIds = useMemo(() => new Set(categories.map(c => c.id)), [categories]);

    const filteredMatrixTasks = useMemo(() => {
        let filtered = tasks.filter(t => validCategoryIds.has(t.categoryId));
        return filtered;
    }, [tasks, validCategoryIds]);

    const layoutContext = useMemo(() => {
        const context = { taskTracks: {}, maxTracks: {} };
        if (!isMultiDayFeatureEnabled) return context;

        categories.forEach(cat => {
            const catTasks = filteredMatrixTasks.filter(t => t.categoryId === cat.id);
            catTasks.sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                const durA = a.endDate ? (parseDateStr(a.endDate) - parseDateStr(a.date)) : 0;
                const durB = b.endDate ? (parseDateStr(b.endDate) - parseDateStr(b.date)) : 0;
                return durB - durA;
            });

            const tracks = [];
            catTasks.forEach(task => {
                let assigned = false;
                for (let i = 0; i < tracks.length; i++) {
                    if (tracks[i] < task.date) {
                        tracks[i] = task.endDate || task.date;
                        context.taskTracks[task.id] = i;
                        assigned = true; break;
                    }
                }
                if (!assigned) {
                    context.taskTracks[task.id] = tracks.length;
                    tracks.push(task.endDate || task.date);
                }
            });
            context.maxTracks[cat.id] = tracks.length;
        });
        return context;
    }, [filteredMatrixTasks, categories]);

    const monthLayoutContext = useMemo(() => {
        const context = { taskTracks: {}, maxTrack: 0 };
        if (!isMultiDayFeatureEnabled || calendarView !== 'month') return context;

        const monthTasks = [...filteredMatrixTasks].sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            const durA = a.endDate ? (parseDateStr(a.endDate) - parseDateStr(a.date)) : 0;
            const durB = b.endDate ? (parseDateStr(b.endDate) - parseDateStr(b.date)) : 0;
            return durB - durA;
        });

        const tracks = [];
        monthTasks.forEach(task => {
            let assigned = false;
            for (let i = 0; i < tracks.length; i++) {
                if (tracks[i] < task.date) {
                    tracks[i] = task.endDate || task.date;
                    context.taskTracks[task.id] = i;
                    assigned = true; break;
                }
            }
            if (!assigned) {
                context.taskTracks[task.id] = tracks.length;
                tracks.push(task.endDate || task.date);
            }
        });
        context.maxTrack = tracks.length;
        return context;
    }, [filteredMatrixTasks, calendarView]);

    const handleGenerateRepeats = async (baseTask, repeatType) => {
        if (!baseTask || !repeatType || repeatType === 'none') return;
        const seriesId = baseTask.seriesId || `series-${Date.now()}`; const newTasks = [];
        const [year, month, day] = baseTask.date.split('-').map(Number); let currentIterDate = new Date(year, month - 1, day);
        for (let i = 1; i <= 12; i++) {
            if (repeatType === 'daily') currentIterDate.setDate(currentIterDate.getDate() + 1);
            else if (repeatType === 'weekly') currentIterDate.setDate(currentIterDate.getDate() + 7);
            else if (repeatType === 'monthly') currentIterDate.setMonth(currentIterDate.getMonth() + 1);
            const nextDateStr = formatDateKey(currentIterDate);
            newTasks.push({ id: `${baseTask.id}-rep-${Date.now()}-${i}`, category_id: baseTask.categoryId, date: nextDateStr, end_date: nextDateStr, title: baseTask.title || '', description: baseTask.description || null, time: baseTask.time || null, is_completed: false, repeat: repeatType, series_id: seriesId });
        }
        const mappedNewTasks = newTasks.map(t => ({ id: t.id, title: t.title, description: t.description, date: t.date, endDate: t.end_date, time: t.time, isCompleted: t.is_completed, categoryId: t.category_id, repeat: t.repeat, seriesId: t.series_id }));
        const updatedBase = { ...baseTask, seriesId, repeat: repeatType };
        setBoardData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === baseTask.id ? updatedBase : t).concat(mappedNewTasks) }));
        await supabase.from('tasks').insert(newTasks);
        await supabase.from('tasks').update({ series_id: seriesId, repeat: repeatType }).eq('id', baseTask.id);
    };

    const handleUpdateTask = async (updatedTask) => {
        const originalTask = tasks.find(t => t.id === updatedTask.id); if (!originalTask) return;
        const hasSeries = !!originalTask.seriesId || (originalTask.repeat && originalTask.repeat !== 'none');
        const isNowSeries = updatedTask.repeat !== 'none';
        const isContentChanged = originalTask.title !== updatedTask.title || (originalTask.description || '') !== (updatedTask.description || '') || originalTask.date !== updatedTask.date || originalTask.endDate !== updatedTask.endDate || originalTask.repeat !== updatedTask.repeat || originalTask.categoryId !== updatedTask.categoryId || (originalTask.time || '') !== (updatedTask.time || '');

        if (hasSeries && isContentChanged) {
            setPendingUpdate({ originalTask, updatedTask }); setShowRecurringModal(true);
        } else {
            setBoardData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === updatedTask.id ? updatedTask : t) }));
            const dbPayload = { title: updatedTask.title || '', description: updatedTask.description || null, date: updatedTask.date, end_date: updatedTask.endDate || updatedTask.date, time: updatedTask.time || null, is_completed: Boolean(updatedTask.isCompleted), repeat: updatedTask.repeat || 'none', category_id: updatedTask.categoryId };
            const { error } = await supabase.from('tasks').update(dbPayload).eq('id', updatedTask.id);
            if (error) { setBoardData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === updatedTask.id ? originalTask : t) })); addToast(`Lỗi: ${error.message}`, 'error'); }
            else { if (!hasSeries && isNowSeries) await handleGenerateRepeats(updatedTask, updatedTask.repeat); }
        }
    };

    const handleConfirmRecurringUpdate = async (mode) => {
        if (!pendingUpdate) return;
        const { originalTask, updatedTask } = pendingUpdate; setShowRecurringModal(false); setPendingUpdate(null);
        let finalUpdatedTask = { ...updatedTask };

        if (mode === 'single') {
            finalUpdatedTask.seriesId = null;
            setBoardData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === finalUpdatedTask.id ? finalUpdatedTask : t) }));
            const dbPayload = { title: finalUpdatedTask.title || '', description: finalUpdatedTask.description || null, date: finalUpdatedTask.date, end_date: finalUpdatedTask.endDate || finalUpdatedTask.date, time: finalUpdatedTask.time || null, is_completed: Boolean(finalUpdatedTask.isCompleted), repeat: finalUpdatedTask.repeat || 'none', category_id: finalUpdatedTask.categoryId, series_id: null };
            await supabase.from('tasks').update(dbPayload).eq('id', finalUpdatedTask.id);
            addToast('Đã cập nhật (Tách riêng)', 'success');
        } else if (mode === 'future') {
            const isStoppingRepeat = finalUpdatedTask.repeat === 'none';
            const newSeriesId = isStoppingRepeat ? null : (originalTask.seriesId || `series-${Date.now()}`);
            finalUpdatedTask.seriesId = newSeriesId;

            setBoardData(prev => ({
                ...prev,
                tasks: prev.tasks.filter(t => {
                    if (t.id === finalUpdatedTask.id) return true;
                    if (originalTask.seriesId && t.seriesId === originalTask.seriesId) {
                        if (isStoppingRepeat) return false;
                        if (t.date > originalTask.date) return false;
                    }
                    return true;
                }).map(t => t.id === finalUpdatedTask.id ? finalUpdatedTask : t)
            }));

            const dbPayload = { title: finalUpdatedTask.title || '', description: finalUpdatedTask.description || null, date: finalUpdatedTask.date, end_date: finalUpdatedTask.endDate || finalUpdatedTask.date, time: finalUpdatedTask.time || null, is_completed: Boolean(finalUpdatedTask.isCompleted), repeat: finalUpdatedTask.repeat || 'none', category_id: finalUpdatedTask.categoryId, series_id: newSeriesId };

            try {
                if (originalTask.seriesId) {
                    if (isStoppingRepeat) { await supabase.from('tasks').delete().eq('series_id', originalTask.seriesId).neq('id', finalUpdatedTask.id); }
                    else { await supabase.from('tasks').delete().eq('series_id', originalTask.seriesId).gt('date', originalTask.date); }
                }
                await supabase.from('tasks').update(dbPayload).eq('id', finalUpdatedTask.id);
                if (!isStoppingRepeat) { await handleGenerateRepeats(finalUpdatedTask, finalUpdatedTask.repeat); }
                else { addToast('Đã hủy lặp lại & xoá sạch', 'success'); }
            } catch (err) { addToast(`Lỗi DB: ${err.message}`, 'error'); }
        }
    };

    const handleSaveNewTask = async ({ title, date, categoryId, newCategoryTitle }) => {
        let finalCategoryId = categoryId || categories[0]?.id;
        let newCategories = [...categories]; let newCategoryObj = null;
        if (newCategoryTitle) {
            const newCatId = `cat-${Date.now()}`;
            newCategoryObj = { id: newCatId, title: newCategoryTitle, color: COLORS[Math.floor(Math.random() * COLORS.length)], collapsed: false, position: categories.length };
            newCategories.push(newCategoryObj); finalCategoryId = newCatId;
        }
        const newId = `new-${Date.now()}`;
        const localTask = { id: newId, categoryId: finalCategoryId, date: date, endDate: date, title: title, description: null, time: null, isCompleted: false, repeat: 'none', seriesId: null };
        setBoardData(prev => ({ categories: newCategories, tasks: [...prev.tasks, localTask] })); setShowAddTaskModal(false); addToast('Đã lưu công việc!', 'success');
        try {
            if (newCategoryObj) await supabase.from('categories').insert([newCategoryObj]);
            const dbTask = { id: newId, category_id: finalCategoryId, date: date, end_date: date, title: title || '', description: null, time: null, is_completed: false, repeat: 'none', series_id: null };
            await supabase.from('tasks').insert([dbTask]);
        } catch (error) { addToast(`Lỗi lưu: ${error.message}`, 'error'); }
    };

    const handleDeleteTask = async (taskId) => {
        const originalTasks = [...tasks]; setBoardData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) })); setEditingTask(null); addToast('Đã xóa công việc 🗑️');
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (error) { setBoardData(prev => ({ ...prev, tasks: originalTasks })); addToast('Lỗi', 'error'); }
    };

    const handleSaveCategory = async () => {
        if (newCategoryName && newCategoryName.trim()) {
            const newCat = { id: `cat-${Date.now()}`, title: newCategoryName.trim(), color: COLORS[Math.floor(Math.random() * COLORS.length)], collapsed: false, position: categories.length };
            setBoardData(prev => ({ ...prev, categories: [...prev.categories, newCat] })); setNewCategoryName(''); setIsCreatingCategory(false); addToast('Đã thêm hạng mục', 'success');
            await supabase.from('categories').insert([newCat]);
        }
    };

    const handleDeleteCategory = (catId) => {
        const category = categories.find(c => c.id === catId); const title = category ? category.title : 'hạng mục này';
        setConfirmDialog({
            title: "Xóa hạng mục?", message: `Tất cả công việc nằm trong hạng mục này cũng sẽ bị xóa vĩnh viễn!`, confirmLabel: "Xóa vĩnh viễn", isDangerous: true,
            onConfirm: async () => {
                const originalData = { ...boardData }; setBoardData(prev => ({ tasks: prev.tasks.filter(t => t.categoryId !== catId), categories: prev.categories.filter(c => c.id !== catId) })); setEditingCategory(null); setConfirmDialog(null); addToast('Đã xóa hạng mục');
                const { error } = await supabase.from('categories').delete().eq('id', catId); if (error) { setBoardData(originalData); addToast(`Lỗi: ${error.message}`, 'error'); }
            }
        });
    };

    const handleUpdateCategory = async (updatedCat) => { setBoardData(prev => ({ ...prev, categories: prev.categories.map(c => c.id === updatedCat.id ? updatedCat : c) })); await supabase.from('categories').update({ title: updatedCat.title, color: updatedCat.color }).eq('id', updatedCat.id); };
    const toggleCategoryCollapse = async (catId) => { const cat = categories.find(c => c.id === catId); if (cat) { const newCollapsedState = !cat.collapsed; setBoardData(prev => ({ ...prev, categories: prev.categories.map(c => c.id === catId ? { ...c, collapsed: newCollapsedState } : c) })); await supabase.from('categories').update({ collapsed: newCollapsedState }).eq('id', catId); } };

    const handleCategoryDragStart = (e, index) => { setDraggedCategoryIndex(index); e.dataTransfer.effectAllowed = "move"; };
    const handleCategoryDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
    const handleCategoryDrop = async (e, dropIndex) => {
        e.preventDefault(); if (draggedCategoryIndex === null || draggedCategoryIndex === dropIndex) return;
        const newCategories = [...categories]; const [movedCategory] = newCategories.splice(draggedCategoryIndex, 1); newCategories.splice(dropIndex, 0, movedCategory);
        const orderedCategories = newCategories.map((cat, index) => ({ ...cat, position: index })); setBoardData(prev => ({ ...prev, categories: orderedCategories })); setDraggedCategoryIndex(null); addToast('Đã sắp xếp lại', 'success');
        const updates = orderedCategories.map(c => ({ id: c.id, title: c.title, color: c.color, collapsed: c.collapsed, position: c.position })); await supabase.from('categories').upsert(updates);
    };

    const startResizingSidebar = (e) => { e.preventDefault(); const startX = e.clientX; const startWidth = sidebarWidth; const onMouseMove = (ev) => setSidebarWidth(Math.max(150, Math.min(500, startWidth + (ev.clientX - startX)))); const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); }; document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp); };

    const handleDragStart = (e, task) => {
        e.stopPropagation();
        setDraggedTask(task);

        if (isMultiDayFeatureEnabled && task.endDate) {
            const rect = e.currentTarget.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const start = parseDateStr(task.date);
            const end = parseDateStr(task.endDate);
            const maxDuration = Math.round((end - start) / 86400000) + 1;

            let offsetDays = Math.floor(offsetX / dayWidth);
            offsetDays = Math.max(0, Math.min(offsetDays, maxDuration - 1));
            setDraggedTaskOffset(offsetDays);
        } else {
            setDraggedTaskOffset(0);
        }

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify(task));
        setTimeout(() => { if (e.target) { e.target.style.opacity = '0.4'; e.target.style.transform = 'scale(0.95)'; e.target.style.filter = 'grayscale(0.5)'; } }, 0);
    };
    const handleDragEnd = (e) => { if (e.target) { e.target.style.opacity = '1'; e.target.style.transform = 'none'; e.target.style.filter = 'none'; } setDraggedTask(null); };
    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

    const handleDrop = (e, targetCategoryId, bubbledDateStr) => {
        e.preventDefault();
        if (draggedTask) { const draggedEl = document.querySelector(`[draggable="true"][style*="opacity: 0.4"]`); if (draggedEl) { draggedEl.style.opacity = '1'; draggedEl.style.transform = 'none'; draggedEl.style.filter = 'none'; } }
        if (!draggedTask) return;

        let dropDateStr = bubbledDateStr;

        if (calendarView === 'week' && scrollContainerRef.current) {
            const rect = scrollContainerRef.current.getBoundingClientRect();
            const scrollLeft = scrollContainerRef.current.scrollLeft;
            const x = e.clientX - rect.left + scrollLeft;

            if (x >= sidebarWidth) {
                const dayIndex = Math.floor((x - sidebarWidth) / dayWidth);
                if (dayIndex >= 0 && dayIndex < visibleDays.length) {
                    dropDateStr = formatDateKey(visibleDays[dayIndex]);
                }
            }
        }

        const finalCategoryId = targetCategoryId || draggedTask.categoryId;
        const dropDate = parseDateStr(dropDateStr);
        dropDate.setDate(dropDate.getDate() - draggedTaskOffset);

        const oldStart = parseDateStr(draggedTask.date);
        const oldEnd = parseDateStr(draggedTask.endDate || draggedTask.date);
        const durationDays = Math.round((oldEnd - oldStart) / 86400000);

        const newEnd = parseDateStr(formatDateKey(dropDate));
        newEnd.setDate(newEnd.getDate() + durationDays);

        handleUpdateTask({ ...draggedTask, categoryId: finalCategoryId, date: formatDateKey(dropDate), endDate: formatDateKey(newEnd) });
        setDraggedTask(null);
        setDraggedTaskOffset(0);
    };

    const handleConfirmQuickAdd = (title) => { if (!title || !title.trim()) { setQuickAddCell(null); return; } handleSaveNewTask({ title: title.trim(), date: quickAddCell.dateStr, categoryId: quickAddCell.categoryId }); setQuickAddCell(null); };

    const prevWeek = () => {
        const d = new Date(currentDate);
        if (calendarView === 'month') d.setMonth(d.getMonth() - 1); else d.setDate(d.getDate() - 7);
        previousDateRef.current = currentDate; scrollActionRef.current = 'jump'; setCurrentDate(d);
    };
    const nextWeek = () => {
        const d = new Date(currentDate);
        if (calendarView === 'month') d.setMonth(d.getMonth() + 1); else d.setDate(d.getDate() + 7);
        previousDateRef.current = currentDate; scrollActionRef.current = 'jump'; setCurrentDate(d);
    };
    const goToToday = () => { previousDateRef.current = currentDate; scrollActionRef.current = 'jump'; setCurrentDate(new Date()); };
    const handleDateSelect = (date) => { previousDateRef.current = currentDate; scrollActionRef.current = 'jump'; setCurrentDate(date); };
    const handleOpenAddTask = (defaults = {}) => { setNewTaskDefaults(defaults); setShowAddTaskModal(true); };
    const handleNavigateToTask = (task) => { const targetDate = new Date(task.date); setCurrentDate(targetDate); previousDateRef.current = targetDate; scrollActionRef.current = 'jump'; setHighlightedTaskId(task.id); setTimeout(() => setHighlightedTaskId(null), 2000); };

    const handleContextMenu = useCallback((e, task) => { e.preventDefault(); setContextMenu({ position: { x: e.clientX, y: e.clientY }, type: 'TASK', data: task }); }, []);
    const handleContextMenuAction = async (action, task) => {
        switch (action) {
            case 'EDIT': setEditingTask(task); break;
            case 'DELETE': handleDeleteTask(task.id); break;
            case 'TOGGLE_COMPLETE': handleUpdateTask({ ...task, isCompleted: !task.isCompleted }); break;
            case 'DUPLICATE': { const newTask = { ...task, id: `dup-${Date.now()}`, title: `${task.title} (Sao chép)`, seriesId: null, repeat: 'none' }; await handleSaveNewTask({ title: newTask.title, date: newTask.date, categoryId: newTask.categoryId }); break; }
            case 'MOVE_TODAY': { const todayStr = formatDateKey(new Date()); handleUpdateTask({ ...task, date: todayStr, endDate: todayStr }); addToast('Đã dời sang hôm nay 📅', 'success'); break; }
            default: break;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans text-slate-800" onClick={() => { setSelectedTaskId(null); setContextMenu(null); }}>

            <Header
                currentDate={currentDate} prevWeek={prevWeek} nextWeek={nextWeek} goToToday={goToToday} onDateSelect={handleDateSelect} zoomIndex={zoomIndex} onZoomChange={handleZoomChange} onUndo={undo} canUndo={canUndo} onRedo={redo} canRedo={canRedo}
                viewMode={viewMode} setViewMode={setViewMode} calendarView={calendarView} setCalendarView={setCalendarView}
                onOpenAddTask={handleOpenAddTask} tasks={tasks} onNavigateToTask={handleNavigateToTask} categories={categories}
                onOpenSettings={() => setShowAISettings(true)}
            />

            {viewMode === 'list' && (
                <TodoView tasks={tasks} categories={categories} currentDate={currentDate} onUpdateTask={handleUpdateTask} setEditingTask={setEditingTask} onDeleteTask={handleDeleteTask} onOpenAddTask={handleOpenAddTask} quickAddCell={quickAddCell} setQuickAddCell={setQuickAddCell} onConfirmQuickAdd={handleConfirmQuickAdd} onSaveNewTask={handleSaveNewTask} />
            )}

            {/* GỌI MONTH VIEW ĐÃ ĐƯỢC TÁCH RA FILE RIÊNG */}
            {viewMode === 'matrix' && calendarView === 'month' && (
                <MonthView
                    monthGridDays={monthGridDays}
                    currentDate={currentDate}
                    filteredMatrixTasks={filteredMatrixTasks}
                    isMultiDayFeatureEnabled={isMultiDayFeatureEnabled}
                    monthLayoutContext={monthLayoutContext}
                    categories={categories}
                    handleDragOver={handleDragOver}
                    handleDrop={handleDrop}
                    handleOpenAddTask={handleOpenAddTask}
                    handleDragStart={handleDragStart}
                    handleDragEnd={handleDragEnd}
                    setSelectedTaskId={setSelectedTaskId}
                    setEditingTask={setEditingTask}
                    handleContextMenu={handleContextMenu}
                    selectedTaskId={selectedTaskId}
                />
            )}

            {/* CHẾ ĐỘ TUẦN */}
            {viewMode === 'matrix' && calendarView === 'week' && (
                <div className="flex-1 overflow-hidden relative flex flex-col">
                    <div ref={scrollContainerRef} className="flex-1 overflow-auto custom-scrollbar" onScroll={handleScroll}>
                        <div className="inline-block min-w-full relative z-0">

                            <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md flex border-b border-gray-200/60 shadow-sm transition-all">
                                <div className="sticky left-0 z-50 bg-white/95 backdrop-blur-md border-r border-gray-200/60 p-4 flex items-center font-bold text-gray-500 bg-gray-50/50 box-border group" style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
                                    Hạng Mục / Deadline
                                    <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500 group-hover:bg-gray-300 transition-colors z-30" onMouseDown={startResizingSidebar} />
                                </div>
                                {visibleDays.map((day, index) => {
                                    const dayKey = formatDateKey(day); const isTodayDate = dayKey === formatDateKey(new Date());
                                    const isMonday = index % 7 === 0; const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                    return (
                                        <div key={dayKey} style={{ width: dayWidth, minWidth: dayWidth }} className={`flex-shrink-0 p-3 text-center flex flex-col justify-center transition-all duration-200 ease-out relative ${isTodayDate ? 'bg-indigo-50/50' : (isWeekend ? 'bg-slate-50/50' : 'bg-white')}`}>
                                            {isMonday && (<div className="absolute top-0 left-0 right-0 -mt-1 text-[10px] font-bold text-indigo-400 uppercase tracking-widest text-center">Tuần {day.getDate()} - {new Date(day.getTime() + 6 * 86400000).getDate()}/{day.getMonth() + 1}</div>)}
                                            <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isTodayDate ? 'text-indigo-600' : 'text-gray-400'}`}>{getDayName(day)}</span>
                                            <span className={`text-2xl font-light w-10 h-10 flex items-center justify-center mx-auto rounded-full transition-all ${isTodayDate ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-700'}`}>{formatDateDisplay(day)}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {categories.map((category, index) => {
                                const maxTrack = layoutContext.maxTracks[category.id] || 0;
                                const catTasks = filteredMatrixTasks.filter(t => t.categoryId === category.id);
                                const firstVisibleDateStr = formatDateKey(visibleDays[0]);

                                return (
                                    <div key={category.id} className={`flex border-b border-gray-300 group ${draggedCategoryIndex === index ? 'opacity-40 border-dashed border-indigo-400' : ''}`} onDragOver={handleCategoryDragOver} onDrop={(e) => handleCategoryDrop(e, index)}>
                                        <div draggable onDragStart={(e) => handleCategoryDragStart(e, index)} className={`sticky left-0 z-40 bg-white/95 backdrop-blur-sm border-r border-gray-200/60 p-4 flex flex-col justify-center group-hover:bg-gray-50 transition-colors border-l-4 ${category.color.value.replace('bg-', 'border-').split(' ')[0]} shadow-[4px_0_24px_rgba(0,0,0,0.02)]`} style={{ width: sidebarWidth, minWidth: sidebarWidth, borderLeftColor: category.color?.hex || '#ccc' }}>
                                            <div className="font-semibold text-gray-800 flex items-center justify-between group/header overflow-hidden">
                                                <div className="flex items-center gap-2 truncate pr-2 cursor-pointer" onDoubleClick={() => setEditingCategory(category)}>
                                                    <button onClick={(e) => { e.stopPropagation(); toggleCategoryCollapse(category.id); }} className="text-gray-400 hover:text-indigo-600 transition-colors">{category.collapsed ? <ChevronRightIcon size={16} /> : <CornerDownLeft size={16} className="rotate-0" />}</button>
                                                    <span className="truncate hover:underline decoration-dashed underline-offset-4">{category.title}</span>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                                    <button onClick={() => handleDeleteCategory(category.id)} className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                                                    <button onClick={() => setEditingCategory(category)} className={`p-1 rounded hover:bg-gray-200 ${category.color.text}`}><Palette size={14} /></button>
                                                    <div className="text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-700" title="Kéo để sắp xếp"><GripVertical size={14} /></div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 flex items-center gap-2 ml-6"><span className={`w-2 h-2 rounded-full ${category.color.value.split(' ')[0].replace('bg-', 'bg-')}`}></span></div>
                                            <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500 z-30" onMouseDown={startResizingSidebar} />
                                        </div>

                                        {!category.collapsed && visibleDays.map((day) => {
                                            const dateStr = formatDateKey(day);
                                            const isToday = dateStr === formatDateKey(new Date());
                                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                                            let renderItems = [];
                                            if (!isMultiDayFeatureEnabled) {
                                                renderItems = catTasks.filter(t => t.date === dateStr).map(t => ({ type: 'task', task: t }));
                                            } else {
                                                for (let i = 0; i < maxTrack; i++) {
                                                    const taskStartsHere = catTasks.find(t => {
                                                        if (layoutContext.taskTracks[t.id] !== i) return false;
                                                        if (t.date === dateStr) return true;
                                                        if (dateStr === firstVisibleDateStr && t.date < firstVisibleDateStr && (t.endDate || t.date) >= dateStr) return true;
                                                        return false;
                                                    });

                                                    const taskSpansHere = catTasks.find(t => {
                                                        if (layoutContext.taskTracks[t.id] !== i) return false;
                                                        if (t.date < dateStr && (t.endDate || t.date) >= dateStr) {
                                                            if (dateStr === firstVisibleDateStr && t.date < firstVisibleDateStr) return false;
                                                            return true;
                                                        }
                                                        return false;
                                                    });

                                                    if (taskStartsHere) renderItems.push({ type: 'task', task: taskStartsHere });
                                                    else if (taskSpansHere) renderItems.push({ type: 'spacer', task: taskSpansHere });
                                                    else renderItems.push({ type: 'empty' });
                                                }
                                                while (renderItems.length > 0 && renderItems[renderItems.length - 1].type === 'empty') renderItems.pop();
                                            }

                                            return (
                                                <div key={`${category.id}-${dateStr}`} style={{ width: dayWidth, minWidth: dayWidth }} className={`flex-shrink-0 min-h-[120px] p-2 transition-all duration-300 group/cell relative ${isToday ? 'bg-indigo-50/40' : (isWeekend ? 'bg-slate-50/30' : 'bg-transparent')} hover:bg-gray-50/80 cursor-pointer`}
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e) => handleDrop(e, category.id, dateStr)}
                                                    onDoubleClick={(e) => { handleOpenAddTask({ date: dateStr, categoryId: category.id }); }}
                                                    onMouseEnter={() => setHoveredCell({ categoryId: category.id, dateStr })}
                                                    onMouseLeave={() => setHoveredCell(null)}
                                                >
                                                    <div className="flex flex-col gap-2 h-full relative">
                                                        {renderItems.map((item, idx) => {
                                                            if (item.type === 'task') {
                                                                return (
                                                                    <div className="pointer-events-auto h-max" key={item.task.id}>
                                                                        <TaskCard task={item.task} categoryColor={category.color} dayWidth={dayWidth} isSelected={selectedTaskId === item.task.id} isHighlighted={highlightedTaskId === item.task.id} onSelect={setSelectedTaskId} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} onDragStart={handleDragStart} onDragEnd={handleDragEnd} setEditingTask={setEditingTask} onContextMenu={handleContextMenu} renderDate={dateStr} />
                                                                    </div>
                                                                );
                                                            } else if (item.type === 'spacer') {
                                                                return <GhostCard key={`spacer-${item.task.id}`} task={item.task} />;
                                                            } else {
                                                                return <GhostCard key={`empty-${idx}`} empty />;
                                                            }
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {category.collapsed && <div className="flex-1 bg-gray-50/50 flex items-center justify-center text-gray-400 text-sm italic">Đã thu gọn</div>}
                                    </div>
                                )
                            })}

                            <div className="flex border-b border-gray-300 group">
                                <div className="sticky left-0 z-30 bg-white/95 backdrop-blur-sm border-r border-gray-200/60 flex flex-col justify-center border-l-4 border-transparent shadow-[4px_0_24px_rgba(0,0,0,0.02)]" style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
                                    {isCreatingCategory ? (
                                        <div className="p-3 m-2 bg-white border border-indigo-200 rounded-xl shadow-lg animate-in zoom-in-95 duration-200">
                                            <input autoFocus type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCategory(); if (e.key === 'Escape') setIsCreatingCategory(false); }} placeholder="Tên hạng mục..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => setIsCreatingCategory(false)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"><X size={16} /></button>
                                                <button onClick={handleSaveCategory} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1"><Check size={14} /> Lưu</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setIsCreatingCategory(true)} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold transition-colors w-full p-4"><div className="p-1 rounded-md bg-gray-100 group-hover:bg-indigo-100 text-gray-500 group-hover:text-indigo-600 transition-colors"><Plus size={16} /></div><span>Thêm hạng mục mới</span></button>
                                    )}
                                </div>
                                {visibleDays.map((day) => (<div key={`empty-${formatDateKey(day)}`} style={{ width: dayWidth, minWidth: dayWidth }} className="flex-shrink-0 border-r border-transparent bg-gray-50/20" />))}
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {editingTask && <TaskModal task={editingTask} onClose={() => setEditingTask(null)} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} categories={categories} onGenerateRepeats={handleGenerateRepeats} />}
            {showAddTaskModal && <AddTaskModal onClose={() => setShowAddTaskModal(false)} onSave={handleSaveNewTask} categories={categories} initialDate={newTaskDefaults.date} initialCategoryId={newTaskDefaults.categoryId} />}
            {editingCategory && <CategoryModal category={editingCategory} onClose={() => setEditingCategory(null)} onUpdate={handleUpdateCategory} onDelete={handleDeleteCategory} />}
            {showRecurringModal && <RecurringUpdateModal onClose={() => setShowRecurringModal(false)} onConfirm={handleConfirmRecurringUpdate} />}
            {confirmDialog && <ConfirmModal isOpen={true} onClose={() => setConfirmDialog(null)} {...confirmDialog} />}
            {contextMenu && <ContextMenu position={contextMenu.position} type={contextMenu.type} data={contextMenu.data} onClose={() => setContextMenu(null)} onAction={handleContextMenuAction} />}

            {showAISettings && <SettingsAI onClose={() => setShowAISettings(false)} />}
            <AIAssistant
                tasks={tasks}
                categories={categories}
                onSaveNewTask={handleSaveNewTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onNavigateToTask={handleNavigateToTask}
            />

            <ToastContainer toasts={toasts} />
        </div>
    );
}