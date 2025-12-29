# 🔧 Google OAuth 2.0 설정 점검 및 수정 보고서

**작업일**: 2024년  
**작업 내용**: 400 에러(invalid_request) 해결을 위한 OAuth 2.0 설정 점검 및 수정

---

## ✅ 수정 완료 사항

### 1. Scope 정규화 (googleConfig.js)

**문제점**:
- 기존 Scope: `https://www.googleapis.com/auth/drive.appdata` (단일 범위)
- OpenID Connect 표준 Scope 미포함 (openid, profile, email)

**수정 내용**:
```javascript
// ❌ 수정 전
export const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

// ✅ 수정 후
// 필요한 OAuth 범위 (표준화된 Scope - 프로필 정보 권한 명시)
// openid: OpenID Connect 인증
// profile: 기본 프로필 정보
// email: 이메일 주소
// https://www.googleapis.com/auth/drive.file: Google Drive 파일 접근 (appDataFolder 사용)
export const GOOGLE_SCOPES = 'openid profile email https://www.googleapis.com/auth/drive.file';
```

**변경 사항**:
- `drive.appdata` → `drive.file`로 변경 (더 넓은 범위, appDataFolder 포함)
- `openid`, `profile`, `email` Scope 추가 (OpenID Connect 표준)

**파일**: `src/utils/googleConfig.js`

---

### 2. Client ID 확인

**확인 사항**:
- `index.html`: Google Identity Services SDK 로드만 수행 (client_id 설정 없음)
- `src/utils/googleConfig.js`: `GOOGLE_CLIENT_ID` 환경 변수에서 가져옴
- `src/utils/driveSync.js`: `GOOGLE_CLIENT_ID` 또는 `import.meta.env.VITE_GOOGLE_CLIENT_ID` 사용

**현재 설정**:
```javascript
// googleConfig.js
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// driveSync.js (requestAccessToken)
const clientId = GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
```

**확인 필요 사항**:
- `.env` 파일에 `VITE_GOOGLE_CLIENT_ID`가 설정되어 있는지 확인
- Google Cloud Console의 Client ID와 정확히 일치하는지 확인

**파일**:
- `src/utils/googleConfig.js`
- `src/utils/driveSync.js` (line 114, 120)

---

### 3. 리디렉션 URI 점검 안내

**현재 앱 실행 주소**:
- **로컬 개발 서버**: `http://localhost:5173` (Vite 기본 포트)
- **포트 확인 방법**: 개발 서버 실행 시 콘솔에 표시되는 주소 확인

**Google Cloud Console 설정 방법**:

1. **Google Cloud Console 접속**:
   - https://console.cloud.google.com/

2. **API 및 서비스 > 사용자 인증 정보**로 이동

3. **OAuth 2.0 클라이언트 ID** 선택 (웹 애플리케이션)

4. **승인된 리디렉션 URI** 섹션 확인 및 추가:
   ```
   http://localhost:5173
   http://localhost:5173/
   ```

5. **저장** 클릭

**중요 사항**:
- 포트 번호가 다른 경우 (예: 3000, 8080) 해당 포트도 추가
- 프로덕션 배포 시 프로덕션 도메인도 추가 필요
- 리디렉션 URI는 정확히 일치해야 함 (마지막 슬래시 포함/제외 여부도 중요)

---

## 📋 추가 점검 사항

### 1. Google Cloud Console OAuth 동의 화면 설정

**확인 필요**:
- **앱 이름**: 설정되어 있는지 확인
- **사용자 지원 이메일**: 설정되어 있는지 확인
- **개발자 연락처 정보**: 이메일 주소 설정
- **승인된 도메인**: 필요 시 설정

**접근 경로**:
- Google Cloud Console > API 및 서비스 > OAuth 동의 화면

---

### 2. API 사용 설정

**확인 필요**:
- **Google Drive API**: 사용 설정되어 있는지 확인
- **Google+ API** (필요 시): 프로필 정보 접근용

**접근 경로**:
- Google Cloud Console > API 및 서비스 > 라이브러리

---

### 3. Client ID 타입 확인

**확인 필요**:
- **웹 애플리케이션** 타입으로 생성되었는지 확인
- **iOS**, **Android** 타입이 아닌지 확인

---

## 🔍 400 에러(invalid_request) 일반 원인

1. **잘못된 Client ID**: 
   - Client ID가 Google Cloud Console의 것과 일치하지 않음
   - 다른 프로젝트의 Client ID를 사용

2. **잘못된 Scope**:
   - Scope 형식이 잘못됨
   - 승인되지 않은 Scope 사용

3. **리디렉션 URI 불일치**:
   - Google Cloud Console에 등록되지 않은 리디렉션 URI 사용
   - 프로토콜(http/https), 포트, 경로가 정확히 일치하지 않음

4. **OAuth 동의 화면 미완성**:
   - 필수 정보(앱 이름, 이메일 등)가 설정되지 않음

---

## ✅ 수정 완료 체크리스트

- [x] Scope 정규화 완료 (`openid profile email https://www.googleapis.com/auth/drive.file`)
- [ ] Client ID 확인 (사용자가 Google Cloud Console과 비교 필요)
- [ ] 리디렉션 URI 추가 (사용자가 Google Cloud Console에 추가 필요)
- [ ] OAuth 동의 화면 설정 확인 (사용자가 Google Cloud Console에서 확인 필요)
- [ ] Google Drive API 사용 설정 확인 (사용자가 Google Cloud Console에서 확인 필요)

---

## 📝 다음 단계

1. **Client ID 확인**:
   - `.env` 파일의 `VITE_GOOGLE_CLIENT_ID` 값 확인
   - Google Cloud Console의 Client ID와 비교
   - 일치하지 않으면 `.env` 파일 수정

2. **리디렉션 URI 추가**:
   - Google Cloud Console > API 및 서비스 > 사용자 인증 정보
   - OAuth 2.0 클라이언트 ID 선택
   - "승인된 리디렉션 URI"에 `http://localhost:5173` 추가
   - 저장

3. **OAuth 동의 화면 확인**:
   - Google Cloud Console > API 및 서비스 > OAuth 동의 화면
   - 필수 정보(앱 이름, 이메일) 설정되어 있는지 확인
   - 미설정 시 설정 후 저장

4. **테스트**:
   - 개발 서버 재시작
   - 로그인 시도
   - 400 에러 해결 여부 확인

---

**작성일**: 2024년  
**상태**: ✅ **Scope 정규화 완료, Client ID 및 리디렉션 URI 확인 필요**


