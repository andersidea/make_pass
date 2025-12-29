import { disassemble, assemble } from 'hangul-js';

/**
 * 한글 초성 추출
 * @param {string} text
 * @returns {string} 초성 문자열
 */
const extractChosung = (text) => {
    if (!text) return '';
    
    const chosungTable = {
        'ㄱ': 'ㄱ', 'ㄲ': 'ㄲ', 'ㄴ': 'ㄴ', 'ㄷ': 'ㄷ', 'ㄸ': 'ㄸ',
        'ㄹ': 'ㄹ', 'ㅁ': 'ㅁ', 'ㅂ': 'ㅂ', 'ㅃ': 'ㅃ', 'ㅅ': 'ㅅ',
        'ㅆ': 'ㅆ', 'ㅇ': 'ㅇ', 'ㅈ': 'ㅈ', 'ㅉ': 'ㅉ', 'ㅊ': 'ㅊ',
        'ㅋ': 'ㅋ', 'ㅌ': 'ㅌ', 'ㅍ': 'ㅍ', 'ㅎ': 'ㅎ'
    };

    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const code = char.charCodeAt(0);
        
        // 한글 완성형 (가-힣)
        if (code >= 0xAC00 && code <= 0xD7A3) {
            const unicode = code - 0xAC00;
            const chosungIndex = Math.floor(unicode / 588);
            const chosungList = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
            result += chosungList[chosungIndex];
        } else if (chosungTable[char]) {
            // 이미 초성인 경우
            result += char;
        } else {
            // 한글이 아닌 경우
            result += char.toLowerCase();
        }
    }
    
    return result;
};

/**
 * 영문 키보드 위치를 한글로 변환 (qwerty → 한글)
 * @param {string} engText - 영문 입력 (예: 'dkver')
 * @returns {string} 한글 변환 (예: '아플')
 */
const convertEngToKor = (engText) => {
    if (!engText) return '';
    
    const qwertyToKor = {
        // 첫 글자
        'q': 'ㅂ', 'w': 'ㅈ', 'e': 'ㄷ', 'r': 'ㄱ', 't': 'ㅅ',
        'y': 'ㅛ', 'u': 'ㅕ', 'i': 'ㅑ', 'o': 'ㅐ', 'p': 'ㅔ',
        'a': 'ㅁ', 's': 'ㄴ', 'd': 'ㅇ', 'f': 'ㄹ', 'g': 'ㅎ',
        'h': 'ㅗ', 'j': 'ㅓ', 'k': 'ㅏ', 'l': 'ㅣ',
        'z': 'ㅋ', 'x': 'ㅌ', 'c': 'ㅊ', 'v': 'ㅍ', 'b': 'ㅠ',
        'n': 'ㅜ', 'm': 'ㅡ',
        // Shift (대문자)
        'Q': 'ㅃ', 'W': 'ㅉ', 'E': 'ㄸ', 'R': 'ㄲ', 'T': 'ㅆ',
        'Y': 'ㅛ', 'U': 'ㅕ', 'I': 'ㅑ', 'O': 'ㅒ', 'P': 'ㅖ',
        'A': 'ㅁ', 'S': 'ㄴ', 'D': 'ㅇ', 'F': 'ㄹ', 'G': 'ㅎ',
        'H': 'ㅗ', 'J': 'ㅓ', 'K': 'ㅏ', 'L': 'ㅣ',
        'Z': 'ㅋ', 'X': 'ㅌ', 'C': 'ㅊ', 'V': 'ㅍ', 'B': 'ㅠ',
        'N': 'ㅜ', 'M': 'ㅡ'
    };

    let result = '';
    for (let i = 0; i < engText.length; i++) {
        const char = engText[i];
        if (qwertyToKor[char]) {
            result += qwertyToKor[char];
        } else {
            result += char;
        }
    }
    
    return result;
};

/**
 * 초성으로 검색 가능한지 확인
 * @param {string} text - 검색 대상 텍스트
 * @param {string} query - 검색 쿼리 (초성 가능)
 * @returns {boolean}
 */
const matchChosung = (text, query) => {
    if (!text || !query) return false;
    
    const textChosung = extractChosung(text);
    const queryLower = query.toLowerCase();
    
    // 초성 검색
    if (textChosung.includes(queryLower)) {
        return true;
    }
    
    // 일반 검색 (대소문자 무시)
    if (text.toLowerCase().includes(queryLower)) {
        return true;
    }
    
    return false;
};

/**
 * 영문 입력을 한글로 변환하여 검색
 * @param {string} text - 검색 대상 텍스트
 * @param {string} query - 영문 검색 쿼리
 * @returns {boolean}
 */
