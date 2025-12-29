import React, { useState } from 'react';
import { Star, Clock, Settings, LogOut, Folder, Lock, FileText, ChevronDown, ChevronRight, Plus, CreditCard, User } from 'lucide-react';

const Sidebar = ({ activeCategory, onCategoryChange, stats, onLogout, financeCategories = [], accountCategories = [], memoCategories = [], financeSubCategories = [], webSubCategories = [], memoSubCategories = [], items = [], onOpenSettings, onOpenPasswordGenerator, onQuickAddFinance, onQuickAddAccount, onQuickAddNote, syncStatus, userProfile }) => {
    const [expandedGroups, setExpandedGroups] = useState({
        smartAccess: true,  // SMART ACCESS 그룹 기본 확장
        finance: true,      // 금융 자산 관리 그룹 기본 확장
        'finance-sub': true, // 금융 서브 카테고리 기본 확장
        accounts: true,     // 계정 관리 그룹 기본 확장
        'web-sub': true,    // 비밀번호 서브 카테고리 기본 확장
        notes: true,        // 메모 관리 그룹 기본 확장
        'memo-sub': true    // 메모 서브 카테고리 기본 확장
    });

    const toggleGroup = (groupName) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    // 카테고리별 항목 수 계산
    const getCategoryCount = (categoryId) => {
        if (categoryId === 'favorites') return stats.favorites;
        if (categoryId === 'recent') return stats.recent;
        if (categoryId === 'uncategorized') {
            return items.filter(item => !item.categoryId || item.categoryId === 'uncategorized').length;
        }
        return items.filter(item => item.categoryId === categoryId).length;
    };

    // 카테고리 렌더링 헬퍼
    const renderCategoryButton = (category, isActive) => {
        const count = getCategoryCount(category.id);
        const icon = category.type === 'finance' ? '🏦' : category.type === 'web' ? '🌐' : '📝';
        
        return (
            <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm relative ${
                    isActive
                        ? 'bg-blue-600 text-white font-medium shadow-sm'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
            >
                {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-l-lg"></div>
                )}
                <div className="flex items-center gap-3">
                    <span className="text-base">{icon}</span>
                    <span>{category.name}</span>
                </div>
                {count > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-700 text-slate-300'
                    }`}>
                        {count}
                    </span>
                )}
            </button>
        );
    };

    return (
        <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-screen">
            {/* 로고 */}
            <div className="p-6 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Lock className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white">Make_Pass</h1>
                        <p className="text-xs text-slate-400">인텔리전트 보안 매니저</p>
                    </div>
                </div>
            </div>

            {/* B형 트리 메뉴 */}
            <div className="flex-1 overflow-y-auto py-4">
                <div className="px-3 space-y-3">
                    {/* GROUP 1: SMART ACCESS (고정) */}
                    <div className="mb-6">
                        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            SMART ACCESS
                        </div>
                        <div className="space-y-2">
                            {/* 비밀번호 생성기 */}
                            {onOpenPasswordGenerator && (
                                <button
                                    onClick={onOpenPasswordGenerator}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm relative ${
                                        activeCategory === 'password-generator'
                                            ? 'bg-blue-600 text-white font-medium shadow-sm'
                                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                                >
                                    {activeCategory === 'password-generator' && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-l-lg"></div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <Lock size={16} className={activeCategory === 'password-generator' ? 'text-white' : 'text-slate-400'} />
                                        <span>🔑 비밀번호 생성기</span>
                                    </div>
                                </button>
                            )}
                            <button
                                onClick={() => onCategoryChange('favorites')}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm relative ${
                                    activeCategory === 'favorites'
                                        ? 'bg-blue-600 text-white font-medium shadow-sm'
                                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                }`}
                            >
                                {activeCategory === 'favorites' && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-l-lg"></div>
                                )}
                                <div className="flex items-center gap-3">
                                    <Star size={16} className={activeCategory === 'favorites' ? 'text-white' : 'text-slate-400'} />
                                    <span>⭐ 즐겨찾기</span>
                                </div>
                                {stats.favorites > 0 && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        activeCategory === 'favorites'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-slate-700 text-slate-300'
                                    }`}>
                                        {stats.favorites}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => onCategoryChange('recent')}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm relative ${
                                    activeCategory === 'recent'
                                        ? 'bg-blue-600 text-white font-medium shadow-sm'
                                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                }`}
                            >
                                {activeCategory === 'recent' && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-l-lg"></div>
                                )}
                                <div className="flex items-center gap-3">
                                    <Clock size={16} className={activeCategory === 'recent' ? 'text-white' : 'text-slate-400'} />
                                    <span>🕒 최근 사용</span>
                                </div>
                                {stats.recent > 0 && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        activeCategory === 'recent'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-slate-700 text-slate-300'
                                    }`}>
                                        {stats.recent}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* GROUP 2: 금융 자산 관리 */}
                    <div className="mb-6">
                        <div className="relative group">
                            <div className="w-full flex items-center justify-between px-3 py-2.5 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-all text-sm font-semibold">
                                <button
                                    onClick={() => toggleGroup('finance')}
                                    className="flex-1 flex items-center justify-between text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <CreditCard size={16} />
                                        <span>💳 [금융 자산 관리]</span>
                                    </div>
                                    {expandedGroups.finance ? (
                                        <ChevronDown size={16} />
                                    ) : (
                                        <ChevronRight size={16} />
                                    )}
                                </button>
                                {onQuickAddFinance && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onQuickAddFinance();
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-white ml-2"
                                        title="새 금융 자산 추가"
                                    >
                                        <Plus size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        {expandedGroups.finance && (
                            <div className="mt-2 ml-4 space-y-2">
                                {/* 서브 카테고리만 표시 (상위 카테고리 'finance' 제외) */}
                                {financeSubCategories.length > 0 && (
                                    <div className="space-y-1">
                                        {financeSubCategories.map((subCategory) => 
                                            renderCategoryButton(subCategory, activeCategory === subCategory.id)
                                        )}
                                    </div>
                                )}
                                {/* 상위 카테고리가 아닌 다른 finance 카테고리들 (있다면) */}
                                {financeCategories.filter(cat => cat.id !== 'finance').map((category) => 
                                    renderCategoryButton(category, activeCategory === category.id)
                                )}
                            </div>
                        )}
                    </div>

                    {/* GROUP 3: 비밀번호 관리 */}
                    <div className="mb-6">
                        <div className="relative group">
                            <div className="w-full flex items-center justify-between px-3 py-2.5 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-all text-sm font-semibold">
                                <button
                                    onClick={() => toggleGroup('accounts')}
                                    className="flex-1 flex items-center justify-between text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <Lock size={16} />
                                        <span>🔑 [비밀번호 관리]</span>
                                    </div>
                                    {expandedGroups.accounts ? (
                                        <ChevronDown size={16} />
                                    ) : (
                                        <ChevronRight size={16} />
                                    )}
                                </button>
                                {onQuickAddAccount && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onQuickAddAccount();
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-white ml-2"
                                        title="새 계정 추가"
                                    >
                                        <Plus size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        {expandedGroups.accounts && (
                            <div className="mt-2 ml-4 space-y-2">
                                {/* 서브 카테고리만 표시 (상위 카테고리 'web' 제외) */}
                                {webSubCategories.length > 0 && (
                                    <div className="space-y-1">
                                        {webSubCategories.map((subCategory) => 
                                            renderCategoryButton(subCategory, activeCategory === subCategory.id)
                                        )}
                                    </div>
                                )}
                                {/* 상위 카테고리가 아닌 다른 web 카테고리들 (있다면) */}
                                {accountCategories.filter(cat => cat.id !== 'web').map((category) => 
                                    renderCategoryButton(category, activeCategory === category.id)
                                )}
                                {/* 미분류 (비밀번호 관리 섹션 하단) */}
                                <button
                                    onClick={() => onCategoryChange('uncategorized')}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm relative ${
                                        activeCategory === 'uncategorized'
                                            ? 'bg-blue-600 text-white font-medium shadow-sm'
                                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                                >
                                    {activeCategory === 'uncategorized' && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-l-lg"></div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <Folder size={16} className={activeCategory === 'uncategorized' ? 'text-white' : 'text-slate-400'} />
                                        <span>미분류</span>
                                    </div>
                                    {getCategoryCount('uncategorized') > 0 && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            activeCategory === 'uncategorized'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-slate-700 text-slate-300'
                                        }`}>
                                            {getCategoryCount('uncategorized')}
                                        </span>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* GROUP 4: 메모 관리 */}
                    <div className="mb-6">
                        <div className="relative group">
                            <div className="w-full flex items-center justify-between px-3 py-2.5 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-all text-sm font-semibold">
                                <button
                                    onClick={() => toggleGroup('notes')}
                                    className="flex-1 flex items-center justify-between text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText size={16} />
                                        <span>📝 [메모 관리]</span>
                                    </div>
                                    {expandedGroups.notes ? (
                                        <ChevronDown size={16} />
                                    ) : (
                                        <ChevronRight size={16} />
                                    )}
                                </button>
                                {onQuickAddNote && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onQuickAddNote();
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-white ml-2"
                                        title="새 메모 추가"
                                    >
                                        <Plus size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        {expandedGroups.notes && (
                            <div className="mt-2 ml-4 space-y-2">
                                {/* 서브 카테고리만 표시 (상위 카테고리 'memo' 제외) */}
                                {memoSubCategories.length > 0 && (
                                    <div className="space-y-1">
                                        {memoSubCategories.map((subCategory) => 
                                            renderCategoryButton(subCategory, activeCategory === subCategory.id)
                                        )}
                                    </div>
                                )}
                                {/* 상위 카테고리가 아닌 다른 memo 카테고리들 (있다면) */}
                                {memoCategories.filter(cat => cat.id !== 'memo').map((category) => 
                                    renderCategoryButton(category, activeCategory === category.id)
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FOOTER (시스템 제어) */}
            <div className="border-t border-slate-700 p-3 space-y-2">
                {/* 사용자 프로필 정보 */}
                {userProfile && (
                    <div 
                        onClick={onLogout}
                        className="px-3 py-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 cursor-pointer transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            {/* 프로필 이미지 */}
                            <div className="relative">
                                {userProfile.imageUrl ? (
                                    <img 
                                        src={userProfile.imageUrl} 
                                        alt={userProfile.name || 'User'} 
                                        className="w-10 h-10 rounded-full object-cover border-2 border-slate-600 group-hover:border-slate-500 transition-colors"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center border-2 border-slate-600 group-hover:border-slate-500 transition-colors">
                                        <User size={20} className="text-white" />
                                    </div>
                                )}
                                {/* 동기화 상태 표시등 (초록색) */}
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800" title="구글 드라이브 동기화 중"></div>
                            </div>
                            
                            {/* 사용자 정보 */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-white truncate">
                                        {userProfile.name || '사용자'}
                                    </p>
                                </div>
                                <p className="text-xs text-slate-400 truncate">
                                    {userProfile.email || ''}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 구글 동기화 상태 인디케이터 (사용자 프로필이 없는 경우에만 표시) */}
                {!userProfile && typeof syncStatus !== 'undefined' && (
                    <div className="px-3 py-2 rounded-lg bg-slate-700/50">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400">구글 동기화</span>
                            {syncStatus?.isSyncing ? (
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            ) : syncStatus?.error ? (
                                <div className="w-2 h-2 bg-red-500 rounded-full" title={syncStatus.error}></div>
                            ) : (
                                <div className="w-2 h-2 bg-green-500 rounded-full" title="동기화 완료"></div>
                            )}
                        </div>
                        {syncStatus?.lastSyncTime && (
                            <p className="text-xs text-slate-500">
                                {new Date(syncStatus.lastSyncTime).toLocaleTimeString('ko-KR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })} 동기화
                            </p>
                        )}
                    </div>
                )}

                {/* 설정 */}
                {onOpenSettings && (
                    <button
                        onClick={onOpenSettings}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-all text-sm"
                    >
                        <Settings size={18} />
                        <span>⚙️ 설정</span>
                    </button>
                )}

                {/* 로그아웃 버튼 (사용자 프로필이 없는 경우에만 표시) */}
                {!userProfile && (
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-all text-sm"
                    >
                        <Lock size={18} />
                        <span>🔒 잠금</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default Sidebar;