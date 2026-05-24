import React, { useState, useEffect } from 'react';
import { X, Key, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey, getGeminiModel, setGeminiModel } from '../../lib/gemini';

export default function SettingsAI({ onClose, onSave }) {
    const [apiKey, setApiKey] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
    const [isSaved, setIsSaved] = useState(false);
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        const savedKey = getGeminiApiKey();
        if (savedKey) setApiKey(savedKey);
        
        const savedModel = getGeminiModel();
        if (savedModel) setSelectedModel(savedModel);
    }, []);

    const handleSave = () => {
        setGeminiApiKey(apiKey.trim());
        setGeminiModel(selectedModel);
        setIsSaved(true);
        if (onSave) onSave();
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Key size={18} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">Cài đặt AI</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Gemini API Key</label>
                        <div className="relative">
                            <input 
                                type={showKey ? "text" : "password"} 
                                value={apiKey} 
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Nhập API Key của Google Gemini..." 
                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                            <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-orange-500" />
                            <span>Khóa API được lưu cục bộ trên trình duyệt (localStorage) và chỉ được gửi trực tiếp đến server của Google.</span>
                        </p>
                    </div>

                    <div className="pt-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Model AI</label>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50 text-gray-700"
                        >
                            <option value="gemini-2.5-flash">gemini-2.5-flash (Khuyên dùng - Ổn định nhất)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-2">
                            Hiện tại hệ thống chỉ hỗ trợ Gemini 2.5 Flash vì các model khác không khả dụng.
                        </p>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-xl transition-colors">
                        Đóng
                    </button>
                    <button 
                        onClick={handleSave} 
                        className={`px-6 py-2 text-sm font-bold text-white rounded-xl transition-colors flex items-center gap-2 ${isSaved ? 'bg-green-500 hover:bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {isSaved ? <><Check size={16} /> Đã lưu</> : 'Lưu lại'}
                    </button>
                </div>
            </div>
        </div>
    );
}
