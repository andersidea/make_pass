/**
 * JSON 백업 및 복원 핸들러
 * 보안: 데이터를 복호화하지 않고 accountsEncrypted 그대로 저장
 */

import persistentStorage from './storage';

// 프로덕션 환경 체크
const isDevelopment = process.env.NODE_ENV !== 'production';

// 마지막 백업 날짜 저장 키
const LAST_BACKUP_DATE_KEY = 'last_backup_date';

/**
 * 데이터를 JSON 파일로 내보내기
 * @param {Array<Object>} items - 모든 비밀번호 항목
 * @returns {void} 파일 다운로드 트리거
 */
export const exportDataToJSON = (items) => {
    try {
        // accountsEncrypted는 그대로 저장 (복호화하지 않음)
        // accounts 필드는 제거 (UI 전용이므로 백업에 포함하지 않음)
        const itemsToExport = items.map(item => {
            const { accounts, ...rest } = item;
            return rest;
        });

        const backupData = {
            version: "1.5",
            exportedAt: new Date().toISOString(),
            app: "make_pass",
            data: itemsToExport
        };

        // JSON 문자열로 변환 (보기 좋게 포맷팅)
        const jsonString = JSON.stringify(backupData, null, 2);

        // 파일명 생성: makepass_backup_YYYYMMDD_HHmm.json
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const fileName = `makepass_backup_${year}${month}${day}_${hours}${minutes}.json`;

        // Blob 생성
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // 다운로드 링크 생성 및 클릭
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        // cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // 마지막 백업 날짜 저장
        persistentStorage.setItem(LAST_BACKUP_DATE_KEY, new Date().toISOString());

        return true;
    } catch (error) {
        if (isDevelopment) {
            console.error('Export failed:', error);
        }
        throw new Error('백업 파일 생성에 실패했습니다: ' + error.message);
    }
};

/**
 * JSON 파일에서 데이터 가져오기
 * @param {File} file - JSON 파일 객체
 * @returns {Promise<Array<Object>>} 복원할 항목 배열
 */
export const importDataFromJSON = async (file) => {
    try {
        // 파일 읽기
        const text = await readFileAsText(file);

        // JSON 파싱
        let backupData;
        try {
            backupData = JSON.parse(text);
        } catch (parseError) {
            throw new Error('유효하지 않은 JSON 파일입니다.');
        }

        // 검증: app 필드 확인
        if (backupData.app !== 'make_pass') {
            throw new Error('make_pass 백업 파일이 아닙니다.');
        }

        // 검증: data 배열 확인
        if (!Array.isArray(backupData.data)) {
            throw new Error('백업 파일에 데이터 배열이 없습니다.');
        }

        // 버전 확인 (선택사항, 경고만 표시)
        if (backupData.version && backupData.version !== '1.5' && isDevelopment) {
            console.warn(`백업 파일 버전이 다릅니다: ${backupData.version} (현재: 1.5)`);
        }

        // accountsEncrypted가 있는 항목만 반환 (보안 유지)
        const validItems = backupData.data.filter(item => {
            // 최소한 id가 있어야 함
            return item && typeof item === 'object' && item.id;
        });

        return validItems;
    } catch (error) {
        if (isDevelopment) {
            console.error('Import failed:', error);
        }
        throw error;
    }
};

/**
 * 파일을 텍스트로 읽기 (FileReader Promise 래퍼)
 * @param {File} file
 * @returns {Promise<string>}
 */
const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('파일 읽기 실패'));
        reader.readAsText(file, 'UTF-8');
    });
};

/**
 * 마지막 백업 날짜 조회
 * @returns {Date|null} 마지막 백업 날짜 또는 null
 */
export const getLastBackupDate = () => {
    const lastBackupDateStr = persistentStorage.getItem(LAST_BACKUP_DATE_KEY);
    if (!lastBackupDateStr) {
        return null;
    }
    try {
        return new Date(lastBackupDateStr);
    } catch (error) {
        if (isDevelopment) {
            console.error('Failed to parse last backup date:', error);
        }
        return null;
    }
};

/**
 * 마지막 백업 이후 경과 일수 계산
 * @returns {number|null} 경과 일수 또는 null (백업 기록이 없을 경우)
 */
export const getDaysSinceLastBackup = () => {
    const lastBackupDate = getLastBackupDate();
    if (!lastBackupDate) {
        return null;
    }
    const now = new Date();
    const diffTime = now - lastBackupDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

/**
 * 백업 리마인더 체크 (7일 경과 시)
 * @returns {boolean} 리마인더 표시 여부
 */
export const shouldShowBackupReminder = () => {
    const daysSince = getDaysSinceLastBackup();
    // null이면 백업 기록이 없으므로 리마인더 표시 안 함
    // 7일 이상 경과 시 리마인더 표시
    return daysSince !== null && daysSince >= 7;
};
