import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmLabel = "Xác nhận", 
    cancelLabel = "Hủy bỏ", 
    isDangerous = false 
}) => {
    // --- SỬA LỖI QUAN TRỌNG: Di chuyển useEffect lên đầu ---
    // Hook phải luôn được gọi trước khi return để đảm bảo cleanup hoạt động đúng
    
    useEffect(() => {
        if (!isOpen) return; 

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation(); // Ngăn không cho sự kiện lọt xuống dưới
                onConfirm();
            }
        };

        // Thêm sự kiện
        window.addEventListener('keydown', handleKeyDown);

        // Dọn dẹp sự kiện ngay khi Modal đóng (Quan trọng!)
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, onConfirm]);

    // --- CHECK ĐIỀU KIỆN HIỂN THỊ Ở DƯỚI CÙNG ---
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200" onClick={onClose} />
            
            <div className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-6 animate-in zoom-in-95 duration-300 ease-apple border border-white/50 text-center ring-1 ring-black/5">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm 
                    ${isDangerous ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'}`}>
                    <AlertTriangle size={32} strokeWidth={2.5} />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
                
                <p className="text-sm text-slate-500 mb-8 px-2 leading-relaxed whitespace-pre-line font-medium">
                    {message}
                </p>
                
                <div className="flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-slate-600 rounded-2xl font-bold transition-all active:scale-95"
                    >
                        {cancelLabel}
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className={`flex-1 py-3.5 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
                            ${isDangerous 
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-200' 
                                : 'bg-slate-900 hover:bg-black shadow-slate-300'
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;