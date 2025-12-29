# 🔍 인증 흐름 분석 보고서 (Authentication Flow Analysis)

## 질문 1: 로그인 시도 전에 구글 API 호출이 먼저 발생하는 '선후관계의 모순'이 어디에 있는가?

---

## ⚠️ 발견된 문제점

### 1. useGoogleAuth.js의 useEffect - 자동 인증 상태 확인

**위치**: `src/hooks/useGoogleAuth.js` line 17-27

**문제 코드**:
```javascript
// Google Identity Services 로드 확인 및 초기 인증 상태 확인
useEffect(() => {
    const checkGoogleAPI = () => {
        if (isGoogleAPILoaded()) {
            checkAuthStatus();  // ⚠️ 즉시 호출됨
        } else {
            // API 로드 대기
            setTimeout(checkGoogleAPI, 100);
        }
    };
    checkGoogleAPI();
}, []);
```

**문제점**:
- 컴포넌트가 마운트되면 **사용자 로그인 버튼 클릭 없이** `checkAuthStatus()`가 자동으로 호출됩니다.
- 사용자 상호작용 없이 Google API 호출이 발생합니다.

---

### 2. checkAuthStatus 내부의 getUserProfile 호출

**위치**: `src/hooks/useGoogleAuth.js` line 30-57

**문제 코드**:
```javascript
const checkAuthStatus = useCallback(async () => {
    try {
        if (!isGoogleAPILoaded()) {
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
        }

        const signedIn = isSignedIn();  // ⚠️ 로컬 스토리지 확인
        
        if (signedIn) {
            const profile = await getUserProfile();  // ⚠️ Google API 호출
            setUserProfile(profile);
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
            setUserProfile(null);
        }
    } catch (error) {
        // ...
    } finally {
        setIsLoading(false);
    }
}, []);
```

**문제점**:
- `isSignedIn()`이 로컬 스토리지에 토큰이 있는지만 확인하더라도, `getUserProfile()`은 **Google API 엔드포인트(`https://www.googleapis.com/oauth2/v2/userinfo`)에 HTTP 요청**을 보냅니다.
- 이는 사용자가 로그인 버튼을 클릭하기도 전에 발생합니다.

---

### 3. App.jsx에서의 즉시 사용

**위치**: `src/App.jsx` line 25-35

**문제 코드**:
```javascript
const googleAuth = useGoogleAuth();

const isAuthenticated = googleAuth.isAuthenticated;
// 암호화 키: Google 계정의 고유 ID 사용 (AES-256 보안 유지)
const encryptionKey = googleAuth.userProfile?.id;  // ⚠️ userProfile이 없으면 undefined

// Google Drive 동기화 지원하는 훅 사용
const vaultHook = useSecureVaultWithDrive(encryptionKey, true);  // ⚠️ undefined 전달 가능

const { items, isLoading, addItem, deleteItem, updateItem } = vaultHook;
const { categories, financeCategories, accountCategories, memoCategories, createCategory, updateCategory, deleteCategory, reorderCategories } = useCategories(encryptionKey);  // ⚠️ undefined 전달 가능
```

**문제점**:
- `encryptionKey`가 `undefined`일 수 있는데, 이를 `useSecureVaultWithDrive`와 `useCategories`에 전달합니다.
- 이러한 훅들이 내부적으로 Google Drive API나 다른 API를 호출할 수 있습니다.

---

## 🔄 선후관계의 모순 흐름도

```
1. App.jsx 마운트
   ↓
2. useGoogleAuth() 훅 호출
   ↓
3. useEffect 실행 (line 17-27)
   ↓
4. checkGoogleAPI() → isGoogleAPILoaded() 확인
   ↓
5. checkAuthStatus() 호출 ⚠️ (사용자 클릭 없이)
   ↓
6. isSignedIn() → 로컬 스토리지에 토큰 확인
   ↓
7. getUserProfile() 호출 ⚠️ (Google API HTTP 요청 발생)
   ↓
8. 사용자가 로그인 화면을 보기도 전에 API 호출 완료
```

