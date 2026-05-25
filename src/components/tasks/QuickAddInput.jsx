import React, { useState, useRef, useEffect } from 'react';
import { CornerDownLeft } from 'lucide-react';

const QuickAddInput = ({ dateStr, onConfirm, onCancel, categoryColor }) => {
    const inputRef = useRef(null);
    const [title, setTitle] = useState('');
    
    useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);
    
    const handleKeyDown = (e) => { 
        if (e.key === 'Enter') onConfirm(title); 
        else if (e.key === 'Escape') onCancel(); 
    };

    return (
        <div className={`p-1 bg-white rounded-2xl shadow-xl ring-4 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200 z-50 relative min-w-[220px]`}>
            <div className={`p-3 rounded-xl ${categoryColor.value.split(' ')[0]} bg-opacity-30`}>
                <input 
                    ref={inputRef} 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="w-full text-sm font-semibold text-slate-800 placeholder-slate-400 border-none outline-none p-0 bg-transparent focus:ring-0 leading-tight" 
                    placeholder="Nhập việc cần làm..." 
                    onKeyDown={handleKeyDown} 
                />
            </div>
             <div className="flex items-center justify-between px-2 pt-2 pb-1">
                 <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                     <CornerDownLeft size={10} /> Enter
                 </div>
                 <button onClick={() => onConfirm(title)} className="text-[10px] font-bold bg-slate-900 text-white px-2.5 py-1 rounded-lg hover:bg-black shadow-md shadow-slate-200 transition-all">Thêm</button>
            </div>
        </div>
    );
};
export default QuickAddInput;