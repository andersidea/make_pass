/**
 * 프로덕션 환경에서 console 로그를 제거하기 위한 래퍼
 * 개발 환경에서만 로그를 출력합니다.
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};



