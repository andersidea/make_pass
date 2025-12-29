import CryptoJS from 'crypto-js';

// 프로덕션 환경 체크
const isDevelopment = process.env.NODE_ENV !== 'production';

// 마스터 비밀번호로 데이터 암호화
export const encryptData = (data, masterPassword) => {
    try {
        const jsonString = JSON.stringify(data);
        const encrypted = CryptoJS.AES.encrypt(jsonString, masterPassword).toString();
        return encrypted;
    } catch (error) {
        if (isDevelopment) {
            console.error('Encryption failed:', error);
        }
        return null;
    }
};

// 암호화된 데이터 복호화
export const decryptData = (encryptedData, masterPassword) => {
    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedData, masterPassword);
        const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
        return JSON.parse(jsonString);
    } catch (error) {
        if (isDevelopment) {
            console.error('Decryption failed:', error);
        }
        return null;
    }
};

// 마스터 비밀번호 해시 생성 (검증용)
export const hashPassword = (password) => {
    return CryptoJS.SHA256(password).toString();
};

// 마스터 비밀번호 검증
export const verifyPassword = (password, hash) => {
    return hashPassword(password) === hash;
};

/**
 * Accounts 배열 암호화
 * @param {Array<{id: string, username: string, password: string, memo?: string, isVerified?: boolean, verifiedAt?: string}>} accounts
 * @param {string} masterPassword
 * @returns {string} 암호화된 문자열
 */
export const encryptAccounts = (accounts, masterPassword) => {
    if (!Array.isArray(accounts) || accounts.length === 0) {
        return '';
    }
    try {
        const jsonString = JSON.stringify(accounts);
        const encrypted = CryptoJS.AES.encrypt(jsonString, masterPassword).toString();
        return encrypted;
    } catch (error) {
        if (isDevelopment) {
            console.error('Accounts encryption failed:', error);
        }
        return '';
    }
};

/**
 * Accounts 배열 복호화
 * @param {string} accountsEncrypted
 * @param {string} masterPassword
 * @returns {Array<{id: string, username: string, password: string, memo?: string, isVerified?: boolean, verifiedAt?: string}>} 복호화된 accounts 배열
 */
export const decryptAccounts = (accountsEncrypted, masterPassword) => {
    if (!accountsEncrypted) {
        return [];
    }
    try {
        const decrypted = CryptoJS.AES.decrypt(accountsEncrypted, masterPassword);
        const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
        if (!jsonString) {
            return [];
        }
        const accounts = JSON.parse(jsonString);
        return Array.isArray(accounts) ? accounts : [];
    } catch (error) {
        if (isDevelopment) {
            console.error('Accounts decryption failed:', error);
        }
        return [];
    }
};
