import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Check, Users, Circle, XCircle, Copy, Clock, History, ExternalLink } from 'lucide-react';
import { formatNumberWithCommas, parseNumberFromString, formatExpiryDate, formatCardNumber, parseCardNumber } from '../utils/formatUtils';

const EditModal = ({ item, categories = [], financeSubCategories = [], webSubCategories = [], memoSubCategories = [], onSave, onClose, onDuplicate }) => {
    // 카테고리 타입 가져오기
    const getCategoryType = (categoryId) => {
        if (!categoryId || categoryId === 'uncategorized') return 'web';
        const category = categories.find(c => c.id === categoryId);
        return category?.type || 'web';
    };

    // 서브 카테고리 ID 가져오기 (금융 자산 관리용)
    const getSubCategoryId = (categoryId) => {
        if (!categoryId || categoryId === 'uncategorized') return null;
        const category = categories.find(c => c.id === categoryId);
        return category?.id || null;
    };

    // 금융 서브 카테고리 타입 확인 (카드인지 계좌인지)
    const getFinanceSubCategoryType = (categoryId) => {
        if (!categoryId || categoryId === 'uncategorized') return null;
        const category = categories.find(c => c.id === categoryId);
        if (!category || category.type !== 'finance') return null;
        
        // 카드 관련: finance-card
        if (category.id === 'finance-card') return 'card';
        
        // 계좌 관련: finance-bank, finance-loan, finance-other
        if (category.id === 'finance-bank' || category.id === 'finance-loan' || category.id === 'finance-other') return 'account';
        
        // 기본값 (구 하위 호환성을 위한 fallback)
        if (category.id === 'finance-account') return 'account';
        
        return null;
    };

    // 기본 정보 (최우선 선언)
    const [editedItem, setEditedItem] = useState({
        siteName: item?.siteName || item?.title || '',
        url: item?.url || item?.fields?.url || '',
        memo: item?.memo || '',
        categoryId: item?.categoryId || 'uncategorized',
        status: item?.status || 'active',
        tags: item?.tags || [],
        // 금융 전용 필드
        institutionName: item?.institutionName || '', // 기관명
        accountCardNumber: item?.accountCardNumber || '', // 계좌/카드번호
        accountHolder: item?.accountHolder || '', // 예금주/카드주
        expiryDate: item?.expiryDate || '', // 유효기간
        creditLimit: item?.creditLimit || '', // 이용한도
        paymentDate: item?.paymentDate || '', // 결제일
        securityCode: item?.securityCode || '', // 보안번호(CVC/비번)
        // 비밀번호 전용 필드
        serviceName: item?.serviceName || '', // 서비스명
        otpSeedKey: item?.otpSeedKey || '', // OTP/2FA Seed Key
        lastVerifiedAt: item?.lastVerifiedAt || null, // 마지막 검증일
        passwordChangedAt: item?.passwordChangedAt || null, // 비밀번호 변경일
        oldPasswords: item?.oldPasswords || [] // 패스워드 히스토리
    });
    
    // 태그 관리
    const [tagInput, setTagInput] = useState('');

    // currentCategoryType 계산 (editedItem 선언 후)
    const currentCategoryType = getCategoryType(editedItem?.categoryId || 'uncategorized');
    
    // 현재 타입에 맞는 카테고리 목록 가져오기 (editedItem 선언 후)
    const getAvailableCategories = () => {
        const currentType = getCategoryType(editedItem?.categoryId || 'uncategorized');
        if (currentType === 'finance') {
            return financeSubCategories;
        } else if (currentType === 'web') {
            return webSubCategories;
        } else if (currentType === 'memo') {
            return memoSubCategories;
        }
        return [];
    };
    
    // Accounts 배열 (Multi-Account)
    const [accounts, setAccounts] = useState(() => {
        // 기존 구조에서 accounts 추출
        if (item?.accounts && Array.isArray(item.accounts) && item.accounts.length > 0) {
            return item.accounts;
        }
        // 기존 구조 (Single-Account) → 첫 번째 account로 변환
        if (item?.username || item?.password || item?.passwordEncrypted) {
            return [{
                id: `acc_${Date.now()}`,
                username: item?.username || item?.fields?.id || item?.fields?.username || '',
                displayName: '',
                password: item?.password || item?.fields?.password || '',
                memo: item?.memo || '',
                isVerified: item?.isVerified || false,
                verifiedAt: item?.verifiedAt || null
            }];
        }
        return [];
    });

    // 사용자 정의 입력란 (Custom Fields)
    const [customFields, setCustomFields] = useState(
        item?.customFields || []
    );
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldValue, setNewFieldValue] = useState('');

    // 카테고리 변경 시 타입 확인 및 입력 필드 자동 변경
    useEffect(() => {
        if (!editedItem?.categoryId) return;
        
        const categoryType = getCategoryType(editedItem.categoryId);
        // 메모 타입으로 변경 시 accounts 초기화
        if (categoryType === 'memo' && accounts.length > 0) {
            setAccounts([]);
        }
        // 금융 타입으로 변경 시 accounts 초기화 (금융은 accounts 사용 안 함)
        if (categoryType === 'finance' && accounts.length > 0) {
            setAccounts([]);
        }
        // 웹 타입(비밀번호)으로 변경 시 accounts가 비어있으면 기본 account 추가 (신규 항목만)
        if (categoryType === 'web' && accounts.length === 0 && (!item?.id || item?.id?.startsWith('temp_'))) {
            const newAccount = {
                id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                username: '',
                displayName: '',
                password: '',
                memo: '',
                isVerified: false,
                verifiedAt: null
            };
            setAccounts([newAccount]);
        }
    }, [editedItem?.categoryId]);

    // Account 관리
    const handleAddAccount = () => {
        const newAccount = {
            id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            username: '',
            displayName: '',
            password: '',
            memo: '',
            isVerified: false,
            verifiedAt: null
        };
        setAccounts([...accounts, newAccount]);
    };

    const handleDeleteAccount = (accountId) => {
        if (accounts.length === 1) {
            // 마지막 계정은 삭제 불가
            if (!window.confirm('마지막 계정입니다. 정말 삭제하시겠습니까? (사이트 자체는 유지됩니다)')) {
                return;
            }
        }
        setAccounts(accounts.filter(acc => acc.id !== accountId));
    };

    const handleUpdateAccount = (accountId, updates) => {
        setAccounts(accounts.map(acc => 
            acc.id === accountId ? { ...acc, ...updates } : acc
        ));
    };

    const handleToggleVerified = (accountId) => {
        setAccounts(accounts.map(acc => {
            if (acc.id === accountId) {
                return {
                    ...acc,
                    isVerified: !acc.isVerified,
                    verifiedAt: !acc.isVerified ? new Date().toISOString() : null
                };
            }
            return acc;
        }));
    };
    
    // 비밀번호 히스토리 관리 (비밀번호 변경 시)
    const handlePasswordChange = (accountId, newPassword) => {
        const account = accounts.find(acc => acc.id === accountId);
        if (!account) return;
        
        const currentPassword = account.password || '';
        if (currentPassword && currentPassword !== newPassword) {
            // 이전 비밀번호를 히스토리에 추가
            const passwordHistory = editedItem?.oldPasswords || [];
            const updatedHistory = [
                {
                    password: currentPassword,
                    changedAt: editedItem?.passwordChangedAt || new Date().toISOString()
                },
                ...passwordHistory
            ].slice(0, 10); // 최대 10개까지만 저장
            
            setEditedItem({
                ...editedItem,
                oldPasswords: updatedHistory,
                passwordChangedAt: new Date().toISOString()
            });
        }
    };
    
    // 비밀번호 검증일 기록
    const handleVerifyPassword = (accountId) => {
        setEditedItem({
            ...editedItem,
            lastVerifiedAt: new Date().toISOString()
        });
        // accounts의 해당 계정도 업데이트
        setAccounts(accounts.map(acc => 
            acc.id === accountId
                ? { ...acc, isVerified: true, verifiedAt: new Date().toISOString() }
                : acc
        ));
    };

    // Custom Field 관리
    const handleAddField = () => {
        // 항목명이 없어도 빈 필드로 추가 가능 (나중에 입력 가능)
        const newField = {
            id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            field_name: newFieldName.trim() || `필드 ${customFields.length + 1}`,
            field_value: newFieldValue.trim()
        };
        
        setCustomFields([...customFields, newField]);
        setNewFieldName('');
        setNewFieldValue('');
    };

    const handleDeleteField = (fieldId) => {
        setCustomFields(customFields.filter(f => f.id !== fieldId));
    };

    const handleUpdateField = (fieldId, newValue) => {
        setCustomFields(customFields.map(f => 
            f.id === fieldId ? { ...f, field_value: newValue } : f
        ));
    };

    const handleSave = () => {
        const now = new Date().toISOString();
        const status = editedItem?.status || item?.status || 'active';
        const isActive = status === 'active';
        
        // 금융 타입이면 accounts 사용 안 함
        const accountsToSave = currentCategoryType === 'finance' ? [] : (accounts.length > 0 ? accounts : []);
        
        const savedItem = {
            ...(item || {}),
            ...(editedItem || {}),
            accounts: accountsToSave,
            customFields: customFields,
            tags: editedItem?.tags || [],
            updatedAt: now,
            lastModified: now,
            isActive: isActive,
            status: status
        };
        
        // 금융 필드 저장
        if (currentCategoryType === 'finance') {
            savedItem.institutionName = editedItem?.institutionName || '';
            savedItem.accountCardNumber = editedItem?.accountCardNumber || '';
            savedItem.accountHolder = editedItem?.accountHolder || '';
            savedItem.expiryDate = editedItem?.expiryDate || '';
            savedItem.creditLimit = editedItem?.creditLimit || '';
            savedItem.paymentDate = editedItem?.paymentDate || '';
            savedItem.securityCode = editedItem?.securityCode || '';
        }
        
        // 비밀번호 필드 저장 (web 타입)
        if (currentCategoryType === 'web') {
            savedItem.serviceName = editedItem?.serviceName || editedItem?.siteName || '';
            savedItem.otpSeedKey = editedItem?.otpSeedKey || '';
            savedItem.lastVerifiedAt = editedItem?.lastVerifiedAt || null;
            savedItem.passwordChangedAt = editedItem?.passwordChangedAt || null;
            savedItem.oldPasswords = editedItem?.oldPasswords || [];
        }
        
        // 메모 필드 저장 (memo 타입)
        if (currentCategoryType === 'memo') {
            savedItem.memo = editedItem?.memo || '';
            savedItem.tags = editedItem?.tags || [];
            savedItem.siteName = editedItem?.siteName || editedItem?.title || '';
        }
        
        onSave(item?.id || Date.now().toString(), savedItem);
        onClose();
    };

    // 모달 제목 결정
    const getModalTitle = () => {
        if (!item?.id || item?.id?.startsWith('temp_')) {
            // 신규 항목
            if (currentCategoryType === 'finance') {
                return '금융 자산 관리 - 새 항목';
            } else if (currentCategoryType === 'memo') {
                return '메모 관리 - 새 항목';
            } else {
                return '비밀번호 관리 - 새 항목';
            }
        } else {
            // 기존 항목 수정
            if (currentCategoryType === 'finance') {
                return '금융 자산 관리 - 항목 수정';
            } else if (currentCategoryType === 'memo') {
                return '메모 관리 - 항목 수정';
            } else {
                return '비밀번호 관리 - 항목 수정';
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">{getModalTitle()}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* 카테고리 선택 (최상단) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">카테고리 선택</h3>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                카테고리 <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={editedItem?.categoryId || 'uncategorized'}
                                onChange={(e) => setEditedItem({ ...(editedItem || {}), categoryId: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            >
                                <option value="uncategorized">미분류</option>
                                {getAvailableCategories().map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {currentCategoryType === 'finance' && '💳 금융 자산 관리 카테고리'}
                                {currentCategoryType === 'web' && '🔑 비밀번호 관리 카테고리'}
                                {currentCategoryType === 'memo' && '📝 메모 관리 카테고리'}
                            </p>
                        </div>
                    </div>

                    {/* 카테고리별 최상단 필드 */}
                    {currentCategoryType === 'finance' ? (
                        /* 금융 타입: 기관명만 최상단 */
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800">금융 정보</h3>
                                <span className="text-xs text-gray-500 bg-blue-100 text-blue-700 px-2 py-0.5 rounded">금융 자산 관리</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    기관명 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editedItem?.institutionName || editedItem?.siteName || ''}
                                    onChange={(e) => setEditedItem({ ...(editedItem || {}), institutionName: e.target.value, siteName: e.target.value, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="예: 국민은행, 신한카드"
                                    required
                                />
                            </div>
                        </div>
                    ) : currentCategoryType === 'web' ? (
                        /* 비밀번호 타입: 서비스명/표시명 */
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800">서비스 정보</h3>
                                <span className="text-xs text-gray-500 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">비밀번호 관리</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    서비스명 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editedItem?.siteName || editedItem?.serviceName || ''}
                                    onChange={(e) => setEditedItem({ ...(editedItem || {}), siteName: e.target.value, serviceName: e.target.value, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="예: Google, Netflix, GitHub"
                                    required
                                />
                            </div>
                        </div>
                    ) : null}

                    {/* 공통 필드: URL, 카테고리, 상태 (금융/비밀번호만) */}
                    {currentCategoryType !== 'memo' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800">기본 정보</h3>
                            </div>
                            
                            {/* URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={editedItem?.url || ''}
                                        onChange={(e) => setEditedItem({ ...(editedItem || {}), url: e.target.value })}
                                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                        placeholder="https://example.com (선택사항)"
                                    />
                                    {editedItem?.url && editedItem.url.trim() !== '' && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const url = editedItem.url.trim();
                                                if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                                                    window.open(`https://${url}`, '_blank', 'noopener,noreferrer');
                                                } else if (url) {
                                                    window.open(url, '_blank', 'noopener,noreferrer');
                                                }
                                            }}
                                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                            title="새 창에서 열기"
                                        >
                                            <ExternalLink size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 금융 타입 전용 필드 (서브 카테고리별로 다른 필드 표시) */}
                    {currentCategoryType === 'finance' && (() => {
                        const financeSubType = getFinanceSubCategoryType(editedItem?.categoryId || '');
                        const isCard = financeSubType === 'card';
                        const isAccount = financeSubType === 'account';
                        
                        return (
                            <div className="border-t border-gray-200 pt-6">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {isCard ? '카드 정보' : isAccount ? '계좌 정보' : '계좌/카드 정보'}
                                    </h3>
                                    <span className="text-xs text-gray-500 bg-blue-100 text-blue-700 px-2 py-0.5 rounded">금융 자산 관리</span>
                                </div>
                                
                                <div className="space-y-4">
                                    {/* 계좌/카드번호 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {isCard ? '카드번호' : isAccount ? '계좌번호' : '계좌/카드번호'} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formatCardNumber(editedItem?.accountCardNumber || '')}
                                            onChange={(e) => {
                                                const parsed = parseCardNumber(e.target.value);
                                                setEditedItem({ ...(editedItem || {}), accountCardNumber: parsed });
                                            }}
                                            maxLength={19} // 16자리 숫자 + 3개 띄어쓰기
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                                            placeholder={isCard ? "1234 5678 9012 3456" : isAccount ? "110-123-456789" : "1234 5678 9012 3456"}
                                            required
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            {isCard ? "4자리 단위로 자동 띄어쓰기가 적용됩니다" : isAccount ? "계좌번호를 입력하세요" : "4자리 단위로 자동 띄어쓰기가 적용됩니다"}
                                        </p>
                                    </div>
                                    
                                    {/* 예금주/카드주 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {isCard ? '카드주' : isAccount ? '예금주' : '예금주/카드주'} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editedItem?.accountHolder || ''}
                                            onChange={(e) => setEditedItem({ ...(editedItem || {}), accountHolder: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="홍길동"
                                            required
                                        />
                                    </div>
                                    
                                    {/* 카드 전용 필드: 유효기간, 결제일, 이용 한도 */}
                                    {isCard && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* 유효기간 (MM/YY) - 카드 전용 */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        유효기간 (MM/YY) <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editedItem?.expiryDate || ''}
                                                        onChange={(e) => {
                                                            const formatted = formatExpiryDate(e.target.value);
                                                            setEditedItem({ ...(editedItem || {}), expiryDate: formatted });
                                                        }}
                                                        maxLength={5}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                        placeholder="12/25"
                                                        required
                                                    />
                                                </div>
                                                
                                                {/* 결제일 - 카드 전용 */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        결제일 <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="31"
                                                        value={editedItem?.paymentDate || ''}
                                                        onChange={(e) => setEditedItem({ ...(editedItem || {}), paymentDate: e.target.value })}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                        placeholder="25"
                                                        required
                                                    />
                                                    <p className="text-xs text-gray-400 mt-1">매월 결제일 (1-31)</p>
                                                </div>
                                            </div>
                                            
                                            {/* 이용 한도 - 카드 전용 */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    이용 한도 (원) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formatNumberWithCommas(editedItem?.creditLimit || '')}
                                                    onChange={(e) => {
                                                        const parsed = parseNumberFromString(e.target.value);
                                                        setEditedItem({ ...(editedItem || {}), creditLimit: parsed > 0 ? parsed : '' });
                                                    }}
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                    placeholder="5,000,000"
                                                    required
                                                />
                                                <p className="text-xs text-gray-400 mt-1">천 단위 콤마가 자동으로 표시됩니다</p>
                                            </div>
                                        </>
                                    )}
                                    
                                    {/* 보안번호 (CVC/비번) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {isCard ? '보안번호 (CVC)' : isAccount ? '계좌 비밀번호' : '보안번호 (CVC/비번)'}
                                        </label>
                                        <input
                                            type="password"
                                            value={editedItem?.securityCode || ''}
                                            onChange={(e) => setEditedItem({ ...(editedItem || {}), securityCode: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                                            placeholder={isCard ? "123" : isAccount ? "계좌 비밀번호" : "123"}
                                            maxLength={isCard ? 6 : 20}
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            {isCard ? "카드 뒷면의 CVC 3자리 번호" : isAccount ? "계좌 비밀번호" : "카드 CVC 또는 계좌 비밀번호"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* 카테고리 타입에 따른 입력 필드 분기 */}
                    {currentCategoryType === 'memo' ? (
                        /* 메모 타입: 본문 영역 중심 (문서형 템플릿) */
                        <div className="border-t border-gray-200 pt-6 space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800">메모 정보</h3>
                                <span className="text-xs text-gray-500 bg-purple-100 text-purple-700 px-2 py-0.5 rounded">메모 관리</span>
                            </div>
                            
                            {/* 제목 (사이트명 필드 재사용) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    제목 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editedItem?.siteName || editedItem?.title || ''}
                                    onChange={(e) => setEditedItem({ ...(editedItem || {}), siteName: e.target.value, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                    placeholder="문서 제목을 입력하세요"
                                    required
                                />
                            </div>
                            
                            {/* 태그 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">태그</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {(editedItem?.tags || []).map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newTags = [...(editedItem?.tags || [])];
                                                    newTags.splice(index, 1);
                                                    setEditedItem({ ...(editedItem || {}), tags: newTags });
                                                }}
                                                className="hover:text-purple-900"
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const trimmed = tagInput.trim();
                                                if (trimmed && !(editedItem?.tags || []).includes(trimmed)) {
                                                    setEditedItem({ ...(editedItem || {}), tags: [...(editedItem?.tags || []), trimmed] });
                                                    setTagInput('');
                                                }
                                            }
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                        placeholder="태그를 입력하고 Enter를 누르세요"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const trimmed = tagInput.trim();
                                            if (trimmed && !(editedItem?.tags || []).includes(trimmed)) {
                                                setEditedItem({ ...(editedItem || {}), tags: [...(editedItem?.tags || []), trimmed] });
                                                setTagInput('');
                                            }
                                        }}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        추가
                                    </button>
                                </div>
                            </div>
                            
                            {/* 본문 (500px 높이 리치 텍스트 에디터) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    본문 <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={editedItem?.memo || ''}
                                    onChange={(e) => setEditedItem({ ...(editedItem || {}), memo: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-mono text-sm resize-y"
                                    style={{ minHeight: '500px' }}
                                    placeholder="본문 내용을 입력하세요...&#10;&#10;체크리스트: - [ ] 항목&#10;코드 블록: ```code```&#10;이미지 링크: ![alt](url)"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    체크리스트: - [ ] 항목 | 코드 블록: ```code``` | 이미지: ![alt](url)
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* 금융/웹 타입: 계정 정보 입력 */
                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold text-gray-800">로그인 정보</h3>
                                    <span className="text-xs text-gray-500 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">계정 정보</span>
                                </div>
                                {/* 기존 항목 복사 버튼 */}
                                {item?.id && onDuplicate && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (onDuplicate) {
                                                onDuplicate(item);
                                                onClose();
                                            }
                                        }}
                                        className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-2 py-1 border border-indigo-200 rounded hover:bg-indigo-50 transition-colors"
                                        title="이 항목을 템플릿으로 복사"
                                    >
                                        <Copy size={12} />
                                        템플릿 복사
                                    </button>
                                )}
                                <button
                                    onClick={handleAddAccount}
                                    type="button"
                                    className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 font-medium"
                                >
                                    <Plus size={14} />
                                    계정 추가
                                </button>
                            </div>
                        
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                            {accounts.map((account, index) => (
                                <div key={account.id} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-all space-y-3">
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-700">계정 {index + 1}</span>
                                            {account.isVerified && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Check size={12} />
                                                    검증됨
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleVerified(account.id)}
                                                type="button"
                                                className={`p-1.5 rounded-lg transition-colors ${
                                                    account.isVerified
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                }`}
                                                title={account.isVerified ? '검증 취소' : '검증 표시'}
                                            >
                                                <Check size={14} />
                                            </button>
                                            {accounts.length > 1 && (
                                                <button
                                                    onClick={() => handleDeleteAccount(account.id)}
                                                    type="button"
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="계정 삭제"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* 표시명/이름 (최상단) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            표시명/이름 <span className="text-xs font-normal text-gray-500">(선택사항)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={account.displayName || ''}
                                            onChange={(e) => handleUpdateAccount(account.id, { displayName: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                            placeholder="예: 회사 계정, 개인 계정"
                                        />
                                    </div>
                                    
                                    {/* 아이디 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            아이디 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={account.username}
                                            onChange={(e) => handleUpdateAccount(account.id, { username: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                            placeholder="user@email.com 또는 사용자ID"
                                            required
                                        />
                                    </div>
                                    
                                    {/* OTP/2FA Seed Key (첫 번째 계정에만) */}
                                    {index === 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                OTP/2FA Seed Key
                                            </label>
                                            <input
                                                type="text"
                                                value={editedItem?.otpSeedKey || ''}
                                                onChange={(e) => setEditedItem({ ...editedItem, otpSeedKey: e.target.value })}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                                                placeholder="6자리 OTP 생성용 시드 키"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">2단계 인증을 위한 시드 키</p>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            비밀번호 <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={account.password}
                                                onChange={(e) => {
                                                    const oldPassword = account.password;
                                                    handleUpdateAccount(account.id, { password: e.target.value });
                                                    // 비밀번호 변경 감지하여 히스토리에 추가
                                                    if (oldPassword && oldPassword !== e.target.value) {
                                                        handlePasswordChange(account.id, e.target.value);
                                                    }
                                                }}
                                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                                                placeholder="비밀번호"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleVerifyPassword(account.id)}
                                                className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1.5 font-medium"
                                                title="비밀번호 확인 완료 표시"
                                            >
                                                <Check size={14} />
                                                확인
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* 메모 (선택사항) */}
                                    {(account.memo || index === accounts.length - 1) && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                메모 <span className="text-xs font-normal text-gray-500">(선택사항)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={account.memo || ''}
                                                onChange={(e) => handleUpdateAccount(account.id, { memo: e.target.value })}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                placeholder="이 계정에 대한 메모나 설명"
                                            />
                                        </div>
                                    )}
                                    
                                    {/* 상태 정보 (UI 최하단) - 첫 번째 계정에만 */}
                                    {index === 0 && (
                                        <div className="pt-3 mt-3 border-t border-gray-200 space-y-3">
                                            {/* 마지막 검증일 */}
                                            {editedItem?.lastVerifiedAt && (
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <Clock size={14} className="text-gray-400" />
                                                    <span>마지막 검증: {new Date(editedItem.lastVerifiedAt).toLocaleDateString('ko-KR')}</span>
                                                </div>
                                            )}
                                            
                                            {/* 비밀번호 히스토리 */}
                                            {editedItem?.oldPasswords && editedItem.oldPasswords.length > 0 && (
                                                <div className="p-3 bg-gray-50 rounded-lg text-xs">
                                                    <div className="flex items-center gap-1 mb-2">
                                                        <History size={12} className="text-gray-500" />
                                                        <span className="font-medium text-gray-700">비밀번호 히스토리 ({editedItem.oldPasswords.length}개)</span>
                                                    </div>
                                                    <div className="space-y-1 max-h-24 overflow-y-auto">
                                                        {editedItem.oldPasswords.slice(0, 5).map((oldPwd, idx) => (
                                                            <div key={idx} className="text-gray-600">
                                                                {new Date(oldPwd.changedAt).toLocaleDateString('ko-KR')}: ••••••{oldPwd.password.slice(-2)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {accounts.length === 0 && (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                    <div className="text-gray-400 mb-2">
                                        <Users size={32} className="mx-auto mb-2 opacity-50" />
                                    </div>
                                    <p className="text-sm text-gray-500 mb-3">등록된 계정이 없습니다</p>
                                    <button
                                        onClick={handleAddAccount}
                                        type="button"
                                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
                                    >
                                        <Plus size={16} />
                                        첫 계정 추가하기
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    {/* 사용자 정의 입력란 (커스텀 필드) - 모든 타입에 표시 */}
                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-gray-800">사용자 정의 필드</h3>
                                <span className="text-xs text-gray-500 bg-purple-100 text-purple-700 px-2 py-0.5 rounded">커스텀</span>
                            </div>
                            <button
                                onClick={handleAddField}
                                type="button"
                                className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 font-medium"
                            >
                                <Plus size={14} />
                                필드 추가
                            </button>
                        </div>

                        {/* 기존 필드 목록 */}
                        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                            {customFields.map((field, index) => (
                                <div key={field.id} className="p-3 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-all">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1 space-y-2">
                                            {/* 항목명 (필드 이름) */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                                    항목명
                                                </label>
                                                <input
                                                    type="text"
                                                    value={field.field_name}
                                                    onChange={(e) => {
                                                        const updatedFields = customFields.map(f => 
                                                            f.id === field.id ? { ...f, field_name: e.target.value } : f
                                                        );
                                                        setCustomFields(updatedFields);
                                                    }}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                    placeholder="예: 계좌번호, 카드번호, 연락처 등"
                                                />
                                            </div>
                                            {/* 값 */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                                    값
                                                </label>
                                                <input
                                                    type="text"
                                                    value={field.field_value}
                                                    onChange={(e) => handleUpdateField(field.id, e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                                                    placeholder="값을 입력하세요"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteField(field.id)}
                                            type="button"
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 mt-7"
                                            title="필드 삭제"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            
                            {customFields.length === 0 && (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                    <div className="text-gray-400 mb-2">
                                        <Plus size={32} className="mx-auto mb-2 opacity-50" />
                                    </div>
                                    <p className="text-sm text-gray-500 mb-3">추가된 커스텀 필드가 없습니다</p>
                                    <button
                                        onClick={handleAddField}
                                        type="button"
                                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
                                    >
                                        <Plus size={16} />
                                        첫 필드 추가하기
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 빠른 필드 추가 (하단 고정) */}
                        {customFields.length > 0 && (
                            <div className="flex gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                <input
                                    type="text"
                                    value={newFieldName}
                                    onChange={(e) => setNewFieldName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddField()}
                                    placeholder={currentCategoryType === 'finance' ? '항목명 (예: 지점 정보, 담당자 연락처)' : currentCategoryType === 'web' ? '항목명 (예: 복구 코드, 관리자 연락처)' : '항목명 (예: 관련 참고 링크, 파일 경로)'}
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                />
                                <input
                                    type="text"
                                    value={newFieldValue}
                                    onChange={(e) => setNewFieldValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddField()}
                                    placeholder="값"
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                />
                                <button
                                    onClick={handleAddField}
                                    type="button"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 font-medium"
                                    title="필드 추가"
                                >
                                    <Plus size={16} />
                                    추가
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditModal;
