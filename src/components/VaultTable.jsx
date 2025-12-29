import React, { useState } from 'react';
import { Copy, Eye, EyeOff, ExternalLink, Edit2, Trash2, Star, Check, MoreVertical } from 'lucide-react';

const VaultTable = ({ items, onEdit, onDelete, onToggleFavorite }) => {
    const [showPassword, setShowPassword] = useState({});
    const [copied, setCopied] = useState(null);

    const handleCopy = (text, id, field) => {
        navigator.clipboard.writeText(text);
        setCopied(`${id}-${field}`);
        setTimeout(() => setCopied(null), 2000);
    };

    const togglePasswordVisibility = (id) => {
        setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getStrengthColor = (strength) => {
        if (strength >= 80) return 'bg-green-500';
        if (strength >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'password': return '🔐';
            case 'finance': return '💳';
            case 'contact': return '📞';
            case 'note': return '📝';
            default: return '📄';
        }
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <div className="text-6xl mb-4">🔒</div>
                <p className="text-lg">저장된 항목이 없습니다</p>
                <p className="text-sm mt-2">하단의 입력창에서 새 항목을 추가하세요</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-8">
                            <Star size={14} className="text-gray-400" />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            이름
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            사용자명
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            비밀번호
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                            강도
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                            액션
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {items.map((item) => (
                        <tr
                            key={item.id}
                            className="hover:bg-gray-50 transition-colors group"
                        >
                            {/* 즐겨찾기 */}
                            <td className="px-4 py-3">
                                <button
                                    onClick={() => onToggleFavorite(item.id)}
                                    className="hover:scale-110 transition-transform"
                                >
                                    <Star
                                        size={16}
                                        className={item.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 group-hover:text-gray-400'}
                                    />
                                </button>
                            </td>

                            {/* 이름 & 아이콘 */}
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{getCategoryIcon(item.category)}</span>
                                    <div className="min-w-0">
                                        <div className="font-medium text-gray-900 truncate">
                                            {item.siteName || item.service || item.title || '제목 없음'}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {item.accounts && item.accounts.length > 1 && (
                                                <span className="text-xs text-indigo-600 font-medium">
                                                    계정 {item.accounts.length}개
                                                </span>
                                            )}
                                            {item.accounts && item.accounts.some(acc => acc.isVerified) && (
                                                <span className="text-xs text-green-600" title="검증된 계정">✓</span>
                                            )}
                                            {item.customFields && item.customFields.length > 0 && (
                                                <span className="text-xs text-gray-500">
                                                    필드 {item.customFields.length}개
                                                </span>
                                            )}
                                        </div>
                                        {item.url && (
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-0.5"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <ExternalLink size={10} />
                                                {(() => {
                                                    try {
                                                        return new URL(item.url).hostname;
                                                    } catch {
                                                        return item.url;
                                                    }
                                                })()}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </td>

                            {/* 사용자명 (첫 번째 계정) */}
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    {(() => {
                                        // Multi-Account 구조
                                        const firstAccount = item.accounts && item.accounts.length > 0 ? item.accounts[0] : null;
                                        const username = firstAccount?.username || item.username || item.fields?.id || item.fields?.username || '-';
                                        const accountCount = item.accounts?.length || 0;
                                        
                                        return (
                                            <>
                                                <span className="text-sm text-gray-700 truncate max-w-xs">
                                                    {username}
                                                    {accountCount > 1 && (
                                                        <span className="ml-1 text-xs text-gray-500">(+{accountCount - 1})</span>
                                                    )}
                                                </span>
                                                {username !== '-' && (
                                                    <button
                                                        onClick={() => handleCopy(username, item.id, 'username')}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                                                    >
                                                        {copied === `${item.id}-username` ? (
                                                            <Check size={14} className="text-green-600" />
                                                        ) : (
                                                            <Copy size={14} className="text-gray-400" />
                                                        )}
                                                    </button>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </td>

                            {/* 비밀번호 (첫 번째 계정) */}
                            <td className="px-4 py-3">
                                {(() => {
                                    // Multi-Account 구조
                                    const firstAccount = item.accounts && item.accounts.length > 0 ? item.accounts[0] : null;
                                    const password = firstAccount?.password || item.password || item.fields?.password || null;
                                    const accountKey = firstAccount?.id || item.id;
                                    
                                    if (password) {
                                        return (
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm text-gray-700">
                                                    {showPassword[accountKey] ? password : '••••••••••'}
                                                </span>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => togglePasswordVisibility(accountKey)}
                                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                        title={showPassword[accountKey] ? '숨기기' : '보기'}
                                                    >
                                                        {showPassword[accountKey] ? (
                                                            <EyeOff size={14} className="text-gray-600" />
                                                        ) : (
                                                            <Eye size={14} className="text-gray-600" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleCopy(password, item.id, 'password')}
                                                        className="p-1 hover:bg-indigo-100 rounded transition-colors"
                                                        title="복사"
                                                    >
                                                        {copied === `${item.id}-password` ? (
                                                            <Check size={14} className="text-green-600" />
                                                        ) : (
                                                            <Copy size={14} className="text-indigo-600" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return <span className="text-sm text-gray-400">-</span>;
                                })()}
                            </td>

                            {/* 비밀번호 강도 */}
                            <td className="px-4 py-3">
                                {item.strength !== undefined ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${getStrengthColor(item.strength)} transition-all`}
                                                style={{ width: `${item.strength}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500 w-8">
                                            {item.strength}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                )}
                            </td>

                            {/* 액션 */}
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onEdit(item)}
                                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                        title="수정"
                                    >
                                        <Edit2 size={14} className="text-gray-600" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('정말 삭제하시겠습니까?')) {
                                                onDelete(item.id);
                                            }
                                        }}
                                        className="p-1.5 hover:bg-red-100 rounded transition-colors"
                                        title="삭제"
                                    >
                                        <Trash2 size={14} className="text-red-600" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default VaultTable;
