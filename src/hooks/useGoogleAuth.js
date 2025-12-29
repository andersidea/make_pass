import { useState, useEffect, useCallback } from 'react';
import { requestAccessToken, signOut as driveSignOut, isSignedIn, getUserProfile, isGoogleAPILoaded, getStoredToken } from '../utils/driveSync';
import persistentStorage from '../utils/storage';

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Google OAuth2 인증 훅 (Google Identity Services 사용)
 */
export const useGoogleAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // 초기값을 false로 변경 (사용자 클릭 전에는 로딩하지 않음)
    const [userProfile, setUserProfile] = useState(null);
    const [error, setError] = useState(null);

    // 인증 상태 확인 (자동 호출 및 수동 호출용)
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
                // 🔍 디버깅: 프로필 확인
                console.log('checkAuthStatus - 프로필:', profile);
                console.log('checkAuthStatus - 프로필 ID:', profile?.id);
                
                // 프로필이 확실히 확보되고 id가 있는 경우에만 인증 상태를 true로 설정
                if (profile && profile.id) {
                    // userProfile을 먼저 설정
                    setUserProfile(profile);
                    
                    // React의 상태 업데이트는 배치 처리되므로, 다음 이벤트 루프에서 상태가 반영됨
                    await new Promise(resolve => {
                        setTimeout(() => {
                            // userProfile이 설정된 후에만 isAuthenticated를 true로 설정
                            setIsAuthenticated(true);
                            console.log('checkAuthStatus - 상태 업데이트 완료: userProfile 설정 후 isAuthenticated 설정');
                            resolve();
                        }, 0);
                    });
                } else {
                    setIsAuthenticated(false);
                    setUserProfile(null);
                }
            } else {
                setIsAuthenticated(false);
                setUserProfile(null);
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('인증 상태 확인 실패:', error);
            }
            setIsAuthenticated(false);
            setUserProfile(null);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 자동 인증 상태 확인: 앱 시작 시 세션 유지 확인 (새로고침 후에도 로그인 상태 유지)
    useEffect(() => {
        const checkGoogleAPI = () => {
            if (isGoogleAPILoaded()) {
                checkAuthStatus();
            } else {
                // Google API가 아직 로드되지 않았으면 재시도
                setTimeout(checkGoogleAPI, 100);
            }
        };
        
        // 약간의 지연을 두어 Google API 로드 대기
        const initTimer = setTimeout(checkGoogleAPI, 500);
        return () => clearTimeout(initTimer);
    }, [checkAuthStatus]); // checkAuthStatus 의존성 추가

    // Google 로그인 (사용자 클릭 시에만 호출)
    const login = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            if (!isGoogleAPILoaded()) {
                throw new Error('Google Identity Services가 로드되지 않았습니다.');
            }

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
                // userProfile을 먼저 설정 (React 상태 업데이트는 비동기이지만 배치 처리됨)
                setUserProfile(profile);
                
                // React의 상태 업데이트는 배치 처리되므로, 다음 이벤트 루프에서 상태가 반영됨
                // setTimeout을 사용하여 상태 업데이트가 완료된 후 isAuthenticated를 설정
                await new Promise(resolve => {
                    setTimeout(() => {
                        // userProfile이 설정된 후에만 isAuthenticated를 true로 설정
                        setIsAuthenticated(true);
                        setError(null);
                        console.log('상태 업데이트 완료: userProfile 설정 후 isAuthenticated 설정');
                        resolve();
                    }, 0);
                });
                
                return profile;
            } else {
                // 프로필을 끝까지 못 가져올 때만 로그인 차단
                setIsAuthenticated(false);
                setUserProfile(null);
                throw new Error('사용자 프로필을 가져올 수 없습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            if (isDevelopment) {
                console.error('로그인 오류:', error);
            }
            setIsAuthenticated(false);
            setUserProfile(null);
            setError(error.message || '로그인에 실패했습니다.');
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 로그아웃 (로컬 캐시 데이터 삭제 포함)
    const logout = useCallback(async () => {
        try {
            // Google 로그아웃 (토큰 제거)
            await driveSignOut();
            
            // 로컬 캐시 데이터 삭제
            persistentStorage.removeItem('vault_data');
            persistentStorage.removeItem('categories_data');
            persistentStorage.removeItem('last_backup_date');
            
            setIsAuthenticated(false);
            setUserProfile(null);
            setError(null);
        } catch (error) {
            if (isDevelopment) {
                console.error('로그아웃 오류:', error);
            }
            // 로그아웃 실패해도 로컬 데이터는 삭제
            persistentStorage.removeItem('vault_data');
            persistentStorage.removeItem('categories_data');
            persistentStorage.removeItem('last_backup_date');
            setIsAuthenticated(false);
            setUserProfile(null);
        }
    }, []);

    return {
        isAuthenticated,
        isLoading,
        userProfile,
        error,
        login,
        logout,
        checkAuthStatus
    };
};
