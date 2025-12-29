import React, { useState } from 'react';
import { Copy, Eye, EyeOff, ExternalLink, Edit2, Trash2, Star, Check, ChevronDown, ChevronRight, Users } from 'lucide-react';

const VaultTableGrouped = ({ items, onEdit, onDelete, onToggleFavorite }) => {
    const [showPassword, setShowPassword] = useState({});
    const [copied, setCopied] = useState(null);
    const [expandedSites, setExpandedSites] = useState(new Set());

    const toggleExpand = (siteId) => {
        const newExpanded = new Set(expandedSites);
        if (newExpanded.has(siteId)) {
            newExpanded.delete(siteId);
        } else {
            newExpanded.add(siteId);
        }
        setExpandedSites(newExpanded);
    };

    const handleCopy = (text, id, field) => {
        navigator.clipboard.writeText(text);
        setCopied(`${id}-${field}`);
        setTimeout(() => setCopied(null), 2000);
    };

    const togglePasswordVisibility = (id) => {
        setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getFaviconUrl = (url) => {
        if (!url) return null;
        try {
            const hostname = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
        } catch {
            return null;
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
            {/* 테이블 헤더 */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div className="col-span-1 flex items-center justify-center">
                    <Star size={14} className="text-gray-400" />
                </div>
                <div className="col-span-5">사이트 / 계정</div>
                <div className="col-span-2">로그인 정보</div>
                <div className="col-span-2">비밀번호</div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                    <span>액션</span>
                </div>
            </div>

            {/* 사이트별 그룹 */}
            <div className="divide-y divide-gray-100">
                {items.map((item) => {
                    const accounts = item.accounts || [];
                    const accountCount = accounts.length;
                    const isExpanded = expandedSites.has(item.id);
                    const hasMultipleAccounts = accountCount > 1;
                    const faviconUrl = getFaviconUrl(item.url);

                    return (
                        <div key={item.id} className="group">
                            {/* 사이트 헤더 행 */}
                            <div className="px-4 py-3 hover:bg-gray-50 transition-colors grid grid-cols-12 gap-4 items-center">
                                {/* 즐겨찾기 */}
                                <div className="col-span-1 flex items-center justify-center">
                                    <button
                                        onClick={() => onToggleFavorite(item.id)}
                                        className="hover:scale-110 transition-transform"
                                    >
                                        <Star
                                            size={16}
                                            className={item.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 group-hover:text-gray-400'}
                                        />
                                    </button>
                                </div>

                                {/* 사이트 정보 */}
                                <div className="col-span-5 flex items-center gap-3 min-w-0">
                                    {/* 확장 버튼 (여러 계정이 있을 때만) */}
                                    {hasMultipleAccounts && (
                                        <button
                                            onClick={() => toggleExpand(item.id)}
                                            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {isExpanded ? (
                                                <ChevronDown size={18} />
                                            ) : (
                                                <ChevronRight size={18} />
                                            )}
                                        </button>
                                    )}
                                    {!hasMultipleAccounts && <div className="w-[18px]" />}

                                    {/* 파비콘 또는 아이콘 */}
                                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg">
                                        {faviconUrl ? (
                                            <img src={faviconUrl} alt="" className="w-6 h-6" onError={(e) => { e.target.style.display = 'none'; }} />
                                        ) : (
                                            <span className="text-lg">🔐</span>
                                        )}
                                    </div>

                                    {/* 사이트명 및 메타 정보 */}
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium text-gray-900 truncate">
                                            {item.siteName || '제목 없음'}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {hasMultipleAccounts && (
                                                <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium">
                                                    <Users size={12} />
                                                    {accountCount}개 계정
                                                </span>
                                            )}
                                            {accounts.some(acc => acc.isVerified) && (
                                                <span className="text-xs text-green-600" title="검증된 계정">✓ 검증됨</span>
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

                                {/* 첫 번째 계정 정보 (축약 표시) */}
                                {accountCount > 0 && (() => {
                                    const firstAccount = accounts[0];
                                    const displayName = firstAccount.displayName || firstAccount.username || '-';
                                    
                                    return (
                                        <>
                                            <div className="col-span-2 flex items-center gap-2 min-w-0">
                                                <span className="text-sm text-gray-700 truncate" title={displayName}>
                                                    {displayName}
                                                    {hasMultipleAccounts && !isExpanded && (
                                                        <span className="ml-1 text-xs text-gray-500">외 {accountCount - 1}개</span>
                                                    )}
                                                </span>
                                                {displayName !== '-' && (
                                                    <button
                                                        onClick={() => handleCopy(firstAccount.username || displayName, item.id, 'username')}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all flex-shrink-0"
                                                    >
                                                        {copied === `${item.id}-username` ? (
                                                            <Check size={14} className="text-green-600" />
                                                        ) : (
                                                            <Copy size={14} className="text-gray-400" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            <div className="col-span-2 flex items-center gap-2 min-w-0">
                                                {firstAccount.password ? (
                                                    <>
                                                        <span className="font-mono text-sm text-gray-700 truncate">
                                                            {showPassword[`${item.id}-${firstAccount.id}`] ? firstAccount.password : '••••••••'}
                                                        </span>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                            <button
                                                                onClick={() => togglePasswordVisibility(`${item.id}-${firstAccount.id}`)}
                                                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                                title={showPassword[`${item.id}-${firstAccount.id}`] ? '숨기기' : '보기'}
                                                            >
                                                                {showPassword[`${item.id}-${firstAccount.id}`] ? (
                                                                    <EyeOff size={14} className="text-gray-600" />
                                                                ) : (
                                                                    <Eye size={14} className="text-gray-600" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleCopy(firstAccount.password, item.id, 'password')}
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
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">비밀번호 없음</span>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}

                                {/* 액션 버튼 */}
                                <div className="col-span-2 flex items-center justify-end gap-1">
                                    <button
                                        onClick={() => onEdit(item)}
                                        className="p-1.5 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100"
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
                                        className="p-1.5 hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                                        title="삭제"
                                    >
                                        <Trash2 size={14} className="text-red-600" />
                                    </button>
                                </div>
                            </div>

                            {/* 계정 목록 (확장 시 표시) */}
                            {isExpanded && hasMultipleAccounts && (
                                <div className="bg-gray-50 border-t border-gray-200">
                                    {accounts.map((account, idx) => {
                                        const accountKey = `${item.id}-${account.id}`;
                                        const displayName = account.displayName || account.username || '이름 없음';
                                        
                                        return (
                                            <div key={account.id} className="px-4 py-2.5 border-b border-gray-100 last:border-b-0 grid grid-cols-12 gap-4 items-center hover:bg-gray-100/50 transition-colors">
                                                <div className="col-span-1" /> {/* 즐겨찾기 공간 */}
                                                <div className="col-span-5 flex items-center gap-3 min-w-0 pl-11">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <span className="text-xs text-gray-500 w-12 flex-shrink-0">계정 {idx + 1}</span>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-sm font-medium text-gray-700 truncate">
                                                                {displayName}
                                                            </div>
                                                            {account.memo && (
                                                                <div className="text-xs text-gray-500 truncate mt-0.5">
                                                                    {account.memo}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {account.isVerified && (
                                                            <Check size={14} className="text-green-600 flex-shrink-0" title="검증됨" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-span-2 flex items-center gap-2 min-w-0">
                                                    <span className="text-sm text-gray-600 truncate" title={account.username || '-'}>
                                                        {account.username || <span className="text-gray-400 italic">사용자명 없음</span>}
                                                    </span>
                                                    {account.username && (
                                                        <button
                                                            onClick={() => handleCopy(account.username, accountKey, 'username')}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all flex-shrink-0"
                                                        >
                                                            {copied === `${accountKey}-username` ? (
                                                                <Check size={14} className="text-green-600" />
                                                            ) : (
                                                                <Copy size={14} className="text-gray-400" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="col-span-2 flex items-center gap-2 min-w-0">
                                                    {account.password ? (
                                                        <>
                                                            <span className="font-mono text-sm text-gray-700 truncate">
                                                                {showPassword[accountKey] ? account.password : '••••••••'}
                                                            </span>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
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
                                                                    onClick={() => handleCopy(account.password, accountKey, 'password')}
                                                                    className="p-1 hover:bg-indigo-100 rounded transition-colors"
                                                                    title="복사"
                                                                >
                                                                    {copied === `${accountKey}-password` ? (
                                                                        <Check size={14} className="text-green-600" />
                                                                    ) : (
                                                                        <Copy size={14} className="text-indigo-600" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-gray-400 italic">비밀번호 없음</span>
                                                    )}
                                                </div>
                                                <div className="col-span-2" /> {/* 액션 공간 (빈 공간) */}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VaultTableGrouped;



