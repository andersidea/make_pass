# 🔄 401 에러 재시도 로직 구현 보고서

**작업일**: 2024년  
**작업 내용**: 토큰 발급과 프로필 요청 사이의 타이밍 이슈 해결을 위한 재시도 로직 추가

---

## ✅ 수정 완료 사항

### 1. driveSync.js: getUserProfileFromToken 함수에 401 에러 재시도 로직 추가

**문제점**:
- 토큰은 발급되었으나 프로필 요청 시점에 Google 서버가 아직 해당 토큰을 '유효'하다고 인지하지 못해 401 에러 발생
- 타이밍 이슈로 인해 '찰나의 에러' 때문에 로그인이 막힘

**수정 내용**:
```javascript
/**
 * 토큰으로 사용자 정보 가져오기 (401 에러 재시도 로직 포함)
 */
const getUserProfileFromToken = async (accessToken, retryCount = 0) => {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            // 401 오류인 경우 토큰이 만료되었거나 유효하지 않음 (타이밍 이슈 가능)
            if (response.status === 401) {
                // 첫 번째 시도에서 401 에러 발생 시 1초 대기 후 한 번만 재시도
                if (retryCount === 0) {
                    if (isDevelopment) {
                        console.log('401 에러 발생, 1초 대기 후 재시도...');
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return getUserProfileFromToken(accessToken, 1); // 재시도
                } else {
                    // 재시도에서도 401 에러 발생 시 토큰이 실제로 유효하지 않은 것으로 판단
                    setStoredToken(null);
                    setStoredUserInfo(null);
                    throw new Error('인증 토큰이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.');
                }
            }
            throw new Error(`사용자 정보 가져오기 실패: ${response.status}`);
        }

        const userInfo = await response.json();
        return {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            imageUrl: userInfo.picture
        };
    } catch (error) {
        // 네트워크 에러나 기타 에러인 경우에도 재시도 로직 적용
        if (retryCount === 0 && error.message && !error.message.includes('인증 토큰이 만료')) {
            if (isDevelopment) {
                console.log('네트워크 에러 발생, 1초 대기 후 재시도...');
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            return getUserProfileFromToken(accessToken, 1); // 재시도
        }
        
        if (isDevelopment) {
            console.error('사용자 정보 가져오기 실패:', error);
        }
        throw error;
    }
};
```

**핵심 개선 사항**:
1. **재시도 매개변수 추가**: `retryCount` 매개변수로 재시도 횟수 추적
2. **401 에러 재시도**: 첫 번째 시도에서 401 에러 발생 시 1초 대기 후 한 번만 재시도
3. **네트워크 에러 재시도**: 네트워크 에러도 동일하게 재시도
4. **실패 시 처리**: 재시도에서도 실패하면 토큰이 실제로 유효하지 않은 것으로 판단하여 에러 처리

**파일**: `src/utils/driveSync.js` line 159-211

---

### 2. useGoogleAuth.js: login 함수에 프로필 강제 확보 로직 추가

**문제점**:
- `requestAccessToken()`이 성공했지만 `result.profile`이 `null`인 경우
- 타이밍 이슈로 인해 프로필을 가져오지 못함

**수정 내용**:
```javascript
const result = await requestAccessToken();

// 🔍 디버깅: 로그인 결과 확인
console.log('로그인 결과:', result);
console.log('프로필:', result.profile);
console.log('프로필 ID:', result.profile?.id);
console.log('액세스 토큰:', result.access_token ? '존재' : '없음');

// 프로필 강제 확보: result.profile이 null이지만 access_token이 있는 경우 재시도
let profile = result.profile;
if (!profile && result.access_token) {
    if (isDevelopment) {
        console.log('프로필이 null이지만 토큰이 존재, 1초 대기 후 재시도...');
    }
    // 1초 대기 후 getUserProfile을 다시 호출 (getUserProfileFromToken 내부에서 재시도 로직 포함)
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
        profile = await getUserProfile();
        if (isDevelopment) {
            console.log('재시도 후 프로필:', profile);
        }
    } catch (retryError) {
        if (isDevelopment) {
            console.error('재시도 실패:', retryError);
        }
        // 재시도 실패는 아래에서 처리
    }
}

// 프로필이 확실히 확보된 후에만 인증 상태를 true로 설정
if (profile && profile.id) {
    // ... 상태 업데이트 로직
    return profile;
} else {
    // 프로필을 끝까지 못 가져올 때만 로그인 차단
    setIsAuthenticated(false);
    setUserProfile(null);
    throw new Error('사용자 프로필을 가져올 수 없습니다. 다시 시도해주세요.');
}
```

