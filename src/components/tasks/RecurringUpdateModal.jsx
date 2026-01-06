import React from 'react';
import { Repeat } from 'lucide-react';

[cite_start]// [cite: 141, 143]
const RecurringUpdateModal = ({ onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600"><Repeat size={24} /></div>
                    <h3 className="text-lg font-bold text-gray-800">Cập nhật chuỗi công việc</h3>
                    <p className="text-sm text-gray-500 mt-2">Thay đổi này áp dụng cho...</p>
                </div>
                <div className="space-y-3">
                    <button onClick={() => onConfirm('single')} className="w-full py-3 px-4 bg-white border border-gray-200 hover:border-indigo-500 hover:text-indigo-600 rounded-xl text-gray-700 font-medium transition-all shadow-sm flex items-center justify-center gap-2">Chỉ công việc này</button>
                    <button onClick={() => onConfirm('future')} className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-medium transition-all shadow-md flex items-center justify-center gap-2">Các công việc tiếp theo</button>
                    <button onClick={onClose} className="w-full py-2 text-gray-400 hover:text-gray-600 text-sm">Hủy bỏ</button>
                </div>
            </div>
        </div>
    );
};
export default RecurringUpdateModal;