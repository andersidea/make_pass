/**
 * QA 체크리스트 검증 스크립트
 * 브라우저 콘솔에서 실행하여 각 기능을 테스트할 수 있습니다.
 */

// QA-04: 영문→한글 변환 검색 테스트
console.log('=== QA-04: 영문→한글 변환 검색 테스트 ===');
const testEngToKor = () => {
    // dkver → ㅇㅏㅍㄷㄱ 변환 테스트
    const qwertyToKor = {
        'd': 'ㅇ', 'k': 'ㅏ', 'v': 'ㅍ', 'e': 'ㄷ', 'r': 'ㄱ'
    };
    
    const testCases = [
        { input: 'dkver', expected: 'ㅇㅏㅍㄷㄱ', description: 'dkver → 아플 (자모 변환)' },
        { input: '네이버', expected: 'ㄴㅇㅂ', description: '네이버 초성 추출' },
        { input: '아플', expected: 'ㅇㅍ', description: '아플 초성 추출' }
    ];
    
    testCases.forEach(test => {
        let result = '';
        for (let char of test.input) {
            if (qwertyToKor[char]) {
                result += qwertyToKor[char];
            }
        }
        console.log(`${test.description}: "${test.input}" → "${result}" (예상: "${test.expected}")`);
    });
};

testEngToKor();

// QA-05: 초성 검색 테스트
console.log('\n=== QA-05: 초성 검색 테스트 ===');
const testChosung = (text, query) => {
    const extractChosung = (str) => {
        if (!str) return '';
        let result = '';
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            if (code >= 0xAC00 && code <= 0xD7A3) {
                const unicode = code - 0xAC00;
                const chosungIndex = Math.floor(unicode / 588);
                const chosungList = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
                result += chosungList[chosungIndex];
            } else if (/^[ㄱ-ㅎ]$/.test(str[i])) {
                result += str[i];
            }
        }
        return result;
    };
    
    const textChosung = extractChosung(text);
    const match = textChosung.includes(query);
    console.log(`"${text}" (초성: ${textChosung}) - 쿼리: "${query}" → 매칭: ${match}`);
    return match;
};

testChosung('네이버', 'ㄴㅇㅂ');
testChosung('네이버', 'ㄴㅇ');
testChosung('구글', 'ㄱㄱ');

console.log('\n=== QA 체크리스트 검증 가이드 ===');
console.log(`
다음 순서로 실제 테스트를 수행하세요:

QA-01: 마이그레이션
1. 브라우저 개발자 도구 > Application > Local Storage > vault_data 확인
2. 기존 데이터가 있다면 (username, passwordEncrypted 필드가 있는 경우)
3. 페이지 새로고침 (F5)
4. 콘솔에서 오류 확인
5. EditModal로 항목 열어서 accounts 배열이 있는지 확인

QA-02: 다중 계정 추가
1. 기존 항목 편집 또는 새 항목 생성
2. "계정 추가" 버튼 클릭
3. 첫 번째 계정: user1 / pw1 입력
4. "계정 추가" 버튼 다시 클릭
5. 두 번째 계정: user2 / pw2 입력
6. 저장 후 새로고침
7. EditModal로 다시 열어서 계정 2개 확인

QA-03: 계정 삭제
1. 계정이 2개인 항목 열기
2. 첫 번째 계정의 삭제 버튼 클릭
3. 저장 후 새로고침
4. 다시 열어서 계정 1개만 남아있는지 확인

QA-04: 한글 오타 검색
1. 사이트 이름에 "아플"이 포함된 항목 생성 (예: "아플 회원")
2. 검색창에 "dkver" 입력
3. 해당 항목이 검색 결과에 나타나는지 확인

QA-05: 초성 검색
1. "네이버"라는 사이트 이름 항목 생성
2. 검색창에 "ㄴㅇㅂ" 입력
3. 해당 항목이 검색 결과에 나타나는지 확인

QA-06: 계정 검색
1. 계정 username이 "testuser"인 항목 생성
2. 검색창에 "testuser" 입력
3. 해당 항목이 검색 결과에 나타나는지 확인

QA-07: 엑셀 다운로드
1. 계정이 2개인 사이트 생성
2. "엑셀 다운로드" 버튼 클릭
3. 다운로드된 파일 열기
4. 해당 사이트가 2개 이상의 row로 분리되어 있는지 확인

QA-08: 엑셀 업로드
1. QA-07에서 다운로드한 파일을 그대로 업로드
2. "엑셀 업로드" 버튼 클릭
3. 업로드 결과 확인 (업데이트되었는지, 중복 생성되지 않았는지)
`);