**올바른 순서**:
```
1. 사용자가 로그인 화면을 봄
   ↓
2. 사용자가 "Google 계정으로 시작하기" 버튼 클릭
   ↓
3. 그때 Google API 호출 시작
```

---

## 질문 2: 인증 변수가 없을 때 UI가 죽지 않도록 하는 '최소한의 안전망'이 지금 코드에 존재하는가?

---

## ✅ 존재하는 안전망

### 1. useGoogleAuth.js의 try-catch

**위치**: `src/hooks/useGoogleAuth.js` line 30-57

**안전망 코드**:
```javascript
const checkAuthStatus = useCallback(async () => {
    try {
        // ...
        if (signedIn) {
            const profile = await getUserProfile();
            setUserProfile(profile);
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
            setUserProfile(null);
        }
    } catch (error) {
        if (isDevelopment) {
            console.error('인증 상태 확인 실패:', error);
        }
        setIsAuthenticated(false);  // ✅ 실패 시 false로 설정
        setError(error.message);
    } finally {
        setIsLoading(false);  // ✅ 로딩 상태 해제
    }
}, []);
```

**평가**: ✅ **부분적 안전망 존재**
- 에러 발생 시 `isAuthenticated`를 `false`로 설정하고 `isLoading`을 `false`로 설정합니다.
- 하지만 `userProfile`은 `null`로 유지되므로 `encryptionKey`가 `undefined`가 될 수 있습니다.

---

### 2. App.jsx의 조건부 렌더링

**위치**: `src/App.jsx` line 123-130

**안전망 코드**:
```javascript
// 로그인 전 화면 (Google 로그인만)
if (!isAuthenticated) {
    return (
        <LoginScreen 
            onGoogleLogin={handleGoogleLogin}
            isLoading={googleAuth.isLoading}
        />
    );
}
```

**평가**: ✅ **기본 안전망 존재**
- `isAuthenticated`가 `false`이면 로그인 화면을 표시합니다.
- 하지만 `isAuthenticated`가 `true`인데 `userProfile`이 `null`인 경우는 처리하지 않습니다.

---

### 3. Optional Chaining 사용

**위치**: `src/App.jsx` line 29

**안전망 코드**:
```javascript
const encryptionKey = googleAuth.userProfile?.id;  // ✅ Optional chaining
```

**평가**: ✅ **기본 안전망 존재**
- `userProfile`이 `null`이면 `encryptionKey`가 `undefined`가 되지만, 에러는 발생하지 않습니다.
- 하지만 `undefined`가 다른 훅에 전달되면 예상치 못한 동작이 발생할 수 있습니다.

---

## ❌ 부족한 안전망

### 1. encryptionKey가 undefined일 때의 처리 부족

**문제 위치**: `src/App.jsx` line 32, 35

**문제 코드**:
```javascript
const vaultHook = useSecureVaultWithDrive(encryptionKey, true);  // ⚠️ undefined 전달 가능
const { categories, financeCategories, accountCategories, memoCategories, ... } = useCategories(encryptionKey);  // ⚠️ undefined 전달 가능
```

**문제점**:
- `encryptionKey`가 `undefined`일 때 이 훅들이 어떻게 동작하는지 불명확합니다.
- `useSecureVaultWithDrive`와 `useCategories`가 `undefined`를 안전하게 처리하는지 확인이 필요합니다.

---

### 2. isAuthenticated가 true인데 userProfile이 null인 경우 미처리

**문제 위치**: `src/App.jsx` line 27-29

**문제 코드**:
```javascript
const isAuthenticated = googleAuth.isAuthenticated;
const encryptionKey = googleAuth.userProfile?.id;

// 로그인 전 화면 (Google 로그인만)
if (!isAuthenticated) {
    return <LoginScreen ... />;
}

// ⚠️ isAuthenticated가 true인데 userProfile이 null이면 encryptionKey가 undefined
// 하지만 메인 화면이 렌더링됨
```

**문제점**:
- `isAuthenticated`가 `true`인데 `userProfile`이 `null`인 경우, `encryptionKey`가 `undefined`가 되지만 메인 화면이 렌더링됩니다.
- 이 경우 데이터 암호화/복호화가 실패할 수 있습니다.

---

### 3. useSecureVaultWithDrive의 encryptionKey 검증

