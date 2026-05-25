import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Palette } from 'lucide-react';
import { COLORS } from '../../constants/theme';

const CategoryModal = ({ category, onClose, onUpdate, onDelete }) => {
    const [title, setTitle] = useState(category.title);
    const [selectedColor, setSelectedColor] = useState(category.color);

    const handleSave = () => {
        if (!title.trim()) return;
        onUpdate({ ...category, title: title.trim(), color: selectedColor });
        onClose();
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter') handleSave();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [title, selectedColor]);

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-[2px] transition-opacity" onClick={onClose} />
            
            <div className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-6 animate-in zoom-in-95 duration-300 ease-apple border border-white/50 ring-1 ring-black/5">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Palette size={20} className="text-slate-700"/>
                        Sửa hạng mục
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
                </div>

                <div className="space-y-6">
                    {/* INPUT: Tự nhiên, không viền, không box */}
                    <div className="bg-transparent px-2 py-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tên hiển thị</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            className="w-full bg-transparent border-none outline-none p-0 focus:ring-0 text-slate-900 font-black text-3xl" 
                            autoFocus 
                        />
                        <div className="h-0.5 w-full bg-gray-100 mt-2"></div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest px-1">Màu sắc chủ đạo</label>
                        <div className="grid grid-cols-6 gap-3">
                            {COLORS.map((color, index) => (
                                <button 
                                    key={index} 
                                    onClick={() => setSelectedColor(color)} 
                                    className={`w-8 h-8 rounded-full transition-all duration-200 relative flex items-center justify-center 
                                    ${color.value.split(' ')[0]} 
                                    ${selectedColor.name === color.name ? 'ring-2 ring-offset-2 ring-slate-800 scale-110 shadow-md' : 'hover:scale-110 hover:shadow-sm'}`} 
                                    title={color.name}
                                >
                                    {selectedColor.name === color.name && <Check size={12} className={color.text} strokeWidth={3} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-3 pt-6 border-t border-gray-100">
                    <button onClick={() => { onDelete(category.id); }} className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors" title="Xóa"><Trash2 size={20} /></button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black shadow-lg shadow-slate-300 transition-all active:scale-95">Lưu thay đổi</button>
                </div>
            </div>
        </div>
    );
};
export default CategoryModal;