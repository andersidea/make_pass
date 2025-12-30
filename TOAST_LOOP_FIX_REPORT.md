# Toast 무한 루프 및 에러 수정 보고서

**작업일**: 2024년  
**문제**: 로그인 후 '데이터 확인' 메시지 폭주 및 'Maximum update depth exceeded' 에러  
**상태**: ✅ **수정 완료**

---

## 🔍 문제 분석

### 발생한 문제
1. **Toast 무한 루프**: `App.jsx`의 `useEffect`에서 `toast` 객체를 의존성 배열에 포함하여 매 렌더링마다 새로운 함수로 인식되어 무한 루프 발생
2. **동기화 시점 제어 부족**: `encryptionKey`가 null이거나 유효하지 않을 때 동기화 함수가 실행되는 경우 발생
3. **에러 메시지 중복**: 동일한 내용의 토스트 메시지가 짧은 시간 안에 여러 번 호출됨

---

## ✅ 수정 사항

### 1. Toast Hook 최적화 (`src/components/Toast.jsx`)

#### 변경 사항
- ✅ **useCallback 사용**: `showToast`, `removeToast`, `success`, `error`, `info`, `warning` 함수들을 `useCallback`으로 메모이제이션하여 안정적인 참조 유지
- ✅ **디바운싱 로직 추가**: 동일한 메시지가 2초 이내에 호출되면 무시하는 로직 추가
- ✅ **Toast 컴포넌트 최적화**: `onRemove`를 `useCallback`으로 감싸서 안정적인 참조 유지

**수정 코드**:
```javascript
// 디바운싱: 동일한 메시지가 최근 2초 이내에 호출되었는지 확인
const messageKey = `${type}-${message}-${title || ''}`;
const now = Date.now();
const lastCallTime = recentMessages.current.get(messageKey);

if (lastCallTime && (now - lastCallTime) < DEBOUNCE_MS) {
  // 최근 2초 이내에 동일한 메시지가 호출되었으면 무시
  return null;
}
```

---

### 2. App.jsx useEffect 최적화 (`src/App.jsx`)

#### 변경 사항
- ✅ **toast 의존성 제거**: `useEffect`의 의존성 배열에서 `toast` 제거
- ✅ **useRef로 중복 호출 방지**: 각 경고 메시지가 한 번만 표시되도록 `useRef` 사용
- ✅ **조건부 경고**: 초기 로딩 중에는 경고를 표시하지 않도록 조건 추가

**수정 코드**:
```javascript
// 백업 리마인더 체크
const lastBackupReminderShown = useRef(false);
useEffect(() => {
  if (isAuthenticated && syncStatus?.lastSyncTime && !lastBackupReminderShown.current && shouldShowBackupReminder()) {
    const daysSince = getDaysSinceLastBackup();
    toast.info(/* ... */);
    lastBackupReminderShown.current = true;
  }
}, [isAuthenticated, syncStatus]); // toast 의존성 제거

// 동기화 상태 체크
const syncErrorShown = useRef(false);
const syncIncompleteShown = useRef(false);
useEffect(() => {
  // ... 조건부 경고 로직
}, [syncStatus, isAuthenticated, encryptionKey]); // toast 의존성 제거
```

---

### 3. 동기화 가드 로직 강화

#### `src/hooks/useSecureVaultWithDrive.js`
- ✅ **encryptionKey 검증 추가**: Google Drive 동기화 시 `encryptionKey`가 유효한지 확인

```javascript
// Google Drive 동기화 (디바운스)
// encryptionKey가 유효할 때만 실행 (가드 로직 강화)
if (useDriveSync && encryptionKey && isSignedIn()) {
    driveSyncManager.scheduleSave(itemsToSave);
}
```

#### `src/utils/driveSync.js`
- ✅ **saveVaultToDrive 가드 로직**: `encryptionKey`가 유효하지 않으면 즉시 에러 반환
- ✅ **loadVaultFromDrive 가드 로직**: `encryptionKey`가 유효하지 않으면 `null` 반환

