# encryptionKey 동기화 매니저 전달 수정 보고서

**작업일**: 2024년  
**문제**: Google 인증은 성공했으나 encryptionKey가 driveSyncManager에 전달되지 않아 403 에러 및 동기화 중단 발생  
**상태**: ✅ **수정 완료**

---

## 🔍 문제 분석

### 발생한 문제
- **encryptionKey 미전달**: Google 인증은 성공했지만 `encryptionKey`가 `driveSyncManager`에 전달되지 않음
- **403 에러**: 키가 없어 Google Drive API 호출 시 403 에러 발생
- **동기화 중단**: 키가 없어 동기화가 실행되지 않음
- **타이밍 이슈**: React 상태 업데이트 타이밍으로 인해 `encryptionKey`가 설정되기 전에 동기화가 시도됨

---

## ✅ 수정 사항

### 1. App.jsx - 키 생성 자동화 및 순서 보장

#### 변경 사항
- ✅ **키 생성 자동화**: `encryptionKey` 또는 `userProfile.id`를 즉시 `driveSyncManager`에 설정
- ✅ **순서 보장**: 키가 생성된 후에만 동기화가 시작되도록 보장
- ✅ **상태 동기화**: `encryptionKey`와 `driveSyncManager.encryptionKey`를 항상 동기화

**수정 코드**:
```javascript
// 동기화 상태 콜백 및 암호화 키 설정 (키 생성 자동화 및 순서 보장)
useEffect(() => {
  // 동기화 상태 콜백은 항상 설정
  driveSyncManager.setSyncStatusCallback(setSyncStatus);
  
  // encryptionKey 생성 및 설정 (우선순위: encryptionKey > userProfile.id)
  const keyToUse = encryptionKey || googleAuth.userProfile?.id;
  
  if (keyToUse && typeof keyToUse === 'string' && keyToUse.trim() !== '') {
    // 키가 유효하면 즉시 driveSyncManager에 설정
    console.log('🔑 encryptionKey를 driveSyncManager에 설정:', keyToUse);
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
```

---

### 2. useSecureVaultWithDrive.js - 동기화 대기 로직 강화

#### 변경 사항
- ✅ **키 유효성 검증**: `encryptionKey`의 타입과 빈 문자열 체크 추가
- ✅ **초기 동기화 대기**: 키가 준비된 후에만 초기 동기화 시작
- ✅ **Auto Save 키 확인**: Auto Save 시 `driveSyncManager`에 키가 설정되어 있는지 확인

**수정 코드**:
```javascript
// Initial Sync: 로그인 직후 Drive에서 데이터 로드 (키 생성 대기 로직 포함)
useEffect(() => {
    // 키가 없거나 동기화를 사용하지 않으면 대기
    if (!encryptionKey || !useDriveSync || !isInitialMount.current) {
        isInitialMount.current = false;
        if (!encryptionKey) {
            setIsLoading(false);
            if (isDevelopment) {
                console.log('⏳ encryptionKey 대기 중... (초기 동기화 보류)');
            }
        }
        return;
    }

    // 키가 유효한지 확인 (타입 및 빈 문자열 체크)
    if (typeof encryptionKey !== 'string' || encryptionKey.trim() === '') {
        if (isDevelopment) {
            console.warn('⚠️ encryptionKey가 유효하지 않습니다:', encryptionKey);
        }
        setIsLoading(false);
        isInitialMount.current = false;
        return;
    }

    // ... (초기 동기화 로직)
    
    // 암호화 키 설정 (키가 준비된 후에만 실행)
    if (encryptionKey && typeof encryptionKey === 'string' && encryptionKey.trim() !== '') {
        driveSyncManager.setEncryptionKey(encryptionKey);
        if (isDevelopment) {
            console.log('✅ encryptionKey가 driveSyncManager에 설정되었습니다. 초기 동기화 시작...');
        }
    }
}, [encryptionKey, useDriveSync]);

// Auto Save: 항목 변경 시 자동 저장 (디바운스)
useEffect(() => {
    // ... (데이터 저장 로직)
    
    // Google Drive 동기화 (디바운스)
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
        }
    }
}, [items, encryptionKey, isLoading, isInitialSync, useDriveSync]);
```

---

### 3. driveSyncManager.js - 키 설정 로직 강화

#### 변경 사항
- ✅ **키 유효성 검증**: `setEncryptionKey`에서 키의 유효성을 검증
- ✅ **디버깅 로그**: 키 설정 시 로그 출력
- ✅ **getEncryptionKey 메서드**: 디버깅용 키 조회 메서드 추가

**수정 코드**:
```javascript
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
```

---

### 4. injectTestData.js - 키 생성 대기 로직 추가

#### 변경 사항
- ✅ **키 생성 대기**: 키가 준비될 때까지 대기하는 로직 추가
- ✅ **driveSyncManager 키 확인**: `driveSyncManager`에 키가 설정되어 있는지 확인
- ✅ **동기화 재개**: 키 설정 후 약간의 지연을 두어 동기화 매니저 초기화 대기

**수정 코드**:
```javascript
// encryptionKey 확인 및 재생성 (키 생성 대기 로직 포함)
let encryptionKey = window.__VAULT_ENCRYPTION_KEY__;
const googleAuth = window.__VAULT_GOOGLE_AUTH__;
const driveSyncManager = window.__VAULT_DRIVE_SYNC_MANAGER__;

// 키가 없으면 재생성 시도
if (!encryptionKey && googleAuth) {
    encryptionKey = deriveEncryptionKey(googleAuth);
    if (encryptionKey) {
        window.__VAULT_ENCRYPTION_KEY__ = encryptionKey;
        console.log('🔑 encryptionKey 재생성 완료:', encryptionKey);
    }
}

// driveSyncManager에 키 설정 (키가 준비된 후에만 실행)
if (encryptionKey && driveSyncManager) {
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
```

