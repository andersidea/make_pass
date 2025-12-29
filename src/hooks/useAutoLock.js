// 자동 잠금 타이머 훅
import { useEffect, useRef } from 'react';

export const useAutoLock = (onLock, timeoutMinutes = 5) => {
    const timerRef = useRef(null);

    const resetTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            onLock();
        }, timeoutMinutes * 60 * 1000);
    };

    useEffect(() => {
        // 사용자 활동 감지
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        events.forEach(event => {
            document.addEventListener(event, resetTimer);
        });

        resetTimer(); // 초기 타이머 시작

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach(event => {
                document.removeEventListener(event, resetTimer);
            });
        };
    }, [timeoutMinutes]);

    return resetTimer;
};
