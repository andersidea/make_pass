# Google OAuth2 및 Drive API 설정 가이드

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택

### 1.2 OAuth 2.0 클라이언트 ID 생성
1. **API 및 서비스** > **사용자 인증 정보** 이동
2. **+ 사용자 인증 정보 만들기** > **OAuth 클라이언트 ID** 선택
3. **애플리케이션 유형**: 웹 애플리케이션
4. **승인된 JavaScript 원본**: 
   - 개발 환경: `http://localhost:5173` (Vite 기본 포트)
   - 프로덕션 환경: 실제 도메인 (예: `https://yourdomain.com`)
5. **승인된 리디렉션 URI**: (필요 시 추가)
6. **클라이언트 ID 복사**

### 1.3 Google Drive API 활성화
1. **API 및 서비스** > **라이브러리** 이동
2. "Google Drive API" 검색
3. **사용 설정** 클릭

## 2. 환경 변수 설정

### 2.1 개발 환경 (.env 파일)
프로젝트 루트에 `.env` 파일 생성:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

### 2.2 프로덕션 환경
배포 환경에 따라 환경 변수 설정:
- Vercel: 프로젝트 설정 > Environment Variables
- Netlify: Site settings > Environment variables
- 기타: 배포 플랫폼의 환경 변수 설정 사용

## 3. 보안 고려사항

### 3.1 클라이언트 ID
- 클라이언트 ID는 공개되어도 안전합니다 (OAuth 2.0 표준)
- 클라이언트 시크릿은 사용하지 않습니다 (브라우저 앱이므로)

### 3.2 OAuth 범위
현재 사용 범위:
- `https://www.googleapis.com/auth/drive.appdata` - appDataFolder 접근
- `https://www.googleapis.com/auth/userinfo.email` - 이메일 정보
- `https://www.googleapis.com/auth/userinfo.profile` - 프로필 정보

### 3.3 데이터 저장 위치
- Google Drive의 `appDataFolder`에 저장 (사용자가 직접 볼 수 없는 숨겨진 폴더)
- 파일명: `vault_master.json`

## 4. 테스트

### 4.1 개발 서버 실행
```bash
npm run dev
```

### 4.2 로그인 테스트
1. "Google 계정으로 시작하기" 버튼 클릭
2. Google 계정 선택 및 권한 승인
3. 동기화 상태 확인 (사이드바 하단)

## 5. 문제 해결

### 5.1 "Google APIs가 로드되지 않았습니다" 오류
- 인터넷 연결 확인
- Google Identity Services SDK 로드 확인 (개발자 도구 > Network 탭)

### 5.2 "클라이언트 ID가 유효하지 않습니다" 오류
- `.env` 파일의 `VITE_GOOGLE_CLIENT_ID` 확인
- Google Cloud Console의 클라이언트 ID와 일치하는지 확인

### 5.3 동기화 실패
- Google Drive API 활성화 확인
- 브라우저 콘솔에서 오류 메시지 확인
- 사용자가 권한을 승인했는지 확인



