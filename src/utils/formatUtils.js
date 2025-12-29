/**
 * 숫자 포맷 유틸리티
 */

/**
 * 숫자에 천 단위 콤마 추가
 * @param {number|string} num - 포맷할 숫자
 * @returns {string} - 포맷된 문자열 (예: "1,000,000")
 */
export const formatNumberWithCommas = (num) => {
    if (num === null || num === undefined || num === '') return '';
    const numStr = String(num).replace(/,/g, ''); // 기존 콤마 제거
    const numValue = parseFloat(numStr);
    if (isNaN(numValue)) return numStr;
    return numValue.toLocaleString('ko-KR');
};

/**
 * 콤마가 포함된 문자열을 숫자로 변환
 * @param {string} str - 콤마가 포함된 문자열
 * @returns {number} - 변환된 숫자
 */
export const parseNumberFromString = (str) => {
    if (!str) return 0;
    const cleaned = String(str).replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
};

/**
 * 카드 유효기간 포맷 (MM/YY)
 * @param {string} expiryDate - MM/YY 형식의 날짜
 * @returns {string} - 포맷된 날짜
 */
export const formatExpiryDate = (expiryDate) => {
    if (!expiryDate) return '';
    // MM/YY 형식으로 변환 (숫자만 입력된 경우)
    const cleaned = expiryDate.replace(/\D/g, '');
    if (cleaned.length >= 2) {
        return cleaned.slice(0, 2) + (cleaned.length > 2 ? '/' + cleaned.slice(2, 4) : '');
    }
    return cleaned;
};

/**
 * 유효기간 만료 체크
 * @param {string} expiryDate - MM/YY 형식의 날짜
 * @returns {Object} - { isExpired: boolean, isExpiringSoon: boolean, daysUntilExpiry: number }
 */
export const checkExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { isExpired: false, isExpiringSoon: false, daysUntilExpiry: null };
    
    try {
        const [month, year] = expiryDate.split('/').map(s => parseInt(s, 10));
        if (isNaN(month) || isNaN(year)) {
            return { isExpired: false, isExpiringSoon: false, daysUntilExpiry: null };
        }
        
        // 2자리 연도를 4자리로 변환 (20XX)
        const fullYear = year < 100 ? 2000 + year : year;
        
        // 해당 월의 마지막 날짜
        const expiryDateObj = new Date(fullYear, month, 0); // 월의 마지막 날
        
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiryDateObj - now) / (1000 * 60 * 60 * 24));
        
        const isExpired = daysUntilExpiry < 0;
        const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 30; // 30일 이내
        
        return {
            isExpired,
            isExpiringSoon,
            daysUntilExpiry
        };
    } catch (error) {
        return { isExpired: false, isExpiringSoon: false, daysUntilExpiry: null };
    }
};

/**
 * 카드번호 포맷 (4자리 단위로 띄어쓰기)
 * @param {string} cardNumber - 카드번호 문자열
 * @returns {string} - 포맷된 카드번호 (예: "1234 5678 9012 3456")
 */
export const formatCardNumber = (cardNumber) => {
    if (!cardNumber) return '';
    // 숫자만 추출
    const cleaned = cardNumber.replace(/\D/g, '');
    // 4자리마다 띄어쓰기 추가
    return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
};

/**
 * 포맷된 카드번호에서 숫자만 추출
 * @param {string} formattedCardNumber - 포맷된 카드번호
 * @returns {string} - 숫자만 포함된 문자열
 */
export const parseCardNumber = (formattedCardNumber) => {
    if (!formattedCardNumber) return '';
    return formattedCardNumber.replace(/\D/g, '');
};

