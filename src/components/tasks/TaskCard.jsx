import React, { useState } from 'react';
import { Square, CheckSquare, AlignLeft, Repeat } from 'lucide-react';
import { formatDateKey } from '../../utils/dateHelpers';

const isMultiDayEnabled = import.meta.env.VITE_ENABLE_MULTIDAY === 'true' || 
    (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('multiday') === 'true');

const parseDateStr = (dateStr) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const TaskCard = ({ 
    task, categoryColor, dayWidth, isSelected, isHighlighted, 
    onSelect, onUpdate, onDragStart, onDragEnd, setEditingTask,
    onContextMenu, renderDate 
}) => {
    const [dropPosition, setDropPosition] = useState(null);
    const [isResizing, setIsResizing] = useState(false); 
    const [localDuration, setLocalDuration] = useState(null); 

    const handleToggleComplete = (e) => { e.stopPropagation(); onUpdate({ ...task, isCompleted: !task.isCompleted }); };
    const handleRightClick = (e) => { if (onContextMenu) onContextMenu(e, task); };

    let dbDuration = 1;
    if (isMultiDayEnabled && task.endDate) {
        const start = parseDateStr(renderDate || task.date);
        const end = parseDateStr(task.endDate);
        dbDuration = Math.max(1, Math.round((end - start) / 86400000) + 1);
    }

    const handleResizeStart = (e) => {
        if (!isMultiDayEnabled) return;
        e.preventDefault(); e.stopPropagation(); 
        
        setIsResizing(true); 
        const startX = e.clientX;
        const startDuration = dbDuration;

        const handleMouseMove = (moveEvent) => {
            const diffX = moveEvent.clientX - startX;
            const diffDays = Math.round(diffX / dayWidth);
            setLocalDuration(Math.max(1, startDuration + diffDays));
        };

        const handleMouseUp = (upEvent) => {
            const diffX = upEvent.clientX - startX;
            const diffDays = Math.round(diffX / dayWidth);
            const finalDuration = Math.max(1, startDuration + diffDays);

            if (finalDuration !== startDuration) {
                const newEndDate = parseDateStr(renderDate || task.date);
                newEndDate.setDate(newEndDate.getDate() + finalDuration - 1);
                onUpdate({ ...task, endDate: formatDateKey(newEndDate) });
            }
            
            setIsResizing(false); setLocalDuration(null); 
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const currentDuration = localDuration !== null ? localDuration : dbDuration;
    
    // TỐI ƯU: Đã hạ Z-index xuống 10 & 30 để chắc chắn luôn "luồn" dưới Sidebar (Z-40)
    const multiDayStyle = (isMultiDayEnabled && currentDuration > 1) || isResizing ? {
        width: `${currentDuration * dayWidth - 16}px`,
        maxWidth: 'none',
        position: 'relative',
        zIndex: isResizing ? 30 : 10, 
    } : {
        width: `${dayWidth - 16}px`,
        maxWidth: 'none',
        position: 'relative'
    };

    const finalColorValue = categoryColor?.value || 'bg-white border-gray-200';
    const finalColorText = categoryColor?.text || 'text-gray-700';

    return (
        <div 
            draggable={!isResizing} 
            onDragStart={(e) => { if (!isResizing) onDragStart(e, task); }}
            onDragEnd={onDragEnd} 
            onClick={(e) => { e.stopPropagation(); onSelect(task.id); }}
            onDoubleClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
            onContextMenu={handleRightClick}
            
            // Xóa stopPropagation để cho phép Drop rơi xuống nền lưới
            onDragOver={(e) => {
                e.preventDefault(); 
                const rect = e.currentTarget.getBoundingClientRect();
                setDropPosition((e.clientY - rect.top) < (rect.height / 2) ? 'top' : 'bottom');
            }}
            onDragLeave={(e) => { e.preventDefault(); setDropPosition(null); }}
            onDrop={() => setDropPosition(null)}

            className={`
                group relative px-3 py-3 mb-2 rounded-2xl border ease-apple select-none
                
                ${isResizing 
                    ? '!scale-100 !rotate-0 ring-2 ring-indigo-400 shadow-xl opacity-95 transition-none' 
                    : 'transition-all duration-200 cursor-grab active:cursor-grabbing hover:-translate-y-[2px] hover:shadow-md active:scale-105 active:rotate-2 active:shadow-xl'
                }
                
                ${task.isCompleted ? 'bg-gray-50/50 border-transparent' : `${finalColorValue} shadow-sm backdrop-blur-sm`}
                ${isSelected && !isResizing ? `ring-2 ring-indigo-500 ring-offset-2 z-40` : ''}
                ${isHighlighted && !isResizing ? 'ring-4 ring-yellow-400 ring-offset-2 z-40 scale-105 shadow-xl bg-yellow-50' : ''}
                
                ${dropPosition === 'top' ? 'border-t-2 border-t-indigo-500 pt-[12px] mt-0' : ''}
                ${dropPosition === 'bottom' ? 'border-b-2 border-b-indigo-500 pb-[12px] mb-0' : ''}
            `}
            style={multiDayStyle}
        >
            <div className="flex flex-row gap-3">
                <div className="flex flex-col items-center gap-1.5 pt-0.5 min-w-[24px]">
                    <button onClick={handleToggleComplete} className={`w-[20px] h-[20px] flex items-center justify-center transition-all duration-300 rounded-md ${task.isCompleted ? 'scale-100 animate-check-bounce text-gray-400' : `${finalColorText} hover:scale-110 active:scale-90`}`}>
                        {task.isCompleted ? <CheckSquare size={20} weight="fill" /> : <Square size={20} />}
                    </button>
                    <div className={`flex flex-col items-center gap-1 transition-opacity duration-300 ${task.isCompleted ? 'opacity-30' : 'opacity-60'}`}>
                        {task.time && <div className="text-[9px] font-bold text-indigo-600 bg-white/60 px-0.5 rounded leading-tight text-center tracking-tighter w-full overflow-hidden">{task.time}</div>}
                        {task.repeat !== 'none' && <Repeat size={12} className="text-indigo-500" />}
                        {task.description && <AlignLeft size={12} className="text-slate-500" />}
                    </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col pt-0.5 pointer-events-none">
                    <div className="leading-snug break-words">
                        <span className={`text-[15px] font-semibold task-title ${task.isCompleted ? 'completed' : 'text-gray-700'}`}>
                            {task.title}
                        </span>
                    </div>
                </div>
            </div>

            {isMultiDayEnabled && !task.isCompleted && (
                <div className="absolute right-0 top-0 bottom-0 w-5 cursor-e-resize hover:bg-black/10 rounded-r-2xl transition-colors flex items-center justify-center z-[100]" onMouseDown={handleResizeStart}>
                    <div className="w-1 h-5 bg-black/20 rounded-full transition-colors pointer-events-none"></div>
                </div>
            )}
        </div>
    );
};

export default TaskCard;