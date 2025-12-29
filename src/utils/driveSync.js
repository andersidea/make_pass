/**
 * Google Drive API 동기화 유틸리티 (Google Identity Services 사용)
 * 일반 드라이브 공간을 사용하여 파일 저장 (drive.file 권한 호환)
 */

import { GOOGLE_SCOPES, VAULT_FILE_NAME, GOOGLE_CLIENT_ID } from './googleConfig';
import { encryptData, decryptData } from './encryption';

// 프로덕션 환경 체크
const isDevelopment = process.env.NODE_ENV !== 'production';

// 토큰 저장 키
const TOKEN_STORAGE_KEY = 'google_access_token';
const USER_INFO_STORAGE_KEY = 'google_user_info';

/**
 * Google Identity Services 로드 확인
 */
export const isGoogleAPILoaded = () => {
    return typeof window !== 'undefined' && window.google && window.google.accounts;
};

/**
 * 저장된 액세스 토큰 가져오기
 */
export const getStoredToken = () => {
    try {
        return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch (error) {
        return null;
    }
};

/**
 * 액세스 토큰 저장
 */
const setStoredToken = (token) => {
    try {
        if (token) {
            localStorage.setItem(TOKEN_STORAGE_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
    } catch (error) {
        if (isDevelopment) {
            console.error('토큰 저장 실패:', error);
        }
    }
};

/**
 * 사용자 정보 저장
 */
const setStoredUserInfo = (userInfo) => {
    try {
        if (userInfo) {
            localStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(userInfo));
        } else {
            localStorage.removeItem(USER_INFO_STORAGE_KEY);
        }
    } catch (error) {
        if (isDevelopment) {
            console.error('사용자 정보 저장 실패:', error);
        }
    }
};

/**
 * 저장된 사용자 정보 가져오기
 */
export const getStoredUserInfo = () => {
    try {
        const stored = localStorage.getItem(USER_INFO_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        return null;
    }
};

/**
 * 토큰 클라이언트 초기화
 */
export const initTokenClient = () => {
    if (!isGoogleAPILoaded()) {
        throw new Error('Google Identity Services가 로드되지 않았습니다.');
    }

    const clientId = GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    if (!clientId) {
        throw new Error('Google Client ID가 설정되지 않았습니다.');
    }

    return window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GOOGLE_SCOPES,
        callback: (response) => {
            // 토큰 응답은 여기서 처리하지 않고 Promise로 전달
            // 실제 사용은 requestAccessToken 콜백에서 처리
        },
    });
};

/**
 * 액세스 토큰 요청 (로그인)
 */
export const requestAccessToken = () => {
    return new Promise((resolve, reject) => {
        try {
            if (!isGoogleAPILoaded()) {
                reject(new Error('Google Identity Services가 로드되지 않았습니다.'));
                return;
            }

            const clientId = GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
            if (!clientId) {
                reject(new Error('Google Client ID가 설정되지 않았습니다.'));
                return;
            }

            let tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: GOOGLE_SCOPES,
                callback: (tokenResponse) => {
                    if (tokenResponse.error) {
                        reject(new Error(tokenResponse.error));
                        return;
                    }

                    // 토큰 저장
                    setStoredToken(tokenResponse.access_token);
                    
                    // 사용자 정보 가져오기
                    getUserProfileFromToken(tokenResponse.access_token)
                        .then((profile) => {
                            setStoredUserInfo(profile);
                            resolve({
                                access_token: tokenResponse.access_token,
                                profile
                            });
                        })
                        .catch((error) => {
                            // 토큰은 저장했지만 프로필 가져오기 실패
                            resolve({
                                access_token: tokenResponse.access_token,
                                profile: null
                            });
                        });
                },
            });

            // 토큰 요청
            tokenClient.requestAccessToken();
        } catch (error) {
            reject(error);
        }
    });
};

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

/**
 * 현재 로그인 상태 확인
 */
export const isSignedIn = () => {
    const token = getStoredToken();
    return !!token;
};

/**
 * 사용자 정보 가져오기
 */
export const getUserProfile = async () => {
    // 먼저 저장된 정보 확인
    const stored = getStoredUserInfo();
    if (stored) {
        return stored;
    }

    // 토큰이 있으면 API로 정보 가져오기
    const token = getStoredToken();
    if (token) {
        try {
            const profile = await getUserProfileFromToken(token);
            setStoredUserInfo(profile);
            return profile;
        } catch (error) {
            // 401 오류인 경우 토큰이 만료되었으므로 null 반환하여 재로그인 유도
            if (error.message && error.message.includes('401')) {
                // 토큰 이미 제거됨 (getUserProfileFromToken에서)
                return null;
            }
            // 기타 오류도 조용히 처리 (null 반환)
            if (isDevelopment) {
                console.warn('사용자 정보 가져오기 실패 (저장된 정보 없음):', error);
            }
            return null;
        }
    }

    return null;
};

