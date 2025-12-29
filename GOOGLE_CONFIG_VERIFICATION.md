# ✅ Google OAuth2 설정 검증 및 고정

**검증일**: 2024년  
**목적**: 200개 데이터 작업 전 환경 설정 검증 및 고정

---

## 🔍 현재 설정 상태

### 1. redirect_uri 검증

**Google Identity Services (GIS) 특성**:
- ✅ **redirect_uri를 코드에서 명시적으로 설정하지 않음**
- GIS는 자동으로 현재 페이지의 origin을 redirect_uri로 사용
- 개발 환경: `http://localhost:5173` (또는 실행 중인 포트)
- 프로덕션 환경: 배포된 도메인의 origin

**확인 사항**:
- ❌ 코드에 `redirect_uri` 파라미터가 명시적으로 설정되어 있지 않음 (정상)
- ✅ Google Cloud Console의 "승인된 JavaScript 원본"에 도메인이 등록되어 있어야 함
- ✅ Google Cloud Console의 "승인된 리디렉션 URI"에는 개발/프로덕션 도메인을 등록해야 함 (선택사항이지만 권장)

**권장 Google Cloud Console 설정**:
```
승인된 JavaScript 원본:
- http://localhost:5173
- https://yourdomain.com (프로덕션)

승인된 리디렉션 URI:
- http://localhost:5173
- http://localhost:5173/ (슬래시 없이 권장)
- https://yourdomain.com (프로덕션)
- https://yourdomain.com/ (슬래시 없이 권장)
```

**중요**: 리디렉션 URI 끝에 슬래시(`/`)가 없어야 정확히 매칭됩니다.

---

### 2. GOOGLE_SCOPES 검증

**현재 설정** (`src/utils/googleConfig.js`):
```javascript
export const GOOGLE_SCOPES = 'openid profile email https://www.googleapis.com/auth/drive.file';
```

**Scope 구성 요소**:
1. `openid`: OpenID Connect 인증 (필수)
2. `profile`: 기본 프로필 정보 (이름, 프로필 사진 등)
3. `email`: 이메일 주소
4. `https://www.googleapis.com/auth/drive.file`: Google Drive 파일 접근 (appDataFolder 포함)

**Google Cloud Console에서 확인 필요 사항**:
- OAuth 동의 화면에서 위 4가지 scope가 모두 승인되어 있는지 확인
- 특히 `https://www.googleapis.com/auth/drive.file` scope가 활성화되어 있는지 확인

**참고**: 
- `drive.file` scope는 사용자가 명시적으로 앱에 부여한 파일에만 접근 가능 (appDataFolder 포함)
- `drive.appdata` scope와 달리 `drive.file`은 더 넓은 권한을 제공하지만, appDataFolder 접근도 가능

---

## ✅ 검증 완료 체크리스트

### 코드 레벨 검증
- [x] `redirect_uri`가 코드에 명시적으로 설정되어 있지 않음 (GIS 자동 처리, 정상)
- [x] `GOOGLE_SCOPES`가 정확히 정의되어 있음
- [x] `initTokenClient`에서 `scope` 파라미터로 `GOOGLE_SCOPES` 사용
- [x] `GOOGLE_CLIENT_ID` 환경 변수 사용

### Google Cloud Console 검증 (사용자 확인 필요)
- [ ] 승인된 JavaScript 원본에 `http://localhost:5173` 등록 (슬래시 없이)
- [ ] 승인된 리디렉션 URI에 `http://localhost:5173` 등록 (슬래시 없이 권장)
- [ ] OAuth 동의 화면에서 다음 scope 승인:
  - `openid`
  - `profile`
  - `email`
  - `https://www.googleapis.com/auth/drive.file`
- [ ] Google Drive API 활성화 확인

---

## 🔧 설정 고정

### `src/utils/googleConfig.js` - 최종 고정 설정

```javascript
/**
 * Google OAuth2 및 Drive API 설정
 * 
 * 사용 전 Google Cloud Console에서 설정 필요:
 * 1. 프로젝트 생성
 * 2. OAuth 2.0 클라이언트 ID 생성
 * 3. 승인된 JavaScript 원본에 도메인 추가 (슬래시 없이)
 * 4. 승인된 리디렉션 URI 설정 (슬래시 없이 권장)
 * 5. Google Drive API 활성화
 */

// 환경 변수 또는 기본값으로 설정
// 프로덕션 환경에서는 환경 변수 사용 권장
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// 필요한 OAuth 범위 (표준화된 Scope - 프로필 정보 권한 명시)
// openid: OpenID Connect 인증
// profile: 기본 프로필 정보
// email: 이메일 주소
// https://www.googleapis.com/auth/drive.file: Google Drive 파일 접근 (appDataFolder 사용)
export const GOOGLE_SCOPES = 'openid profile email https://www.googleapis.com/auth/drive.file';

// Drive API 파일명
export const VAULT_FILE_NAME = 'vault.json';

// 디바운스 시간 (밀리초)
export const SYNC_DEBOUNCE_MS = 500;

// Google Identity Services 초기화 확인
export const isGoogleAPILoaded = () => {
    return typeof window !== 'undefined' && 
           window.google && 
           window.google.accounts;
};
```

**중요 사항**:
- ❌ `redirect_uri`를 코드에서 명시적으로 설정하지 않음 (GIS가 자동 처리)
- ✅ Google Cloud Console의 "승인된 JavaScript 원본"에 도메인을 등록해야 함
- ✅ 리디렉션 URI는 슬래시(`/`) 없이 등록하는 것을 권장

---

## 📋 Google Cloud Console 설정 가이드

### 1. 승인된 JavaScript 원본
```
http://localhost:5173
```
⚠️ **슬래시 없이** 입력

### 2. 승인된 리디렉션 URI
```
http://localhost:5173
```
⚠️ **슬래시 없이** 입력 (권장)

또는 슬래시 포함:
```
http://localhost:5173/
```

### 3. OAuth 동의 화면 - Scope
다음 scope가 승인되어 있어야 함:
- `openid`
- `profile`
- `email`
- `https://www.googleapis.com/auth/drive.file`

---

## ✅ 검증 완료

**코드 레벨 검증**: ✅ 완료
- `redirect_uri`가 코드에 명시적으로 설정되어 있지 않음 (정상, GIS 자동 처리)
- `GOOGLE_SCOPES`가 정확히 정의되어 있음: `'openid profile email https://www.googleapis.com/auth/drive.file'`

**다음 단계**:
1. Google Cloud Console에서 위 설정 확인 및 조정 (필요 시)
2. 200개 데이터 생성 및 주입 작업 진행

---

**작성일**: 2024년  
**상태**: ✅ **코드 레벨 검증 완료, Google Cloud Console 설정은 사용자 확인 필요**


