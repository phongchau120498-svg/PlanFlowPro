import React, { useState } from 'react';
import { Square, CheckSquare, AlignLeft, Repeat, Clock } from 'lucide-react';

const TaskCard = ({ 
    task, categoryColor, isSelected, isHighlighted, 
    onSelect, onUpdate, onDragStart, onDragEnd, setEditingTask,
    onContextMenu 
}) => {
    
    const [dropPosition, setDropPosition] = useState(null);

    const handleToggleComplete = (e) => {
        e.stopPropagation();
        onUpdate({ ...task, isCompleted: !task.isCompleted });
    };

    const handleRightClick = (e) => {
        if (onContextMenu) {
            onContextMenu(e, task);
        }
    };

    return (
        <div 
            draggable 
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
                group relative px-3 py-3 mb-2 rounded-2xl border transition-all duration-200 ease-apple select-none
                
                cursor-grab active:cursor-grabbing
                hover:-translate-y-[2px] hover:shadow-md
                active:scale-105 active:rotate-2 active:shadow-xl active:z-50
                
                ${task.isCompleted 
                    ? 'bg-gray-50/50 border-transparent' 
                    : `${categoryColor.value} shadow-sm backdrop-blur-sm`
                }
                
                ${isSelected ? `ring-2 ring-indigo-500 ring-offset-2 z-10` : ''}
                ${isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2 z-20 scale-105 shadow-xl bg-yellow-50' : ''}
                
                ${dropPosition === 'top' ? 'border-t-2 border-t-indigo-500 pt-[12px] mt-0' : ''}
                ${dropPosition === 'bottom' ? 'border-b-2 border-b-indigo-500 pb-[12px] mb-0' : ''}
            `}
        >
            {/* SỬ DỤNG FLEX-ROW ĐỂ CHIA 2 CỘT */}
            <div className="flex flex-row gap-3">
                
                {/* --- CỘT TRÁI: CHECKBOX + ICONS --- */}
                <div className="flex flex-col items-center gap-1.5 pt-0.5 min-w-[24px]">
                    {/* Checkbox */}
                    <button 
                        onClick={handleToggleComplete} 
                        className={`
                            w-[20px] h-[20px] flex items-center justify-center transition-all duration-300 rounded-md
                            ${task.isCompleted 
                                ? 'scale-100 animate-check-bounce text-gray-400' 
                                : `${categoryColor.text} hover:scale-110 active:scale-90`
                            }
                        `}
                    >
                        {task.isCompleted 
                            ? <CheckSquare size={20} weight="fill" /> 
                            : <Square size={20} />
                        }
                    </button>

                    {/* Các icon nhỏ xếp dọc bên dưới Checkbox */}
                    <div className={`flex flex-col items-center gap-1 transition-opacity duration-300 ${task.isCompleted ? 'opacity-30' : 'opacity-60'}`}>
                        {/* Giờ (nếu có) - Hiển thị text nhỏ */}
                        {task.time && (
                            <div className="text-[9px] font-bold text-indigo-600 bg-white/60 px-0.5 rounded leading-tight text-center tracking-tighter w-full overflow-hidden">
                                {task.time}
                            </div>
                        )}
                        
                        {/* Icon Lặp lại */}
                        {task.repeat !== 'none' && (
                            <Repeat size={12} className="text-indigo-500" />
                        )}

                        {/* Icon Ghi chú */}
                        {task.description && (
                            <AlignLeft size={12} className="text-slate-500" />
                        )}
                    </div>
                </div>
                
                {/* --- CỘT PHẢI: NỘI DUNG --- */}
                <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                    <div className="leading-snug break-words">
                        <span 
                            className={`
                                text-[15px] font-semibold task-title
                                ${task.isCompleted ? 'completed' : 'text-gray-700'}
                            `}
                        >
                            {task.title}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TaskCard;