```javascript
export const saveVaultToDrive = async (vaultData, encryptionKey) => {
    // 가드 로직: encryptionKey가 없으면 즉시 반환
    if (!encryptionKey || typeof encryptionKey !== 'string' || encryptionKey.trim() === '') {
        if (isDevelopment) {
            console.warn('saveVaultToDrive: 암호화 키가 유효하지 않습니다.');
        }
        throw new Error('암호화 키가 필요합니다.');
    }
    // ...
};

export const loadVaultFromDrive = async (encryptionKey) => {
    // 가드 로직: encryptionKey가 없으면 즉시 반환
    if (!encryptionKey || typeof encryptionKey !== 'string' || encryptionKey.trim() === '') {
        if (isDevelopment) {
            console.warn('loadVaultFromDrive: 암호화 키가 유효하지 않습니다.');
        }
        return null;
    }
    // ...
};
```

#### `src/utils/driveSyncManager.js`
- ✅ **saveToDrive 가드 로직 강화**: `encryptionKey` 타입 및 빈 문자열 검증 추가
- ✅ **loadFromDrive 가드 로직 강화**: `encryptionKey` 타입 및 빈 문자열 검증 추가

```javascript
saveToDrive = async (vaultData) => {
    // 가드 로직 강화: encryptionKey가 유효하지 않으면 즉시 반환
    if (!this.encryptionKey || typeof this.encryptionKey !== 'string' || this.encryptionKey.trim() === '') {
        if (isDevelopment) {
            console.warn('Drive 동기화: 암호화 키가 유효하지 않습니다.');
        }
        return;
    }
    // ...
};
```

---

## 📋 수정된 파일 목록

1. ✅ `src/components/Toast.jsx`
   - `useToast` 훅 최적화 (useCallback 사용)
   - 디바운싱 로직 추가 (2초 이내 동일 메시지 무시)
   - Toast 컴포넌트 최적화

2. ✅ `src/App.jsx`
   - useEffect 의존성 배열에서 `toast` 제거
   - useRef를 사용한 중복 호출 방지
   - 조건부 경고 로직 개선

3. ✅ `src/hooks/useSecureVaultWithDrive.js`
   - Google Drive 동기화 시 `encryptionKey` 검증 추가

4. ✅ `src/utils/driveSync.js`
   - `saveVaultToDrive` 가드 로직 추가
   - `loadVaultFromDrive` 가드 로직 추가

5. ✅ `src/utils/driveSyncManager.js`
   - `saveToDrive` 가드 로직 강화
   - `loadFromDrive` 가드 로직 강화

---

## 🔍 검증 사항

### Toast 무한 루프 방지
- ✅ `useToast` 훅의 모든 함수가 `useCallback`으로 메모이제이션됨
- ✅ `useEffect` 의존성 배열에서 `toast` 객체 제거
- ✅ Toast 컴포넌트의 `onRemove`가 `useCallback`으로 감싸짐

### 동기화 시점 제어
- ✅ `encryptionKey`가 null이거나 유효하지 않을 때 동기화 함수가 실행되지 않음
- ✅ 모든 동기화 함수에 타입 검증 및 빈 문자열 검증 추가

### 에러 메시지 중복 제거
- ✅ 동일한 메시지가 2초 이내에 호출되면 무시하는 디바운싱 로직 추가
- ✅ 각 경고 메시지가 한 번만 표시되도록 `useRef` 사용

---

## ✅ 수정 완료 체크리스트

- [x] Toast Hook 최적화 (useCallback 사용)
- [x] Toast 디바운싱 로직 추가 (2초 이내 동일 메시지 무시)
- [x] App.jsx useEffect에서 toast 의존성 제거
- [x] useRef를 사용한 중복 호출 방지
- [x] useSecureVaultWithDrive.js 가드 로직 강화
- [x] driveSync.js 가드 로직 추가
- [x] driveSyncManager.js 가드 로직 강화
- [x] 빌드 검증 완료
- [x] 린터 검증 완료

---

## 🚀 예상 효과

1. **무한 루프 해결**: `useEffect`에서 `toast` 의존성을 제거하여 무한 렌더링 루프 방지
2. **메시지 폭주 방지**: 디바운싱 로직으로 동일한 메시지가 짧은 시간 내에 여러 번 호출되는 것을 방지
3. **안정성 향상**: `encryptionKey` 검증 강화로 잘못된 상태에서 동기화 함수가 실행되는 것을 방지
4. **성능 개선**: `useCallback`을 사용하여 불필요한 함수 재생성 방지

---

**작성일**: 2024년  
**최종 업데이트**: 2024년  
**상태**: ✅ **모든 수정 완료, 빌드 및 린터 검증 완료**



