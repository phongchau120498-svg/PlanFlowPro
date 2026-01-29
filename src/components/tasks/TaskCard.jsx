import React, { useState } from 'react';
import { Square, CheckSquare, AlignLeft, Repeat } from 'lucide-react';

const TaskCard = ({ task, categoryColor, isSelected, isHighlighted, onSelect, onUpdate, onDragStart, onDragEnd, setEditingTask }) => {
    
    const [dropPosition, setDropPosition] = useState(null);

    const handleToggleComplete = (e) => {
        e.stopPropagation();
        onUpdate({ ...task, isCompleted: !task.isCompleted });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation(); 
        
        const rect = e.currentTarget.getBoundingClientRect();
        const midpoint = rect.height / 2;
        const hoverY = e.clientY - rect.top; 

        if (hoverY < midpoint) {
            setDropPosition('top');
        } else {
            setDropPosition('bottom');
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDropPosition(null); 
    };

    const handleDrop = (e) => {
        setDropPosition(null);
    };

    return (
        <div 
            draggable 
            onDragStart={(e) => onDragStart(e, task)}
            onDragEnd={onDragEnd} 
            onClick={(e) => { e.stopPropagation(); onSelect(task.id); }}
            onDoubleClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}

            className={`
                group relative px-3.5 py-3 mb-2 rounded-2xl border transition-all duration-300 ease-out select-none
                cursor-grab active:cursor-grabbing
                
                ${/* Hiệu ứng hover: Nhấc nhẹ thẻ lên + Bóng đổ đậm hơn */ 'hover:-translate-y-0.5 hover:shadow-md'}
                
                ${task.isCompleted 
                    // Task hoàn thành: Chìm vào nền, trong suốt hơn
                    ? 'bg-gray-50/80 border-transparent opacity-60 grayscale' 
                    // Task thường: Dùng màu nền nhẹ, border trong suốt để shadow nổi bật
                    : `${categoryColor.value} border-transparent shadow-sm`
                }
                
                ${/* Viền khi chọn */ isSelected ? `ring-2 ring-indigo-500 ring-offset-2 z-10` : ''}
                ${/* Viền khi highlight (tìm kiếm/di chuyển) */ isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2 z-20 scale-105 shadow-xl bg-yellow-50' : ''}
                
                ${dropPosition === 'top' ? 'border-t-2 border-t-indigo-500 pt-[12px] mt-0' : ''}
                ${dropPosition === 'bottom' ? 'border-b-2 border-b-indigo-500 pb-[12px] mb-0' : ''}
                transition-[border,padding,margin,transform,box-shadow]
            `}
        >
            <div className="flex items-start gap-3 pointer-events-none">
                <button 
                    onClick={handleToggleComplete} 
                    className={`
                        mt-0.5 min-w-[18px] h-[18px] flex items-center justify-center transition-transform duration-300 pointer-events-auto
                        ${task.isCompleted ? 'text-gray-400' : `${categoryColor.text} hover:scale-110 active:scale-75`}
                    `}
                >
                    {task.isCompleted 
                        ? <CheckSquare size={18} className="animate-in zoom-in spin-in-180 duration-300" /> 
                        : <Square size={18} />
                    }
                </button>
                
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <span className={`text-sm font-semibold leading-snug transition-all duration-300 ${task.isCompleted ? 'text-gray-500 line-through decoration-gray-300 decoration-2' : 'text-gray-700'}`}>
                        {task.title}
                    </span>
                    
                    {(task.description || task.repeat !== 'none') && (
                         <div className="flex items-center gap-2 opacity-60">
                            {task.repeat !== 'none' && <Repeat size={10} className="text-indigo-500" />}
                            {task.description && <AlignLeft size={10} />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskCard;