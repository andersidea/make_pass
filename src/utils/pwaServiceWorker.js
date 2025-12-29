/**
 * PWA Service Worker 등록 (선택사항)
 * 오프라인 지원 및 캐싱을 위해 사용 가능
 * 현재는 기본 설정만 포함
 */

export const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            // Service Worker 등록은 선택사항
            // 오프라인 기능이 필요할 때만 활성화
            if (process.env.NODE_ENV !== 'production') {
                console.log('Service Worker registration available (not registered by default)');
            }
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('Service Worker registration failed:', error);
            }
        }
    }
};

// 설치 프롬프트 처리 (선택사항)
export const handleInstallPrompt = () => {
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        // 기본 설치 프롬프트 방지
        e.preventDefault();
        deferredPrompt = e;
        
        // 설치 버튼 표시 (선택사항)
        // UI에 설치 버튼을 추가하여 사용자가 원할 때 설치 가능
    });

    return {
        showInstallPrompt: async () => {
            if (!deferredPrompt) {
                return false;
            }

            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                if (process.env.NODE_ENV !== 'production') {
                    console.log('User accepted the install prompt');
                }
            }
            
            deferredPrompt = null;
            return outcome === 'accepted';
        },
        canInstall: () => deferredPrompt !== null
    };
};



