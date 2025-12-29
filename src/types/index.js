/**
 * @typedef {Object} Account
 * @property {string} id - 계정 고유 ID
 * @property {string} username - 사용자명 (로그인 ID)
 * @property {string} [displayName] - 표시명 (사용자에게 보여질 이름, 선택사항)
 * @property {string} password - 비밀번호 (평문, UI에서만 사용)
 * @property {string} [memo] - 메모
 * @property {boolean} [isVerified] - 현재 비밀번호인지 확인함 플래그
 * @property {string} [verifiedAt] - 확인 일시 (ISO string)
 */

/**
 * @typedef {Object} PasswordItem
 * @property {string} id - 항목 고유 ID
 * @property {string} siteName - 사이트 이름
 * @property {string} [url] - URL
 * @property {string} accountsEncrypted - 암호화된 accounts 배열 (JSON string, AES-256)
 * @property {Account[]} [accounts] - 복호화된 accounts 배열 (UI에서만 사용, 저장 시 accountsEncrypted로 변환)
 * @property {string} [memo] - 메모
 * @property {string} categoryId - 카테고리 ID (기본값: 'uncategorized')
 * @property {Array<{id: string, field_name: string, field_value: string}>} [customFields] - 사용자 정의 필드
 * @property {string} createdAt - 생성 일시 (ISO string)
 * @property {string} updatedAt - 수정 일시 (ISO string)
 * 
 * @property {string} [username] - @deprecated 기존 필드 (마이그레이션용)
 * @property {string} [passwordEncrypted] - @deprecated 기존 필드 (마이그레이션용)
 * @property {string} [password] - @deprecated 기존 필드 (마이그레이션용, UI에서만 사용)
 */




