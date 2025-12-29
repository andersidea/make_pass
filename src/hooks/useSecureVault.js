import { useState, useEffect } from 'react';
import { encryptData, decryptData, decryptAccounts, encryptAccounts } from '../utils/encryption';
import { migrateData } from '../utils/passwordUtils';
import { searchItems as smartSearch } from '../utils/smartSearch';
import persistentStorage from '../utils/storage';

// 프로덕션 환경 체크
const isDevelopment = process.env.NODE_ENV !== 'production';

export const useSecureVault = (masterPassword) => {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 데이터 로드 및 마이그레이션
    useEffect(() => {
        if (!masterPassword) {
            setIsLoading(false);
            return;
        }

        try {
            // 데이터 존재 여부 확인 (강화된 체크)
            if (!persistentStorage.hasItem('vault_data')) {
                setIsLoading(false);
                return;
            }

            const encryptedData = persistentStorage.getItem('vault_data');
            if (encryptedData) {
                const decrypted = decryptData(encryptedData, masterPassword);
                if (decrypted && Array.isArray(decrypted)) {
                    // 데이터 마이그레이션 (Single-Account → Multi-Account)
                    const migratedItems = migrateData(decrypted, masterPassword);
                    
                    // accounts 복호화 (UI에서 사용하기 위해)
                    const itemsWithAccounts = migratedItems.map(item => {
                        if (item.accountsEncrypted && !item.accounts) {
                            return {
                                ...item,
                                accounts: decryptAccounts(item.accountsEncrypted, masterPassword)
                            };
                        }
                        return item;
                    });
                    
                    setItems(itemsWithAccounts);
                }
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('Failed to load vault data:', error);
            }
        } finally {
            setIsLoading(false);
        }
    }, [masterPassword]);

    // 데이터 저장 (accounts를 accountsEncrypted로 변환)
    useEffect(() => {
        if (!masterPassword || isLoading) return;

        try {
            // accounts를 accountsEncrypted로 변환하여 저장
            const itemsToSave = items.map(item => {
                const { accounts, ...rest } = item;
                
                // accounts가 있으면 암호화 (없으면 기존 accountsEncrypted 유지)
                let accountsEncrypted = item.accountsEncrypted || '';
                if (accounts && Array.isArray(accounts) && accounts.length > 0) {
                    accountsEncrypted = encryptAccounts(accounts, masterPassword);
                }
                
                return {
                    ...rest,
                    accountsEncrypted
                };
            });
            
            const encrypted = encryptData(itemsToSave, masterPassword);
            if (encrypted) {
                const saved = persistentStorage.setItem('vault_data', encrypted);
                if (!saved && process.env.NODE_ENV !== 'production') {
                    console.error('Failed to save vault data: Storage quota exceeded or error');
                }
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('Failed to save vault data:', error);
            }
        }
    }, [items, masterPassword, isLoading]);

    const addItem = (item) => {
        const now = new Date().toISOString();
        const newItem = {
            id: item.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
            siteName: item.siteName || '',
            url: item.url || '',
            categoryId: item.categoryId || 'uncategorized',
            accounts: item.accounts || [], // UI에서 사용
            accountsEncrypted: item.accountsEncrypted || '', // 저장용
            customFields: item.customFields || [],
            memo: item.memo || '',
            createdAt: item.createdAt || now,
            updatedAt: item.updatedAt || now,
            lastModified: item.lastModified || now, // 수정일 (명시적)
            isActive: item.isActive !== undefined ? item.isActive : (item.status === 'active'), // 활성 상태
            status: item.status || 'active', // 호환성을 위해 유지
            ...item
        };
        setItems(prev => [newItem, ...prev]);
        return newItem.id;
    };

    const updateItem = (id, updates) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const now = new Date().toISOString();
                // status와 isActive 동기화
                const status = updates.status || item.status || 'active';
                const isActive = updates.isActive !== undefined ? updates.isActive : (status === 'active');
                return { 
                    ...item, 
                    ...updates,
                    lastModified: now, // 수정일 자동 업데이트
                    updatedAt: now, // 호환성 유지
                    isActive: isActive,
                    status: status
                };
            }
            return item;
        }));
    };

    const deleteItem = (id) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const searchItems = (query) => {
        return smartSearch(items, query);
    };

    return {
        items,
        isLoading,
        addItem,
        updateItem,
        deleteItem,
        searchItems
    };
};
