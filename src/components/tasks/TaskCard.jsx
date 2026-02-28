import React, { useState } from 'react';
import { Square, CheckSquare, AlignLeft, Repeat } from 'lucide-react';
import { formatDateKey } from '../../utils/dateHelpers';

// Kích hoạt cờ từ Vercel hoặc URL (?multiday=true)
const isMultiDayEnabled = import.meta.env.VITE_ENABLE_MULTIDAY === 'true' || 
    (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('multiday') === 'true');

const TaskCard = ({ 
    task, categoryColor, dayWidth, isSelected, isHighlighted, 
    onSelect, onUpdate, onDragStart, onDragEnd, setEditingTask,
    onContextMenu 
}) => {
    const [dropPosition, setDropPosition] = useState(null);
    const [localWidth, setLocalWidth] = useState(null); // State phục vụ kéo dãn

    const handleToggleComplete = (e) => {
        e.stopPropagation();
        onUpdate({ ...task, isCompleted: !task.isCompleted });
    };

    const handleRightClick = (e) => {
        if (onContextMenu) onContextMenu(e, task);
    };

    // --- TÍNH TOÁN ĐỘ DÀI NGÀY ---
    let duration = 1;
    if (isMultiDayEnabled && task.endDate) {
        const start = new Date(task.date);
        const end = new Date(task.endDate);
        duration = Math.max(1, Math.round((end - start) / 86400000) + 1);
    }

    // --- XỬ LÝ KÉO DÃN (NHƯ GOOGLE CALENDAR) ---
    const handleResizeStart = (e) => {
        if (!isMultiDayEnabled) return;
        e.preventDefault(); 
        e.stopPropagation(); // Chặn sự kiện nhấc cả thẻ task lên
        
        const startX = e.clientX;
        const startDuration = duration;

        const handleMouseMove = (moveEvent) => {
            const diffX = moveEvent.clientX - startX;
            const diffDays = Math.round(diffX / dayWidth);
            
            // Tính toán số ngày đang nháp, không cho nhỏ hơn 1 ngày
            const tempDuration = Math.max(1, startDuration + diffDays);
            
            // SNAP-TO-GRID: Chiều rộng nhảy theo từng ô chuẩn xác như Calendar
            setLocalWidth(tempDuration * dayWidth - 16);
        };

        const handleMouseUp = (upEvent) => {
            const diffX = upEvent.clientX - startX;
            const diffDays = Math.round(diffX / dayWidth); // Chốt sổ số ngày thay đổi
            const newDuration = Math.max(1, startDuration + diffDays);

            if (newDuration !== startDuration) {
                const newEndDate = new Date(task.date);
                newEndDate.setDate(newEndDate.getDate() + newDuration - 1);
                onUpdate({ ...task, endDate: formatDateKey(newEndDate) });
            }
            
            setLocalWidth(null); // Trả lại quyền quản lý cho CSS gốc
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Chuyển đổi linh hoạt giữa chiều rộng lưu trong DB và chiều rộng lúc đang kéo
    const currentWidth = localWidth !== null ? localWidth : (duration * dayWidth - 16);
    const multiDayStyle = (isMultiDayEnabled && duration > 1) || localWidth !== null ? {
        width: `${currentWidth}px`,
        maxWidth: 'none',
        position: 'relative',
        zIndex: localWidth !== null ? 60 : 30, // Nổi lên trên cùng khi đang thao tác
    } : {
        width: `${dayWidth - 16}px`,
        maxWidth: 'none',
        position: 'relative'
    };

    const finalColorValue = categoryColor?.value || 'bg-white border-gray-200';
    const finalColorText = categoryColor?.text || 'text-gray-700';

    return (
        <div 
            draggable={localWidth === null} // Tắt tính năng kéo nguyên card khi đang kéo dãn ngày
            onDragStart={(e) => onDragStart(e, task)}
            onDragEnd={onDragEnd} 
            onClick={(e) => { e.stopPropagation(); onSelect(task.id); }}
            onDoubleClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
            onContextMenu={handleRightClick}
            
            onDragOver={(e) => {
                e.preventDefault(); e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setDropPosition((e.clientY - rect.top) < (rect.height / 2) ? 'top' : 'bottom');
            }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDropPosition(null); }}
            onDrop={() => setDropPosition(null)}

            className={`
                group relative px-3 py-3 mb-2 rounded-2xl border ease-apple select-none
                cursor-grab active:cursor-grabbing hover:-translate-y-[2px] hover:shadow-md
                active:scale-105 active:rotate-2 active:shadow-xl
                
                ${localWidth !== null ? '!transition-none' : 'transition-all duration-200'}
                
                ${task.isCompleted ? 'bg-gray-50/50 border-transparent' : `${finalColorValue} shadow-sm backdrop-blur-sm`}
                ${isSelected ? `ring-2 ring-indigo-500 ring-offset-2 z-40` : ''}
                ${isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2 z-40 scale-105 shadow-xl bg-yellow-50' : ''}
                
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

            {/* NÚT CẦM KÉO DÃN HIỂN THỊ KHI BẬT CỜ */}
            {isMultiDayEnabled && !task.isCompleted && (
                <div 
                    className="absolute right-0 top-0 bottom-0 w-5 cursor-e-resize hover:bg-black/10 rounded-r-2xl transition-colors flex items-center justify-center group/handle"
                    style={{ zIndex: 60 }} 
                    onMouseDown={handleResizeStart}
                >
                    <div className="w-1 h-5 bg-black/20 rounded-full group-hover/handle:bg-black/40 transition-colors pointer-events-none"></div>
                </div>
            )}
        </div>
    );
};

export default TaskCard;