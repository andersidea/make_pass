import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, Save, Download, Upload, Folder, FileSpreadsheet } from 'lucide-react';
import persistentStorage from '../utils/storage';
import { exportDataToJSON, importDataFromJSON } from '../utils/backupHandler';
import { downloadExcel } from '../utils/excelHandler';
import CategoryManageModal from './CategoryManageModal';

// SettingsModal에 toast prop 추가 필요 (App.jsx에서 전달)

const SettingsModal = ({ onClose, items = [], onImportComplete, categories = [], onCreateCategory, onUpdateCategory, onDeleteCategory, onReorderCategories, onOpenExcelUpload, toast = null }) => {
    const fileInputRef = useRef(null);
    const [autoLockMinutes, setAutoLockMinutes] = useState(10); // 기본값 10분
    const [showCategoryManage, setShowCategoryManage] = useState(false);

    useEffect(() => {
        // 저장된 설정 로드
        const saved = persistentStorage.getItem('auto_lock_minutes');
        if (saved) {
            setAutoLockMinutes(parseInt(saved, 10));
        } else {
            // 기본값 10분 설정
            setAutoLockMinutes(10);
            persistentStorage.setItem('auto_lock_minutes', '10');
        }
    }, []);

    const handleSave = () => {
        persistentStorage.setItem('auto_lock_minutes', autoLockMinutes.toString());
        onClose();
    };

    // JSON 백업 내보내기
    const handleExportBackup = () => {
        try {
            exportDataToJSON(items);
            alert('백업 파일이 다운로드되었습니다.');
        } catch (error) {
            alert(`백업 실패: ${error.message}`);
        }
    };

    // JSON 백업 가져오기
    const handleImportBackup = async (file) => {
        const confirmed = window.confirm(
            '주의: 현재 데이터가 백업 파일로 덮어씌워질 수 있습니다.\n계속하시겠습니까?'
        );
        
        if (!confirmed) {
            return;
        }

        try {
            const importedItems = await importDataFromJSON(file);
            
            if (!importedItems || importedItems.length === 0) {
                alert('백업 파일에 복원할 데이터가 없습니다.');
                return;
            }

            const finalConfirm = window.confirm(
                `백업 파일에서 ${importedItems.length}개의 항목을 찾았습니다.\n` +
                `현재 ${items.length}개의 항목이 모두 교체됩니다.\n\n` +
                '정말로 복원하시겠습니까?'
            );

            if (!finalConfirm) {
                return;
            }

            // 부모 컴포넌트에 복원 완료 알림
            if (onImportComplete) {
                onImportComplete(importedItems);
            }
            
            // 파일 입력 초기화
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            alert(`백업 복원 실패: ${error.message}`);
        }
    };

    const autoLockOptions = [
        { value: 1, label: '1분' },
        { value: 5, label: '5분' },
        { value: 10, label: '10분 (기본값)' },
        { value: 30, label: '30분' },
        { value: 0, label: '안함' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">설정</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* 자동 잠금 시간 설정 */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                            <Clock size={18} />
                            자동 잠금 시간
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            일정 시간 활동이 없을 때 자동으로 잠금 화면으로 돌아갑니다.
                        </p>
                        <select
                            value={autoLockMinutes}
                            onChange={(e) => setAutoLockMinutes(parseInt(e.target.value, 10))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            {autoLockOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-2">
                            현재 설정: {autoLockMinutes}분 동안 활동이 없으면 자동 잠금됩니다.
                        </p>
                    </div>

                    {/* 카테고리 관리 */}
                    <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">카테고리 관리</h3>
                        <button
                            onClick={() => setShowCategoryManage(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                            <Folder size={18} />
                            <span className="font-medium">카테고리 설정</span>
                        </button>
                    </div>

                    {/* 데이터 관리 구분선 */}
                    <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">데이터 관리</h3>
                        
                        {/* Excel 다운로드 */}
                        <button
                            onClick={() => {
                                try {
                                    if (!items || items.length === 0) {
                                        alert('다운로드할 데이터가 없습니다.');
                                        return;
                                    }
                                    downloadExcel(items, categories);
                                    if (toast) {
                                        toast.success(`엑셀 파일이 다운로드되었습니다. (${items.length}개 항목)`, '다운로드 완료');
                                    } else {
                                        alert(`엑셀 파일이 다운로드되었습니다. (${items.length}개 항목)`);
                                    }
                                } catch (error) {
                                    console.error('엑셀 다운로드 에러:', error);
                                    alert(`엑셀 다운로드 실패: ${error.message}`);
                                }
                            }}
                            disabled={!items || items.length === 0}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-3 ${
                                !items || items.length === 0
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                            }`}
                        >
                            <FileSpreadsheet size={18} />
                            <span className="font-medium">
                                엑셀 파일로 내보내기 {items && items.length > 0 && `(${items.length}개)`}
                            </span>
                        </button>

                        {/* Excel 업로드 */}
                        {onOpenExcelUpload && (
                            <button
                                onClick={onOpenExcelUpload}
                                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors mb-3"
                            >
                                <FileSpreadsheet size={18} />
                                <span className="font-medium">엑셀 파일로 가져오기</span>
                            </button>
                        )}

                        {/* JSON 백업 내보내기 */}
                        <button
                            onClick={handleExportBackup}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors mb-3"
                        >
                            <Download size={18} />
                            <span className="font-medium">JSON 백업 내보내기 (오프라인 백업)</span>
                        </button>

                        {/* JSON 백업 가져오기 */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    handleImportBackup(e.target.files[0]);
                                }
                            }}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <Upload size={18} />
                            <span className="font-medium">JSON 백업 가져오기 (오프라인 백업)</span>
                        </button>
                    </div>
                </div>

                {/* 저장 버튼 */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        <Save size={18} />
                        저장
                    </button>
                </div>
            </div>

            {/* 카테고리 설정 모달 */}
            {showCategoryManage && (
                <CategoryManageModal
                    categories={categories}
                    onClose={() => setShowCategoryManage(false)}
                    onCreate={onCreateCategory}
                    onUpdate={onUpdateCategory}
                    onDelete={onDeleteCategory}
                    onReorder={onReorderCategories}
                />
            )}
        </div>
    );
};

export default SettingsModal;


