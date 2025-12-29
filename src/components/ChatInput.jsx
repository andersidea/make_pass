import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

const ChatInput = ({ onSend }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSend(input);
        setInput('');
    };

    return (
        <div className="fixed bottom-0 left-64 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                    <Sparkles size={20} />
                </div>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="여기에 입력하세요 (예: 넷플릭스 비번 1234, 국민은행 계좌 110-123...)"
                    className="w-full pl-12 pr-14 py-4 bg-white border border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg placeholder-gray-400 transition-shadow hover:shadow-xl"
                />
                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default ChatInput;
