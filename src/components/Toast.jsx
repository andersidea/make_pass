import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TOAST_DURATION = 3000; // 3초

const Toast = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(true);

  // onRemove를 useCallback으로 감싸서 안정적인 참조 유지
  const handleRemove = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300); // 애니메이션 완료 후 제거
  }, [toast.id, onRemove]);

  useEffect(() => {
    const timer = setTimeout(handleRemove, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [handleRemove]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
    warning: 'text-yellow-800'
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${bgColors[toast.type]} ${textColors[toast.type]} min-w-[300px] max-w-[500px]`}
    >
      {icons[toast.type]}
      <div className="flex-1">
        {toast.title && (
          <div className="font-semibold mb-1">{toast.title}</div>
        )}
        <div className="text-sm whitespace-pre-line">{toast.message}</div>
      </div>
      <button
        onClick={handleRemove}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onRemove={onRemove} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;

// Toast 관리 Hook
export const useToast = () => {
  const [toasts, setToasts] = useState([]);
  
  // 동일한 메시지의 중복 호출을 방지하는 디바운싱 (최근 2초 이내 동일 메시지 무시)
  const recentMessages = React.useRef(new Map());
  const DEBOUNCE_MS = 2000; // 2초 이내 동일 메시지 무시

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type, message, title = null, duration = TOAST_DURATION) => {
    // 디바운싱: 동일한 메시지가 최근 2초 이내에 호출되었는지 확인
    const messageKey = `${type}-${message}-${title || ''}`;
    const now = Date.now();
    const lastCallTime = recentMessages.current.get(messageKey);
    
    if (lastCallTime && (now - lastCallTime) < DEBOUNCE_MS) {
      // 최근 2초 이내에 동일한 메시지가 호출되었으면 무시
      return null;
    }
    
    // 마지막 호출 시간 업데이트
    recentMessages.current.set(messageKey, now);
    
    // 2초 후 맵에서 제거 (메모리 누수 방지)
    setTimeout(() => {
      recentMessages.current.delete(messageKey);
    }, DEBOUNCE_MS);

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast = { id, type, message, title, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    // duration이 0이면 자동으로 제거하지 않음
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    
    return id;
  }, []);

  const success = useCallback((message, title = null) => showToast('success', message, title), [showToast]);
  const error = useCallback((message, title = null) => showToast('error', message, title), [showToast]);
  const info = useCallback((message, title = null) => showToast('info', message, title), [showToast]);
  const warning = useCallback((message, title = null) => showToast('warning', message, title), [showToast]);

  return {
    toasts,
    success,
    error,
    info,
    warning,
    removeToast
  };
};

