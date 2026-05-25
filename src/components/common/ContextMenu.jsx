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
            // Thay đổi ở đây: Bỏ w-48, dùng w-max và min-w-[200px] để menu tự vừa vặn nội dung
            className="fixed z-[9999] w-max min-w-[200px] bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-100"
            style={menuStyle}
        >
            {/* Thêm whitespace-nowrap vào tất cả các nút để chặn xuống dòng */}
            <button onClick={() => { onAction('EDIT', data); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap">
                <Edit3 size={15} /> Chỉnh sửa
            </button>
            <button onClick={() => { onAction('TOGGLE_COMPLETE', data); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap">
                <CheckSquare size={15} /> {data.isCompleted ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
            </button>
            <button onClick={() => { onAction('MOVE_TODAY', data); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap">
                <CalendarDays size={15} /> Dời sang hôm nay
            </button>
            <button onClick={() => { onAction('DUPLICATE', data); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap">
                <Copy size={15} /> Nhân bản
            </button>
            
            <div className="h-px bg-gray-200 my-1.5"></div>
            
            <button onClick={() => { onAction('DELETE', data); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap">
                <Trash2 size={15} /> Xóa công việc
            </button>
        </div>
    );
};

export default ContextMenu;