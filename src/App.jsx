import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Lock, FileText, CreditCard } from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import CategoryManageModal from './components/CategoryManageModal';
import VaultCardList from './components/VaultCardList';
import EditModal from './components/EditModal';
import SettingsModal from './components/SettingsModal';
import PasswordGeneratorPage from './components/PasswordGeneratorPage';
import ExcelUploadModal from './components/ExcelUploadModal';
import { downloadExcel } from './utils/excelHandler';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import { useSecureVaultWithDrive } from './hooks/useSecureVaultWithDrive';
import { useCategories } from './hooks/useCategories';
import { useAutoLock } from './hooks/useAutoLock';
import { decryptAccounts, encryptData, encryptAccounts } from './utils/encryption';
import { parseSmartInput } from './utils/smartParser';
import { generatePassword } from './utils/passwordUtils';
import { searchItems as smartSearch } from './utils/smartSearch';
import { exportDataToJSON, importDataFromJSON, shouldShowBackupReminder, getDaysSinceLastBackup } from './utils/backupHandler';
import ToastContainer, { useToast } from './components/Toast';
import persistentStorage from './utils/storage';
import { driveSyncManager } from './utils/driveSyncManager';

const isDevelopment = import.meta.env.MODE === 'development';

function App() {
  // Google OAuth 단일 인증 사용
  const googleAuth = useGoogleAuth();
  
  const isAuthenticated = googleAuth.isAuthenticated;
  // 암호화 키: Google 계정의 고유 ID 사용 (AES-256 보안 유지)
  const encryptionKey = googleAuth.userProfile?.id;
  
  // Google Drive 동기화 지원하는 훅 사용
  const vaultHook = useSecureVaultWithDrive(encryptionKey, true);
  
  const { items, isLoading, addItem, deleteItem, updateItem } = vaultHook;
  
  // 개발 모드에서 테스트 데이터 주입을 위한 전역 함수 노출
  useEffect(() => {
    if (isDevelopment && typeof window !== 'undefined') {
      // Vault 관련 전역 변수 노출
      window.__VAULT_ADD_ITEM__ = addItem;
      window.__VAULT_ITEMS__ = items;
      window.__VAULT_ENCRYPTION_KEY__ = encryptionKey || googleAuth.userProfile?.id || null;
      window.__VAULT_GOOGLE_AUTH__ = googleAuth;
      window.__VAULT_DRIVE_SYNC_MANAGER__ = driveSyncManager;
      window.__VAULT_SYNC_STATUS__ = syncStatus;
      
      // 강제 저장 테스트 명령어
      window.saveNow = async () => {
        try {
          const currentItems = window.__VAULT_ITEMS__ || items;
          const key = window.__VAULT_ENCRYPTION_KEY__ || encryptionKey;
          
          if (!key) {
            console.error('❌ encryptionKey가 없습니다. 로그인이 필요합니다.');
            return;
          }
          
          if (!currentItems || currentItems.length === 0) {
            console.warn('⚠️ 저장할 데이터가 없습니다.');
            return;
          }
          
          console.log('🔄 강제 저장 시작...');
          console.log('   - 항목 수:', currentItems.length);
          console.log('   - encryptionKey:', key ? '설정됨' : '없음');
          
          // accounts를 accountsEncrypted로 변환
          const itemsToSave = currentItems.map(item => {
            const { accounts, ...rest } = item;
            let accountsEncrypted = item.accountsEncrypted || '';
            if (accounts && Array.isArray(accounts) && accounts.length > 0) {
              accountsEncrypted = encryptAccounts(accounts, key);
            }
            return { ...rest, accountsEncrypted };
          });
          
          await driveSyncManager.saveToDrive(itemsToSave);
          console.log('✅ 강제 저장 완료!');
        } catch (error) {
          console.error('❌ 강제 저장 실패:', error);
          throw error;
        }
      };
      
      if (isDevelopment) {
        console.log('🔧 개발 모드: 테스트 명령어가 노출되었습니다.');
        console.log('   - window.saveNow() - 강제 저장 실행');
        console.log('   - window.__VAULT_DRIVE_SYNC_MANAGER__.saveToDrive(data) - 직접 저장');
      }
      window.__VAULT_SYNC_STATUS__ = syncStatus;
      
      // 테스트 데이터 주입 함수 정의 및 노출
      const createInjectFunction = () => {
        try {
          // generateTestData 함수를 직접 정의 (빌드 에러 방지)
          // scripts/generateTestData.js의 로직을 간소화하여 포함
          const generateTestData = () => {
            // 간단한 테스트 데이터 생성 (200개)
            const items = [];
            const types = ['finance', 'web', 'memo'];
            const categories = {
              finance: ['finance-bank', 'finance-card', 'finance-loan', 'finance-other'],
              web: ['web-shopping', 'web-portal', 'web-finance', 'web-work'],
              memo: ['memo-work', 'memo-personal', 'memo-project', 'memo-scraps']
            };
            
            for (let i = 0; i < 200; i++) {
              const type = types[i % 3];
              const categoryList = categories[type];
              const categoryId = categoryList[i % categoryList.length];
              
              const item = {
                id: `test_${type}_${i + 1}`,
                type: type,
                categoryId: categoryId,
                siteName: `${type} 항목 ${i + 1}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                customFields: []
              };
              
              if (type === 'web') {
                item.serviceName = `서비스 ${i + 1}`;
                item.url = `https://example${i + 1}.com`;
                item.accounts = [{
                  id: `acc_${i + 1}`,
                  username: `user${i + 1}`,
                  password: `pass${i + 1}`,
                  displayName: '',
                  memo: '',
                  isVerified: false,
                  verifiedAt: null
                }];
              } else if (type === 'finance') {
                item.institutionName = `은행 ${i + 1}`;
                item.accountCardNumber = `${Math.floor(Math.random() * 10000000000000000)}`;
                item.accountHolder = `홍길동${i + 1}`;
              } else if (type === 'memo') {
                item.memo = `메모 내용 ${i + 1}`;
              }
              
              items.push(item);
            }
            
            return items;
          };
          
          // encryptionKey 재생성 함수
          const deriveEncryptionKey = (googleAuth) => {
            if (googleAuth?.userProfile?.id) {
              const derivedKey = googleAuth.userProfile.id;
              console.log('🔑 encryptionKey 재생성:', derivedKey);
              return derivedKey;
            }
            return null;
          };
          
          // injectTestData 함수 정의
          const injectTestDataFn = async () => {
            const addItemFn = window.__VAULT_ADD_ITEM__;
            if (!addItemFn || typeof addItemFn !== 'function') {
              throw new Error('addItem 함수가 제공되지 않았습니다. window.__VAULT_ADD_ITEM__를 확인하세요.');
            }

            // encryptionKey 확인 및 재생성
            let encryptionKey = window.__VAULT_ENCRYPTION_KEY__;
            const googleAuth = window.__VAULT_GOOGLE_AUTH__;
            const driveSyncManager = window.__VAULT_DRIVE_SYNC_MANAGER__;

            if (!encryptionKey && googleAuth) {
              encryptionKey = deriveEncryptionKey(googleAuth);
              if (encryptionKey) {
                window.__VAULT_ENCRYPTION_KEY__ = encryptionKey;
                console.log('🔑 encryptionKey 재생성 완료:', encryptionKey);
              }
            }

            // driveSyncManager에 키 설정
            if (encryptionKey && driveSyncManager) {
              const managerKey = driveSyncManager.encryptionKey;
              if (!managerKey || managerKey !== encryptionKey) {
                console.log('🔑 encryptionKey를 driveSyncManager에 설정합니다:', encryptionKey);
                driveSyncManager.setEncryptionKey(encryptionKey);
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }

            if (!encryptionKey) {
              throw new Error('encryptionKey를 생성할 수 없습니다. Google 로그인이 필요합니다.');
            }

            console.log('✅ encryptionKey 확인 완료');
            console.log('🧪 테스트 데이터 생성 시작...');
            const testData = generateTestData();
            console.log(`✅ ${testData.length}개의 테스트 데이터 생성 완료`);

            const startTime = performance.now();
            let success = 0;
            let failed = 0;

            for (let i = 0; i < testData.length; i++) {
              try {
                addItemFn(testData[i]);
                success++;
              } catch (error) {
                failed++;
                console.error(`❌ 아이템 ${i + 1} 추가 실패:`, error);
              }
            }

            const duration = performance.now() - startTime;
            console.log('📊 테스트 데이터 주입 완료:');
            console.log(`   - 총 데이터: ${testData.length}개`);
            console.log(`   - 성공: ${success}개`);
            console.log(`   - 실패: ${failed}개`);
            console.log(`   - 소요 시간: ${duration.toFixed(2)}ms (${(duration / 1000).toFixed(2)}초)`);
            
            // 데이터 주입 후 Drive 동기화 확인 및 네트워크 감시
            if (driveSyncManager && encryptionKey) {
              console.log('🔄 Google Drive 동기화 대기 중... (네트워크 탭에서 vault.json 업데이트 확인)');
              
              // 네트워크 요청 모니터링을 위한 로그
              console.log('📡 네트워크 탭 모니터링 가이드:');
              console.log('   1. 개발자 도구(F12) → Network 탭 열기');
              console.log('   2. 필터: "drive" 또는 "files" 입력');
              console.log('   3. 다음 요청을 확인하세요:');
              console.log('      - POST https://www.googleapis.com/upload/drive/v3/files');
              console.log('      - PATCH https://www.googleapis.com/drive/v3/files/{fileId}');
              console.log('   4. 요청 본문(Request Payload)에 vault.json 데이터 확인');
              console.log('   5. 응답 코드 200이면 성공적으로 저장됨');
              
              // 약간의 지연 후 상태 확인
              setTimeout(() => {
                const managerKey = driveSyncManager.getEncryptionKey();
                console.log('📊 동기화 상태 확인:');
                console.log('   - encryptionKey 설정됨:', managerKey ? '예' : '아니오');
                console.log('   - 동기화 진행 중:', driveSyncManager.isSyncing ? '예' : '아니오');
                
                // 네트워크 요청이 실제로 발생했는지 확인 안내
                if (window.performance && window.performance.getEntriesByType) {
                  const networkEntries = window.performance.getEntriesByType('resource');
                  const driveRequests = networkEntries.filter(entry => 
                    entry.name.includes('googleapis.com/drive') || entry.name.includes('googleapis.com/upload/drive')
                  );
                  if (driveRequests.length > 0) {
                    console.log('✅ Drive API 요청 감지:', driveRequests.length, '개');
                    driveRequests.forEach((req, idx) => {
                      console.log(`   ${idx + 1}. ${req.name} (${Math.round(req.duration)}ms)`);
                    });
                  } else {
                    console.log('⚠️ Drive API 요청이 아직 감지되지 않았습니다. Network 탭을 확인하세요.');
                  }
                }
              }, 3000);
            }
            
            return { total: testData.length, success, failed, duration };
          };
          
          // 함수 노출 (이름 통일: injectTestData)
          window.injectTestData = injectTestDataFn;
          window.injectTestDataWithKeyCheck = injectTestDataFn; // 동일한 함수 사용
          
          // 즉시 실행 가능한 간단한 함수 (forceInject)
          window.forceInject = injectTestDataFn;
          
          if (!window.__VAULT_TEST_DATA_LOADED__) {
            console.log('🔧 개발 모드: 테스트 데이터 주입 함수가 window 객체에 노출되었습니다.');
            console.log('사용법:');
            console.log('  - window.injectTestData() - 키 확인 후 주입');
            console.log('  - window.injectTestDataWithKeyCheck() - 키 확인 및 재생성 후 주입');
            console.log('  - window.forceInject() - 즉시 주입 (간단한 별칭)');
            window.__VAULT_TEST_DATA_LOADED__ = true;
          }
        } catch (error) {
          console.error('테스트 데이터 주입 함수 생성 실패:', error);
          window.forceInject = async () => {
            console.error('테스트 데이터 주입 함수를 생성할 수 없습니다. 페이지를 새로고침해주세요.');
          };
        }
      };
      
      createInjectFunction();
    }
  }, [addItem, items, encryptionKey, googleAuth, isDevelopment]);
  const { categories, financeCategories, accountCategories, memoCategories, financeSubCategories, webSubCategories, memoSubCategories, createCategory, updateCategory, deleteCategory, reorderCategories } = useCategories(encryptionKey);
  
  // 동기화 상태
  const [syncStatus, setSyncStatus] = useState(null);

  // Toast 알림
  const toast = useToast();

  // Google OAuth 로그인 핸들러
  const handleGoogleLogin = async () => {
    try {
      await googleAuth.login();
      toast.success('Google 계정으로 로그인되었습니다.', '로그인 성공');
    } catch (error) {
      toast.error('로그인에 실패했습니다.', '로그인 실패');
    }
  };

  // 자동 잠금 시 Google 재인증 요구 (로그아웃 후 재로그인 필요)
  const handleAutoLock = async () => {
    // Google 로그아웃 (로컬 캐시 삭제 포함)
    await googleAuth.logout();
    toast.info('세션이 만료되었습니다. Google 계정으로 다시 로그인해주세요.', '세션 만료');
  };

  // 자동 잠금 (설정에서 가져옴, 기본 10분)
  const autoLockMinutes = parseInt(persistentStorage.getItem('auto_lock_minutes') || '10', 10);
  useAutoLock(handleAutoLock, autoLockMinutes);

  // 수동 로그아웃 핸들러
  const handleLogout = async () => {
    // 드라이브 동기화 상태 확인
    if (syncStatus?.isSyncing) {
      const confirm = window.confirm('동기화가 진행 중입니다. 정말 로그아웃하시겠습니까?');
      if (!confirm) return;
    }
    
    await googleAuth.logout();
    toast.info('로그아웃되었습니다.', '로그아웃');
  };

  // 모든 state를 조건부 return 이전에 선언 (React Hooks 규칙)
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [botInput, setBotInput] = useState(''); // 하단 봇 입력창
  const [showAddMenu, setShowAddMenu] = useState(false); // 하단 추가 메뉴 표시 여부

  // 하단 봇 입력창 변경 시 실시간 검색 (Hooks는 조건부 return 이전에 선언)
  useEffect(() => {
    setSearchQuery(botInput);
  }, [botInput]);

  // 백업 리마인더 체크 (Google Drive 동기화가 완료된 경우에만 JSON 백업 권장)
  // toast를 useCallback으로 메모이제이션하여 의존성 배열에서 제거
  const lastBackupReminderShown = useRef(false);
  useEffect(() => {
    if (isAuthenticated && syncStatus?.lastSyncTime && !lastBackupReminderShown.current && shouldShowBackupReminder()) {
      const daysSince = getDaysSinceLastBackup();
      toast.info(
        `마지막 JSON 백업 이후 ${daysSince}일이 경과했습니다.\n오프라인 백업을 원하시면 설정에서 JSON 백업을 진행해주세요.`,
        '오프라인 백업 권장'
      );
      lastBackupReminderShown.current = true;
    }
  }, [isAuthenticated, syncStatus]); // toast 의존성 제거

  // SecureVault 폴더 경로 가져오기
  useEffect(() => {
    if (isAuthenticated && googleAuth.userProfile) {
      const loadFolderPath = async () => {
        try {
          const { getSecureVaultFolderPath } = await import('./utils/driveSync');
          const path = await getSecureVaultFolderPath();
          setFolderPath(path);
        } catch (error) {
          if (isDevelopment) {
            console.warn('폴더 경로 로드 실패:', error);
          }
        }
      };
      loadFolderPath();
    }
  }, [isAuthenticated, googleAuth.userProfile]);

  // 동기화 상태 콜백 및 암호화 키 설정 (키 생성 자동화 및 순서 보장)
  useEffect(() => {
    // 동기화 상태 콜백은 항상 설정
    driveSyncManager.setSyncStatusCallback((status) => {
      setSyncStatus(status);
      
      // 동기화 성공 시 토스트 알림
      if (status.success && !status.isSyncing && status.lastSyncTime) {
        toast.success('Google Drive에 저장되었습니다.', '동기화 완료');
      }
    });
    
    // encryptionKey 생성 및 설정 (우선순위: encryptionKey > userProfile.id)
    const keyToUse = encryptionKey || googleAuth.userProfile?.id;
    
    if (keyToUse && typeof keyToUse === 'string' && keyToUse.trim() !== '') {
      // 키가 유효하면 즉시 driveSyncManager에 설정
      if (isDevelopment) {
        console.log('🔑 encryptionKey를 driveSyncManager에 설정:', keyToUse);
      }
      driveSyncManager.setEncryptionKey(keyToUse);
    } else if (isAuthenticated && googleAuth.userProfile?.id) {
      // 로그인은 되어 있지만 키가 없는 경우 (비정상 상태)
      const derivedKey = googleAuth.userProfile.id;
      console.log('🔑 encryptionKey 재생성 (비정상 상태 복구):', derivedKey);
      driveSyncManager.setEncryptionKey(derivedKey);
    } else {
      // 키가 없는 경우 driveSyncManager에서도 제거 (동기화 중단)
      if (isDevelopment) {
        console.warn('⚠️ encryptionKey가 없어 동기화가 중단됩니다.');
      }
      driveSyncManager.setEncryptionKey(null);
    }
  }, [encryptionKey, isAuthenticated, googleAuth.userProfile]);

  // 드라이브 동기화 상태 체크 강화
  // toast를 의존성 배열에서 제거하고, 각 경고는 한 번만 표시되도록 ref로 추적
  const syncErrorShown = useRef(false);
  const syncIncompleteShown = useRef(false);
  
  useEffect(() => {
    if (!isAuthenticated || !encryptionKey) {
      // 인증되지 않았거나 암호화 키가 없으면 리셋
      syncErrorShown.current = false;
      syncIncompleteShown.current = false;
      return;
    }
    
    // 동기화 상태가 오류인 경우 경고 (한 번만 표시)
    if (syncStatus?.error && !syncErrorShown.current) {
      toast.warning('Google Drive 동기화에 문제가 발생했습니다. 데이터 안전을 위해 확인해주세요.', '동기화 오류');
      syncErrorShown.current = true;
    } else if (!syncStatus?.error) {
      // 오류가 해결되면 리셋
      syncErrorShown.current = false;
    }
    
    // 동기화가 완료되지 않은 경우 경고 (한 번만 표시, 초기 로딩 중 제외)
    if (syncStatus && !syncStatus.lastSyncTime && !syncStatus.isSyncing && !syncIncompleteShown.current && syncStatus.error === null) {
      // 초기 로딩 후 약간의 지연을 두고 확인 (너무 빠른 경고 방지)
      const timer = setTimeout(() => {
        if (syncStatus && !syncStatus.lastSyncTime && !syncStatus.isSyncing) {
          toast.warning('Google Drive 동기화가 완료되지 않았습니다. 네트워크를 확인해주세요.', '동기화 미완료');
          syncIncompleteShown.current = true;
        }
      }, 3000); // 3초 후 확인
      
      return () => clearTimeout(timer);
    } else if (syncStatus?.lastSyncTime) {
      // 동기화가 완료되면 리셋
      syncIncompleteShown.current = false;
    }
  }, [syncStatus, isAuthenticated, encryptionKey]); // toast 의존성 제거

  // 동기화 매니저 키 설정 (useSecureVaultWithDrive가 자동으로 로드하므로 여기서는 키만 설정)
  useEffect(() => {
    if (isAuthenticated && encryptionKey && typeof encryptionKey === 'string' && encryptionKey.trim() !== '') {
      // driveSyncManager에 키 설정 (useSecureVaultWithDrive가 자동으로 로드함)
      if (!driveSyncManager.getEncryptionKey() || driveSyncManager.getEncryptionKey() !== encryptionKey) {
        driveSyncManager.setEncryptionKey(encryptionKey);
        if (isDevelopment) {
          console.log('🔑 driveSyncManager.encryptionKey 설정 완료:', encryptionKey);
        }
      }
    }
  }, [isAuthenticated, encryptionKey]);

  // 로그인 전 화면 (인증되지 않은 경우에만 로그인 화면 표시)
  if (!isAuthenticated) {
    return (
      <LoginScreen 
        onGoogleLogin={handleGoogleLogin}
        isLoading={googleAuth.isLoading}
      />
    );
  }

  // 🔍 디버깅: encryptionKey 상태 확인
  if (isDevelopment) {
    console.log('현재 키 상태:', encryptionKey);
    console.log('userProfile:', googleAuth.userProfile);
    console.log('isAuthenticated:', isAuthenticated);
  }

  // 데이터 로딩 상태: 인증 완료 후 encryptionKey가 준비되거나 데이터가 로딩 중일 때 로딩 스피너 표시
  const isDataLoading = !encryptionKey || isLoading || googleAuth.isLoading;
  
  if (isDataLoading) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
          <p className="text-gray-600 font-medium">데이터 로딩 중...</p>
          {isDevelopment && !encryptionKey && (
            <p className="text-sm text-gray-400 mt-2">암호화 키 준비 중...</p>
          )}
        </div>
      </div>
    );
  }

  // ⚠️ 임시 주석 처리: 디버깅용
  // if (!encryptionKey) {
  //   return (
  //     <div className="flex h-screen bg-gray-100 items-center justify-center">
  //       <div className="text-center">
  //         <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
  //         <p className="text-gray-500">인증 정보를 불러오는 중...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // 즐겨찾기 토글
  const handleToggleFavorite = (id) => {
    const item = items.find(i => i.id === id);
    if (item) {
      updateItem(id, { ...item, isFavorite: !item.isFavorite });
    }
  };

  // 항목 수정
  const handleEdit = (item) => {
    setEditingItem(item);
  };

  const handleSaveEdit = (id, updates) => {
    updateItem(id, updates);
    setEditingItem(null);
  };

  // 필터링된 항목
  const getFilteredItems = () => {
    let filtered = items;

    // 카테고리 필터 (먼저 필터링)
    if (activeCategory === 'favorites') {
      filtered = filtered.filter(item => item.isFavorite);
    } else if (activeCategory === 'recent') {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      filtered = filtered.filter(item => new Date(item.createdAt) > dayAgo || (item.lastUsed && new Date(item.lastUsed) > dayAgo));
    } else if (activeCategory === 'finance' || activeCategory === 'web' || activeCategory === 'memo') {
      // 기본 카테고리 ID로 직접 필터링
      filtered = filtered.filter(item => item.categoryId === activeCategory);
    } else if (activeCategory === 'uncategorized') {
      filtered = filtered.filter(item => !item.categoryId || item.categoryId === 'uncategorized');
    } else if (activeCategory && activeCategory !== 'all') {
      // 특정 카테고리 ID로 필터링
      filtered = filtered.filter(item => item.categoryId === activeCategory);
    }

    // 검색 (카테고리 필터링 후)
    if (searchQuery) {
      filtered = smartSearch(filtered, searchQuery);
    }

    return filtered;
  };

  const filteredItems = getFilteredItems();

  // 통계
  const stats = {
    total: items.length,
    favorites: items.filter(i => i.isFavorite).length,
    recent: items.filter(i => {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return new Date(i.createdAt) > dayAgo || (i.lastUsed && new Date(i.lastUsed) > dayAgo);
    }).length,
    passwords: items.filter(i => i.type === 'password' || i.category === 'password').length,
    finance: items.filter(i => i.category === 'finance').length,
    contacts: items.filter(i => i.category === 'contact').length,
    notes: items.filter(i => i.category === 'note').length,
  };

  // 비밀번호 생성 명령어 인식
  const isPasswordGenerateCommand = (text) => {
    const normalized = text.trim().toLowerCase();
    const commands = ['비밀번호 생성', '비번 생성', '비번 만들어줘', '/gen'];
    return commands.some(cmd => normalized === cmd || normalized.includes(cmd));
  };

  // 하단 봇 엔터 키 처리 (명령어 우선)
  const handleBotSubmit = async (e) => {
    e.preventDefault();
    const inputText = botInput.trim();
    if (!inputText) return;

    // 비밀번호 생성 명령어 체크
    if (isPasswordGenerateCommand(inputText)) {
      setActiveCategory('password-generator');
      setBotInput(''); // 입력창 초기화
      return;
    }

    // 일반 입력은 실시간 검색으로 처리 (이미 useEffect에서 처리됨)
    // 엔터만 눌렀을 때는 검색 결과 표시만 (추가 모달은 [➕ 추가] 버튼으로만)
  };

  // 퀵 추가: 금융형
  const handleQuickAddFinance = () => {
    // 첫 번째 finance 카테고리 찾기
    const firstFinanceCategory = financeCategories.find(cat => cat.type === 'finance');
    const defaultCategoryId = firstFinanceCategory?.id || 'uncategorized';
    
    setEditingItem({
      id: `temp_${Date.now()}`,
      siteName: '',
      url: '',
      accounts: [], // 금융 타입은 accounts 사용 안 함
      customFields: [],
      memo: '',
      institutionName: '',
      accountCardNumber: '',
      accountHolder: '',
      expiryDate: '',
      creditLimit: '',
      paymentDate: '',
      securityCode: '',
      categoryId: defaultCategoryId
    });
  };

  // 퀵 추가: 계정형
  const handleQuickAddAccount = () => {
    // 첫 번째 web 카테고리 찾기
    const firstAccountCategory = accountCategories.find(cat => cat.type === 'web');
    const defaultCategoryId = firstAccountCategory?.id || 'uncategorized';
    
    setEditingItem({
      id: `temp_${Date.now()}`,
      siteName: '',
      url: '',
      accounts: [{
        id: `acc_${Date.now()}`,
        username: '',
        displayName: '',
        password: '',
        memo: '',
        isVerified: false,
        verifiedAt: null
      }],
      customFields: [],
      memo: '',
      categoryId: defaultCategoryId
    });
  };

  // 퀵 추가: 지식(메모)형
  const handleQuickAddNote = () => {
    // 첫 번째 memo 카테고리 찾기
    const firstMemoCategory = memoCategories.find(cat => cat.type === 'memo');
    const defaultCategoryId = firstMemoCategory?.id || 'uncategorized';
    
    setEditingItem({
      id: `temp_${Date.now()}`,
      siteName: '',
      url: '',
      accounts: [],
      customFields: [],
      memo: '',
      tags: [],
      categoryId: defaultCategoryId
    });
  };

  // [➕ 추가] 버튼 클릭 처리
  const handleAddButtonClick = () => {
    const inputText = botInput.trim();
    if (!inputText) {
      // 입력이 없으면 플로팅 메뉴 표시
      setShowAddMenu(!showAddMenu);
      return;
    }

    // 비밀번호 생성 명령어 체크
    if (isPasswordGenerateCommand(inputText)) {
      setActiveCategory('password-generator');
      setBotInput(''); // 입력창 초기화
      return;
    }

    // parseSmartInput으로 분석하여 모달 띄우기
    const parsed = parseSmartInput(inputText);
    
    // parsed.type 기반으로 올바른 카테고리 ID 찾기
    let defaultCategoryId = 'uncategorized';
    if (parsed.type === 'memo' || parsed.isKnowledge) {
      // 메모 타입: memo 카테고리 찾기
      const firstMemoCategory = memoCategories.find(cat => cat.type === 'memo');
      defaultCategoryId = firstMemoCategory?.id || 'uncategorized';
    } else if (parsed.type === 'account' || parsed.type === 'finance') {
      // 금융 타입: finance 카테고리 찾기
      const firstFinanceCategory = financeCategories.find(cat => cat.type === 'finance');
      defaultCategoryId = firstFinanceCategory?.id || 'uncategorized';
    } else {
      // 비밀번호 타입: web 카테고리 찾기 (기본값)
      const firstAccountCategory = accountCategories.find(cat => cat.type === 'web');
      defaultCategoryId = firstAccountCategory?.id || 'uncategorized';
    }
    
    // parsed.fields에서 데이터 추출
    const siteName = parsed.title || parsed.fields?.id || '';
    const url = parsed.fields?.url || '';
    const username = parsed.fields?.id || '';
    const password = parsed.fields?.password || '';
    const memoContent = parsed.fields?.memo || '';
    
    // 타입별로 다른 초기값 설정
    if (parsed.type === 'memo' || parsed.isKnowledge) {
      // 메모 타입
      setEditingItem({
        id: `temp_${Date.now()}`,
        siteName: siteName,
        url: '',
        accounts: [],
        customFields: [],
        memo: memoContent,
        tags: [],
        categoryId: defaultCategoryId
      });
    } else if (parsed.type === 'account' || parsed.type === 'finance') {
      // 금융 타입
      setEditingItem({
        id: `temp_${Date.now()}`,
        siteName: siteName,
        url: url || '',
        accounts: [],
        customFields: [],
        memo: '',
        institutionName: siteName,
        accountCardNumber: parsed.fields?.accountNumber || '',
        accountHolder: '',
        expiryDate: '',
        creditLimit: '',
        paymentDate: '',
        securityCode: '',
        categoryId: defaultCategoryId
      });
    } else {
      // 비밀번호 타입 (기본)
      setEditingItem({
        id: `temp_${Date.now()}`,
        siteName: siteName,
        url: url,
        accounts: (username || password) ? [{
          id: `acc_${Date.now()}`,
          username: username,
          displayName: '',
          password: password,
          memo: '',
          isVerified: false,
          verifiedAt: null
        }] : [],
        customFields: [],
        memo: '',
        categoryId: defaultCategoryId
      });
    }
    setBotInput(''); // 모달 띄운 후 입력창 초기화
  };

  // 카테고리 이름 가져오기
  const getCategoryName = (categoryId) => {
    if (categoryId === 'uncategorized') return '미분류';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '알 수 없음';
  };

  // JSON 백업 내보내기 (SettingsModal에서 사용하도록 제거, SettingsModal에서 직접 처리)

  // JSON 백업 복원 처리 (SettingsModal에서 호출)
  const handleImportComplete = async (importedItems) => {
    try {
      // accountsEncrypted를 가진 항목만 복원 (보안 유지)
      // accounts 필드는 복호화해서 추가 (UI용)
      const itemsWithAccounts = importedItems.map(item => {
        if (item.accountsEncrypted && encryptionKey) {
          try {
            const accounts = decryptAccounts(item.accountsEncrypted, encryptionKey);
            return {
              ...item,
              accounts: accounts
            };
          } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('Failed to decrypt accounts for item:', item.id, e);
            }
            return {
              ...item,
              accounts: []
            };
          }
        }
        return {
          ...item,
          accounts: []
        };
      });

      // 모든 항목을 암호화하여 저장 (useSecureVault의 로직과 동일하게)
      if (!encryptionKey) {
        toast.error('암호화 키가 필요합니다.', '오류');
        return;
      }

      // 각 항목의 accounts를 다시 암호화 (이미 accountsEncrypted가 있으면 유지)
      const itemsToSave = itemsWithAccounts.map(item => {
        // accountsEncrypted가 이미 있으면 유지, 없으면 accounts를 암호화
        if (!item.accountsEncrypted && item.accounts && item.accounts.length > 0) {
          const accountsEncrypted = encryptAccounts(item.accounts, encryptionKey);
          return {
            ...item,
            accountsEncrypted: accountsEncrypted
          };
        }
        return item;
      });
      
      // 전체 vault 데이터를 JSON 문자열로 변환 후 암호화
      const vaultJson = JSON.stringify(itemsToSave);
      const encryptedVault = encryptData(vaultJson, encryptionKey);
      
      if (!encryptedVault) {
        throw new Error('데이터 암호화 실패');
      }
      
      const saved = persistentStorage.setItem('vault_data', encryptedVault);
      if (!saved) {
        throw new Error('저장소 공간이 부족하거나 저장에 실패했습니다.');
      }
      
      toast.success('백업이 성공적으로 복원되었습니다. 페이지를 새로고침합니다.', '복원 완료');
      
      // 페이지 새로고침하여 데이터 반영
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error(`백업 복원 실패: ${error.message}`, '오류');
      if (process.env.NODE_ENV !== 'production') {
        console.error('Import error:', error);
      }
    }
  };

  return (
    <>
      {/* Toast 알림 */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        {/* 편집 모달 */}
      {editingItem && (
        <EditModal
          item={editingItem}
          categories={categories}
          financeSubCategories={financeSubCategories}
          webSubCategories={webSubCategories}
          memoSubCategories={memoSubCategories}
          onSave={(id, updates) => {
            if (editingItem.siteName === '' && !updates.siteName && !items.find(i => i.id === id)) {
              setEditingItem(null);
              return;
            }
            if (items.find(i => i.id === id)) {
              handleSaveEdit(id, updates);
            } else {
              addItem({
                ...updates,
                categoryId: updates.categoryId || 'uncategorized',
                accounts: updates.accounts || []
              });
              setEditingItem(null);
            }
          }}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* 설정 모달 */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          items={items}
          onImportComplete={handleImportComplete}
          categories={categories}
          onCreateCategory={createCategory}
          toast={toast}
          onUpdateCategory={updateCategory}
          onDeleteCategory={(categoryId) => {
            // 카테고리 삭제 전 해당 카테고리의 항목들을 미분류로 이동
            items.forEach(item => {
              if (item.categoryId === categoryId) {
                updateItem(item.id, { ...item, categoryId: 'uncategorized' });
              }
            });
            deleteCategory(categoryId);
          }}
          onReorderCategories={reorderCategories}
          onOpenExcelUpload={() => {
            setShowSettings(false);
            setShowExcelUpload(true);
          }}
        />
      )}

      {/* Excel 업로드 모달 */}
      {showExcelUpload && (
        <ExcelUploadModal
          onClose={() => setShowExcelUpload(false)}
          categories={categories}
          items={items}
          onCreateCategory={createCategory}
          onAddItem={addItem}
          onUpdateItem={updateItem}
          onUploadComplete={async () => {
            // Google Drive 동기화 트리거
            try {
              const itemsToSave = items.map(item => {
                const { accounts, ...rest } = item;
                let accountsEncrypted = item.accountsEncrypted || '';
                if (accounts && Array.isArray(accounts) && accounts.length > 0) {
                  accountsEncrypted = encryptAccounts(accounts, encryptionKey);
                }
                return { ...rest, accountsEncrypted };
              });
              
              // 즉시 저장 (디바운스 없이)
              await driveSyncManager.saveToDrive(itemsToSave);
              toast.success('엑셀 업로드 완료 및 Google Drive 동기화 완료', '업로드 완료');
            } catch (error) {
              console.error('Drive 동기화 실패:', error);
              toast.warning('엑셀 업로드는 완료되었으나 Google Drive 동기화에 실패했습니다.', '동기화 실패');
            }
          }}
        />
      )}

      {/* 사이드바 */}
      <Sidebar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        stats={stats}
        onLogout={handleLogout}
        financeCategories={financeCategories}
        accountCategories={accountCategories}
        memoCategories={memoCategories}
        financeSubCategories={financeSubCategories}
        webSubCategories={webSubCategories}
        memoSubCategories={memoSubCategories}
        items={items}
        onOpenSettings={() => setShowSettings(true)}
        onOpenPasswordGenerator={() => setActiveCategory('password-generator')}
        onQuickAddFinance={handleQuickAddFinance}
        onQuickAddAccount={handleQuickAddAccount}
        onQuickAddNote={handleQuickAddNote}
        syncStatus={syncStatus}
        userProfile={googleAuth.userProfile}
        folderPath={folderPath}
      />

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* 비밀번호 생성기 페이지 */}
        {activeCategory === 'password-generator' ? (
          <PasswordGeneratorPage
            onPasswordGenerated={(password) => {
              setBotInput(password);
              toast.success('비밀번호가 생성되었습니다.', '비밀번호 생성');
            }}
          />
        ) : (
          <>
            {/* 카드 리스트 영역 */}
            <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
                <p className="text-gray-500">로딩 중...</p>
              </div>
            </div>
          ) : (
            <VaultCardList
              items={filteredItems}
              onEdit={handleEdit}
              onDelete={deleteItem}
              onToggleFavorite={handleToggleFavorite}
              onCopyToast={(message) => toast.success(message, '복사 완료')}
              categories={categories}
            />
          )}
        </div>

            {/* 하단 스마트 봇 바 (검색 + 추가 하이브리드) */}
            <div className="bg-white border-t border-gray-200 px-6 py-4 relative">
              <form onSubmit={handleBotSubmit} className="flex items-center gap-3">
                <input
                  type="text"
                  value={botInput}
                  onChange={(e) => {
                    setBotInput(e.target.value);
                    setShowAddMenu(false); // 입력 시 메뉴 닫기
                  }}
                  placeholder="찾고 싶은 항목을 입력하거나, '서비스명 ID PW'를 입력해 추가하세요."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleAddButtonClick}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
                    title="항목 추가"
                  >
                    <Plus size={18} />
                    추가
                  </button>
                  
                  {/* 플로팅 메뉴 */}
                  {showAddMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] z-50">
                      <button
                        type="button"
                        onClick={() => {
                          handleQuickAddFinance();
                          setShowAddMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <CreditCard size={18} className="text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-800">금융 자산 추가</div>
                          <div className="text-xs text-gray-500">계좌/카드 정보</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleQuickAddAccount();
                          setShowAddMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-t border-gray-200"
                      >
                        <Lock size={18} className="text-indigo-600" />
                        <div>
                          <div className="font-medium text-gray-800">비밀번호 추가</div>
                          <div className="text-xs text-gray-500">사이트명, URL, 아이디, 비밀번호</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleQuickAddNote();
                          setShowAddMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-t border-gray-200"
                      >
                        <FileText size={18} className="text-purple-600" />
                        <div>
                          <div className="font-medium text-gray-800">메모 추가</div>
                          <div className="text-xs text-gray-500">제목, 태그, 본문</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </form>
              <p className="text-xs text-gray-500 mt-2 text-center">
                💡 검색은 실시간입니다. 비밀번호가 필요하면 '비밀번호 생성'이라고 입력해 보세요.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}

export default App;
