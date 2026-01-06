import React from 'react';
import { CheckSquare, Square, Repeat, X } from 'lucide-react';

[cite_start]// [cite: 47, 48, 57, 58]
const TaskCard = ({ task, categoryColor, dayWidth, isHighlighted, onSelect, onUpdate, onDelete, onDragStart, setEditingTask }) => {
    return (
        <div draggable onDragStart={(e) => onDragStart(e, task)} onDoubleClick={(e) => { e.stopPropagation(); setEditingTask(task); }} style={{ width: `${dayWidth - 12}px` }} 
            className={`group relative p-2.5 rounded-xl border border-transparent cursor-grab active:cursor-grabbing transition-all duration-300 ease-out select-none z-10 ${isHighlighted ? 'ring-2 ring-amber-400 ring-offset-2 scale-105 shadow-xl z-30' : 'hover:z-20 hover:scale-[1.02] hover:shadow-lg'} ${task.isCompleted ? 'bg-gray-50 border-gray-100 opacity-60 grayscale' : `${categoryColor.value} shadow-sm`}`}>
            <div className="flex items-start gap-2.5 overflow-hidden">
                <button onClick={(e) => { e.stopPropagation(); onUpdate({ ...task, isCompleted: !task.isCompleted }); }} className={`flex-shrink-0 transition-colors mt-0.5 rounded-md hover:bg-black/5 p-0.5 ${task.isCompleted ? 'text-gray-400' : categoryColor.text}`}>
                    {task.isCompleted ? <CheckSquare size={16}/> : <Square size={16}/>}
                </button>
                <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold leading-snug break-words ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {task.title}
                    </div>
                    {(task.repeat !== 'none' || task.time) && !task.isCompleted && (
                        <div className="flex items-center gap-2 mt-1.5">
                            {task.time && (<span className="flex items-center gap-0.5 text-[10px] font-mono bg-white/50 px-1 rounded text-gray-600">{task.time}</span>)}
                            {task.repeat !== 'none' && (<span className="flex items-center gap-0.5 text-[10px] opacity-60"><Repeat size={10} /></span>)}
                        </div>
                    )}
                </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="absolute top-1 right-1 p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-all opacity-0 group-hover:opacity-100 scale-90 hover:scale-110 shadow-sm" title="Xóa nhanh"><X size={14} /></button>
        </div>
    );
};
export default TaskCard;