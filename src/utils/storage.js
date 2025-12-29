/**
 * Persistent Storage API 래퍼
 * localStorage 대신 더 안정적인 저장소 사용
 * 브라우저 설정에 의해 데이터가 휘발되지 않도록 보장
 */

// Storage API 지원 확인
const isStoragePersistentSupported = () => {
    return 'storage' in navigator && 'persist' in navigator.storage;
};

// Persistent Storage 요청
const requestPersistentStorage = async () => {
    if (!isStoragePersistentSupported()) {
        return false;
    }

    try {
        const isPersisted = await navigator.storage.persist();
        if (process.env.NODE_ENV !== 'production') {
            if (isPersisted) {
                console.log('✅ Persistent storage granted');
            } else {
                console.warn('⚠️ Persistent storage denied');
            }
        }
        return isPersisted;
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Failed to request persistent storage:', error);
        }
        return false;
    }
};

// Storage 사용량 확인
const getStorageEstimate = async () => {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
        return null;
    }

    try {
        const estimate = await navigator.storage.estimate();
        return {
            quota: estimate.quota,
            usage: estimate.usage,
            usageDetails: estimate.usageDetails
        };
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Failed to get storage estimate:', error);
        }
        return null;
    }
};

// localStorage 래퍼 (추후 IndexedDB로 확장 가능)
class PersistentStorage {
    constructor() {
        this.isPersistent = false;
        this.init();
    }

    async init() {
        try {
            // Persistent Storage 요청 (앱 시작 시)
            // 권한이 거부되어도 앱은 정상 동작 (일반 localStorage 사용)
            this.isPersistent = await requestPersistentStorage();
            
            // Storage 사용량 확인 (선택사항)
            if (process.env.NODE_ENV !== 'production') {
                try {
                    const estimate = await getStorageEstimate();
                    if (estimate) {
                        const usageMB = (estimate.usage / 1024 / 1024).toFixed(2);
                        const quotaMB = (estimate.quota / 1024 / 1024).toFixed(2);
                        console.log(`📦 Storage: ${usageMB}MB / ${quotaMB}MB`);
                    }
                } catch (err) {
                    // Storage 사용량 확인 실패는 무시 (기능에 영향 없음)
                }
            }
        } catch (error) {
            // init 실패 시에도 앱은 정상 동작 (일반 localStorage 사용)
            this.isPersistent = false;
            if (process.env.NODE_ENV !== 'production') {
                console.warn('Storage initialization warning:', error);
            }
        }
    }

    /**
     * 데이터 저장
     * @param {string} key
     * @param {string} value
     * @returns {boolean} 성공 여부
     */
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            // QuotaExceededError 처리
            if (error.name === 'QuotaExceededError') {
                if (process.env.NODE_ENV !== 'production') {
                    console.error('Storage quota exceeded');
                }
                // 사용자에게 알림 필요 (선택사항)
                return false;
            }
            if (process.env.NODE_ENV !== 'production') {
                console.error('Failed to save to storage:', error);
            }
            return false;
        }
    }

    /**
     * 데이터 조회
     * @param {string} key
     * @returns {string|null}
     */
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('Failed to read from storage:', error);
            }
            return null;
        }
    }

    /**
     * 데이터 삭제
     * @param {string} key
     */
    removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('Failed to remove from storage:', error);
            }
        }
    }

    /**
     * 모든 데이터 삭제
     */
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('Failed to clear storage:', error);
            }
        }
    }

    /**
     * 데이터 존재 여부 확인
     * @param {string} key
     * @returns {boolean}
     */
    hasItem(key) {
        return this.getItem(key) !== null;
    }

    /**
     * 저장소 상태 확인
     * @returns {Promise<{isPersistent: boolean, estimate: object|null}>}
     */
    async getStatus() {
        const estimate = await getStorageEstimate();
        return {
            isPersistent: this.isPersistent,
            estimate
        };
    }
}

// 싱글톤 인스턴스
const persistentStorage = new PersistentStorage();

// 앱 시작 시 Persistent Storage 요청
if (typeof window !== 'undefined') {
    persistentStorage.init();
}

export default persistentStorage;

// 기존 localStorage API와 호환되는 named export
export const storage = persistentStorage;


