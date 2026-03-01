import React from 'react';
import { formatDateKey } from '../../utils/dateHelpers';

const MonthView = ({
    monthGridDays,
    currentDate,
    filteredMatrixTasks,
    isMultiDayFeatureEnabled,
    monthLayoutContext,
    categories,
    handleDragOver,
    handleDrop,
    handleOpenAddTask,
    handleDragStart,
    handleDragEnd,
    setSelectedTaskId,
    setEditingTask,
    handleContextMenu,
    selectedTaskId
}) => {
    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80">
                {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map(d => (
                    <div key={d} className="p-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-widest">{d}</div>
                ))}
            </div>
            <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-gray-200 gap-px overflow-y-auto">
                {monthGridDays.map((day, idx) => {
                    const dateStr = formatDateKey(day);
                    const isToday = dateStr === formatDateKey(new Date());
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                    return (
                        <div
                            key={`${dateStr}-${idx}`}
                            className={`bg-white p-1.5 flex flex-col transition-colors min-h-[90px] ${!isCurrentMonth ? 'bg-gray-50/50' : ''} hover:bg-gray-50/80 cursor-pointer overflow-hidden`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, null, dateStr)}
                            onDoubleClick={() => handleOpenAddTask({ date: dateStr })}
                        >
                            <div className="flex justify-center mb-1">
                                <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-md' : (!isCurrentMonth ? 'text-gray-400' : 'text-slate-700')}`}>
                                    {day.getDate()}
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-[2px] custom-scrollbar pt-1 relative">
                                {(() => {
                                    let renderItems = [];
                                    if (!isMultiDayFeatureEnabled) {
                                        renderItems = filteredMatrixTasks.filter(t => t.date === dateStr).map(t => ({ type: 'task', task: t }));
                                    } else {
                                        for (let i = 0; i < monthLayoutContext.maxTrack; i++) {
                                            const taskStartsHere = filteredMatrixTasks.find(t => monthLayoutContext.taskTracks[t.id] === i && t.date === dateStr);
                                            const taskSpansHere = filteredMatrixTasks.find(t => monthLayoutContext.taskTracks[t.id] === i && t.date < dateStr && (t.endDate || t.date) >= dateStr);

                                            if (taskStartsHere) renderItems.push({ type: 'task', task: taskStartsHere, isStart: true });
                                            else if (taskSpansHere) renderItems.push({ type: 'task', task: taskSpansHere, isStart: false });
                                            else renderItems.push({ type: 'empty' });
                                        }
                                        while (renderItems.length > 0 && renderItems[renderItems.length - 1].type === 'empty') renderItems.pop();
                                    }

                                    return renderItems.map((item, idxx) => {
                                        if (item.type === 'empty') return <div key={`empty-${idxx}`} className="h-[22px]"></div>;

                                        const task = item.task;
                                        const catColorObj = categories.find(c => c.id === task.categoryId)?.color;
                                        
                                        // LOGIC MỚI: NẾU HOÀN THÀNH THÌ CHUYỂN MÀU XÁM, NẾU CHƯA THÌ LẤY MÀU HẠNG MỤC
                                        const isCompleted = task.isCompleted;
                                        const activeBg = catColorObj?.value?.split(' ')[0] || 'bg-gray-200';
                                        const activeText = catColorObj?.text || 'text-slate-700';
                                        
                                        const finalBg = isCompleted ? 'bg-gray-200/60' : activeBg;
                                        const finalText = isCompleted ? 'text-gray-400' : activeText;

                                        const isStart = item.isStart !== undefined ? item.isStart : true;
                                        const isEnd = (task.endDate || task.date) === dateStr;
                                        const isMultiDay = task.endDate && task.endDate !== task.date;

                                        const isEndOfWeek = day.getDay() === 0;
                                        const isStartOfWeek = day.getDay() === 1;

                                        let classes = `text-[10px] font-semibold py-1 px-1.5 h-[22px] truncate cursor-grab active:cursor-grabbing transition-all select-none ${finalBg} ${finalText} ${isCompleted ? 'opacity-60 line-through' : ''}`;

                                        if (isMultiDayFeatureEnabled && isMultiDay) {
                                            if (!isStart && !isStartOfWeek) classes += ' rounded-l-none !ml-[-6px] !pl-[7px] border-l-0';
                                            else classes += ' rounded-l-md';

                                            if (!isEnd && !isEndOfWeek) classes += ' rounded-r-none !mr-[-7px] !pr-[8px] border-r-0 relative z-10';
                                            else classes += ' rounded-r-md';
                                        } else {
                                            classes += ' rounded-md';
                                        }

                                        const showText = !isMultiDay || isStart || isStartOfWeek;

                                        return (
                                            <div
                                                key={task.id} draggable
                                                onDragStart={(e) => handleDragStart(e, task)}
                                                onDragEnd={handleDragEnd}
                                                onClick={(e) => { e.stopPropagation(); setSelectedTaskId(task.id); }}
                                                onDoubleClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                                                onContextMenu={(e) => handleContextMenu(e, task)}
                                                className={classes} title={task.title}
                                            >
                                                {showText ? task.title : '\u00A0'}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MonthView;