import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Trash2, Key, CreditCard, StickyNote, Wallet, ExternalLink, Phone, Edit, AlertCircle, Check } from 'lucide-react';

const VaultCard = ({ item, onDelete, onEdit }) => {
    const [isRevealed, setIsRevealed] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLaunch = () => {
        if (item.fields?.url) {
            navigator.clipboard.writeText(item.fields.password);
            window.open(item.fields.url, '_blank');
        }
    };

    const getIcon = () => {
        switch (item.type) {
            case 'password': return <Key className="text-amber-500" size={24} />;
            case 'account': return <Wallet className="text-blue-500" size={24} />;
            case 'card': return <CreditCard className="text-purple-500" size={24} />;
            case 'phone': return <Phone className="text-green-500" size={24} />;
            default: return <StickyNote className="text-gray-500" size={24} />;
        }
    };

    const renderContent = () => {
        if (item.type === 'password') {
            return (
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">ID</span>
                        <span className="font-medium text-gray-800 text-sm">{item.fields?.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">PW</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold">
                                {isRevealed ? item.fields?.password : '••••••••'}
                            </span>
                            <button
                                onClick={() => setIsRevealed(!isRevealed)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button
                                onClick={() => handleCopy(item.fields?.password)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>
                    {item.fields?.url && (
                        <button
                            onClick={handleLaunch}
                            className="w-full mt-3 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all hover:scale-[1.02] font-medium"
                        >
                            <ExternalLink size={16} />
                            로그인 하러 가기
                        </button>
                    )}
                </div>
            );
        }

        if (item.type === 'account') {
            return (
                <div className="space-y-2">
                    <div
                        onClick={() => handleCopy(item.fields?.accountNumber || item.fields?.id)}
                        className="text-2xl font-mono text-gray-800 tracking-tight cursor-pointer hover:text-blue-600 transition-colors p-4 bg-blue-50 rounded-xl text-center"
                    >
                        {item.fields?.accountNumber || item.fields?.id}
                    </div>
                    <div className="text-xs text-gray-400 text-center">
                        클릭하여 복사
                    </div>
                </div>
            );
        }

        if (item.type === 'phone') {
            return (
                <div className="space-y-3">
                    <div
                        onClick={() => handleCopy(item.fields?.phoneNumber || item.fields?.id)}
                        className="text-2xl font-mono text-gray-800 tracking-tight cursor-pointer hover:text-green-600 transition-colors p-4 bg-green-50 rounded-xl text-center"
                    >
                        {item.fields?.phoneNumber || item.fields?.id}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleCopy(item.fields?.phoneNumber || item.fields?.id)}
                            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            <Copy size={16} />
                            복사
                        </button>
                        <a
                            href={`tel:${item.fields?.phoneNumber || item.fields?.id}`}
                            className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
                        >
                            <Phone size={16} />
                            전화
                        </a>
                    </div>
                </div>
            );
        }

        return <div className="text-gray-600 text-sm p-4 bg-gray-50 rounded-xl">{item.fields?.rawInput || item.value}</div>;
    };

    return (
        <div className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden ${item.needsReview ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-white' : 'border-gray-100 hover:border-indigo-200'
            }`}>
            {item.needsReview && (
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 flex items-center gap-2 text-white text-sm font-medium">
                    <AlertCircle size={16} />
                    <span>정리 필요</span>
                </div>
            )}

            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl group-hover:scale-110 transition-transform">
                            {getIcon()}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{item.title}</h3>
                            <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-full">{item.type}</span>
                        </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(item)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="수정"
                        >
                            <Edit size={18} />
                        </button>
                        <button
                            onClick={() => onDelete(item.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="삭제"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default VaultCard;