**확인 결과**: `src/hooks/useSecureVaultWithDrive.js` line 29-34

**안전망 코드**:
```javascript
if (!encryptionKey || !useDriveSync || !isInitialMount.current) {
    isInitialMount.current = false;
    if (!encryptionKey) {
        setIsLoading(false);  // ✅ 로딩 종료
    }
    return;  // ✅ early return
}
```

**평가**: ✅ **안전하게 처리됨**
- `encryptionKey`가 `undefined`이면 early return하여 빈 배열(`items`)을 유지하고 로딩을 종료합니다.

---

### 4. useCategories의 encryptionKey 검증

**확인 결과**: `src/hooks/useCategories.js` line 21-24

**안전망 코드**:
```javascript
if (!masterPassword) {
    setIsLoading(false);
    return;  // ✅ early return
}
```

**평가**: ✅ **안전하게 처리됨**
- `encryptionKey`가 `undefined`이면 early return하여 빈 배열(`categories`)을 유지하고 로딩을 종료합니다.

---

## 📋 권장 개선 사항

### 1. useGoogleAuth.js 개선

```javascript
// checkAuthStatus에서 에러 시 userProfile을 명시적으로 null로 설정 (이미 구현됨)
// 하지만 isAuthenticated도 false로 설정해야 함 (이미 구현됨)
```

**현재 상태**: ✅ **부분적으로 안전함**

---

### 2. App.jsx 개선

```javascript
// encryptionKey 검증 추가
const encryptionKey = googleAuth.userProfile?.id;

// ⚠️ 추가 필요: isAuthenticated가 true인데 encryptionKey가 없으면 로그인 화면으로
if (!isAuthenticated || !encryptionKey) {
    return (
        <LoginScreen 
            onGoogleLogin={handleGoogleLogin}
            isLoading={googleAuth.isLoading}
        />
    );
}
```

**현재 상태**: ❌ **부족함**

---

### 3. useSecureVaultWithDrive 개선

```javascript
// encryptionKey가 없으면 빈 배열 반환 또는 에러 처리
// 확인 필요
```

**현재 상태**: ✅ **안전하게 처리됨**
- `encryptionKey`가 없으면 early return하여 빈 배열을 유지합니다.

---

### 4. useCategories 개선

**현재 상태**: ✅ **안전하게 처리됨**
- `encryptionKey`가 없으면 early return하여 빈 배열을 유지합니다.

---

## 📊 최종 평가

### 질문 1: 선후관계의 모순

**발견 위치**:
1. ✅ `useGoogleAuth.js` line 17-27: `useEffect`에서 자동으로 `checkAuthStatus()` 호출
2. ✅ `useGoogleAuth.js` line 41: `getUserProfile()` 호출이 사용자 클릭 전에 발생
3. ⚠️ Google API HTTP 요청이 로그인 화면 표시 전에 발생할 수 있음

**심각도**: ⚠️ **중간**
- 로컬 스토리지에 토큰이 있는 경우에만 API 호출이 발생하지만, 사용자 상호작용 없이 자동으로 호출되는 것은 문제입니다.

---

### 질문 2: 최소한의 안전망

**존재하는 안전망**:
1. ✅ `try-catch` 블록으로 에러 처리
2. ✅ `isAuthenticated` 조건부 렌더링
3. ✅ Optional chaining (`userProfile?.id`)

**부족한 안전망**:
1. ❌ `isAuthenticated === true && encryptionKey === undefined` 경우 미처리
   - 이 경우 메인 화면이 렌더링되지만, 데이터를 로드할 수 없어 빈 화면이 표시될 수 있습니다.

**추가 확인 사항**:
2. ✅ `useSecureVaultWithDrive`: `encryptionKey`가 없으면 안전하게 early return
3. ✅ `useCategories`: `encryptionKey`가 없으면 안전하게 early return

**심각도**: ⚠️ **중간**
- 기본적인 안전망은 충분하지만, `isAuthenticated === true && encryptionKey === undefined` 엣지 케이스에서 문제가 발생할 수 있습니다.

---

**작성일**: 2024년  
**상태**: ✅ **분석 완료**

