import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, Check } from 'lucide-react';
import { parseExcelFile, parseCSVText, processExcelData } from '../utils/excelHandler';

const ExcelUploadModal = ({ onClose, categories, items, onCreateCategory, onAddItem, onUpdateItem, onUploadComplete }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [pendingFile, setPendingFile] = useState(null);
    const [showUploadMode, setShowUploadMode] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (file) => {
        if (!file) return;

        // 먼저 업로드 모드 선택 화면 표시
        setPendingFile(file);
        setShowUploadMode(true);
    };

    const confirmUpload = async (mergeMode) => {
        if (!pendingFile) return;

        setShowUploadMode(false);
        setIsProcessing(true);
        setError('');
        setResult(null);

        try {
            const fileName = pendingFile.name.toLowerCase();
            let rows = [];

            if (fileName.endsWith('.csv')) {
                const text = await readFileAsText(pendingFile);
                rows = parseCSVText(text);
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                rows = await parseExcelFile(pendingFile);
            } else {
                setError('지원하지 않는 파일 형식입니다. CSV 또는 Excel 파일(.xlsx, .xls)만 지원합니다.');
                setIsProcessing(false);
                setPendingFile(null);
                return;
            }

            if (rows.length === 0) {
                setError('파일에서 데이터를 찾을 수 없습니다.');
                setIsProcessing(false);
                setPendingFile(null);
                return;
            }

            // 데이터 처리 (mergeMode에 따라 기존 데이터 처리 방식 변경)
            // 덮어쓰기 모드의 경우 processExcelData가 빈 배열을 받아서 모든 항목을 새로 생성
            const stats = processExcelData(
                rows,
                categories,
                mergeMode === 'merge' ? items : [], // 덮어쓰기 모드면 빈 배열 전달하여 새로 생성
                onCreateCategory,
                onAddItem, // 항상 onAddItem 사용 (덮어쓰기 모드는 items를 빈 배열로 전달하여 처리)
                onUpdateItem
            );

            setResult(stats);
            
            // 업로드 완료 콜백 호출 (Google Drive 동기화 트리거)
            if (onUploadComplete) {
                onUploadComplete();
            }
            
            // 3초 후 자동 닫기
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (err) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('Upload error:', err);
            }
            setError(`파일 처리 실패: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setIsProcessing(false);
            setPendingFile(null);
        }
    };

    const cancelUpload = () => {
        setPendingFile(null);
        setShowUploadMode(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const readFileAsText = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('파일 읽기 실패'));
            reader.readAsText(file, 'UTF-8');
        });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileInputChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">엑셀 업로드</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isProcessing}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* 업로드 모드 선택 화면 */}
                {showUploadMode && pendingFile && (
                    <div className="mb-6">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                            <p className="text-sm font-medium text-blue-900 mb-2">
                                선택된 파일: <span className="font-normal">{pendingFile.name}</span>
                            </p>
                            <p className="text-sm text-blue-700 mb-4">
                                현재 {items.length}개의 항목이 있습니다. 어떻게 처리하시겠습니까?
                            </p>
                            <div className="space-y-2">
                                <button
                                    onClick={() => confirmUpload('merge')}
                                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                                >
                                    기존 데이터에 추가
                                </button>
                                <button
                                    onClick={() => confirmUpload('replace')}
                                    className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                                >
                                    기존 데이터 덮어쓰기 (주의)
                                </button>
                                <button
                                    onClick={cancelUpload}
                                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                                >
                                    취소
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 파일 선택 영역 */}
                {!showUploadMode && (
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => !isProcessing && fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                            isProcessing
                                ? 'opacity-50 pointer-events-none border-gray-300'
                                : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileInputChange}
                            className="hidden"
                            disabled={isProcessing}
                        />

                        {isProcessing ? (
                            <div className="flex flex-col items-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
                                <p className="text-gray-600">파일 처리 중...</p>
                            </div>
                        ) : (
                            <>
                                <FileSpreadsheet size={48} className="mx-auto mb-4 text-indigo-600" />
                                <p className="text-gray-700 font-medium mb-2">
                                    파일을 드롭하거나 클릭하여 선택
                                </p>
                                <p className="text-sm text-gray-500">
                                    CSV 또는 Excel 파일 (.csv, .xlsx, .xls)
                                </p>
                                <p className="text-xs text-gray-400 mt-3">
                                    템플릿: site_name, url, category_name, field_name, field_value
                                </p>
                            </>
                        )}
                    </div>
                )}

                {/* 에러 메시지 */}
                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* 결과 메시지 */}
                {result && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-2 mb-2">
                            <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-green-700">업로드 완료</p>
                        </div>
                        <div className="text-xs text-green-600 space-y-1 ml-7">
                            <p>• 카테고리 생성: {result.categoriesCreated}개</p>
                            <p>• 사이트 생성: {result.sitesCreated}개</p>
                            <p>• 사이트 업데이트: {result.sitesUpdated}개</p>
                            <p>• 계정 추가: {result.accountsAdded || 0}개</p>
                            <p>• 필드 추가: {result.fieldsAdded}개</p>
                        </div>
                    </div>
                )}

                {/* 닫기 버튼 */}
                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                        {isProcessing ? '처리 중...' : '닫기'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExcelUploadModal;


