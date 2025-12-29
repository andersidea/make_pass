/**
 * Google Drive 동기화 매니저
 * 디바운스된 자동 저장 및 자동 로드 관리
 */

import { saveVaultToDrive, loadVaultFromDrive } from './driveSync';
import { SYNC_DEBOUNCE_MS } from './googleConfig';

const isDevelopment = process.env.NODE_ENV !== 'production';

class DriveSyncManager {
    constructor() {
        this.saveTimer = null;
        this.isSyncing = false;
        this.lastSyncTime = null;
        this.syncError = null;
        this.onSyncStatusChange = null;
        this.encryptionKey = null; // 암호화 키 저장
    }
    
    /**
     * 암호화 키 설정
     * @param {string} key - 암호화 키 (Google 사용자 ID)
     */
    setEncryptionKey(key) {
        if (key && typeof key === 'string' && key.trim() !== '') {
            this.encryptionKey = key;
            if (isDevelopment) {
                console.log('✅ driveSyncManager.encryptionKey 설정 완료:', key);
            }
        } else {
            this.encryptionKey = null;
            if (isDevelopment) {
                console.warn('⚠️ driveSyncManager.encryptionKey가 null로 설정되었습니다.');
            }
        }
    }
    
    /**
     * 암호화 키 가져오기 (디버깅용)
     */
    getEncryptionKey() {
        return this.encryptionKey;
    }

    /**
     * 동기화 상태 변경 콜백 설정
     */
    setSyncStatusCallback(callback) {
        this.onSyncStatusChange = callback;
    }

    /**
     * 동기화 상태 업데이트 및 콜백 호출
     */
    updateSyncStatus(status) {
        if (this.onSyncStatusChange) {
            this.onSyncStatusChange(status);
        }
    }

    /**
     * 디바운스된 자동 저장 (Auto-Save)
     * 가드 로직: encryptionKey가 유효할 때만 실행
     */
    scheduleSave = (vaultData) => {
        // 가드 로직: encryptionKey가 유효하지 않으면 동기화 시도 중단
        if (!this.encryptionKey || typeof this.encryptionKey !== 'string' || this.encryptionKey.trim() === '') {
            if (isDevelopment) {
                console.warn('scheduleSave: 암호화 키가 유효하지 않아 동기화를 중단합니다.');
            }
            return;
        }
        
        // 기존 타이머 취소
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }

        // 새 타이머 설정
        this.saveTimer = setTimeout(async () => {
            await this.saveToDrive(vaultData);
        }, SYNC_DEBOUNCE_MS);
    };

    /**
     * Drive에 저장
     */
    saveToDrive = async (vaultData) => {
        // 가드 로직 강화: encryptionKey가 유효하지 않으면 즉시 반환
        if (!this.encryptionKey || typeof this.encryptionKey !== 'string' || this.encryptionKey.trim() === '') {
            if (isDevelopment) {
                console.warn('Drive 동기화: 암호화 키가 유효하지 않습니다.');
            }
            return;
        }
        
        if (this.isSyncing) {
            // 이미 동기화 중이면 무시
            return;
        }

        this.isSyncing = true;
        this.updateSyncStatus({ isSyncing: true, error: null });

        try {
            if (isDevelopment) {
                console.log('💾 Drive 저장 시작...');
                console.log('   - 데이터 항목 수:', Array.isArray(vaultData) ? vaultData.length : 'N/A');
                console.log('   - encryptionKey:', this.encryptionKey ? '설정됨' : '없음');
            }
            
            await saveVaultToDrive(vaultData, this.encryptionKey);
            this.lastSyncTime = new Date();
            this.syncError = null;
            this.updateSyncStatus({ 
                isSyncing: false, 
                lastSyncTime: this.lastSyncTime,
                error: null,
                success: true // 성공 플래그 추가
            });

            if (isDevelopment) {
                console.log('✅ Drive 동기화 완료:', this.lastSyncTime);
                console.log('   - 저장 위치: Google Drive / SecureVault');
            }
        } catch (error) {
            this.syncError = error.message;
            this.updateSyncStatus({ 
                isSyncing: false, 
                error: this.syncError 
            });

            if (isDevelopment) {
                console.error('❌ Drive 동기화 실패:', error);
                if (error.response) {
                    console.error('   - 응답 상태:', error.response.status);
                    console.error('   - 응답 데이터:', error.response.data);
                }
                if (error.message) {
                    console.error('   - 에러 메시지:', error.message);
                }
                if (error.stack) {
                    console.error('   - 스택 트레이스:', error.stack);
                }
            }
            throw error; // 에러를 다시 던져서 호출자가 처리할 수 있도록
        } finally {
            this.isSyncing = false;
        }
    };

    /**
     * Drive에서 로드 (Auto-Load)
     */
    loadFromDrive = async () => {
        // 가드 로직 강화: encryptionKey가 유효하지 않으면 즉시 반환
        if (!this.encryptionKey || typeof this.encryptionKey !== 'string' || this.encryptionKey.trim() === '') {
            if (isDevelopment) {
                console.warn('Drive 로드: 암호화 키가 유효하지 않습니다.');
            }
            return null;
        }

        this.isSyncing = true;
        this.updateSyncStatus({ isSyncing: true, error: null });

        try {
            const data = await loadVaultFromDrive(this.encryptionKey);
            this.lastSyncTime = new Date();
            this.syncError = null;
            this.updateSyncStatus({ 
                isSyncing: false, 
                lastSyncTime: this.lastSyncTime,
                error: null 
            });

            if (isDevelopment) {
                console.log('Drive 로드 완료:', this.lastSyncTime);
            }

            return data;
        } catch (error) {
            this.syncError = error.message;
            this.updateSyncStatus({ 
                isSyncing: false, 
                error: this.syncError 
            });

            if (isDevelopment) {
                console.error('Drive 로드 실패:', error);
            }
            throw error;
        } finally {
            this.isSyncing = false;
        }
    };

    /**
     * 동기화 상태 가져오기
     */
    getSyncStatus = () => {
        return {
            isSyncing: this.isSyncing,
            lastSyncTime: this.lastSyncTime,
            error: this.syncError
        };
    };

    /**
     * 리소스 정리
     */
    cleanup = () => {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = null;
        }
    };
}

// 싱글톤 인스턴스
export const driveSyncManager = new DriveSyncManager();

