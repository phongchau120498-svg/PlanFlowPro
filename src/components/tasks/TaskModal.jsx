import React, { useState, useEffect, useRef } from 'react';
import { CalendarPlus, Trash2, X, CheckSquare, Square, Repeat, Calendar, AlignLeft, Save, List, ListOrdered } from 'lucide-react';
import { generateGoogleCalendarLink } from '../../utils/dateHelpers';
import { COLORS } from '../../constants/theme';

const TaskModal = ({ task, onClose, onUpdate, onDelete, categories, onGenerateRepeats }) => {
  if (!task) return null;
  const [localTask, setLocalTask] = useState(task);
  const descriptionRef = useRef(null);

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

  // --- XỬ LÝ PHÍM TẮT CHUNG (ESC & ENTER TOÀN CỤC) ---
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
            return;
        }
        // Phím Enter toàn cục:
        // - Nếu đang ở ô Title (Tiêu đề): Đã có hàm handleTitleKeyDown xử lý riêng bên dưới.
        // - Nếu đang ở ô Description (Ghi chú): Bỏ qua để cho phép xuống dòng.
        // - Các trường hợp khác (Date, Select...): Bấm Enter là Lưu.
        if (e.key === 'Enter') {
            if (e.target.tagName === 'TEXTAREA') return; // Bỏ qua textarea (Title & Desc) để xử lý riêng
            e.preventDefault();
            handleSaveAndClose();
        }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [localTask]); 

  const handleAddToGoogleCalendar = () => {
    const url = generateGoogleCalendarLink(localTask);
    window.open(url, '_blank');
  };

  const handleRepeatChange = (e) => {
      setLocalTask(prev => ({ ...prev, repeat: e.target.value }));
  };

  // --- XỬ LÝ RIÊNG CHO Ô TIÊU ĐỀ: ENTER LÀ LƯU ---
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Chặn hành vi xuống dòng mặc định của textarea
      handleSaveAndClose(); // Lưu ngay lập tức
    }
  };

  // --- LOGIC THÔNG MINH CHO Ô GHI CHÚ (Giữ nguyên) ---
  const handleDescriptionKeyDown = (e) => {
      if (e.key === 'Enter') {
          const textarea = descriptionRef.current;
          if (!textarea) return;

          const start = textarea.selectionStart;
          const value = localTask.description || '';
          
          const lastNewLine = value.lastIndexOf('\n', start - 1);
          const currentLineStart = lastNewLine + 1;
          const currentLineText = value.substring(currentLineStart, start);

          const match = currentLineText.match(/^(\s*)(• |\d+\. )/);

          if (match) {
              const fullPrefix = match[0]; 
              const content = currentLineText.substring(fullPrefix.length);

              if (!content.trim()) {
                  e.preventDefault();
                  const newValue = value.substring(0, currentLineStart) + value.substring(start);
                  setLocalTask(prev => ({...prev, description: newValue}));
                  setTimeout(() => {
                      textarea.selectionStart = textarea.selectionEnd = currentLineStart;
                  }, 0);
                  return;
              }

              e.preventDefault();
              let nextPrefix = match[2]; 
              if (nextPrefix.match(/\d+\./)) {
                  const num = parseInt(nextPrefix);
                  nextPrefix = `${num + 1}. `;
              }

              const insertText = '\n' + match[1] + nextPrefix; 
              const newValue = value.substring(0, start) + insertText + value.substring(textarea.selectionEnd);
              
              setLocalTask(prev => ({...prev, description: newValue}));
              setTimeout(() => {
                  textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
                  textarea.scrollTop = textarea.scrollHeight; 
              }, 0);
          }
      }
  };

  const toggleLineFormat = (type) => { 
      const textarea = descriptionRef.current;
      if (!textarea) return;
      // ... (Logic format giữ nguyên) ...
      const start = textarea.selectionStart;
      const value = localTask.description || '';
      const lastNewLine = value.lastIndexOf('\n', start - 1);
      const currentLineStart = lastNewLine + 1;
      let nextNewLine = value.indexOf('\n', start);
      if (nextNewLine === -1) nextNewLine = value.length;

      const currentLineContent = value.substring(currentLineStart, nextNewLine);
      const match = currentLineContent.match(/^(\s*)(• |\d+\. )(.*)/);
      
      let newContent = currentLineContent;
      let newPrefix = type === 'bullet' ? '• ' : '1. ';

      if (match) {
          const currentPrefix = match[2];
          const textBody = match[3] || '';
          if ((type === 'bullet' && currentPrefix === '• ') || (type === 'number' && currentPrefix.match(/\d+\./))) {
               newContent = match[1] + textBody;
          } else {
               newContent = match[1] + newPrefix + textBody;
          }
      } else {
          newContent = newPrefix + currentLineContent;
      }

      const newValue = value.substring(0, currentLineStart) + newContent + value.substring(nextNewLine);
      setLocalTask(prev => ({...prev, description: newValue}));
      setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = currentLineStart + newContent.length;
      }, 0);
  };

  const ToolbarButton = ({ icon: Icon, onClick, tooltip }) => (
      <button onClick={onClick} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title={tooltip} type="button">
          <Icon size={16} strokeWidth={2.5} />
      </button>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity duration-300" />
      <div className="relative bg-[#FBFBFD] w-full max-w-2xl h-auto max-h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 ease-apple border border-white/50 ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 bg-white/60 backdrop-blur-xl sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest ${currentCategoryColor.value} border border-black/5 shadow-sm`}>
                  {category?.title}
              </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAddToGoogleCalendar} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"><CalendarPlus size={20} /></button>
             <button onClick={() => { onDelete(localTask.id); onClose(); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"><Trash2 size={20} /></button>
            <button onClick={onClose} className="ml-2 p-2 bg-gray-200/50 hover:bg-gray-300/50 text-gray-500 rounded-full transition-all"><X size={20} /></button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar space-y-6">
           <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => setLocalTask(prev => ({...prev, isCompleted: !prev.isCompleted}))} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border shadow-sm active:scale-95 duration-200 ${localTask.isCompleted ? 'bg-gray-100 text-gray-500 border-transparent' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}>
                    {localTask.isCompleted ? <CheckSquare size={18}/> : <Square size={18}/>}
                    {localTask.isCompleted ? 'Đã xong' : 'Đánh dấu xong'}
                </button>
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-gray-200/60 shadow-sm group hover:border-slate-300 transition-colors">
                    <Repeat size={16} className="text-slate-500" />
                    <select value={localTask.repeat || 'none'} onChange={handleRepeatChange} className="text-sm bg-transparent border-none outline-none focus:ring-0 text-slate-700 font-semibold cursor-pointer py-0 pl-0 pr-8">
                        <option value="none">Không lặp lại</option>
                        <option value="daily">Mỗi ngày</option>
                        <option value="weekly">Mỗi tuần</option>
                        <option value="monthly">Mỗi tháng</option>
                    </select>
                </div>
           </div>

          {/* Ô TIÊU ĐỀ: Thêm onKeyDown để chặn xuống dòng */}
          <textarea 
            value={localTask.title} 
            onChange={(e) => setLocalTask(prev => ({...prev, title: e.target.value}))} 
            onKeyDown={handleTitleKeyDown} // <--- QUAN TRỌNG: Gắn hàm xử lý riêng
            className={`w-full text-3xl sm:text-4xl font-bold border-none outline-none focus:ring-0 placeholder-gray-300 p-0 bg-transparent tracking-tight resize-none overflow-hidden ${localTask.isCompleted ? 'text-gray-400 line-through' : 'text-slate-900'}`} 
            placeholder="Tên công việc..." 
            rows={1}
            autoFocus 
            onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
          />

          <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                    <Calendar size={20} />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Hạn chót</label>
                    <input type="date" value={localTask.date} onChange={(e) => setLocalTask(prev => ({...prev, date: e.target.value}))} className="bg-transparent border-none outline-none focus:ring-0 p-0 text-slate-700 font-bold text-lg cursor-pointer font-sans" />
                </div>
          </div>

          <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-400">
                  <AlignLeft size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Ghi chú</span>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm focus-within:ring-2 focus-within:ring-slate-200 focus-within:border-slate-400 transition-all p-4">
                 <div className="flex items-center gap-1 pb-2 mb-2 border-b border-gray-100/80">
                    <ToolbarButton icon={List} onClick={() => toggleLineFormat('bullet')} tooltip="Gạch đầu dòng" />
                    <ToolbarButton icon={ListOrdered} onClick={() => toggleLineFormat('number')} tooltip="Đánh số" />
                 </div>
                 <textarea 
                    ref={descriptionRef}
                    value={localTask.description} 
                    onChange={(e) => setLocalTask(prev => ({...prev, description: e.target.value}))} 
                    onKeyDown={handleDescriptionKeyDown} 
                    className="w-full min-h-[400px] p-0 text-slate-700 bg-transparent border-none outline-none focus:ring-0 text-base leading-relaxed placeholder-gray-300 resize-none" 
                    placeholder="Nhập chi tiết công việc..." 
                 />
              </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-200/50 bg-white/80 backdrop-blur-md flex justify-end shrink-0">
           <button onClick={handleSaveAndClose} className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-black font-bold shadow-lg shadow-slate-300 transition-all transform active:scale-[0.98]">
               <Save size={18}/> Lưu thay đổi
           </button>
        </div>
      </div>
    </div>
  );
};
export default TaskModal;