import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bird, User, Sparkles, Loader2, Command, Plus } from 'lucide-react';
import { generateChatResponse, getGeminiApiKey } from '../../lib/gemini';

export default function AIAssistant({ 
    tasks, 
    categories, 
    onSaveNewTask, 
    onUpdateTask,
    onDeleteTask, 
    onNavigateToTask
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const searchResults = React.useMemo(() => {
        if (!input.trim() || !tasks) return [];
        return tasks.filter(t => t.title.toLowerCase().includes(input.toLowerCase()));
    }, [tasks, input]);

    const hasContent = messages.length > 0 || input.trim();

    // Xử lý phím tắt Cmd+K / Ctrl+K để mở Spotlight
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Tự động focus input khi mở
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            scrollToBottom();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        
        const newMessages = [...messages, { id: Date.now(), role: 'user', content: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            if (!getGeminiApiKey()) {
                setMessages(prev => [...prev, { id: Date.now(), role: 'model', content: "Mày đùa tao à? Không có API Key thì tao cạp mày bây giờ! Mở cài đặt lên nhập vào mau! 🦆🔨" }]);
                setIsLoading(false);
                return;
            }

            const response = await generateChatResponse(newMessages, tasks, categories);
            
            if (response.type === 'text') {
                setMessages(prev => [...prev, { id: Date.now(), role: 'model', content: response.text }]);
            } else if (response.type === 'function_call') {
                await handleFunctionCall(response.functionName, response.functionArgs, newMessages);
            }
        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now(), role: 'model', content: `Lỗi rồi: ${error.message}. Chắc chắn là do bạn chứ ngỗng không bao giờ sai! 🦆😡` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFunctionCall = async (functionName, args, currentMessages) => {
        try {
            let actionMessage = "";
            if (functionName === 'create_task') {
                const { title, date, categoryId } = args;
                await onSaveNewTask({ title, date: date || new Date().toISOString().split('T')[0], categoryId });
                actionMessage = `Đã tạo nhiệm vụ: "${title}". Liệu hồn mà làm đi, ngỗng đang theo dõi đấy! 🦆🔪`;
            } else if (functionName === 'update_task') {
                const { id, title, date, categoryId, isCompleted } = args;
                const existingTask = tasks.find(t => t.id === id);
                if (existingTask) {
                    await onUpdateTask({ 
                        ...existingTask, 
                        title: title || existingTask.title,
                        date: date || existingTask.date,
                        categoryId: categoryId || existingTask.categoryId,
                        isCompleted: isCompleted !== undefined ? isCompleted : existingTask.isCompleted
                    });
                    if (isCompleted) {
                        actionMessage = `Tạm chấp nhận. Cứ tưởng nay mày lười, may cho cái mạng của mày đấy! 🦆`;
                    } else {
                        actionMessage = `Đã cập nhật nhiệm vụ. Mong là bạn cập nhật để làm, chứ không phải dời deadline... 🔪`;
                    }
                } else {
                    actionMessage = "Tôi không tìm thấy task đó. Dám lừa ngỗng à? 🦆🔨";
                }
            } else if (functionName === 'delete_task') {
                const { id } = args;
                await onDeleteTask(id);
                actionMessage = "Đã xóa nhiệm vụ! Đừng hòng xóa để trốn việc, tao biết nhà mày ở đâu đấy! 🔪🦢";
            }

            setMessages(prev => [...prev, { id: Date.now(), role: 'model', content: actionMessage }]);

        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now(), role: 'model', content: `Có lỗi khi thực hiện hành động: ${error.message}` }]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Nút bấm tròn nhỏ ở góc phải dưới (Thu gọn so với bản cũ) */}
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-white hover:bg-gray-50 border border-gray-200 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.15)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40 group overflow-hidden"
                title="Cmd + K để mở"
            >
                <img src="/goose-knife.png" alt="Ngỗng Đại Ca" className="w-full h-full object-cover scale-[1.15] group-hover:animate-bounce" />
            </button>

            {/* Spotlight Overlay */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal Container - Cố định vị trí phía trên để khi mở sẽ sổ xuống */}
                    <div className="fixed top-[20vh] left-1/2 -translate-x-1/2 w-full max-w-[640px] z-[110] animate-in zoom-in-95 fade-in duration-200 dark">
                        {/* Greeting text above input */}
                        <div className="text-center mb-8 pointer-events-none px-4 transition-opacity duration-300">
                            <h2 className="text-2xl md:text-3xl font-medium text-slate-800 dark:text-white tracking-tight drop-shadow-sm leading-relaxed">
                                Có việc gì gõ lẹ, tao đang mài dao! 🔪
                            </h2>
                        </div>

                        {/* Palette Box - Dùng rounded-[32px] cố định để tạo hình pill khi đóng và bo góc mượt khi mở */}
                        <div className="bg-white dark:bg-[#1a1a1c] backdrop-blur-2xl border border-gray-200 dark:border-white/10 shadow-[0_10px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col transition-all duration-300 ease-out rounded-[32px]">
                            
                            {/* Input Area */}
                            <div className="flex items-center gap-3 px-6 h-16">
                                <Sparkles size={20} className="text-slate-400 dark:text-gray-400 flex-shrink-0" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Hỏi Ngỗng Đại Ca hoặc giao việc..."
                                    className="flex-1 bg-transparent border-none focus:outline-none text-[17px] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 h-full w-full"
                                    disabled={isLoading}
                                    autoComplete="off"
                                    spellCheck="false"
                                />
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button 
                                        onClick={() => { setMessages([]); setInput(''); }}
                                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-slate-400 dark:text-gray-400 transition-colors"
                                        title="Cuộc trò chuyện mới"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Dropdown Area with Smooth Animation */}
                            <div className={`transition-all duration-300 ease-out overflow-hidden flex flex-col ${hasContent ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                {/* Divider */}
                                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent flex-shrink-0" />

                                {/* Dynamic Area: Search Results or Chat History */}
                                {input.trim() ? (
                                    <div className="max-h-[400px] overflow-y-auto p-4 flex flex-col gap-1 custom-scrollbar">
                                        {searchResults.length > 0 ? (
                                            <>
                                                <div className="text-[11px] text-slate-400 dark:text-gray-500 mb-1 px-3 uppercase tracking-widest font-semibold">Công việc hiện tại ({searchResults.length})</div>
                                                {searchResults.map(task => (
                                                    <button
                                                        key={task.id}
                                                        onClick={() => {
                                                            onNavigateToTask(task);
                                                            setIsOpen(false);
                                                            setInput('');
                                                        }}
                                                        className="flex flex-col text-left px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-transparent dark:hover:border-white/5 group"
                                                    >
                                                        <div className="font-medium text-slate-800 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white truncate">{task.title}</div>
                                                        <div className="text-xs text-slate-500 dark:text-gray-500 flex items-center gap-2 mt-1">
                                                            <span className={`w-2 h-2 rounded-full ${categories.find(c => c.id === task.categoryId)?.color?.value.split(' ')[0].replace('bg-', 'bg-') || 'bg-gray-500'}`}></span>
                                                            <span>{task.date.split('-').reverse().join('/')}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                                <div className="h-[1px] w-full bg-gray-100 dark:bg-white/5 my-2" />
                                            </>
                                        ) : null}
                                        <button 
                                            onClick={handleSend}
                                            className="flex items-center gap-3 text-left px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white transition-colors border border-transparent dark:hover:border-white/20 group"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center border border-transparent dark:border-white/20 flex-shrink-0">
                                                <Send size={14} className="text-slate-600 dark:text-white" />
                                            </div>
                                            <div className="flex-1 font-medium truncate">
                                                Hỏi Ngỗng Đại Ca: "{input}"
                                            </div>
                                            <span className="text-[10px] bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded font-mono flex-shrink-0">ENTER</span>
                                        </button>
                                    </div>
                                ) : (messages.length > 0) ? (
                                    <div className="max-h-[400px] overflow-y-auto p-5 flex flex-col gap-5 custom-scrollbar">
                                        {messages.map((msg) => (
                                            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border overflow-hidden ${msg.role === 'user' ? 'bg-indigo-100 border-indigo-200 text-indigo-600 dark:bg-indigo-500/20 dark:border-white/5 dark:text-indigo-300' : 'bg-[#58CC02]/20 border-transparent text-[#58CC02]'}`}>
                                                    {msg.role === 'user' ? <User size={16} /> : <img src="/goose-knife.png" alt="Ngỗng Đại Ca" className="w-full h-full object-cover scale-110" />}
                                                </div>
                                                <div className={`px-4 py-3 max-w-[80%] ${msg.role === 'user' ? 'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-900 dark:text-indigo-100 rounded-2xl rounded-tr-sm' : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 text-slate-800 dark:text-gray-200 rounded-2xl rounded-tl-sm shadow-sm'}`}>
                                                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {isLoading && (
                                            <div className="flex gap-3 flex-row">
                                                <div className="w-8 h-8 rounded-full bg-[#58CC02]/20 text-[#58CC02] border border-transparent dark:border-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    <img src="/goose-knife.png" alt="Ngỗng Đại Ca" className="w-full h-full object-cover scale-110" />
                                                </div>
                                                <div className="px-4 py-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-tl-sm shadow-sm flex items-center gap-3">
                                                    <Loader2 size={16} className="text-[#58CC02] animate-spin" />
                                                    <span className="text-sm text-slate-500 dark:text-gray-400 font-medium tracking-wide">Ngỗng đang dòm ngó...</span>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                ) : (
                                    <div className="p-1 opacity-0 pointer-events-none" />
                                )}
                            </div>



                        </div>
                    </div>
                </>
            )}
        </>
    );
}
