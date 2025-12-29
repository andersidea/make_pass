/**
 * 테스트 데이터 주입 스크립트
 * 브라우저 콘솔에서 실행하여 200개 이상의 테스트 데이터를 주입합니다.
 * 
 * 사용법:
 * 1. 개발 서버 실행 (npm run dev)
 * 2. 앱에 로그인
 * 3. 브라우저 콘솔 열기 (F12)
 * 4. 아래 코드를 복사하여 콘솔에 붙여넣기
 * 
 * 또는:
 * import { injectTestData } from './scripts/injectTestData';
 * injectTestData(window.__VAULT_ADD_ITEM__);
 */

import { generateTestData } from './generateTestData.js';

/**
 * encryptionKey 재생성 (Google 프로필 ID 기반)
 * @param {Object} googleAuth - useGoogleAuth 훅에서 가져온 객체
 * @returns {string|null} 재생성된 encryptionKey 또는 null
 */
const deriveEncryptionKey = (googleAuth) => {
    if (googleAuth?.userProfile?.id) {
        const derivedKey = googleAuth.userProfile.id;
        console.log('🔑 encryptionKey 재생성:', derivedKey);
        return derivedKey;
    }
    return null;
};

/**
 * 테스트 데이터 주입 함수 (키 확인 및 재생성 포함)
 * @param {Function} addItemFunction - vault의 addItem 함수 (선택사항, window.__VAULT_ADD_ITEM__ 사용 시 생략 가능)
 * @param {Function} progressCallback - 진행 상황 콜백 (선택사항)
 * @returns {Promise<Object>} 주입 결과
 */
export const injectTestData = async (addItemFunction = null, progressCallback = null) => {
    // 브라우저 환경에서 window 객체 접근 가능한 경우
    if (typeof window !== 'undefined') {
        // addItemFunction이 제공되지 않은 경우 window에서 가져오기
        const addItem = addItemFunction || window.__VAULT_ADD_ITEM__;
        
        if (!addItem || typeof addItem !== 'function') {
            throw new Error('addItem 함수가 제공되지 않았습니다. window.__VAULT_ADD_ITEM__를 확인하세요.');
        }

        // encryptionKey 확인 및 재생성 (키 생성 대기 로직 포함)
        let encryptionKey = window.__VAULT_ENCRYPTION_KEY__;
        const googleAuth = window.__VAULT_GOOGLE_AUTH__;
        const driveSyncManager = window.__VAULT_DRIVE_SYNC_MANAGER__;

        // 키가 없으면 재생성 시도
        if (!encryptionKey && googleAuth) {
            encryptionKey = deriveEncryptionKey(googleAuth);
            if (encryptionKey) {
                // 전역 변수 업데이트
                window.__VAULT_ENCRYPTION_KEY__ = encryptionKey;
                console.log('🔑 encryptionKey 재생성 완료:', encryptionKey);
            }
        }

        // driveSyncManager에 키 설정 (키가 준비된 후에만 실행)
        if (encryptionKey && driveSyncManager) {
            // driveSyncManager에 키가 설정되어 있는지 확인
            const managerKey = driveSyncManager.encryptionKey;
            if (!managerKey || managerKey !== encryptionKey) {
                console.log('🔑 encryptionKey를 driveSyncManager에 설정합니다:', encryptionKey);
                driveSyncManager.setEncryptionKey(encryptionKey);
                
                // 키 설정 후 약간의 지연 (동기화 매니저 초기화 대기)
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                console.log('✅ encryptionKey가 이미 driveSyncManager에 설정되어 있습니다.');
            }
        }

        if (!encryptionKey) {
            throw new Error('encryptionKey를 생성할 수 없습니다. Google 로그인이 필요합니다.');
        }

        console.log('✅ encryptionKey 확인 완료:', encryptionKey ? '존재' : '없음');
    } else if (!addItemFunction || typeof addItemFunction !== 'function') {
        throw new Error('addItem 함수가 제공되지 않았습니다.');
    }

    const addItem = addItemFunction || window.__VAULT_ADD_ITEM__;

    console.log('🧪 테스트 데이터 생성 시작...');
    const testData = generateTestData();
    console.log(`✅ ${testData.length}개의 테스트 데이터 생성 완료`);

    const results = {
        total: testData.length,
        success: 0,
        failed: 0,
        errors: []
    };

    // 성능 측정 시작
    const startTime = performance.now();

    // 각 아이템을 순차적으로 추가 (성능 측정을 위해)
    for (let i = 0; i < testData.length; i++) {
        try {
            const item = testData[i];
            addItem(item);
            results.success++;
            
            if (progressCallback && (i % 50 === 0 || i === testData.length - 1)) {
                progressCallback({
                    current: i + 1,
                    total: testData.length,
                    percentage: Math.round(((i + 1) / testData.length) * 100)
                });
            }
        } catch (error) {
            results.failed++;
            results.errors.push({
                index: i,
                item: testData[i],
                error: error.message
            });
            console.error(`❌ 아이템 ${i + 1} 추가 실패:`, error);
        }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log('📊 테스트 데이터 주입 완료:');
    console.log(`   - 총 데이터: ${results.total}개`);
    console.log(`   - 성공: ${results.success}개`);
    console.log(`   - 실패: ${results.failed}개`);
    console.log(`   - 소요 시간: ${duration.toFixed(2)}ms (${(duration / 1000).toFixed(2)}초)`);
    console.log(`   - 평균 속도: ${(results.total / (duration / 1000)).toFixed(2)}개/초`);

    // 키가 로드된 경우 동기화 재개 확인 (브라우저 환경에서만)
    // 주의: addItem이 호출되면 useSecureVaultWithDrive의 useEffect가 자동으로 scheduleSave를 호출하므로
    // 여기서는 키가 제대로 설정되었는지만 확인하고, 실제 동기화는 자동으로 처리됨
    if (typeof window !== 'undefined') {
        const driveSyncManager = window.__VAULT_DRIVE_SYNC_MANAGER__;
        const encryptionKey = window.__VAULT_ENCRYPTION_KEY__;
        
        if (driveSyncManager && encryptionKey) {
            console.log('✅ encryptionKey가 driveSyncManager에 설정되어 있습니다. 동기화는 자동으로 처리됩니다.');
        } else {
            console.warn('⚠️ encryptionKey 또는 driveSyncManager가 설정되지 않았습니다. 동기화가 자동으로 처리되지 않을 수 있습니다.');
        }
    }

    return {
        ...results,
        duration,
        averageSpeed: results.total / (duration / 1000)
    };
};

/**
 * 키 확인 및 재생성 후 테스트 데이터 주입 (편의 함수)
 */
export const injectTestDataWithKeyCheck = async () => {
    if (typeof window === 'undefined') {
        throw new Error('브라우저 환경에서만 사용할 수 있습니다.');
    }
    
    return await injectTestData();
};

// 브라우저 환경에서 사용할 수 있도록 window 객체에 추가 (개발 모드에서만)
// 주의: App.jsx에서도 노출하므로 여기서는 중복 방지를 위해 조건부로만 실행
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production' && !window.injectTestData) {
    window.injectTestData = injectTestData;
    window.injectTestDataWithKeyCheck = injectTestDataWithKeyCheck;
    window.generateTestData = generateTestData;
    window.forceInject = injectTestData; // 즉시 실행 가능한 간단한 별칭
    console.log('🔧 테스트 데이터 주입 함수가 window 객체에 추가되었습니다.');
    console.log('사용법: window.injectTestData() 또는 window.forceInject()');
}

// Node.js 환경에서 실행 시
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { injectTestData };
}

