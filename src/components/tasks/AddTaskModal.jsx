import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { formatDateKey } from '../../utils/dateHelpers';

[cite_start]// [cite: 105, 117]
const AddTaskModal = ({ onClose, onSave, categories, initialDate, initialCategoryId }) => {
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState(initialCategoryId || categories[0]?.id);
    const [date, setDate] = useState(initialDate || formatDateKey(new Date()));
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [newCategoryTitle, setNewCategoryTitle] = useState('');

    const handleSave = () => {
        if (!title.trim()) return;
        onSave({ title, date, categoryId: isNewCategory ? null : categoryId, newCategoryTitle: isNewCategory ? newCategoryTitle : null });
    };

    return (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-0 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col border border-white/50">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">Thêm công việc mới</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Hạng mục</label>
                        {!isNewCategory ? (
                            <div className="relative">
                                <select value={categoryId} onChange={(e) => e.target.value === 'NEW' ? setIsNewCategory(true) : setCategoryId(e.target.value)} className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white text-gray-700 transition-all appearance-none font-semibold text-sm">
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.title}</option>)}
                                    <option disabled>──────────</option>
                                    <option value="NEW">+ Tạo hạng mục mới...</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input type="text" placeholder="Tên hạng mục..." value={newCategoryTitle} onChange={(e) => setNewCategoryTitle(e.target.value)} className="flex-1 px-5 py-3 border border-indigo-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10" autoFocus />
                                <button onClick={() => setIsNewCategory(false)} className="px-5 py-3 text-gray-500 hover:bg-gray-100 rounded-2xl font-semibold">Hủy</button>
                             </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Tên công việc</label>
                        <input type="text" placeholder="Ví dụ: Họp team marketing..." value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-lg font-semibold placeholder-gray-300 transition-all" autoFocus={!isNewCategory} />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Hạn chót</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-gray-700 font-semibold" />
                     </div>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 text-gray-500 hover:bg-white hover:shadow-sm rounded-2xl font-bold transition-all text-sm">Hủy</button>
                    <button onClick={handleSave} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm">Lưu công việc</button>
                </div>
            </div>
        </div>
    );
};
export default AddTaskModal;