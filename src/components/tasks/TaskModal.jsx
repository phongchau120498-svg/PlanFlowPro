import React, { useState, useEffect } from 'react';
import { CalendarPlus, Trash2, X, CheckSquare, Square, Repeat, Clock, AlignLeft, Save } from 'lucide-react';
import { generateGoogleCalendarLink } from '../../utils/dateHelpers';
import { COLORS } from '../../constants/theme';

[cite_start]// [cite: 123, 140]
const TaskModal = ({ task, onClose, onUpdate, onDelete, categories, onGenerateRepeats }) => {
  if (!task) return null;
  const [localTask, setLocalTask] = useState(task);
  const category = categories.find(c => c.id === localTask.categoryId);
  const currentCategoryColor = category ? category.color : COLORS[0];

  useEffect(() => { setLocalTask(task); }, [task.id]);

  const handleSaveAndClose = () => {
      if (localTask.repeat !== task.repeat && localTask.repeat !== 'none') {
           onGenerateRepeats(localTask, localTask.repeat);
      }
      onUpdate(localTask);
      onClose();
  };

  useEffect(() => {
      const handleKeyDown = (e) => {
          if (e.key === 'Escape') handleSaveAndClose();
          if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') handleSaveAndClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localTask]);

  const handleAddToGoogleCalendar = () => {
    const url = generateGoogleCalendarLink(localTask);
    window.open(url, '_blank');
  };

  const handleRepeatChange = (e) => {
      const newRepeat = e.target.value;
      setLocalTask(prev => ({ ...prev, repeat: newRepeat }));
      if (newRepeat !== 'none') {
          onGenerateRepeats(localTask, newRepeat);
      }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={handleSaveAndClose}>
      <div className="bg-white w-full max-w-2xl h-[85vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/50" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentCategoryColor.value} border shadow-sm`}>{category?.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAddToGoogleCalendar} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Google Calendar"><CalendarPlus size={20} /></button>
             <button onClick={() => { onDelete(localTask.id); onClose(); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Xóa"><Trash2 size={20} /></button>
            <button onClick={handleSaveAndClose} className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-200 rounded-xl transition-all"><X size={22} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           <div className="mb-6 flex items-center justify-between">
                <button onClick={() => setLocalTask(prev => ({...prev, isCompleted: !prev.isCompleted}))} 
                className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border shadow-sm ${localTask.isCompleted ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>
                    {localTask.isCompleted ? <CheckSquare size={20}/> : <Square size={20}/>}
                    {localTask.isCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                </button>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                    <Repeat size={16} className="text-indigo-500" />
                    <select value={localTask.repeat || 'none'} onChange={handleRepeatChange} className="text-sm bg-transparent border-none focus:ring-0 text-gray-600 font-medium cursor-pointer">
                        <option value="none">Không lặp lại</option>
                        <option value="daily">Hàng ngày</option>
                        <option value="weekly">Hàng tuần</option>
                        <option value="monthly">Hàng tháng</option>
                    </select>
                </div>
           </div>

          <input type="text" value={localTask.title} onChange={(e) => setLocalTask(prev => ({...prev, title: e.target.value}))} className={`w-full text-4xl font-bold border-none focus:ring-0 placeholder-gray-300 p-0 mb-8 bg-transparent tracking-tight leading-tight ${localTask.isCompleted ? 'text-gray-400 line-through decoration-2' : 'text-gray-900'}`} placeholder="Tên công việc..." autoFocus />

          <div className="flex items-center gap-6 mb-8 text-sm border-b border-gray-100 pb-6">
            <div className="flex items-center gap-3 text-gray-500 font-medium">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Clock size={18} /></div>
                <input type="date" value={localTask.date} onChange={(e) => setLocalTask(prev => ({...prev, date: e.target.value}))} className="bg-transparent border-none focus:ring-0 p-0 text-gray-800 font-bold" />
           </div>
          </div>

          <div className="flex items-start gap-4 text-gray-500">
              <div className="mt-1 p-2 bg-gray-50 rounded-lg text-gray-400"><AlignLeft size={18} /></div>
              <div className="flex-1">
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Chi tiết</span>
               <textarea value={localTask.description} onChange={(e) => setLocalTask(prev => ({...prev, description: e.target.value}))} className="w-full min-h-[300px] p-0 text-gray-700 bg-transparent border-none focus:ring-0 text-base leading-relaxed placeholder-gray-300 resize-none" placeholder="Nhập chi tiết công việc, ghi chú, hoặc danh sách việc cần làm..." />
              </div>
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
           <button onClick={handleSaveAndClose} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] active:scale-[0.98]"><Save size={18}/> Lưu thay đổi</button>
        </div>
      </div>
    </div>
  );
};
export default TaskModal;