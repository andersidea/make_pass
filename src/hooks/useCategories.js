import { useState, useEffect } from 'react';
import { encryptData, decryptData } from '../utils/encryption';
import persistentStorage from '../utils/storage';

// 프로덕션 환경 체크
const isDevelopment = process.env.NODE_ENV !== 'production';

// 기본 시스템 카테고리 정의
const DEFAULT_CATEGORIES = [
    // 메인 카테고리
    { id: 'finance', name: '금융 자산 관리', type: 'finance', order: 0, isSystem: true, parentId: null },
    { id: 'web', name: '비밀번호 관리', type: 'web', order: 1, isSystem: true, parentId: null },
    { id: 'memo', name: '메모 관리', type: 'memo', order: 2, isSystem: true, parentId: null },
    
    // 금융 자산 관리 하부 카테고리
    { id: 'finance-bank', name: '은행 계좌', type: 'finance', order: 0, isSystem: true, parentId: 'finance' },
    { id: 'finance-card', name: '신용/체크 카드', type: 'finance', order: 1, isSystem: true, parentId: 'finance' },
    { id: 'finance-loan', name: '대출/보험', type: 'finance', order: 2, isSystem: true, parentId: 'finance' },
    { id: 'finance-other', name: '기타 자산', type: 'finance', order: 3, isSystem: true, parentId: 'finance' },
    
    // 비밀번호 관리 하부 카테고리
    { id: 'web-shopping', name: '쇼핑/커머스', type: 'web', order: 0, isSystem: true, parentId: 'web' },
    { id: 'web-portal', name: '포털/이메일', type: 'web', order: 1, isSystem: true, parentId: 'web' },
    { id: 'web-finance', name: '금융/공공', type: 'web', order: 2, isSystem: true, parentId: 'web' },
    { id: 'web-work', name: '업무/협업', type: 'web', order: 3, isSystem: true, parentId: 'web' },
    
    // 메모 관리 하부 카테고리
    { id: 'memo-idea', name: '업무 아이디어', type: 'memo', order: 0, isSystem: true, parentId: 'memo' },
    { id: 'memo-personal', name: '개인 기록', type: 'memo', order: 1, isSystem: true, parentId: 'memo' },
    { id: 'memo-meeting', name: '프로젝트 회의록', type: 'memo', order: 2, isSystem: true, parentId: 'memo' },
    { id: 'memo-scrap', name: '스크랩', type: 'memo', order: 3, isSystem: true, parentId: 'memo' }
];

