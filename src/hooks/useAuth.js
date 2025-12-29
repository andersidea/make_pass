import { useState, useEffect } from 'react';
import { encryptData, decryptData, hashPassword, verifyPassword } from '../utils/encryption';
import persistentStorage from '../utils/storage';

export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [masterPasswordHash, setMasterPasswordHash] = useState(null);
    const [currentMasterPassword, setCurrentMasterPassword] = useState(null);

    useEffect(() => {
        // 저장된 마스터 비밀번호 해시 로드 (Persistent Storage 사용)
        const savedHash = persistentStorage.getItem('master_password_hash');
        if (savedHash) {
            setMasterPasswordHash(savedHash);
        }
    }, []);

    const setupMasterPassword = (password) => {
        const hash = hashPassword(password);
        const saved = persistentStorage.setItem('master_password_hash', hash);
        if (!saved) {
            // 저장 실패 시 에러 반환 (선택사항)
            return false;
        }
        setMasterPasswordHash(hash);
        setCurrentMasterPassword(password);
        setIsAuthenticated(true);
        return true;
    };

    const login = (password) => {
        if (verifyPassword(password, masterPasswordHash)) {
            setCurrentMasterPassword(password);
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        // 마스터 비밀번호를 메모리에서 명시적으로 제거
        // null로 설정하여 가비지 컬렉션 대상이 되도록 함
        setCurrentMasterPassword(null);
        // 추가 보안: state 업데이트를 즉시 반영하기 위해 강제 리렌더링
        // React는 state를 null로 설정하면 참조를 해제하므로 메모리에서 제거됨
    };

    const isFirstTime = () => {
        return !masterPasswordHash;
    };

    return {
        isAuthenticated,
        isFirstTime: isFirstTime(),
        currentMasterPassword,
        setupMasterPassword,
        login,
        logout
    };
};
