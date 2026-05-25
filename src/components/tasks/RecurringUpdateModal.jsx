import React from 'react';
import { Repeat } from 'lucide-react';

const RecurringUpdateModal = ({ onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-6 animate-in zoom-in-95 duration-300 ease-apple border border-white/50 text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-sm">
                    <Repeat size={28} />
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-2">Cập nhật chuỗi lặp lại?</h3>
                <p className="text-sm text-gray-500 mb-8 px-4 leading-relaxed">Bạn đang thay đổi một công việc có tính lặp lại. Bạn muốn áp dụng thay đổi này như thế nào?</p>
                
                <div className="space-y-3 font-semibold">
                    <button onClick={() => onConfirm('single')} className="w-full py-3.5 bg-white border-2 border-gray-100 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl text-slate-600 transition-all">
                        Chỉ công việc này
                    </button>
                    <button onClick={() => onConfirm('future')} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95">
                        Tất cả các việc sau này
                    </button>
                </div>

                <button onClick={onClose} className="mt-6 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                    Hủy bỏ
                </button>
            </div>
        </div>
    );
};
export default RecurringUpdateModal;