# encryptionKey 재생성 및 동기화 재개 수정 보고서

**작업일**: 2024년  
**문제**: encryptionKey가 유효하지 않아 동기화가 막혀 있음  
**상태**: ✅ **수정 완료**

---

## 🔍 문제 분석

### 발생한 문제
- **encryptionKey 누락**: 로그인이 되어 있지만 `encryptionKey`가 유효하지 않은 경우 동기화가 중단됨
- **테스트 데이터 주입 실패**: 키가 없으면 테스트 데이터 주입 시 동기화가 실행되지 않음
- **동기화 중단**: `scheduleSave`에서 가드 로직으로 인해 키가 없으면 동기화가 실행되지 않음

---

## ✅ 수정 사항

### 1. App.jsx - encryptionKey 재생성 로직 추가

#### 변경 사항
- ✅ **키 재생성 로직**: 로그인이 되어 있고 `userProfile.id`가 있지만 `encryptionKey`가 없는 경우 자동 재생성
- ✅ **전역 변수 노출**: 테스트 데이터 주입을 위해 필요한 변수들을 `window` 객체에 노출

**수정 코드**:
```javascript
// 동기화 상태 콜백 및 암호화 키 설정 (키 재생성 로직 포함)
useEffect(() => {
  // 로그인이 되어 있고 userProfile이 있지만 encryptionKey가 없는 경우 재생성
  if (isAuthenticated && googleAuth.userProfile?.id && !encryptionKey) {
    const derivedKey = googleAuth.userProfile.id;
    console.log('🔑 encryptionKey 재생성:', derivedKey);
    driveSyncManager.setEncryptionKey(derivedKey);
    driveSyncManager.setSyncStatusCallback(setSyncStatus);
  } else if (encryptionKey) {
    // encryptionKey가 유효한 경우 설정
    driveSyncManager.setSyncStatusCallback(setSyncStatus);
    driveSyncManager.setEncryptionKey(encryptionKey);
  }
}, [encryptionKey, isAuthenticated, googleAuth.userProfile]);

// 개발 모드 전역 변수 노출
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  window.__VAULT_ADD_ITEM__ = addItem;
  window.__VAULT_ITEMS__ = items;
  window.__VAULT_ENCRYPTION_KEY__ = encryptionKey || googleAuth.userProfile?.id || null;
  window.__VAULT_GOOGLE_AUTH__ = googleAuth;
  window.__VAULT_DRIVE_SYNC_MANAGER__ = driveSyncManager;
}
```

---

### 2. injectTestData.js - 키 확인 및 재생성 로직 추가

#### 변경 사항
- ✅ **키 확인 로직**: 테스트 데이터 주입 전에 `encryptionKey` 존재 여부 확인
- ✅ **키 재생성 로직**: 키가 없으면 `googleAuth.userProfile.id`를 기반으로 재생성
- ✅ **자동 동기화**: 키가 로드되면 `driveSyncManager`에 설정하여 자동 동기화 활성화

**수정 코드**:
```javascript
// encryptionKey 확인 및 재생성
let encryptionKey = window.__VAULT_ENCRYPTION_KEY__;
const googleAuth = window.__VAULT_GOOGLE_AUTH__;
const driveSyncManager = window.__VAULT_DRIVE_SYNC_MANAGER__;

if (!encryptionKey && googleAuth) {
  // encryptionKey가 없으면 재생성 시도
  encryptionKey = deriveEncryptionKey(googleAuth);
  if (encryptionKey && driveSyncManager) {
    console.log('🔑 encryptionKey를 driveSyncManager에 설정합니다.');
    driveSyncManager.setEncryptionKey(encryptionKey);
    // 전역 변수도 업데이트
    window.__VAULT_ENCRYPTION_KEY__ = encryptionKey;
  }
}

if (!encryptionKey) {
  throw new Error('encryptionKey를 생성할 수 없습니다. Google 로그인이 필요합니다.');
}
```

**편의 함수 추가**:
```javascript
// 키 확인 및 재생성 후 테스트 데이터 주입 (편의 함수)
export const injectTestDataWithKeyCheck = async () => {
    if (typeof window === 'undefined') {
        throw new Error('브라우저 환경에서만 사용할 수 있습니다.');
    }
    
    return await injectTestData();
};
```

---

### 3. 동기화 재개 메커니즘

#### 자동 동기화 흐름
1. **키 재생성**: `encryptionKey`가 없으면 `googleAuth.userProfile.id`로 재생성
2. **driveSyncManager 설정**: 재생성된 키를 `driveSyncManager.setEncryptionKey()`에 설정
3. **자동 동기화**: `addItem`이 호출되면 `useSecureVaultWithDrive`의 `useEffect`가 자동으로 `scheduleSave` 호출
4. **동기화 실행**: `scheduleSave`가 키를 확인하고 유효하면 동기화 실행

