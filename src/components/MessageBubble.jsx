import React from 'react';
import { Bot, User, Shield, Check } from 'lucide-react';

const MessageBubble = ({ message }) => {
    const isBot = message.sender === 'bot';

    return (
        <div className={`flex w-full mb-4 ${isBot ? 'justify-start' : 'justify-end'}`}>
            <div className={`flex max-w-[80%] ${isBot ? 'flex-row' : 'flex-row-reverse'} items-end gap-2`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isBot ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'
                    }`}>
                    {isBot ? <Bot size={18} /> : <User size={18} />}
                </div>

                {/* Bubble */}
                <div className={`px-4 py-3 rounded-2xl shadow-sm ${isBot
                        ? 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                        : 'bg-indigo-600 text-white rounded-br-none'
                    }`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.text}
                    </div>

                    {/* Widget Rendering Area */}
                    {message.widget && (
                        <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                            {message.widget}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
