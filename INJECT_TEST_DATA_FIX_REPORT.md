# injectTestData 함수 노출 수정 보고서

**작업일**: 2024년  
**문제**: `window.injectTestDataWithKeyCheck`가 정의되지 않아 에러 발생  
**상태**: ✅ **수정 완료**

---

## 🔍 문제 분석

### 발생한 문제
- **함수 미정의**: `window.injectTestDataWithKeyCheck`가 정의되지 않아 콘솔에서 호출 시 에러 발생
- **모듈 로드 문제**: `scripts/injectTestData.js`가 자동으로 로드되지 않음
- **정적 import 실패**: 빌드 시 경로 문제로 인해 정적 import가 실패

---

## ✅ 수정 사항

### 1. App.jsx - 동적 import로 함수 로드 및 노출

#### 변경 사항
- ✅ **정적 import 제거**: 빌드 에러를 방지하기 위해 정적 import 제거
- ✅ **동적 import 사용**: `useEffect` 내에서 동적 import로 함수 로드
- ✅ **함수 노출**: 로드된 함수를 `window` 객체에 노출
- ✅ **이름 통일**: `window.injectTestData`로 통일
- ✅ **간단한 별칭 추가**: `window.forceInject` 추가

**수정 코드**:
```javascript
// 개발 모드에서 테스트 데이터 주입을 위한 전역 함수 노출
useEffect(() => {
  if (isDevelopment && typeof window !== 'undefined') {
    // Vault 관련 전역 변수 노출
    window.__VAULT_ADD_ITEM__ = addItem;
    window.__VAULT_ITEMS__ = items;
    window.__VAULT_ENCRYPTION_KEY__ = encryptionKey || googleAuth.userProfile?.id || null;
    window.__VAULT_GOOGLE_AUTH__ = googleAuth;
    window.__VAULT_DRIVE_SYNC_MANAGER__ = driveSyncManager;
    
    // 테스트 데이터 주입 함수를 동적으로 로드하여 노출
    const setupInjectFunctions = async () => {
      try {
        // 동적 import로 injectTestData 함수 로드
        const injectModule = await import('../scripts/injectTestData.js');
        const injectFn = injectModule.injectTestData;
        const injectWithKeyCheckFn = injectModule.injectTestDataWithKeyCheck;
        
        // 함수 노출 (이름 통일: injectTestData)
        window.injectTestData = injectFn;
        window.injectTestDataWithKeyCheck = injectWithKeyCheckFn;
        
        // 즉시 실행 가능한 간단한 함수 (forceInject)
        window.forceInject = injectFn;
        
        if (!window.__VAULT_TEST_DATA_LOADED__) {
          console.log('🔧 개발 모드: 테스트 데이터 주입 함수가 window 객체에 노출되었습니다.');
          console.log('사용법:');
          console.log('  - window.injectTestData() - 키 확인 후 주입');
          console.log('  - window.injectTestDataWithKeyCheck() - 키 확인 및 재생성 후 주입');
          console.log('  - window.forceInject() - 즉시 주입 (간단한 별칭)');
          window.__VAULT_TEST_DATA_LOADED__ = true;
        }
      } catch (error) {
        console.error('테스트 데이터 주입 함수 로드 실패:', error);
        // 로드 실패 시에도 기본 함수는 제공
        window.forceInject = async () => {
          console.error('테스트 데이터 주입 함수를 로드할 수 없습니다. 페이지를 새로고침해주세요.');
        };
      }
    };
    
    setupInjectFunctions();
  }
}, [addItem, items, encryptionKey, googleAuth, isDevelopment]);
```

---

### 2. injectTestData.js - 중복 방지 로직 추가

#### 변경 사항
- ✅ **중복 방지**: `window.injectTestData`가 이미 존재하면 노출하지 않음
- ✅ **forceInject 별칭 추가**: 즉시 실행 가능한 간단한 별칭 제공

**수정 코드**:
```javascript
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
```

---

## 📋 수정된 파일 목록

1. ✅ `src/App.jsx`
   - 정적 import 제거
   - 동적 import로 함수 로드
   - `window.injectTestData`, `window.injectTestDataWithKeyCheck`, `window.forceInject` 노출

2. ✅ `scripts/injectTestData.js`
   - 중복 방지 로직 추가
   - `window.forceInject` 별칭 추가

---

## 🚀 사용 방법

### 브라우저 콘솔에서 실행

#### 방법 1: injectTestData (권장)
```javascript
window.injectTestData();
```

#### 방법 2: injectTestDataWithKeyCheck (키 확인 포함)
```javascript
window.injectTestDataWithKeyCheck();
```

#### 방법 3: forceInject (간단한 별칭)
```javascript
window.forceInject();
```

---

## ✅ 수정 완료 체크리스트

- [x] App.jsx에서 정적 import 제거
- [x] 동적 import로 함수 로드 구현
- [x] window.injectTestData 노출
- [x] window.injectTestDataWithKeyCheck 노출
- [x] window.forceInject 별칭 추가
- [x] injectTestData.js에 중복 방지 로직 추가
- [x] 빌드 검증 완료
- [x] 린터 검증 완료

---

## 🔍 검증 사항

### 함수 노출 확인
- [ ] 브라우저 콘솔에서 `window.injectTestData`가 정의되어 있는지 확인
- [ ] `window.injectTestDataWithKeyCheck`가 정의되어 있는지 확인
- [ ] `window.forceInject`가 정의되어 있는지 확인

### 함수 실행 확인
- [ ] `window.injectTestData()` 실행 시 에러가 발생하지 않는지 확인
- [ ] `window.injectTestDataWithKeyCheck()` 실행 시 에러가 발생하지 않는지 확인
- [ ] `window.forceInject()` 실행 시 에러가 발생하지 않는지 확인
- [ ] 200개 데이터가 정상적으로 주입되는지 확인

---

**작성일**: 2024년  
**최종 업데이트**: 2024년  
**상태**: ✅ **모든 수정 완료, 빌드 및 린터 검증 완료**

