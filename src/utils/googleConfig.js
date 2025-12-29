/**
 * Google OAuth2 및 Drive API 설정
 * 
 * 사용 전 Google Cloud Console에서 설정 필요:
 * 1. 프로젝트 생성
 * 2. OAuth 2.0 클라이언트 ID 생성
 * 3. 승인된 JavaScript 원본에 도메인 추가 (슬래시 없이: http://localhost:5173)
 * 4. 승인된 리디렉션 URI 설정 (슬래시 없이 권장: http://localhost:5173)
 * 5. Google Drive API 활성화
 * 
 * 중요: Google Identity Services (GIS)는 redirect_uri를 자동으로 처리하므로
 * 코드에서 명시적으로 설정하지 않습니다. 현재 페이지의 origin을 사용합니다.
 */

// 환경 변수 또는 기본값으로 설정
// 프로덕션 환경에서는 환경 변수 사용 권장
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// 필요한 OAuth 범위 (표준화된 Scope - Google Cloud Console에서 승인 완료)
// 고정값: Google Cloud Console의 OAuth 동의 화면에서 승인된 scope와 정확히 일치해야 합니다.
// 승인된 권한: drive, email, profile, openid
// openid: OpenID Connect 인증 (필수)
// profile: 기본 프로필 정보 (이름, 프로필 사진)
// email: 이메일 주소
// https://www.googleapis.com/auth/drive.file: Google Drive 파일 접근 (appDataFolder 포함)
// 
// 주의: 이 값을 변경하면 Google Cloud Console의 OAuth 동의 화면 설정도 함께 변경해야 합니다.
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