/**
 * 유효한 액세스 토큰 가져오기
 */
const getAccessToken = async () => {
    const token = getStoredToken();
    if (!token) {
        throw new Error('로그인이 필요합니다.');
    }
    
    // 토큰 만료 체크 (간단한 방식, 실제로는 토큰 검증 API 호출 필요)
    // 여기서는 저장된 토큰을 그대로 반환
    // 실제 프로덕션에서는 토큰 갱신 로직 추가 필요
    return token;
};

/**
 * 드라이브에서 파일 ID 찾기 (파일명으로 검색, 루트 폴더에서 검색)
 * drive.file 권한을 사용하므로 사용자가 앱에 부여한 파일만 검색 가능
 */
export const findFileInDrive = async (fileName) => {
    try {
        const token = await getAccessToken();
        
        // 일반 드라이브 공간에서 파일 검색 (appDataFolder 제거)
        // drive.file 권한으로는 사용자가 명시적으로 부여한 파일만 검색 가능
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(fileName)}' and trashed=false&fields=files(id,name,modifiedTime)&pageSize=1`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`파일 검색 실패: ${response.statusText}`);
        }

        const data = await response.json();
        const files = data.files;
        if (files && files.length > 0) {
            return files[0];
        }
        return null;
    } catch (error) {
        if (isDevelopment) {
            console.error('파일 찾기 실패:', error);
        }
        throw error;
    }
};

/**
 * 드라이브에 파일 업로드 (루트 폴더에 저장)
 * drive.file 권한을 사용하므로 사용자가 앱에 부여한 파일만 생성/업데이트 가능
 */
