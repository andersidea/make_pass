/**
 * Google Drive 동기화를 지원하는 Secure Vault Hook
 * 마스터 비밀번호 또는 Google OAuth 사용자 ID를 암호화 키로 사용
 */

import { useState, useEffect, useRef } from 'react';
import { encryptData, decryptData, decryptAccounts, encryptAccounts } from '../utils/encryption';
import { migrateData } from '../utils/passwordUtils';
import { searchItems as smartSearch } from '../utils/smartSearch';
import persistentStorage from '../utils/storage';
import { loadVaultFromDrive, saveVaultToDrive, isSignedIn } from '../utils/driveSync';
import { driveSyncManager } from '../utils/driveSyncManager';

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * useSecureVault with Google Drive Sync
 * @param {string} encryptionKey - 마스터 비밀번호 또는 Google 사용자 ID
 * @param {boolean} useDriveSync - Google Drive 동기화 사용 여부
 */
export const useSecureVaultWithDrive = (encryptionKey, useDriveSync = false) => {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialSync, setIsInitialSync] = useState(false);
    const hasLoadedRef = useRef(false); // 이미 로드했는지 추적

    // Initial Sync: 로그인 직후 Drive에서 데이터 로드 (키 생성 대기 로직 포함)
    useEffect(() => {
        // 키가 없거나 동기화를 사용하지 않으면 대기
        if (!encryptionKey || !useDriveSync) {
            if (!encryptionKey) {
                setIsLoading(false);
                if (isDevelopment) {
                    console.log('⏳ encryptionKey 대기 중... (초기 동기화 보류)');
                }
            }
            return;
        }

        // encryptionKey가 변경되었을 때만 다시 로드 (같은 키면 중복 로드 방지)
        const currentKey = encryptionKey;
        if (hasLoadedRef.current === currentKey) {
            // 이미 같은 키로 로드했으면 스킵
            return;
        }

        // 키가 유효한지 확인 (타입 및 빈 문자열 체크)
        if (typeof encryptionKey !== 'string' || encryptionKey.trim() === '') {
            if (isDevelopment) {
                console.warn('⚠️ encryptionKey가 유효하지 않습니다:', encryptionKey);
            }
            setIsLoading(false);
            return;
        }

        // 로드 시작 마크
        hasLoadedRef.current = currentKey;
        setIsInitialSync(true);

        const loadFromDrive = async () => {
            try {
                if (!isSignedIn()) {
                    setIsLoading(false);
                    setIsInitialSync(false);
                    return;
                }

                // 암호화 키 설정 (키가 준비된 후에만 실행)
                // 주의: App.jsx의 useEffect에서도 설정하지만, 여기서도 명시적으로 설정하여 순서 보장
                if (encryptionKey && typeof encryptionKey === 'string' && encryptionKey.trim() !== '') {
                    driveSyncManager.setEncryptionKey(encryptionKey);
                    if (isDevelopment) {
                        console.log('✅ encryptionKey가 driveSyncManager에 설정되었습니다. 초기 동기화 시작...');
                    }
                } else {
                    if (isDevelopment) {
                        console.warn('⚠️ encryptionKey가 유효하지 않아 초기 동기화를 중단합니다.');
                    }
                    setIsLoading(false);
                    setIsInitialSync(false);
                    return;
                }

                // 로드 상태 고정: 로컬 캐시를 먼저 로드하여 이전 상태 유지
                let localCacheData = null;
                if (persistentStorage.hasItem('vault_data')) {
                    try {
                        const encryptedData = persistentStorage.getItem('vault_data');
                        if (encryptedData) {
                            const decrypted = decryptData(encryptedData, encryptionKey);
                            if (decrypted && Array.isArray(decrypted)) {
                                const migratedItems = migrateData(decrypted, encryptionKey);
                                const itemsWithAccounts = migratedItems.map(item => {
                                    if (item.accountsEncrypted && !item.accounts) {
                                        try {
                                            return {
                                                ...item,
                                                accounts: decryptAccounts(item.accountsEncrypted, encryptionKey)
                                            };
                                        } catch (e) {
                                            return { ...item, accounts: [] };
                                        }
                                    }
                                    return item;
                                });
                                localCacheData = itemsWithAccounts;
                                setItems(itemsWithAccounts); // 로컬 캐시 데이터로 먼저 채움
                                if (isDevelopment) {
                                    console.log(`📦 로컬 캐시에서 ${itemsWithAccounts.length}개 항목 로드 완료 (Drive 동기화 대기 중...)`);
                                }
                            }
                        }
                    } catch (localError) {
                        if (isDevelopment) {
                            console.warn('⚠️ 로컬 캐시 로드 실패:', localError);
                        }
                    }
                }

                // Drive에서 vault.json 로드 (복호화 포함)
                if (isDevelopment) {
                    console.log('🔄 Google Drive에서 vault.json 로드 시작...');
                }
                const driveData = await loadVaultFromDrive(encryptionKey);
                
                if (driveData && Array.isArray(driveData)) {
                    if (isDevelopment) {
                        console.log(`✅ Drive에서 ${driveData.length}개 항목 로드 완료`);
                    }
                    // 데이터 마이그레이션 (Single-Account → Multi-Account)
                    const migratedItems = migrateData(driveData, encryptionKey);
                    
                    // accounts 복호화 (UI에서 사용하기 위해)
                    const itemsWithAccounts = migratedItems.map(item => {
                        if (item.accountsEncrypted && !item.accounts) {
                            try {
                                return {
                                    ...item,
                                    accounts: decryptAccounts(item.accountsEncrypted, encryptionKey)
                                };
                            } catch (e) {
                                if (isDevelopment) {
                                    console.warn('Failed to decrypt accounts for item:', item.id, e);
                                }
                                return { ...item, accounts: [] };
                            }
                        }
                        return item;
                    });
                    
                    setItems(itemsWithAccounts);
                    
                    if (isDevelopment) {
                        console.log(`✅ ${itemsWithAccounts.length}개 항목이 vault 상태에 설정되었습니다.`);
                        console.log('📊 항목 타입별 통계:', {
                            finance: itemsWithAccounts.filter(i => i.type === 'finance').length,
                            web: itemsWithAccounts.filter(i => i.type === 'web').length,
                            memo: itemsWithAccounts.filter(i => i.type === 'memo').length
                        });
                    }
                    
                    // 로컬 캐시에도 저장 (오프라인 지원)
                    const encrypted = encryptData(itemsWithAccounts, encryptionKey);
                    if (encrypted) {
                        persistentStorage.setItem('vault_data', encrypted);
                    }
                } else {
                    // Drive에 데이터가 없으면 로컬 캐시는 이미 로드했으므로 확인 필요 없음
                    if (!localCacheData && persistentStorage.hasItem('vault_data')) {
                        const encryptedData = persistentStorage.getItem('vault_data');
                        if (encryptedData) {
                            try {
                                const decrypted = decryptData(encryptedData, encryptionKey);
                                if (decrypted && Array.isArray(decrypted)) {
                                    const migratedItems = migrateData(decrypted, encryptionKey);
                                    const itemsWithAccounts = migratedItems.map(item => {
                                        if (item.accountsEncrypted && !item.accounts) {
                                            try {
                                                return {
                                                    ...item,
                                                    accounts: decryptAccounts(item.accountsEncrypted, encryptionKey)
                                                };
                                            } catch (e) {
                                                return { ...item, accounts: [] };
                                            }
                                        }
                                        return item;
                                    });
                                    setItems(itemsWithAccounts);
                                    
                                    // Drive에 업로드 (초기 동기화)
                                    const itemsToSave = itemsWithAccounts.map(item => {
                                        const { accounts, ...rest } = item;
                                        let accountsEncrypted = item.accountsEncrypted || '';
                                        if (accounts && Array.isArray(accounts) && accounts.length > 0) {
                                            accountsEncrypted = encryptAccounts(accounts, encryptionKey);
                                        }
                                        return { ...rest, accountsEncrypted };
                                    });
                                    // Drive에 업로드 (암호화 포함)
                                    // 가드 로직: encryptionKey가 유효할 때만 실행
                                    if (encryptionKey && typeof encryptionKey === 'string' && encryptionKey.trim() !== '') {
                                        await saveVaultToDrive(itemsToSave, encryptionKey);
                                    }
                                }
                            } catch (error) {
                                if (isDevelopment) {
                                    console.error('Failed to load from local cache:', error);
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                if (isDevelopment) {
                    console.error('Failed to load from Drive:', error);
                }
                // Drive 로드 실패 시 로컬 캐시 시도
                if (persistentStorage.hasItem('vault_data')) {
                    try {
                        const encryptedData = persistentStorage.getItem('vault_data');
                        if (encryptedData) {
                            const decrypted = decryptData(encryptedData, encryptionKey);
                            if (decrypted && Array.isArray(decrypted)) {
                                const migratedItems = migrateData(decrypted, encryptionKey);
                                const itemsWithAccounts = migratedItems.map(item => {
                                    if (item.accountsEncrypted && !item.accounts) {
                                        try {
                                            return {
                                                ...item,
                                                accounts: decryptAccounts(item.accountsEncrypted, encryptionKey)
                                            };
                                        } catch (e) {
                                            return { ...item, accounts: [] };
                                        }
                                    }
                                    return item;
                                });
                                setItems(itemsWithAccounts);
                            }
                        }
                    } catch (localError) {
                        if (isDevelopment) {
                            console.error('Failed to load from local cache:', localError);
                        }
                    }
                }
            } finally {
                setIsLoading(false);
                setIsInitialSync(false);
            }
        };

        loadFromDrive();
    }, [encryptionKey, useDriveSync]);

    // 마스터 비밀번호 방식: 로컬 저장소에서 로드
    useEffect(() => {
        if (!encryptionKey || useDriveSync || !isInitialMount.current) {
            return;
        }

        isInitialMount.current = false;

        try {
            if (!persistentStorage.hasItem('vault_data')) {
                setIsLoading(false);
                return;
            }

            const encryptedData = persistentStorage.getItem('vault_data');
            if (encryptedData) {
                const decrypted = decryptData(encryptedData, encryptionKey);
                if (decrypted && Array.isArray(decrypted)) {
                    const migratedItems = migrateData(decrypted, encryptionKey);
                    const itemsWithAccounts = migratedItems.map(item => {
                        if (item.accountsEncrypted && !item.accounts) {
                            try {
                                return {
                                    ...item,
                                    accounts: decryptAccounts(item.accountsEncrypted, encryptionKey)
                                };
                            } catch (e) {
                                return { ...item, accounts: [] };
                            }
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
    }, [encryptionKey, useDriveSync]);

    // Auto Save: 항목 변경 시 자동 저장 (디바운스)
    useEffect(() => {
        if (!encryptionKey || isLoading || isInitialSync) return;

        try {
            // accounts를 accountsEncrypted로 변환
            const itemsToSave = items.map(item => {
                const { accounts, ...rest } = item;
                let accountsEncrypted = item.accountsEncrypted || '';
                if (accounts && Array.isArray(accounts) && accounts.length > 0) {
                    accountsEncrypted = encryptAccounts(accounts, encryptionKey);
                }
                return { ...rest, accountsEncrypted };
            });

            // 로컬 저장소에 저장
            const encrypted = encryptData(itemsToSave, encryptionKey);
            if (encrypted) {
                persistentStorage.setItem('vault_data', encrypted);
            }

            // Google Drive 동기화 (디바운스)
            // encryptionKey가 유효하고 driveSyncManager에도 설정되어 있을 때만 실행
            if (useDriveSync && encryptionKey && typeof encryptionKey === 'string' && encryptionKey.trim() !== '') {
                // driveSyncManager에 키가 설정되어 있는지 확인
                const managerKey = driveSyncManager.encryptionKey;
                if (!managerKey || managerKey !== encryptionKey) {
                    // 키가 설정되지 않았거나 다른 키가 설정된 경우 재설정
                    if (isDevelopment) {
                        console.log('🔑 driveSyncManager에 encryptionKey 재설정:', encryptionKey);
                    }
                    driveSyncManager.setEncryptionKey(encryptionKey);
                }
                
                if (isSignedIn()) {
                    driveSyncManager.scheduleSave(itemsToSave);
                } else {
                    if (isDevelopment) {
                        console.warn('⚠️ Google 로그인이 필요합니다. 동기화를 건너뜁니다.');
                    }
                }
            } else {
                if (isDevelopment) {
                    console.warn('⚠️ encryptionKey가 유효하지 않아 동기화를 건너뜁니다.');
                }
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('Failed to save vault data:', error);
            }
        }
    }, [items, encryptionKey, isLoading, isInitialSync, useDriveSync]);

    const addItem = (item) => {
        const now = new Date().toISOString();
        const newItem = {
            id: item.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
            siteName: item.siteName || '',
            url: item.url || '',
            categoryId: item.categoryId || 'uncategorized',
            accounts: item.accounts || [],
            accountsEncrypted: item.accountsEncrypted || '',
            customFields: item.customFields || [],
            memo: item.memo || '',
            createdAt: item.createdAt || now,
            updatedAt: item.updatedAt || now,
            lastModified: item.lastModified || now,
            isActive: item.isActive !== undefined ? item.isActive : (item.status === 'active'),
            status: item.status || 'active',
            ...item
        };
        
        // 상태 업데이트 및 즉시 저장 (Force Save)
        setItems(prev => {
            const updatedItems = [newItem, ...prev];
            
            // 즉시 저장 (Force Save): addItem 성공 시 scheduleSave 대신 즉시 호출
            if (useDriveSync && encryptionKey && typeof encryptionKey === 'string' && encryptionKey.trim() !== '') {
                // accounts를 accountsEncrypted로 변환
                const itemsToSave = updatedItems.map(item => {
                    const { accounts, ...rest } = item;
                    let accountsEncrypted = item.accountsEncrypted || '';
                    if (accounts && Array.isArray(accounts) && accounts.length > 0) {
                        accountsEncrypted = encryptAccounts(accounts, encryptionKey);
                    }
                    return { ...rest, accountsEncrypted };
                });
                
                // driveSyncManager에 키 확인 및 설정
                const managerKey = driveSyncManager.encryptionKey;
                if (!managerKey || managerKey !== encryptionKey) {
                    driveSyncManager.setEncryptionKey(encryptionKey);
                }
                
                // 즉시 저장 (비동기, await하지 않음 - UI 블로킹 방지)
                if (isSignedIn()) {
                    if (isDevelopment) {
                        console.log('💾 addItem 성공, Drive에 즉시 저장 시작...');
                    }
                    driveSyncManager.saveToDrive(itemsToSave).then(() => {
                        if (isDevelopment) {
                            console.log('✅ Drive 즉시 저장 완료');
                        }
                    }).catch((error) => {
                        if (isDevelopment) {
                            console.error('❌ Drive 즉시 저장 실패:', error);
                        }
                    });
                }
            }
            
            return updatedItems;
        });
        
        return newItem.id;
    };

    const updateItem = (id, updates) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const now = new Date().toISOString();
                const status = updates.status || item.status || 'active';
                const isActive = updates.isActive !== undefined ? updates.isActive : (status === 'active');
                return { 
                    ...item, 
                    ...updates,
                    lastModified: now,
                    updatedAt: now,
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