---

## 📋 수정된 파일 목록

1. ✅ `src/App.jsx`
   - 키 생성 자동화 로직 추가
   - 순서 보장 로직 추가
   - 상태 동기화 로직 추가

2. ✅ `src/hooks/useSecureVaultWithDrive.js`
   - 키 유효성 검증 추가
   - 초기 동기화 대기 로직 강화
   - Auto Save 키 확인 로직 추가

3. ✅ `src/utils/driveSyncManager.js`
   - 키 설정 로직 강화
   - 키 유효성 검증 추가
   - 디버깅 메서드 추가

4. ✅ `scripts/injectTestData.js`
   - 키 생성 대기 로직 추가
   - driveSyncManager 키 확인 로직 추가
   - 동기화 재개 로직 추가

---

## 🔍 수정 사항 상세

### 키 생성 자동화 흐름

```
1. Google 인증 성공
   └─> userProfile.id 생성
   
2. App.jsx useEffect 실행
   └─> encryptionKey = userProfile?.id
   └─> keyToUse = encryptionKey || userProfile?.id
   
3. 키 유효성 검증
   └─> typeof keyToUse === 'string' && keyToUse.trim() !== ''
   
4. driveSyncManager에 키 설정
   └─> driveSyncManager.setEncryptionKey(keyToUse)
   
5. 동기화 활성화
   └─> scheduleSave가 키를 확인하고 동기화 실행
```

### 동기화 대기 로직 흐름

```
1. useSecureVaultWithDrive 초기화
   └─> encryptionKey 확인
   
2. 키 유효성 검증
   └─> typeof encryptionKey === 'string' && encryptionKey.trim() !== ''
   
3. 키가 없으면 대기
   └─> setIsLoading(false)
   └─> 초기 동기화 보류
   
4. 키가 준비되면 초기 동기화 시작
   └─> driveSyncManager.setEncryptionKey(encryptionKey)
   └─> loadVaultFromDrive(encryptionKey)
```

### 데이터 주입 재실행 흐름

```
1. injectTestDataWithKeyCheck() 호출
   
2. 키 확인 및 재생성
   └─> window.__VAULT_ENCRYPTION_KEY__ 확인
   └─> 없으면 deriveEncryptionKey() 호출
   
3. driveSyncManager에 키 설정
   └─> managerKey 확인
   └─> 없거나 다르면 재설정
   └─> 100ms 지연 (초기화 대기)
   
4. 테스트 데이터 생성 및 주입
   └─> generateTestData() 호출
   └─> addItem() 반복 호출
   
5. 자동 동기화
   └─> useSecureVaultWithDrive의 useEffect가 scheduleSave 자동 호출
```

---

## ✅ 수정 완료 체크리스트

- [x] App.jsx에 키 생성 자동화 로직 추가
- [x] App.jsx에 순서 보장 로직 추가
- [x] useSecureVaultWithDrive.js에 키 유효성 검증 추가
- [x] useSecureVaultWithDrive.js에 초기 동기화 대기 로직 강화
- [x] useSecureVaultWithDrive.js에 Auto Save 키 확인 로직 추가
- [x] driveSyncManager.js에 키 설정 로직 강화
- [x] driveSyncManager.js에 디버깅 메서드 추가
- [x] injectTestData.js에 키 생성 대기 로직 추가
- [x] 빌드 검증 완료
- [x] 린터 검증 완료

---

## 🚀 사용 방법

### 테스트 데이터 주입 (키 로딩 확인 후 자동 실행)

```javascript
// 브라우저 콘솔에서 실행
window.injectTestDataWithKeyCheck();
```

**동작 흐름**:
1. 키 확인 및 재생성 (필요 시)
2. `driveSyncManager`에 키 설정
3. 100ms 지연 (동기화 매니저 초기화 대기)
4. 테스트 데이터 생성 및 주입
5. 자동 동기화 실행

---

## 🔍 검증 사항

### 키 생성 자동화 확인
- [ ] Google 인증 성공 후 `encryptionKey`가 즉시 생성되는지 확인
- [ ] `driveSyncManager.encryptionKey`가 설정되는지 확인
- [ ] 콘솔에 "🔑 encryptionKey를 driveSyncManager에 설정" 메시지가 출력되는지 확인

### 동기화 대기 로직 확인
- [ ] 키가 없을 때 초기 동기화가 보류되는지 확인
- [ ] 키가 준비된 후 초기 동기화가 시작되는지 확인
- [ ] Auto Save 시 `driveSyncManager`에 키가 설정되어 있는지 확인

### 데이터 주입 재실행 확인
- [ ] `injectTestDataWithKeyCheck()` 실행 시 키가 자동으로 확인/재생성되는지 확인
- [ ] `driveSyncManager`에 키가 설정되는지 확인
- [ ] 테스트 데이터가 정상적으로 주입되는지 확인
- [ ] 주입 후 자동 동기화가 실행되는지 확인

### 403 에러 해결 확인
- [ ] Google 인증 성공 후 403 에러가 발생하지 않는지 확인
- [ ] 동기화가 정상적으로 실행되는지 확인
- [ ] 200개 데이터가 Google Drive에 정상적으로 동기화되는지 확인

---

**작성일**: 2024년  
**최종 업데이트**: 2024년  
**상태**: ✅ **모든 수정 완료, 빌드 및 린터 검증 완료**



