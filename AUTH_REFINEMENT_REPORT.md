# 🔧 인증 흐름 세부 조정 보고서

**작업일**: 2024년  
**작업 내용**: 논리적 중간 지대 설정 - 렌더링 조건 완화 및 상태 확정

---

## ✅ 수정 완료 사항

### 1. App.jsx의 렌더링 조건 완화

**문제점**:
- `!encryptionKey` 조건이 `!isAuthenticated`와 함께 있어서, 인증은 완료되었지만 `encryptionKey`가 준비되기 전까지 전체 화면이 로그인 화면으로 표시됨
- 사용자 경험이 부자연스러움

**수정 내용**:
```javascript
// ❌ 수정 전
if (!isAuthenticated || !googleAuth.userProfile || !encryptionKey) {
    return <LoginScreen ... />;
}

// ✅ 수정 후
// 로그인 전 화면 (인증되지 않은 경우에만 로그인 화면 표시)
if (!isAuthenticated) {
    return <LoginScreen ... />;
}

// encryptionKey가 준비될 때까지 로딩 스피너 표시 (메인 구조는 유지)
if (!encryptionKey) {
    return (
        <div className="flex h-screen bg-gray-100 items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
                <p className="text-gray-500">인증 정보를 불러오는 중...</p>
            </div>
        </div>
    );
}
```

**효과**:
- `isAuthenticated`가 `true`이면 메인 구조로 진입
- `encryptionKey`가 준비될 때까지 로딩 스피너 표시
- 유기적인 순서 보장 (인증 완료 → 프로필 로딩 → 메인 화면)

**파일**: `src/App.jsx` line 122-140

---

### 2. useGoogleAuth.js의 상태 확정

**문제점**:
- 로그인 성공 후 `userProfile`이 들어오는 시점과 `isAuthenticated`가 `true`가 되는 시점 사이의 간격 존재
- `userProfile`이 없거나 `id`가 없을 때도 `isAuthenticated`가 `true`가 될 수 있음
- 부모 컴포넌트가 성급하게 렌더링을 시도하다가 튕기는 현상 발생 가능

**수정 내용**:

#### login() 함수
```javascript
// ✅ 수정 후
const login = useCallback(async () => {
    try {
        setIsLoading(true);
        setError(null);
        
        if (!isGoogleAPILoaded()) {
            throw new Error('Google Identity Services가 로드되지 않았습니다.');
        }

        const result = await requestAccessToken();
        
        // 프로필이 확실히 확보된 후에만 인증 상태를 true로 설정
        if (result.profile && result.profile.id) {
            // userProfile을 먼저 설정
            setUserProfile(result.profile);
            // 그 다음 isAuthenticated를 true로 설정 (순서 중요)
            setIsAuthenticated(true);
            setError(null);
            return result.profile;
        } else {
            // 프로필이 없거나 id가 없으면 로그인 실패로 간주
            setIsAuthenticated(false);
            setUserProfile(null);
            throw new Error('사용자 프로필을 가져올 수 없습니다.');
        }
    } catch (error) {
        // ... 에러 처리
    } finally {
        setIsLoading(false);
    }
}, []);
```

#### checkAuthStatus() 함수
```javascript
// ✅ 수정 후
const checkAuthStatus = useCallback(async () => {
    try {
        setIsLoading(true);
        
        if (!isGoogleAPILoaded()) {
            setIsAuthenticated(false);
            setUserProfile(null);
            setIsLoading(false);
            return;
        }

        const signedIn = isSignedIn();
        
        if (signedIn) {
            const profile = await getUserProfile();
            // 프로필이 확실히 확보되고 id가 있는 경우에만 인증 상태를 true로 설정
            if (profile && profile.id) {
                // userProfile을 먼저 설정
                setUserProfile(profile);
                // 그 다음 isAuthenticated를 true로 설정 (순서 중요)
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
                setUserProfile(null);
            }
        } else {
            setIsAuthenticated(false);
            setUserProfile(null);
        }
    } catch (error) {
        // ... 에러 처리
    } finally {
        setIsLoading(false);
    }
}, []);
```

**핵심 개선 사항**:
1. **프로필 검증 강화**: `result.profile && result.profile.id` 확인으로 프로필의 유효성 검증
2. **상태 설정 순서 명확화**: `setUserProfile()` → `setIsAuthenticated(true)` 순서 보장
3. **타이밍 간격 제거**: 프로필이 확실히 확보된 후에만 `isAuthenticated`를 `true`로 설정

**효과**:
- `userProfile`과 `isAuthenticated` 상태가 동기화됨
- 부모 컴포넌트가 성급하게 렌더링을 시도하는 현상 방지
- `encryptionKey` (userProfile.id)가 항상 존재하는 상태에서만 메인 화면 렌더링

**파일**: `src/hooks/useGoogleAuth.js` line 59-102

---

## 📊 수정 전후 비교

### 수정 전 문제점

1. **렌더링 조건이 너무 엄격**:
   - `encryptionKey`가 없으면 로그인 화면으로 리다이렉트
   - 인증은 완료되었지만 프로필이 로딩되는 동안 사용자가 로그인 화면을 다시 보게 됨

2. **상태 설정 타이밍 불일치**:
   - `isAuthenticated`가 `true`가 되었지만 `userProfile`이 아직 설정되지 않은 순간 존재
   - `encryptionKey`가 `undefined`인 상태에서 메인 화면 렌더링 시도

### 수정 후 개선 사항

1. **유기적인 렌더링 순서**:
   - 인증 완료 → 프로필 로딩 (로딩 스피너) → 메인 화면
   - 각 단계가 명확하게 분리되어 사용자 경험 개선

2. **상태 동기화 보장**:
   - `userProfile`이 확실히 확보된 후에만 `isAuthenticated`를 `true`로 설정
   - `encryptionKey`가 항상 존재하는 상태에서만 메인 화면 렌더링

---

## ✅ 검증 결과

### 빌드 확인
- ✅ 빌드 성공
- ✅ 린터 오류 없음

### 상태 흐름 검증

**정상 흐름**:
```
1. 사용자가 로그인 버튼 클릭
   ↓
2. login() 호출
   ↓
3. requestAccessToken() 완료 → result.profile 확인
   ↓
4. setUserProfile(result.profile) 호출 (프로필 설정)
   ↓
5. setIsAuthenticated(true) 호출 (인증 상태 설정)
   ↓
6. App.jsx: isAuthenticated === true 확인 → 메인 구조 진입
   ↓
7. App.jsx: encryptionKey (userProfile.id) 확인 → 메인 화면 렌더링
```

**비정상 흐름 (에러 처리)**:
```
1. requestAccessToken() 실패 또는 profile.id 없음
   ↓
2. setIsAuthenticated(false) 호출
   ↓
3. setUserProfile(null) 호출
   ↓
4. App.jsx: isAuthenticated === false 확인 → 로그인 화면 표시
```

---

## 📋 기대 효과

1. **사용자 경험 개선**:
   - 인증 완료 후 자연스러운 로딩 과정 표시
   - 로그인 화면과 메인 화면 사이의 불필요한 전환 제거

2. **상태 일관성 보장**:
   - `userProfile`과 `isAuthenticated` 상태가 항상 동기화됨
   - `encryptionKey`가 항상 존재하는 상태에서만 데이터 처리

3. **안정성 향상**:
   - 프로필이 확실히 확보된 후에만 인증 상태 설정
   - 부모 컴포넌트의 성급한 렌더링 시도 방지

---

**작성일**: 2024년  
**상태**: ✅ **수정 완료**


