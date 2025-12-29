import React, { useState } from 'react';
import { Copy, Eye, EyeOff, ExternalLink, Edit2, Trash2, Star, MoreVertical, Check } from 'lucide-react';

const VaultItem = ({ item, onEdit, onDelete, onToggleFavorite }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(null);
    const [showMenu, setShowMenu] = useState(false);

    const handleCopy = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    const getStrengthColor = (strength) => {
        if (strength >= 80) return 'bg-green-500';
        if (strength >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getStrengthLabel = (strength) => {
        if (strength >= 80) return '강함';
        if (strength >= 50) return '보통';
        return '약함';
    };

    const getCategoryIcon = () => {
        switch (item.category) {
            case 'password': return '🔐';
            case 'finance': return '💳';
            case 'contact': return '📞';
            case 'note': return '📝';
            default: return '📄';
        }
    };

    return (
        <div className="group bg-white border border-gray-200 hover:border-indigo-300 rounded-lg p-4 transition-all hover:shadow-md relative">
            {/* 헤더 */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-2xl flex-shrink-0">{getCategoryIcon()}</div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 truncate">{item.service || '제목 없음'}</h3>
                            {item.isFavorite && <Star size={14} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                        </div>
                        {item.username && (
                            <p className="text-sm text-gray-500 truncate">{item.username}</p>
                        )}
                        {item.url && (
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-1"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink size={12} />
                                {new URL(item.url).hostname}
                            </a>
                        )}
                    </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onToggleFavorite(item.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={item.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
                    >
                        <Star size={16} className={item.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
                    </button>
                    <button
                        onClick={() => onEdit(item)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="수정"
                    >
                        <Edit2 size={16} className="text-gray-600" />
                    </button>
                    <button
                        onClick={() => onDelete(item.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="삭제"
                    >
                        <Trash2 size={16} className="text-red-600" />
                    </button>
                </div>
            </div>

            {/* 비밀번호 필드 */}
            {item.password && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 font-mono text-sm">
                            {showPassword ? item.password : '••••••••••••'}
                        </div>
                        <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title={showPassword ? '숨기기' : '보기'}
                        >
                            {showPassword ? <EyeOff size={18} className="text-gray-600" /> : <Eye size={18} className="text-gray-600" />}
                        </button>
                        <button
                            onClick={() => handleCopy(item.password, 'password')}
                            className="p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="복사"
                        >
                            {copied === 'password' ? (
                                <Check size={18} className="text-green-600" />
                            ) : (
                                <Copy size={18} className="text-indigo-600" />
                            )}
                        </button>
                    </div>

                    {/* 비밀번호 강도 */}
                    {item.strength !== undefined && (
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${getStrengthColor(item.strength)} transition-all`}
                                    style={{ width: `${item.strength}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">
                                {getStrengthLabel(item.strength)}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* 추가 정보 */}
            {item.email && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="text-gray-500">이메일:</span>
                    <span className="text-gray-700">{item.email}</span>
                    <button
                        onClick={() => handleCopy(item.email, 'email')}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        {copied === 'email' ? (
                            <Check size={14} className="text-green-600" />
                        ) : (
                            <Copy size={14} className="text-gray-400" />
                        )}
                    </button>
                </div>
            )}

            {item.phone && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-gray-500">전화:</span>
                    <span className="text-gray-700">{item.phone}</span>
                    <button
                        onClick={() => handleCopy(item.phone, 'phone')}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        {copied === 'phone' ? (
                            <Check size={14} className="text-green-600" />
                        ) : (
                            <Copy size={14} className="text-gray-400" />
                        )}
                    </button>
                </div>
            )}

            {item.notes && (
                <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                    {item.notes}
                </div>
            )}

            {/* 메타데이터 */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>생성: {new Date(item.createdAt).toLocaleDateString('ko-KR')}</span>
                {item.lastUsed && (
                    <span>최근 사용: {new Date(item.lastUsed).toLocaleDateString('ko-KR')}</span>
                )}
            </div>
        </div>
    );
};

export default VaultItem;