export const useCategories = (masterPassword) => {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 데이터 로드 및 기본 카테고리 초기화
    useEffect(() => {
        if (!masterPassword) {
            setIsLoading(false);
            return;
        }

        try {
            // 데이터 존재 여부 확인 (강화된 체크)
            if (!persistentStorage.hasItem('categories_data')) {
                // 최초 실행 시 기본 카테고리로 초기화
                setCategories(DEFAULT_CATEGORIES);
                setIsLoading(false);
                return;
            }

            const encryptedData = persistentStorage.getItem('categories_data');
            if (encryptedData) {
                const decrypted = decryptData(encryptedData, masterPassword);
                if (decrypted && Array.isArray(decrypted)) {
                    // 기본 카테고리와 병합 (기본 카테고리가 없으면 추가)
                    const merged = [...decrypted];
                    DEFAULT_CATEGORIES.forEach(defaultCat => {
                        const exists = merged.find(c => c.id === defaultCat.id);
                        if (!exists) {
                            merged.push(defaultCat);
                        } else {
                            // 기본 카테고리의 isSystem 플래그 유지
                            const index = merged.findIndex(c => c.id === defaultCat.id);
                            merged[index] = { ...merged[index], isSystem: true };
                        }
                    });
                    setCategories(merged);
                } else {
                    // 최초 실행 시 기본 카테고리로 초기화
                    setCategories(DEFAULT_CATEGORIES);
                }
            } else {
                setCategories(DEFAULT_CATEGORIES);
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('Failed to load categories:', error);
            }
            setCategories(DEFAULT_CATEGORIES);
        } finally {
            setIsLoading(false);
        }
    }, [masterPassword]);

    // 데이터 저장
    useEffect(() => {
        if (!masterPassword || isLoading) return;

        try {
            const encrypted = encryptData(categories, masterPassword);
            if (encrypted) {
                const saved = persistentStorage.setItem('categories_data', encrypted);
                if (!saved && process.env.NODE_ENV !== 'production') {
                    console.error('Failed to save categories: Storage quota exceeded or error');
                }
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('Failed to save categories:', error);
            }
        }
    }, [categories, masterPassword, isLoading]);

    // 카테고리 생성
    const createCategory = (name, type = 'web', order = 0, parentId = null) => {
        const newCategory = {
            id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name.trim(),
            type: type, // 'finance' | 'web' | 'memo'
            order: order !== undefined ? order : (categories.length > 0 ? Math.max(...categories.map(c => c.order || 0)) + 1 : 0),
            isSystem: false,
            parentId: parentId || null // 서브 카테고리의 부모 ID
        };
        setCategories(prev => [...prev, newCategory]);
        return newCategory.id;
    };

    // 카테고리 수정
    const updateCategory = (id, updates) => {
        setCategories(prev => prev.map(cat => {
            if (cat.id === id) {
                // 시스템 카테고리는 id와 type은 변경 불가 (name, order만 변경 가능)
                if (cat.isSystem) {
                    const { id: _, type: __, ...allowedUpdates } = updates;
                    return { ...cat, ...allowedUpdates };
                }
                return { ...cat, ...updates };
            }
            return cat;
        }));
    };

    // 카테고리 순서 변경 (드래그 앤 드롭)
    const reorderCategories = (newOrder) => {
        const ordered = newOrder.map((id, index) => {
            const category = categories.find(c => c.id === id);
            return category ? { ...category, order: index } : null;
        }).filter(Boolean);
        setCategories(ordered);
    };

    // 카테고리 삭제
    const deleteCategory = (id) => {
        // 시스템 카테고리는 삭제 불가
        const category = categories.find(c => c.id === id);
        if (category?.isSystem) {
            if (isDevelopment) {
                console.warn('Cannot delete system category:', id);
            }
            return;
        }
        setCategories(prev => prev.filter(cat => cat.id !== id));
    };

    // 카테고리 트리 구조 생성 헬퍼
    const buildCategoryTree = (cats, parentId = null) => {
        return cats
            .filter(cat => (cat.parentId || null) === parentId)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(cat => ({
                ...cat,
                children: buildCategoryTree(cats, cat.id)
            }));
    };

    // 금융 자산 관리 그룹 카테고리 (finance 타입, parentId가 null인 최상위만)
    const financeCategories = categories.filter(cat => cat.type === 'finance' && !cat.parentId);
    
    // 계정 관리 그룹 카테고리 (web 타입만, finance 제외)
    const accountCategories = categories.filter(cat => cat.type === 'web' && !cat.parentId);
    
    // 메모 관리 그룹 카테고리 (memo 타입)
    const memoCategories = categories.filter(cat => cat.type === 'memo' && !cat.parentId);

    // 금융 자산 관리 서브 카테고리 (parentId가 'finance'인 카테고리)
    const financeSubCategories = categories.filter(cat => cat.parentId === 'finance');
    
    // 비밀번호 관리 서브 카테고리 (parentId가 'web'인 카테고리)
    const webSubCategories = categories.filter(cat => cat.parentId === 'web');
    
    // 메모 관리 서브 카테고리 (parentId가 'memo'인 카테고리)
    const memoSubCategories = categories.filter(cat => cat.parentId === 'memo');

    return {
        categories: categories.sort((a, b) => (a.order || 0) - (b.order || 0)), // order로 정렬
        financeCategories: financeCategories.sort((a, b) => (a.order || 0) - (b.order || 0)),
        accountCategories: accountCategories.sort((a, b) => (a.order || 0) - (b.order || 0)),
        memoCategories: memoCategories.sort((a, b) => (a.order || 0) - (b.order || 0)),
        financeSubCategories: financeSubCategories.sort((a, b) => (a.order || 0) - (b.order || 0)),
        webSubCategories: webSubCategories.sort((a, b) => (a.order || 0) - (b.order || 0)),
        memoSubCategories: memoSubCategories.sort((a, b) => (a.order || 0) - (b.order || 0)),
        buildCategoryTree, // 카테고리 트리 구조 생성 헬퍼
        isLoading,
        createCategory,
        updateCategory,
        deleteCategory,
        reorderCategories
    };
};