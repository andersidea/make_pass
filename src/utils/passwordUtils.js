import CryptoJS from 'crypto-js';
import { encryptAccounts, decryptAccounts } from './encryption';

/**
 * 비밀번호 생성기
 */
export const generatePassword = (options = {}) => {
    const {
        length = 12, // 기본값을 12자리로 변경
        includeUppercase = true,
        includeLowercase = true,
        includeNumbers = true,
        includeSymbols = true
    } = options;

    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
};

/**
 * 비밀번호 강도 체크
 */
export const checkPasswordStrength = (password) => {
    let score = 0;
    let feedback = [];

    // 길이 체크
    if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;
    else feedback.push('최소 8자 이상 권장');

    // 대문자 포함
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('대문자 포함 권장');

    // 소문자 포함
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('소문자 포함 권장');

    // 숫자 포함
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('숫자 포함 권장');

    // 특수문자 포함
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('특수문자 포함 권장');

    // 강도 판정
    let strength = 'weak';
    let color = 'red';
    if (score >= 5) {
        strength = 'strong';
        color = 'green';
    } else if (score >= 3) {
        strength = 'medium';
        color = 'yellow';
    }

    return {
        score,
        strength,
        color,
        feedback
    };
};

/**
 * 중복 비밀번호 체크
 */
export const checkDuplicatePasswords = (items) => {
    const passwordMap = {};
    const duplicates = [];

    items.forEach(item => {
        if (item.accounts && Array.isArray(item.accounts)) {
            item.accounts.forEach(account => {
                if (account.password) {
                    if (!passwordMap[account.password]) {
                        passwordMap[account.password] = [];
                    }
                    passwordMap[account.password].push({
                        site: item.siteName,
                        username: account.username
                    });
                }
            });
        }
    });

    Object.entries(passwordMap).forEach(([password, accounts]) => {
        if (accounts.length > 1) {
            duplicates.push({
                password,
                count: accounts.length,
                accounts
            });
        }
    });

    return duplicates;
};

/**
 * 데이터 마이그레이션: Single-Account → Multi-Account
 * @param {Array<Object>} items - 기존 항목 배열
 * @param {string} masterPassword - 마스터 비밀번호
 * @returns {Array<Object>} 마이그레이션된 항목 배열
 */
export const migrateData = (items, masterPassword) => {
    if (!Array.isArray(items) || !masterPassword) {
        return items || [];
    }

    return items.map(item => {
        // 이미 새 구조인 경우 (accountsEncrypted가 있음)
        if (item.accountsEncrypted) {
            // 복호화하여 accounts 필드 추가 (UI 사용)
            const accounts = decryptAccounts(item.accountsEncrypted, masterPassword);
            return {
                ...item,
                accounts: accounts
            };
        }

        // 기존 구조인 경우 (username/passwordEncrypted가 있음)
        if (item.username || item.passwordEncrypted || item.password) {
            const accountId = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // 기존 계정 정보 추출
            let password = '';
            if (item.password) {
                password = item.password;
            } else if (item.passwordEncrypted) {
                // passwordEncrypted 복호화 시도 (기존 암호화 방식 사용)
                try {
                    const decrypted = CryptoJS.AES.decrypt(item.passwordEncrypted, masterPassword);
                    password = decrypted.toString(CryptoJS.enc.Utf8);
                } catch (e) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.warn('Failed to decrypt old passwordEncrypted:', e);
                    }
                    password = '';
                }
            }

            // 새 accounts 배열 생성
            const accounts = [{
                id: accountId,
                username: item.username || '',
                password: password,
                memo: item.memo || '',
                isVerified: item.isVerified || false,
                verifiedAt: item.verifiedAt || null
            }];

            // accountsEncrypted 생성
            const accountsEncrypted = encryptAccounts(accounts, masterPassword);

            // 새 구조로 변환 (기존 필드 제거)
            const { username, passwordEncrypted, password: _, ...rest } = item;

            return {
                ...rest,
                accountsEncrypted: accountsEncrypted,
                accounts: accounts, // UI에서 사용
                // 기존 memo는 account.memo로 이동, 사이트 레벨 memo는 유지하지 않음
            };
        }

        // 기존 구조도 아닌 경우 그대로 반환
        return item;
    });
};