const matchEngToKor = (text, query) => {
    if (!text || !query) return false;
    
    const converted = convertEngToKor(query.toLowerCase());
    if (!converted) return false;
    
    // 변환된 한글 자모가 텍스트에 포함되어 있는지 확인
    // 예: dkver → ㅇㅏㅍㄷㄱ, "아플" → ㅇㅏㅍㅡㄹ
    // 자모 단위로 검색
    try {
        const textJamos = disassemble(text); // 한글을 자모로 분해
        const convertedJamos = converted.split(''); // 변환된 자모 배열
        
        // 자모 배열에서 순서대로 매칭되는지 확인 (부분 일치)
        let matchIndex = 0;
        for (let i = 0; i < textJamos.length && matchIndex < convertedJamos.length; i++) {
            if (textJamos[i] === convertedJamos[matchIndex]) {
                matchIndex++;
            }
        }
        // 모든 변환된 자모가 순서대로 매칭되면 true
        if (matchIndex === convertedJamos.length) {
            return true;
        }
    } catch (e) {
        // disassemble 실패 시 기존 로직 사용
    }
    
    // 초성으로도 검색 (양방향 매칭)
    const textChosung = extractChosung(text);
    const convertedChosung = extractChosung(converted);
    if (convertedChosung) {
        // 양방향 부분 일치: 어느 한쪽이 다른 쪽을 포함하면 매칭
        if (textChosung.includes(convertedChosung) || convertedChosung.includes(textChosung)) {
            return true;
        }
    }
    
    return false;
};

/**
 * 스마트 검색: 한글 초성, 영문→한글 변환 지원
 * @param {Array<Object>} items - PasswordItem 배열
 * @param {string} query - 검색 쿼리
 * @returns {Array<Object>} 필터링된 항목 배열
 */
export const searchItems = (items, query) => {
    if (!items || !Array.isArray(items) || !query || !query.trim()) {
        return items;
    }

    const searchQuery = query.trim().toLowerCase();
    
    return items.filter(item => {
        // siteName 검색
        if (matchChosung(item.siteName || '', searchQuery)) {
            return true;
        }
        if (matchEngToKor(item.siteName || '', searchQuery)) {
            return true;
        }
        
        // URL 검색
        if (matchChosung(item.url || '', searchQuery)) {
            return true;
        }
        if (matchEngToKor(item.url || '', searchQuery)) {
            return true;
        }
        
        // Accounts 내 username, displayName, memo 검색
        if (item.accounts && Array.isArray(item.accounts)) {
            for (const account of item.accounts) {
                // username 검색
                if (matchChosung(account.username || '', searchQuery)) {
                    return true;
                }
                if (matchEngToKor(account.username || '', searchQuery)) {
                    return true;
                }
                // displayName 검색
                if (matchChosung(account.displayName || '', searchQuery)) {
                    return true;
                }
                if (matchEngToKor(account.displayName || '', searchQuery)) {
                    return true;
                }
                // memo 검색
                if (matchChosung(account.memo || '', searchQuery)) {
                    return true;
                }
                if (matchEngToKor(account.memo || '', searchQuery)) {
                    return true;
                }
            }
        }
        
        // Custom Fields 검색
        if (item.customFields && Array.isArray(item.customFields)) {
            for (const field of item.customFields) {
                if (matchChosung(field.field_name || '', searchQuery) ||
                    matchChosung(field.field_value || '', searchQuery)) {
                    return true;
                }
                if (matchEngToKor(field.field_name || '', searchQuery) ||
                    matchEngToKor(field.field_value || '', searchQuery)) {
                    return true;
                }
            }
        }
        
        // memo 검색
        if (matchChosung(item.memo || '', searchQuery)) {
            return true;
        }
        if (matchEngToKor(item.memo || '', searchQuery)) {
            return true;
        }
        
        return false;
    });
};

/**
 * 검색 쿼리 분석 (초성인지 영문인지 감지)
 * @param {string} query
 * @returns {Object} { isChosung: boolean, isEnglish: boolean, convertedKor: string }
 */
export const analyzeQuery = (query) => {
    if (!query) {
        return { isChosung: false, isEnglish: false, convertedKor: '' };
    }
    
    const chosungPattern = /^[ㄱ-ㅎ\s]+$/;
    const englishPattern = /^[a-zA-Z\s]+$/;
    
    const isChosung = chosungPattern.test(query);
    const isEnglish = englishPattern.test(query) && !isChosung;
    const convertedKor = isEnglish ? convertEngToKor(query) : '';
    
    return {
        isChosung,
        isEnglish,
        convertedKor
    };
};
