import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Calendar, Tag, Type, AlignLeft } from 'lucide-react';
import { formatDateKey } from '../../utils/dateHelpers';

const AddTaskModal = ({ onClose, onSave, categories, initialDate, initialCategoryId }) => {
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState(initialCategoryId || categories[0]?.id);
    const [date, setDate] = useState(initialDate || formatDateKey(new Date()));
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [newCategoryTitle, setNewCategoryTitle] = useState('');

    const handleSave = () => {
        if (!title.trim()) return;
        onSave({ 
            title, 
            date, 
            categoryId: isNewCategory ? null : categoryId, 
            newCategoryTitle: isNewCategory ? newCategoryTitle : null 
        });
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter') handleSave();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [title, date, categoryId, newCategoryTitle, isNewCategory]);

    const InputField = ({ icon: Icon, children, className = "" }) => (
        // Dùng ring mềm thay vì border cứng
        <div className={`group flex items-center gap-3 bg-gray-100/80 hover:bg-gray-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-200 focus-within:shadow-lg transition-all duration-300 ease-out rounded-2xl px-4 py-3.5 ${className}`}>
            <Icon size={18} className="text-gray-400 group-focus-within:text-slate-800 transition-colors" />
            {children}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:px-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity duration-300" onClick={onClose} />
            
            <div className="relative bg-white w-full max-w-[500px] sm:rounded-[32px] rounded-t-[32px] shadow-2xl transform transition-all animate-in slide-in-from-bottom-10 fade-in duration-300 overflow-hidden flex flex-col">
                
                <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                </div>

                <div className="flex items-center justify-between px-8 pt-6 pb-2">
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Việc mới</h2>
                    <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-500 p-2 rounded-full transition-all active:scale-90"><X size={20} /></button>
                </div>

                <div className="px-8 py-6 space-y-5">
                    <div className="relative">
                        {/* INPUT TIÊU ĐỀ: Đã thêm outline-none và border-none */}
                        <input 
                            type="text" 
                            placeholder="Bạn cần làm gì?" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            className="w-full text-2xl font-semibold placeholder-gray-300 text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0"
                            autoFocus={!isNewCategory} 
                        />
                    </div>

                    <div className="h-px w-full bg-gray-100"></div>

                    <InputField icon={Tag}>
                        {!isNewCategory ? (
                            <div className="relative w-full">
                                <select value={categoryId} onChange={(e) => e.target.value === 'NEW' ? setIsNewCategory(true) : setCategoryId(e.target.value)} className="w-full bg-transparent border-none outline-none text-slate-700 font-medium appearance-none focus:ring-0 cursor-pointer py-0">
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.title}</option>)}
                                    <option disabled>──────────</option>
                                    <option value="NEW">+ Tạo hạng mục mới...</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        ) : (
                            <div className="flex gap-2 w-full animate-in fade-in slide-in-from-left-2">
                                <input type="text" placeholder="Tên hạng mục..." value={newCategoryTitle} onChange={(e) => setNewCategoryTitle(e.target.value)} className="flex-1 bg-transparent border-none outline-none focus:ring-0 p-0 font-medium" autoFocus />
                                <button onClick={() => setIsNewCategory(false)} className="text-xs font-bold text-gray-400 hover:text-gray-600 bg-white px-2 py-1 rounded-md shadow-sm">Hủy</button>
                            </div>
                        )}
                    </InputField>

                    <InputField icon={Calendar}>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent border-none outline-none text-slate-700 font-medium focus:ring-0 p-0 cursor-pointer" />
                    </InputField>
                </div>

                <div className="px-8 pb-8 pt-4 flex justify-end items-center gap-3 bg-gray-50/50 border-t border-gray-100">
                    <button onClick={handleSave} className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-300 transform active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
                        Lưu công việc
                    </button>
                </div>
            </div>
        </div>
    );
};
export default AddTaskModal;