export const uploadFileToDrive = async (fileName, content, mimeType = 'application/json') => {
    try {
        const token = await getAccessToken();
        
        if (!token) {
            throw new Error('Access token이 없습니다. 로그인이 필요합니다.');
        }
        
        if (isDevelopment) {
            console.log('🔑 파일 업로드 시작 - 토큰 확인:', token ? '있음' : '없음');
            console.log('📝 파일명:', fileName);
        }

        // 기존 파일 찾기
        let existingFile = null;
        try {
            if (isDevelopment) {
                console.log('🔍 드라이브에서 기존 파일 검색 중...');
            }
            existingFile = await findFileInDrive(fileName);
            if (isDevelopment) {
                if (existingFile) {
                    console.log(`✅ 기존 파일 발견: ${fileName} (ID: ${existingFile.id})`);
                } else {
                    console.log(`❌ 기존 파일 없음: ${fileName} → 새 파일 생성 진행`);
                }
            }
        } catch (findError) {
            if (isDevelopment) {
                console.warn('⚠️ 파일 검색 실패 (새 파일로 생성 시도):', findError);
                console.warn('   - 에러 메시지:', findError.message);
            }
            // 파일 검색 실패 시 새 파일로 생성 시도
            existingFile = null;
        }

        const jsonContent = JSON.stringify(content);
        const blob = new Blob([jsonContent], { type: mimeType });
        
        if (isDevelopment) {
            console.log('📦 파일 데이터 준비 완료:', {
                contentLength: jsonContent.length,
                blobSize: blob.size,
                mimeType: mimeType
            });
        }

        let response;
        if (existingFile) {
            // 기존 파일 업데이트
            if (isDevelopment) {
                console.log('🔄 기존 파일 업데이트 경로로 진행...');
            }
            
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify({ name: fileName })], { type: 'application/json' }));
            form.append('file', blob);

            const url = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart&fields=id,name`;
            if (isDevelopment) {
                console.log(`🔄 파일 업데이트 요청: PATCH ${url}`);
                console.log('   - 파일 ID:', existingFile.id);
            }

            try {
                response = await fetch(url, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: form
                });
                
                if (isDevelopment) {
                    console.log('📡 업데이트 요청 전송 완료, 응답 대기 중...');
                }
            } catch (fetchError) {
                if (isDevelopment) {
                    console.error('❌ 업데이트 요청 전송 실패:', fetchError);
                }
                throw fetchError;
            }
        } else {
            // 새 파일 생성 (루트 폴더에 저장, parents 지정하지 않으면 루트에 저장됨)
            if (isDevelopment) {
                console.log('✨ 새 파일 생성 경로로 진행...');
                console.log('   - drive.files.create 호출 준비 중...');
            }
            
            const form = new FormData();
            const metadata = {
                name: fileName,
                mimeType: mimeType
            };
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', blob);

            const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name';
            if (isDevelopment) {
                console.log(`✨ 새 파일 생성 요청: POST ${url}`);
                console.log('📦 요청 메타데이터:', JSON.stringify(metadata, null, 2));
                console.log('   - 파일명:', fileName);
                console.log('   - MIME 타입:', mimeType);
                console.log('   - Authorization 헤더:', token ? `Bearer ${token.substring(0, 20)}...` : '없음');
            }

            try {
                if (isDevelopment) {
                    console.log('📤 POST 요청 전송 중...');
                }
                
                response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: form
                });
                
                if (isDevelopment) {
                    console.log('📡 POST 요청 전송 완료, 응답 대기 중...');
                    console.log('   - 응답 상태:', response.status, response.statusText);
                }
            } catch (fetchError) {
                if (isDevelopment) {
                    console.error('❌ 새 파일 생성 요청 전송 실패:', fetchError);
                    console.error('   - 에러 타입:', fetchError.constructor.name);
                    console.error('   - 에러 메시지:', fetchError.message);
                    if (fetchError.stack) {
                        console.error('   - 스택 트레이스:', fetchError.stack);
                    }
                }
                throw fetchError;
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            let errorData = null;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                // JSON 파싱 실패 시 그대로 사용
            }
            
            if (isDevelopment) {
                console.error('❌ 파일 업로드 실패!');
                console.error('   - 상태 코드:', response.status, response.statusText);
                console.error('   - 응답 본문 (전체):', errorText);
                console.error('   - 요청 방식:', existingFile ? 'PATCH (업데이트)' : 'POST (생성)');
                console.error('   - 파일명:', fileName);
                if (errorData) {
                    console.error('   - 에러 객체:', JSON.stringify(errorData, null, 2));
                    if (errorData.error) {
                        console.error('   - 에러 상세:', JSON.stringify(errorData.error, null, 2));
                        if (errorData.error.message) {
                            console.error('   - 에러 메시지:', errorData.error.message);
                        }
                        if (errorData.error.errors) {
                            console.error('   - 에러 배열:', JSON.stringify(errorData.error.errors, null, 2));
                        }
                    }
                }
                
                // 즉시 에러 출력 (사용자가 즉시 확인할 수 있도록)
                console.error('='.repeat(50));
                console.error('🚨 DRIVE 파일 저장 실패 - 즉시 확인 필요!');
                console.error('='.repeat(50));
            }
            
            // 에러를 즉시 던져서 호출자가 처리할 수 있도록
            const errorMessage = errorData?.error?.message || errorText || `업로드 실패 (${response.status})`;
            throw new Error(`업로드 실패 (${response.status}): ${errorMessage}`);
        }

        const result = await response.json();
        if (isDevelopment) {
            console.log('✅ 파일 업로드 성공!');
            console.log('   - 응답 데이터:', JSON.stringify(result, null, 2));
            console.log('   - 파일 ID:', result.id);
            console.log('   - 파일명:', result.name);
            if (!existingFile) {
                console.log('🎉 새 파일이 성공적으로 생성되었습니다!');
            }
        }
        return result;
    } catch (error) {
        if (isDevelopment) {
            console.error('❌ 파일 업로드 중 예외 발생:', error);
            if (error.response) {
                console.error('   - 응답 상태:', error.response.status);
                console.error('   - 응답 데이터:', error.response.data);
            }
            if (error.message) {
                console.error('   - 에러 메시지:', error.message);
            }
        }
        throw error;
    }
};

/**
 * 드라이브에서 파일 다운로드
 */
export const downloadFileFromDrive = async (fileName) => {
    try {
        const token = await getAccessToken();
        
        const file = await findFileInDrive(fileName);
        if (!file) {
            return null;
        }

        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`다운로드 실패: ${response.statusText}`);
        }

        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (parseError) {
            // JSON 파싱 실패 시 문자열 반환
            return text;
        }
    } catch (error) {
        if (isDevelopment) {
            console.error('파일 다운로드 실패:', error);
        }
        throw error;
    }
};

/**
 * vault.json 파일 로드 (Auto-Load)
 * @param {string} encryptionKey - 복호화 키 (마스터 비밀번호 또는 사용자 ID)
 */
export const loadVaultFromDrive = async (encryptionKey) => {
    // 가드 로직: encryptionKey가 없으면 즉시 반환
    if (!encryptionKey || typeof encryptionKey !== 'string' || encryptionKey.trim() === '') {
        if (isDevelopment) {
            console.warn('loadVaultFromDrive: 암호화 키가 유효하지 않습니다.');
        }
        return null;
    }
    
    try {
        if (!isSignedIn()) {
            throw new Error('로그인이 필요합니다.');
        }

        const data = await downloadFileFromDrive(VAULT_FILE_NAME);
        
        if (!data) {
            return null;
        }
        
        // 암호화된 데이터 복호화
        if (data.encrypted && encryptionKey) {
            const decrypted = decryptData(data.encrypted, encryptionKey);
            return decrypted;
        }
        
        // 하위 호환성: 평문 데이터 지원
        return data;
    } catch (error) {
        if (isDevelopment) {
            console.error('Drive에서 볼트 로드 실패:', error);
        }
        throw error;
    }
};

/**
 * vault.json 파일 저장 (Auto-Save)
 * @param {Array} vaultData - 암호화되지 않은 볼트 데이터
 * @param {string} encryptionKey - 암호화 키 (마스터 비밀번호 또는 사용자 ID)
 */
export const saveVaultToDrive = async (vaultData, encryptionKey) => {
    // 가드 로직: encryptionKey가 없으면 즉시 반환
    if (!encryptionKey || typeof encryptionKey !== 'string' || encryptionKey.trim() === '') {
        if (isDevelopment) {
            console.warn('⚠️ saveVaultToDrive: 암호화 키가 유효하지 않습니다.');
        }
        throw new Error('암호화 키가 필요합니다.');
    }
    
    try {
        if (!isSignedIn()) {
            throw new Error('로그인이 필요합니다.');
        }
        
        if (isDevelopment) {
            console.log('🔐 데이터 암호화 시작...');
        }
        
        // 암호화하여 저장 (구글 서버에서도 평문 확인 불가)
        const encryptedData = encryptData(vaultData, encryptionKey);
        
        if (!encryptedData) {
            throw new Error('데이터 암호화 실패');
        }
        
        if (isDevelopment) {
            console.log('✅ 데이터 암호화 완료');
            console.log('📤 vault.json 파일 업로드 시작...');
        }
        
        // 암호화된 문자열을 JSON 객체로 래핑하여 저장
        if (isDevelopment) {
            console.log('📤 vault.json 파일 업로드 함수 호출 중...');
            console.log('   - 파일명:', VAULT_FILE_NAME);
            console.log('   - 암호화된 데이터 크기:', encryptedData ? encryptedData.length : 0);
        }
        
        try {
            const result = await uploadFileToDrive(VAULT_FILE_NAME, { encrypted: encryptedData });
            
            if (isDevelopment) {
                console.log('✅ vault.json 파일 저장 완료!');
                console.log('   - 결과:', JSON.stringify(result, null, 2));
                if (result.id) {
                    console.log('   - 파일 ID:', result.id);
                    console.log('   - 파일이 Drive에 정상적으로 생성/저장되었습니다.');
                }
            }
            
            return true;
        } catch (uploadError) {
            if (isDevelopment) {
                console.error('❌ vault.json 파일 업로드 중 예외 발생!');
                console.error('   - 에러:', uploadError);
                console.error('   - 에러 메시지:', uploadError.message);
                console.error('='.repeat(50));
                console.error('🚨 saveVaultToDrive 실패 - 즉시 확인 필요!');
                console.error('='.repeat(50));
            }
            throw uploadError;
        }
    } catch (error) {
        if (isDevelopment) {
            console.error('❌ Drive에 볼트 저장 실패:', error);
            if (error.message) {
                console.error('   - 에러 메시지:', error.message);
            }
        }
        throw error;
    }
};

/**
 * 로그아웃 (토큰 제거)
 */
export const signOut = async () => {
    try {
        // 먼저 토큰 가져오기 (제거 전)
        const token = getStoredToken();
        
        // Google Identity Services의 revoke 기능 사용
        if (token && isGoogleAPILoaded()) {
            try {
                window.google.accounts.oauth2.revoke(token, () => {
                    if (isDevelopment) {
                        console.log('토큰이 취소되었습니다.');
                    }
                });
            } catch (error) {
                // revoke 실패해도 토큰은 제거됨
                if (isDevelopment) {
                    console.warn('토큰 취소 실패:', error);
                }
            }
        }
        
        // 토큰 및 사용자 정보 제거
        setStoredToken(null);
        setStoredUserInfo(null);
    } catch (error) {
        if (isDevelopment) {
            console.error('로그아웃 실패:', error);
        }
        // 토큰 제거는 계속 수행
        setStoredToken(null);
        setStoredUserInfo(null);
    }
};