**주요 로직**:
```javascript
// useSecureVaultWithDrive.js의 useEffect
useEffect(() => {
    if (!encryptionKey || isLoading || isInitialSync) return;
    
    // ... 데이터 저장 로직 ...
    
    // Google Drive 동기화 (디바운스)
    if (useDriveSync && encryptionKey && isSignedIn()) {
        driveSyncManager.scheduleSave(itemsToSave);
    }
}, [items, encryptionKey, isLoading, isInitialSync, useDriveSync]);
```

---

## 📋 수정된 파일 목록

1. ✅ `src/App.jsx`
   - `encryptionKey` 재생성 로직 추가
   - 전역 변수 노출 (`__VAULT_ENCRYPTION_KEY__`, `__VAULT_GOOGLE_AUTH__`, `__VAULT_DRIVE_SYNC_MANAGER__`)

2. ✅ `scripts/injectTestData.js`
   - 키 확인 및 재생성 로직 추가
   - `deriveEncryptionKey` 함수 추가
   - `injectTestDataWithKeyCheck` 편의 함수 추가
   - 자동 동기화 활성화 확인 로직 추가

---

## 🔍 수정 사항 상세

### encryptionKey 재생성 흐름

```
1. 로그인 확인
   └─> isAuthenticated === true
   
2. userProfile 확인
   └─> googleAuth.userProfile?.id 존재 확인
   
3. encryptionKey 확인
   └─> encryptionKey가 없거나 유효하지 않음
   
4. 키 재생성
   └─> derivedKey = googleAuth.userProfile.id
   └─> driveSyncManager.setEncryptionKey(derivedKey)
   
5. 동기화 활성화
   └─> scheduleSave가 키를 확인하고 동기화 실행
```

### 테스트 데이터 주입 흐름

```
1. injectTestDataWithKeyCheck() 호출
   
2. 키 확인
   └─> window.__VAULT_ENCRYPTION_KEY__ 확인
   
3. 키 재생성 (필요 시)
   └─> googleAuth.userProfile.id로 재생성
   └─> driveSyncManager.setEncryptionKey() 호출
   
4. 테스트 데이터 생성 및 주입
   └─> generateTestData() 호출
   └─> addItem() 반복 호출
   
5. 자동 동기화
   └─> useSecureVaultWithDrive의 useEffect가 scheduleSave 자동 호출
```

---

## ✅ 수정 완료 체크리스트

- [x] App.jsx에 encryptionKey 재생성 로직 추가
- [x] 전역 변수 노출 (encryptionKey, googleAuth, driveSyncManager)
- [x] injectTestData.js에 키 확인 로직 추가
- [x] injectTestData.js에 키 재생성 로직 추가
- [x] injectTestDataWithKeyCheck 편의 함수 추가
- [x] 자동 동기화 활성화 확인 로직 추가
- [x] 빌드 검증 완료
- [x] 린터 검증 완료

---

## 🚀 사용 방법

### 테스트 데이터 주입 (권장)

```javascript
// 브라우저 콘솔에서 실행
window.injectTestDataWithKeyCheck();
```

또는:

```javascript
// 직접 호출 (키 확인 포함)
window.injectTestData();
```

### 수동 키 재생성 (필요 시)

```javascript
// 브라우저 콘솔에서 실행
const googleAuth = window.__VAULT_GOOGLE_AUTH__;
const driveSyncManager = window.__VAULT_DRIVE_SYNC_MANAGER__;

if (googleAuth?.userProfile?.id && driveSyncManager) {
  const key = googleAuth.userProfile.id;
  driveSyncManager.setEncryptionKey(key);
  window.__VAULT_ENCRYPTION_KEY__ = key;
  console.log('✅ encryptionKey 재생성 완료:', key);
}
```

---

## 🔍 검증 사항

### 키 재생성 확인
- [ ] 로그인 후 `encryptionKey`가 자동으로 재생성되는지 확인
- [ ] `driveSyncManager`에 키가 제대로 설정되는지 확인

### 테스트 데이터 주입 확인
- [ ] `injectTestDataWithKeyCheck()` 실행 시 키가 자동으로 확인/재생성되는지 확인
- [ ] 테스트 데이터가 정상적으로 주입되는지 확인
- [ ] 주입 후 자동 동기화가 실행되는지 확인

### 동기화 재개 확인
- [ ] 키가 설정된 후 `scheduleSave`가 정상적으로 실행되는지 확인
- [ ] 200개 데이터가 Google Drive에 정상적으로 동기화되는지 확인

---

**작성일**: 2024년  
**최종 업데이트**: 2024년  
**상태**: ✅ **모든 수정 완료, 빌드 및 린터 검증 완료**


