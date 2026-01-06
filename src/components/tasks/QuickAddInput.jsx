import React, { useState, useRef, useEffect } from 'react';
import { CornerDownLeft } from 'lucide-react';

[cite_start]// [cite: 118, 121]
const QuickAddInput = ({ dateStr, onConfirm, onCancel, categoryColor }) => {
    const inputRef = useRef(null);
    const [title, setTitle] = useState('');
    useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);
    const handleKeyDown = (e) => { if (e.key === 'Enter') onConfirm(title); else if (e.key === 'Escape') onCancel(); };
    return (
        <div className={`p-4 bg-white rounded-2xl border-2 shadow-xl animate-in fade-in zoom-in-95 duration-200 ${categoryColor.text} border-current z-50 relative min-w-[200px]`}>
            <input ref={inputRef} type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-base font-medium text-gray-800 placeholder-gray-400 border-none p-0 focus:ring-0 leading-tight mb-3" placeholder="Nhập tên việc..." onKeyDown={handleKeyDown} />
             <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                 <div className="flex items-center gap-1 text-[10px] opacity-50 font-medium"><CornerDownLeft size={10} /> <span>Enter lưu</span></div>
                 <button onClick={() => onConfirm(title)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 shadow-md font-medium transition-all">Thêm</button>
            </div>
        </div>
    );
};
export default QuickAddInput;