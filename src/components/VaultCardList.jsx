import React, { useState } from 'react';
import { Copy, Eye, EyeOff, ExternalLink, Edit2, Trash2, Star, ChevronDown, ChevronRight, AlertTriangle, Circle, XCircle, Check } from 'lucide-react';
import { checkExpiryStatus, formatNumberWithCommas } from '../utils/formatUtils';

const VaultCardList = ({ items, onEdit, onDelete, onToggleFavorite, onCopyToast, categories = [] }) => {
    const [showPassword, setShowPassword] = useState({});
    const [expandedSites, setExpandedSites] = useState(new Set());
    const [copiedField, setCopiedField] = useState(null); // 복사 성공 애니메이션용

    const toggleExpand = (siteId) => {
        const newExpanded = new Set(expandedSites);
        if (newExpanded.has(siteId)) {
            newExpanded.delete(siteId);
        } else {
            newExpanded.add(siteId);
        }
        setExpandedSites(newExpanded);
    };

    const handleCopy = (text, fieldName, fieldId) => {
        navigator.clipboard.writeText(text);
        if (onCopyToast) {
            onCopyToast(`복사됨!`);
        }
        // 복사 성공 애니메이션
        const uniqueId = fieldId || fieldName || 'default';
        setCopiedField(uniqueId);
        setTimeout(() => setCopiedField(null), 1000);
    };

    // URL 패턴 감지 및 링크 변환
    const isUrlPattern = (text) => {
        if (!text || typeof text !== 'string') return false;
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
        return urlPattern.test(text.trim()) || text.trim().includes('.') && (text.trim().includes('http') || text.trim().split('.').length >= 2);
    };

    // 텍스트에서 URL을 링크로 변환하여 렌더링
    const renderTextWithLinks = (text) => {
        if (!text || typeof text !== 'string') return text;
        if (isUrlPattern(text)) {
            const url = text.trim().startsWith('http') ? text.trim() : `https://${text.trim()}`;
            return (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 underline flex items-center gap-1 inline-flex"
                    onClick={(e) => e.stopPropagation()}
                >
                    <ExternalLink size={12} />
                    {text}
                </a>
            );
        }
        return text;
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

    // 보안 알람 체크 (6개월 경과)
    const isSecurityWarning = (item) => {
        const lastModified = item.lastModified || item.updatedAt;
        if (!lastModified) return false;
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return new Date(lastModified) < sixMonthsAgo;
    };

    // 카테고리명 가져오기
    const getCategoryName = (categoryId) => {
        if (!categoryId || categoryId === 'uncategorized') return null;
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : null;
    };

    // 카테고리 타입 가져오기
    const getCategoryType = (categoryId) => {
        if (!categoryId || categoryId === 'uncategorized') return 'web'; // 기본값
        const category = categories.find(c => c.id === categoryId);
        return category?.type || 'web';
    };

    // 금융 카테고리 여부 확인 (타입 또는 이름 기반)
    const isFinanceCategory = (categoryId) => {
        const categoryType = getCategoryType(categoryId);
        if (categoryType === 'finance') return true;
        
        // 하위 호환성: 이름으로도 확인
        const categoryName = getCategoryName(categoryId);
        if (!categoryName) return false;
        const financeKeywords = ['금융', '은행', 'bank', 'finance', 'financial'];
        return financeKeywords.some(keyword => 
            categoryName.toLowerCase().includes(keyword.toLowerCase())
        );
    };

    // 메모 카테고리 여부 확인
    const isMemoCategory = (categoryId) => {
        const categoryType = getCategoryType(categoryId);
        return categoryType === 'memo';
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <div className="text-6xl mb-4">🔒</div>
                <p className="text-lg font-medium">저장된 항목이 없습니다</p>
                <p className="text-sm mt-2 text-gray-500">하단의 입력창에서 새 항목을 추가하세요</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '20px' }}>
            {items.map((item) => {
                const accounts = item.accounts || [];
                const accountCount = accounts.length;
                const isExpanded = expandedSites.has(item.id);
                const hasMultipleAccounts = accountCount > 1;
                const faviconUrl = getFaviconUrl(item.url);
                const securityWarning = isSecurityWarning(item);
                const isFinance = isFinanceCategory(item.categoryId);
                const isMemo = isMemoCategory(item.categoryId);
                const firstAccount = accounts[0] || {};

                // 상태 (기본값: 사용 중) - isActive 우선, 없으면 status 확인
                const accountStatus = item.isActive === false ? 'inactive' : (firstAccount.status || item.status || 'active');
                
                // 유효기간 만료 상태 체크
                const expiryStatus = isFinance && item.expiryDate ? checkExpiryStatus(item.expiryDate) : null;

                // 금융 카드 배경 스타일
                const cardClasses = [
                    'card',
                    securityWarning ? 'card-alert bg-orange-50/30' : '',
                    isMemo ? 'type-memo' : '',
                    isFinance ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 border-blue-200' : ''
                ].filter(Boolean).join(' ');

                return (
                    <div
                        key={item.id}
                        className={`${cardClasses} relative`}
                        style={{
                            minHeight: '280px',
                            maxHeight: 'none',
                            padding: '20px',
                            margin: '0',
                            overflow: 'visible'
                        }}
                    >
                        {/* 보안 경고 배너 (주황색 #f97316) */}
                        {securityWarning && (
                            <div className="px-5 py-2 bg-orange-100 border-b border-orange-300 flex items-center gap-2">
                                <AlertTriangle size={16} className="text-orange-600" />
                                <span className="text-sm text-orange-700 font-medium">⚠️ 변경 권장</span>
                                <span className="text-xs text-orange-600">
                                    (최종 수정일: {new Date(item.lastModified || item.updatedAt).toLocaleDateString()})
                                </span>
                            </div>
                        )}

                        {/* 액션 버튼 (카드 우측 상단 내부) - 고정 위치 */}
                        <div 
                            className="absolute top-4 right-4 z-10 flex items-center gap-1"
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                zIndex: 10
                            }}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(item);
                                }}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex-shrink-0"
                                title="수정"
                                style={{ flexShrink: 0 }}
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('정말 삭제하시겠습니까?')) {
                                        onDelete(item.id);
                                    }
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                                title="삭제"
                                style={{ flexShrink: 0 }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        {/* 사이트 헤더 */}
                        <div className="flex items-start justify-between gap-4 pr-16 mb-4">
                            {/* 왼쪽: 사이트 정보 */}
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                {/* 즐겨찾기 */}
                                <button
                                    onClick={() => onToggleFavorite(item.id)}
                                    className="flex-shrink-0 mt-1 hover:scale-110 transition-transform"
                                >
                                    <Star
                                        size={18}
                                        className={item.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 hover:text-yellow-400'}
                                    />
                                </button>

                                {/* 파비콘 */}
                                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100">
                                    {faviconUrl ? (
                                        <img 
                                            src={faviconUrl} 
                                            alt="" 
                                            className="w-8 h-8 rounded" 
                                            onError={(e) => { e.target.style.display = 'none'; }} 
                                        />
                                    ) : (
                                        <span className="text-xl">🔐</span>
                                    )}
                                </div>

                                {/* 사이트 이름 및 계정 정보 */}
                                <div className="flex-1 min-w-0" style={{ minWidth: 0, overflow: 'hidden' }}>
                                    {/* 사이트 이름 - 큰 글씨, 굵게 */}
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h3 
                                            className="text-base font-semibold text-gray-900"
                                            style={{
                                                wordBreak: 'break-word',
                                                overflowWrap: 'break-word',
                                                hyphens: 'auto',
                                                lineHeight: '1.4'
                                            }}
                                        >
                                            {item.siteName || '제목 없음'}
                                        </h3>
                                        {/* 상태 배지 */}
                                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
                                            accountStatus === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {accountStatus === 'active' ? (
                                                <>
                                                    <Circle size={10} className="fill-current" />
                                                    <span>사용 중</span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle size={10} className="fill-current" />
                                                    <span>중단</span>
                                                </>
                                            )}
                                        </span>
                                        {hasMultipleAccounts && !isMemo && (
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
                                        {accounts.some(acc => acc.isVerified) && (
                                            <span className="inline-flex items-center text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                                                ✓ 검증됨
                                            </span>
                                        )}
                                        {/* 금융 카드 만료 알람 배지 */}
                                        {isFinance && expiryStatus && (expiryStatus.isExpired || expiryStatus.isExpiringSoon) && (
                                            <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${
                                                expiryStatus.isExpired
                                                    ? 'bg-red-100 text-red-700 animate-pulse'
                                                    : expiryStatus.isExpiringSoon
                                                    ? 'bg-orange-100 text-orange-700 animate-pulse'
                                                    : ''
                                            }`}>
                                                {expiryStatus.isExpired ? '⚠️ 만료됨' : expiryStatus.isExpiringSoon ? '⚠️ 만료 임박' : ''}
                                            </span>
                                        )}
                                    </div>

                                    {/* 첫 번째 계정 정보 - 작은 회색 글씨 (메모 타입이 아닐 때만) */}
                                    {!isMemo && firstAccount && (
                                        <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                                            <span 
                                                className="break-words"
                                                style={{
                                                    wordBreak: 'break-word',
                                                    overflowWrap: 'break-word',
                                                    maxWidth: '100%'
                                                }}
                                            >
                                                {firstAccount.displayName || firstAccount.username || '계정 정보 없음'}
                                            </span>
                                            {hasMultipleAccounts && !isExpanded && (
                                                <span className="text-xs text-indigo-600 font-medium whitespace-nowrap flex-shrink-0">
                                                    +{accountCount - 1}개 더
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* URL (메모 타입이 아닐 때만) */}
                                    {!isMemo && item.url && (
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-1.5"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <ExternalLink size={12} />
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

                        </div>

                        {/* 메모 타입: HTML 명세서의 .memo-text-area 구조 */}
                        {isMemo && (
                            <>
                                <div className="memo-text-area">
                                    {item.memo || (item.customFields && item.customFields.length > 0 
                                        ? item.customFields.map(f => f.field_value).join('\n')
                                        : '내용이 없습니다')}
                                </div>
                                {item.lastModified || item.updatedAt ? (
                                    <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', textAlign: 'right' }}>
                                        <span style={{ color: '#64748b' }}>최종 수정일: {new Date(item.lastModified || item.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                ) : null}
                            </>
                        )}

                        {/* 금융/웹 타입: 아이디/비밀번호 메인 영역 (메모 타입이 아닐 때만 표시) */}
                        {!isMemo && accounts.length > 0 && (
                            <>
                                {/* 계정 정보 메인 영역 - 아이디/비밀번호 중앙 배치 */}
                                <div className="border-t border-gray-100 px-5 py-5 bg-gradient-to-br from-gray-50 to-white">
                                    {accounts.map((account, idx) => {
                                        const accountKey = `${item.id}-${account.id}`;
                                        const copyId = `${item.id}-${account.id}-password`;
                                        return (
                                            <div key={account.id} className={idx > 0 ? 'pt-4 mt-4 border-t border-gray-200' : ''}>
                                                {/* 아이디 */}
                                                {account.username && (
                                                    <div className="mb-4">
                                                        <div className="text-xs text-gray-500 mb-2 font-medium">아이디</div>
                                                        <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3">
                                                            <span className="text-base font-medium text-gray-900 flex-1 break-all">{account.username}</span>
                                                            <button
                                                                onClick={() => handleCopy(account.username, '아이디', `${item.id}-${account.id}-username`)}
                                                                className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                                                                    copiedField === `${item.id}-${account.id}-username`
                                                                        ? 'bg-green-100 text-green-600 scale-110'
                                                                        : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'
                                                                }`}
                                                                title="아이디 복사"
                                                            >
                                                                {copiedField === `${item.id}-${account.id}-username` ? (
                                                                    <Check size={18} className="animate-pulse" />
                                                                ) : (
                                                                    <Copy size={18} />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* 비밀번호 */}
                                                {account.password && (
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-2 font-medium">비밀번호</div>
                                                        <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3">
                                                            <span className="text-base font-mono text-gray-900 flex-1 break-all min-h-[1.5rem]">
                                                                {showPassword[accountKey] ? account.password : '••••••••'}
                                                            </span>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <button
                                                                    onClick={() => togglePasswordVisibility(accountKey)}
                                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                                    title={showPassword[accountKey] ? '숨기기' : '보기'}
                                                                >
                                                                    {showPassword[accountKey] ? <EyeOff size={18} /> : <Eye size={18} />}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCopy(account.password, '비밀번호', copyId)}
                                                                    className={`p-2 rounded-lg transition-all ${
                                                                        copiedField === copyId
                                                                            ? 'bg-green-100 text-green-600 scale-110'
                                                                            : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'
                                                                    }`}
                                                                    title="비밀번호 복사"
                                                                >
                                                                    {copiedField === copyId ? (
                                                                        <Check size={18} className="animate-pulse" />
                                                                    ) : (
                                                                        <Copy size={18} />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* 금융 전용 필드 (유효기간, 이용 한도, 결제일, 계좌번호) */}
                        {isFinance && (
                            <div className="border-t border-blue-200 pt-4 mt-4 px-5 space-y-3">
                                {/* 계좌번호 */}
                                {item.customFields?.find(f => f.field_name?.toLowerCase().includes('계좌') || f.field_name?.toLowerCase().includes('account')) && (
                                    <div className="mb-3">
                                        <div className="text-xs text-gray-600 mb-2 font-medium">계좌번호</div>
                                        <div className="flex items-center gap-3 bg-white rounded-lg border border-blue-200 px-4 py-3">
                                            <span className="text-sm font-mono text-gray-800 flex-1 break-all">
                                                {renderTextWithLinks(item.customFields.find(f => f.field_name?.toLowerCase().includes('계좌') || f.field_name?.toLowerCase().includes('account'))?.field_value || '')}
                                            </span>
                                            <button
                                                onClick={() => handleCopy(item.customFields.find(f => f.field_name?.toLowerCase().includes('계좌') || f.field_name?.toLowerCase().includes('account'))?.field_value || '', '계좌번호', `${item.id}-account-number`)}
                                                className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                                                    copiedField === `${item.id}-account-number`
                                                        ? 'bg-green-100 text-green-600 scale-110'
                                                        : 'text-gray-400 hover:text-indigo-600 hover:bg-blue-50'
                                                }`}
                                                title="계좌번호 복사"
                                            >
                                                {copiedField === `${item.id}-account-number` ? (
                                                    <Check size={18} className="animate-pulse" />
                                                ) : (
                                                    <Copy size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {/* 유효기간 */}
                                {item.expiryDate && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-600 w-24 flex-shrink-0">유효기간</span>
                                        <span className="text-sm font-mono text-gray-800 flex-1 break-all">{item.expiryDate}</span>
                                        <button
                                            onClick={() => handleCopy(item.expiryDate, '유효기간', `${item.id}-expiry`)}
                                            className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                                                copiedField === `${item.id}-expiry`
                                                    ? 'bg-green-100 text-green-600 scale-110'
                                                    : 'text-gray-400 hover:text-indigo-600 hover:bg-blue-50'
                                            }`}
                                            title="유효기간 복사"
                                        >
                                            {copiedField === `${item.id}-expiry` ? (
                                                <Check size={18} className="animate-pulse" />
                                            ) : (
                                                <Copy size={18} />
                                            )}
                                        </button>
                                        {expiryStatus && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ml-2 ${
                                                expiryStatus.isExpired
                                                    ? 'bg-red-100 text-red-700'
                                                    : expiryStatus.isExpiringSoon
                                                    ? 'bg-orange-100 text-orange-700'
                                                    : ''
                                            }`}>
                                                {expiryStatus.isExpired ? '만료됨' : expiryStatus.isExpiringSoon ? '만료 임박' : ''}
                                            </span>
                                        )}
                                    </div>
                                )}
                                
                                {/* 이용 한도 */}
                                {item.creditLimit && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-600 w-24 flex-shrink-0">이용 한도</span>
                                        <span className="text-sm font-mono text-gray-800 flex-1 break-all">{formatNumberWithCommas(item.creditLimit)}원</span>
                                        <button
                                            onClick={() => handleCopy(String(item.creditLimit), '이용 한도', `${item.id}-credit-limit`)}
                                            className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                                                copiedField === `${item.id}-credit-limit`
                                                    ? 'bg-green-100 text-green-600 scale-110'
                                                    : 'text-gray-400 hover:text-indigo-600 hover:bg-blue-50'
                                            }`}
                                            title="이용 한도 복사"
                                        >
                                            {copiedField === `${item.id}-credit-limit` ? (
                                                <Check size={18} className="animate-pulse" />
                                            ) : (
                                                <Copy size={18} />
                                            )}
                                        </button>
                                    </div>
                                )}
                                
                                {/* 결제일 */}
                                {item.paymentDate && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-600 w-24 flex-shrink-0">결제일</span>
                                        <span className="text-sm font-mono text-gray-800 flex-1 break-all">매월 {item.paymentDate}일</span>
                                        <button
                                            onClick={() => handleCopy(item.paymentDate, '결제일', `${item.id}-payment-date`)}
                                            className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                                                copiedField === `${item.id}-payment-date`
                                                    ? 'bg-green-100 text-green-600 scale-110'
                                                    : 'text-gray-400 hover:text-indigo-600 hover:bg-blue-50'
                                            }`}
                                            title="결제일 복사"
                                        >
                                            {copiedField === `${item.id}-payment-date` ? (
                                                <Check size={18} className="animate-pulse" />
                                            ) : (
                                                <Copy size={18} />
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* 금융 추가 필드 (계좌번호 제외한 다른 커스텀 필드) */}
                                {item.customFields && item.customFields.filter(f => 
                                    !f.field_name?.toLowerCase().includes('계좌') && 
                                    !f.field_name?.toLowerCase().includes('account')
                                ).length > 0 && (
                                    <div className="space-y-3 pt-3 border-t border-blue-200">
                                        {item.customFields.filter(f => 
                                            !f.field_name?.toLowerCase().includes('계좌') && 
                                            !f.field_name?.toLowerCase().includes('account')
                                        ).map((field) => {
                                            const fieldCopyId = `${item.id}-${field.id}`;
                                            return (
                                                <div key={field.id} className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-600 w-24 flex-shrink-0">{field.field_name}</span>
                                                    <span className="text-sm font-mono text-gray-800 flex-1 break-all">{renderTextWithLinks(field.field_value)}</span>
                                                    <button
                                                        onClick={() => handleCopy(field.field_value, field.field_name, fieldCopyId)}
                                                        className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                                                            copiedField === fieldCopyId
                                                                ? 'bg-green-100 text-green-600 scale-110'
                                                                : 'text-gray-400 hover:text-indigo-600 hover:bg-blue-50'
                                                        }`}
                                                        title={`${field.field_name} 복사`}
                                                    >
                                                        {copiedField === fieldCopyId ? (
                                                            <Check size={18} className="animate-pulse" />
                                                        ) : (
                                                            <Copy size={18} />
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 일반 커스텀 필드 (금융 카테고리가 아닐 때) */}
                        {!isFinance && item.customFields && item.customFields.length > 0 && (
                            <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <span>📋</span>
                                    추가 정보
                                </h4>
                                <div className="space-y-2">
                                    {item.customFields.map((field) => {
                                        const fieldCopyId = `${item.id}-${field.id}`;
                                        return (
                                            <div key={field.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-medium text-gray-600 mb-1">{field.field_name}</div>
                                                        <div className="text-sm text-gray-800 font-mono break-all">{renderTextWithLinks(field.field_value)}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCopy(field.field_value, field.field_name, fieldCopyId)}
                                                        className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                                                            copiedField === fieldCopyId
                                                                ? 'bg-green-100 text-green-600 scale-110'
                                                                : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'
                                                        }`}
                                                        title={`${field.field_name} 복사`}
                                                    >
                                                        {copiedField === fieldCopyId ? (
                                                            <Check size={18} className="animate-pulse" />
                                                        ) : (
                                                            <Copy size={18} />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 확장된 계정 목록 (메모 타입이 아닐 때만) */}
                        {!isMemo && isExpanded && hasMultipleAccounts && (
                            <div className="border-t border-gray-100 bg-gray-50/50">
                                {accounts.map((account, idx) => {
                                    const accountKey = `${item.id}-${account.id}`;
                                    const displayName = account.displayName || account.username || '이름 없음';
                                    
                                    return (
                                        <div
                                            key={account.id}
                                            className="px-5 py-3.5 border-b border-gray-100 last:border-b-0 hover:bg-white/50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between gap-4 pl-14">
                                                {/* 왼쪽: 계정 정보 (들여쓰기) */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-medium text-gray-500">
                                                            계정 {idx + 1}
                                                        </span>
                                                        {account.isVerified && (
                                                            <span className="inline-flex items-center text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                                ✓
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-700 mb-1">
                                                        {displayName}
                                                    </div>
                                                    {account.username && (
                                                        <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                                                            <span className="break-all">{account.username}</span>
                                                            <button
                                                                onClick={() => handleCopy(account.username, '사용자명', `${item.id}-${account.id}-expanded-username`)}
                                                                className={`p-1 rounded transition-all flex-shrink-0 ${
                                                                    copiedField === `${item.id}-${account.id}-expanded-username`
                                                                        ? 'bg-green-100 text-green-600 scale-110'
                                                                        : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'
                                                                }`}
                                                                title="사용자명 복사"
                                                            >
                                                                {copiedField === `${item.id}-${account.id}-expanded-username` ? (
                                                                    <Check size={14} className="animate-pulse" />
                                                                ) : (
                                                                    <Copy size={14} />
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {account.memo && (
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {account.memo}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 오른쪽: 비밀번호 */}
                                                {account.password && (
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                                                        <span className="font-mono text-sm text-gray-700 min-w-[80px] text-right break-all">
                                                            {showPassword[accountKey] ? account.password : '••••••••'}
                                                        </span>
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            <button
                                                                onClick={() => togglePasswordVisibility(accountKey)}
                                                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                                                title={showPassword[accountKey] ? '숨기기' : '보기'}
                                                            >
                                                                {showPassword[accountKey] ? (
                                                                    <EyeOff size={16} />
                                                                ) : (
                                                                    <Eye size={16} />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleCopy(account.password, '비밀번호', `${item.id}-${account.id}-expanded-password`)}
                                                                className={`p-1.5 rounded transition-all ${
                                                                    copiedField === `${item.id}-${account.id}-expanded-password`
                                                                        ? 'bg-green-100 text-green-600 scale-110'
                                                                        : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'
                                                                }`}
                                                                title="비밀번호 복사"
                                                            >
                                                                {copiedField === `${item.id}-${account.id}-expanded-password` ? (
                                                                    <Check size={16} className="animate-pulse" />
                                                                ) : (
                                                                    <Copy size={16} />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default VaultCardList;

