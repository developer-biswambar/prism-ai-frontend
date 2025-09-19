/**
 * File Requirements Modal Component
 * Shows detailed file requirements when applying a use case
 */

import React from 'react';
import {AlertCircle, ArrowRight, CheckCircle, FileText, Info, X} from 'lucide-react';

const FileRequirementsModal = ({
                                   isOpen,
                                   onClose,
                                   useCase,
                                   currentFiles = [],
                                   onProceed = null
                               }) => {
    if (!isOpen || !useCase) return null;

    const fileRequirements = useCase?.use_case_metadata?.file_requirements;
    const requiredFileCount = fileRequirements?.required_file_count || 0;
    const fileMappings = fileRequirements?.file_role_mappings || [];

    const hasCorrectFileCount = currentFiles.length === requiredFileCount;
    const canProceed = hasCorrectFileCount && requiredFileCount > 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                            <FileText className="text-blue-500" size={24}/>
                            <span>File Requirements</span>
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {useCase.name} requires specific file mappings
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X size={24}/>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {/* Current Status */}
                    <div className={`mb-6 p-4 rounded-lg border ${
                        hasCorrectFileCount
                            ? 'bg-green-50 border-green-200'
                            : 'bg-amber-50 border-amber-200'
                    }`}>
                        <div className="flex items-center space-x-2 mb-2">
                            {hasCorrectFileCount ? (
                                <CheckCircle className="text-green-500" size={20}/>
                            ) : (
                                <AlertCircle className="text-amber-500" size={20}/>
                            )}
                            <span className={`font-medium ${
                                hasCorrectFileCount ? 'text-green-800' : 'text-amber-800'
                            }`}>
                                {hasCorrectFileCount
                                    ? 'File count matches requirements'
                                    : 'File count mismatch'}
                            </span>
                        </div>
                        <p className={`text-sm ${
                            hasCorrectFileCount ? 'text-green-700' : 'text-amber-700'
                        }`}>
                            You have {currentFiles.length} file{currentFiles.length !== 1 ? 's' : ''} selected.
                            This use case requires exactly {requiredFileCount} file{requiredFileCount !== 1 ? 's' : ''}.
                        </p>
                    </div>

                    {/* File Requirements Details */}
                    {fileMappings.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-900 mb-3">Required File Mappings:</h3>

                            {fileMappings.map((mapping, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <div
                                            className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <span className="font-medium text-gray-900">{mapping.role}</span>
                                                <ArrowRight size={16} className="text-gray-400"/>
                                                <span className="text-sm text-gray-600">
                                                    Your file #{index + 1}
                                                    {currentFiles[index] && (
                                                        <span className="text-blue-600 ml-1">
                                                            ({currentFiles[index].filename})
                                                        </span>
                                                    )}
                                                </span>
                                            </div>

                                            <div className="text-sm text-gray-600 space-y-1">
                                                <div><strong>Original file:</strong> {mapping.original_filename}</div>
                                                <div><strong>Expected
                                                    columns:</strong> {mapping.expected_columns.slice(0, 3).join(', ')}
                                                    {mapping.expected_columns.length > 3 && ` (and ${mapping.expected_columns.length - 3} more)`}
                                                </div>
                                                <div><strong>Column count:</strong> {mapping.column_count}</div>
                                            </div>

                                            {mapping.description && (
                                                <div className="mt-2 text-xs text-gray-500 italic">
                                                    {mapping.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                            <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={16}/>
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">How file mapping works:</p>
                                <ul className="space-y-1 list-disc list-inside">
                                    <li>Your files will be mapped to the roles shown above (file1, file2, etc.)</li>
                                    <li>The AI will use these file references to process your data correctly</li>
                                    <li>Column names will be automatically matched where possible</li>
                                    <li>If column matching fails, you'll be prompted to map them manually</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={() => {
                            if (canProceed && onProceed) {
                                onProceed();
                            }
                        }}
                        disabled={!canProceed}
                        className={`px-6 py-2 rounded-lg font-medium ${
                            canProceed
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {canProceed
                            ? 'Proceed with Use Case'
                            : hasCorrectFileCount
                                ? 'No files to process'
                                : `Select ${requiredFileCount} file${requiredFileCount !== 1 ? 's' : ''} first`
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FileRequirementsModal;