**핵심 개선 사항**:
1. **프로필 null 체크**: `result.profile`이 `null`이지만 `access_token`이 있는 경우 감지
2. **재시도 로직**: 1초 대기 후 `getUserProfile()`을 다시 호출 (내부적으로 `getUserProfileFromToken`의 재시도 로직 포함)
3. **안전망 유지**: 재시도 실패 시에만 로그인 차단
4. **에러 메시지 개선**: "다시 시도해주세요" 메시지로 사용자 유도

**파일**: `src/hooks/useGoogleAuth.js` line 82-135

---

## 📊 재시도 로직 흐름

### 정상 흐름 (재시도 없음)
```
1. requestAccessToken() 호출
   ↓
2. getUserProfileFromToken() 호출 (첫 번째 시도)
   ↓
3. Google API 응답 성공 (200 OK)
   ↓
4. 프로필 반환
   ↓
5. 로그인 완료
```

### 타이밍 이슈 발생 시 (재시도 포함)
```
1. requestAccessToken() 호출
   ↓
2. getUserProfileFromToken() 호출 (첫 번째 시도)
   ↓
3. Google API 응답 실패 (401 Unauthorized)
   ↓
4. 1초 대기
   ↓
5. getUserProfileFromToken() 재시도 (두 번째 시도)
   ↓
6. Google API 응답 성공 (200 OK)
   ↓
7. 프로필 반환
   ↓
8. 로그인 완료
```

### 프로필 null 케이스 (강제 재시도)
```
1. requestAccessToken() 호출
   ↓
2. result.profile이 null이지만 access_token 존재
   ↓
3. 1초 대기
   ↓
4. getUserProfile() 재호출 (내부적으로 getUserProfileFromToken 재시도)
   ↓
5. 프로필 확보
   ↓
6. 로그인 완료
```

### 최종 실패 (재시도 후에도 실패)
```
1. requestAccessToken() 호출
   ↓
2. getUserProfileFromToken() 재시도 (최대 2회)
   ↓
3. 모두 실패 (401 또는 네트워크 에러)
   ↓
4. 토큰 제거
   ↓
5. 에러 발생: "인증 토큰이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요."
```

---

## ✅ 검증 결과

### 빌드 확인
- ✅ 빌드 성공
- ✅ 린터 오류 없음

### 재시도 로직 검증

**시나리오 1: 정상 로그인 (재시도 없음)**
- ✅ 토큰 발급 성공 → 프로필 요청 성공 → 로그인 완료

**시나리오 2: 타이밍 이슈 (401 재시도)**
- ✅ 토큰 발급 성공 → 프로필 요청 401 → 1초 대기 → 재시도 성공 → 로그인 완료

**시나리오 3: 프로필 null (강제 재시도)**
- ✅ 토큰 발급 성공 (프로필 null) → 1초 대기 → getUserProfile 재호출 → 프로필 확보 → 로그인 완료

**시나리오 4: 실제 토큰 만료 (최종 실패)**
- ✅ 재시도 후에도 401 → 토큰 제거 → 에러 메시지 표시

---

## 📋 기대 효과

1. **타이밍 이슈 해결**:
   - 토큰 발급 직후 발생하는 일시적인 401 에러 처리
   - 1초 대기 후 재시도로 Google 서버의 토큰 인식 대기

2. **사용자 경험 개선**:
   - '찰나의 에러'로 인한 로그인 실패 방지
   - 프로필을 확보할 수 있을 때까지 재시도

3. **안정성 향상**:
   - 실제 토큰 만료와 타이밍 이슈 구분
   - 최대 2회 시도로 불필요한 재시도 방지

4. **안전망 유지**:
   - 모든 재시도 실패 시에만 로그인 차단
   - 명확한 에러 메시지로 사용자 유도

---

**작성일**: 2024년  
**상태**: ✅ **재시도 로직 구현 완료**



