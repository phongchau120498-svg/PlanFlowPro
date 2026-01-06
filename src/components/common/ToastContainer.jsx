import React from 'react';
import { CheckSquare, Bell } from 'lucide-react';

[cite_start]// [cite: 23, 24, 25]
const ToastContainer = ({ toasts }) => {
    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 z-[100] pointer-events-none">
            {toasts.map(toast => (
                <div key={toast.id} className="bg-gray-900/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    {toast.type === 'success' && <CheckSquare size={18} className="text-emerald-400" />}
                    {toast.type === 'info' && <Bell size={18} className="text-blue-400" />}
                    <span className="text-sm font-medium tracking-wide">{toast.message}</span>
                </div>
            ))}
        </div>
    );
};
export default ToastContainer;