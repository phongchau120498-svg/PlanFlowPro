import React, { useEffect, useRef } from 'react';
import { Edit3, Trash2, CheckSquare, Copy, CalendarDays } from 'lucide-react';

const ContextMenu = ({ position, type, data, onClose, onAction }) => {
    const menuRef = useRef(null);

    // Xử lý click ra ngoài để đóng menu
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    if (type !== 'TASK') return null;

    // Đảm bảo menu không bị tràn ra ngoài màn hình
    const menuStyle = {
        top: position.y,
        left: position.x,
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-[9999] w-48 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-100"
            style={menuStyle}
        >
            <button onClick={() => { onAction('EDIT', data); onClose(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <Edit3 size={14} /> Chỉnh sửa
            </button>
            <button onClick={() => { onAction('TOGGLE_COMPLETE', data); onClose(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <CheckSquare size={14} /> {data.isCompleted ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
            </button>
            <button onClick={() => { onAction('MOVE_TODAY', data); onClose(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <CalendarDays size={14} /> Dời sang hôm nay
            </button>
            <button onClick={() => { onAction('DUPLICATE', data); onClose(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <Copy size={14} /> Nhân bản
            </button>
            
            <div className="h-px bg-gray-200 my-1.5"></div>
            
            <button onClick={() => { onAction('DELETE', data); onClose(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 size={14} /> Xóa công việc
            </button>
        </div>
    );
};

export default ContextMenu;