/**
 * Use Case File Selection Component
 * Specialized file selection for applying use cases with specific file role requirements
 */

import React, { useState, useEffect } from 'react';
import {
    FileText,
    Upload,
    X,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    Info,
    RotateCcw,
    Plus
} from 'lucide-react';

const UseCaseFileSelection = ({
    useCase,
    files = [],
    selectedFiles = {},
    onFileSelection,
    onRefreshFiles,
    onFileUpload,
    uploadProgress = {}
}) => {
    const [selectedFileMappings, setSelectedFileMappings] = useState({});
    const [validationErrors, setValidationErrors] = useState({});

    const fileRequirements = useCase?.use_case_metadata?.file_requirements;
    const requiredFileCount = fileRequirements?.required_file_count || 0;
    const fileMappings = fileRequirements?.file_role_mappings || [];

    useEffect(() => {
        // Initialize with current selectedFiles if they match the count
        if (Object.keys(selectedFiles).length === requiredFileCount) {
            const mappings = {};
            fileMappings.forEach((mapping, index) => {
                const fileKey = Object.keys(selectedFiles)[index];
                if (fileKey && selectedFiles[fileKey]) {
                    mappings[mapping.role] = selectedFiles[fileKey];
                }
            });
            setSelectedFileMappings(mappings);
        }
    }, [selectedFiles, requiredFileCount, fileMappings]);

    const handleFileRoleSelection = (role, file) => {
        const newMappings = { ...selectedFileMappings };
        
        if (file) {
            // Remove this file from any other role first
            Object.keys(newMappings).forEach(existingRole => {
                if (newMappings[existingRole]?.file_id === file.file_id) {
                    delete newMappings[existingRole];
                }
            });
            
            // Assign file to this role
            newMappings[role] = file;
        } else {
            // Remove file from this role
            delete newMappings[role];
        }
        
        setSelectedFileMappings(newMappings);
        
        // Update parent component
        if (onFileSelection) {
            onFileSelection(newMappings);
        }
        
        // Clear validation errors for this role
        const newErrors = { ...validationErrors };
        delete newErrors[role];
        setValidationErrors(newErrors);
    };

    const validateFileMapping = (role, file, expectedMapping) => {
        if (!file) return null;
        
        const errors = [];
        const expectedColumns = expectedMapping.expected_columns || [];
        const fileColumns = file.columns || [];
        
        // Check column count
        if (fileColumns.length !== expectedMapping.column_count) {
            errors.push(`Expected ${expectedMapping.column_count} columns, got ${fileColumns.length}`);
        }
        
        // Check for key columns (first 3 expected columns)
        const missingColumns = expectedColumns.slice(0, 3).filter(col => 
            !fileColumns.some(fileCol => 
                fileCol.toLowerCase().includes(col.toLowerCase()) || 
                col.toLowerCase().includes(fileCol.toLowerCase())
            )
        );
        
        if (missingColumns.length > 0) {
            errors.push(`Missing similar columns: ${missingColumns.join(', ')}`);
        }
        
        return errors.length > 0 ? errors : null;
    };

    const getAvailableFiles = (currentRole) => {
        // Get files that aren't assigned to other roles
        return files.filter(file => {
            const assignedRole = Object.keys(selectedFileMappings).find(role => 
                selectedFileMappings[role]?.file_id === file.file_id
            );
            return !assignedRole || assignedRole === currentRole;
        });
    };

    const isComplete = () => {
        return fileMappings.length > 0 && fileMappings.every(mapping => 
            selectedFileMappings[mapping.role]
        );
    };

    const hasValidationErrors = () => {
        return Object.keys(validationErrors).length > 0;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Map Files to Use Case Requirements
                </h3>
                <p className="text-gray-600">
                    "{useCase?.name}" requires {requiredFileCount} specific file{requiredFileCount > 1 ? 's' : ''}. 
                    Please map your uploaded files to the required roles.
                </p>
            </div>

            {/* Progress Indicator */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">
                        File Mapping Progress
                    </span>
                    <span className="text-sm text-blue-600">
                        {Object.keys(selectedFileMappings).length} of {requiredFileCount} assigned
                    </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                            width: `${(Object.keys(selectedFileMappings).length / requiredFileCount) * 100}%` 
                        }}
                    />
                </div>
            </div>

            {/* File Role Mappings */}
            <div className="space-y-4">
                {fileMappings.map((mapping, index) => {
                    const selectedFile = selectedFileMappings[mapping.role];
                    const availableFiles = getAvailableFiles(mapping.role);
                    const errors = selectedFile ? validateFileMapping(mapping.role, selectedFile, mapping) : null;
                    
                    return (
                        <div key={mapping.role} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start space-x-4">
                                {/* Role Indicator */}
                                <div className="flex-shrink-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                        selectedFile 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {index + 1}
                                    </div>
                                </div>

                                {/* Role Info and Selection */}
                                <div className="flex-1 space-y-3">
                                    {/* Role Header */}
                                    <div>
                                        <div className="flex items-center space-x-2 mb-1">
                                            <h4 className="font-medium text-gray-900">{mapping.role}</h4>
                                            {selectedFile && (
                                                <CheckCircle size={16} className="text-green-500" />
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">{mapping.description}</p>
                                    </div>

                                    {/* Expected vs Selected */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Expected */}
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <h5 className="text-xs font-medium text-gray-700 mb-1">Expected</h5>
                                            <div className="text-sm space-y-1">
                                                <div><strong>Original:</strong> {mapping.original_filename}</div>
                                                <div><strong>Columns:</strong> {mapping.column_count}</div>
                                                <div className="text-xs text-gray-500">
                                                    Key columns: {mapping.expected_columns.slice(0, 3).join(', ')}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Selected */}
                                        <div className="bg-white border border-gray-200 p-3 rounded-lg">
                                            <h5 className="text-xs font-medium text-gray-700 mb-1">Your Selection</h5>
                                            {selectedFile ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">{selectedFile.filename}</span>
                                                        <button
                                                            onClick={() => handleFileRoleSelection(mapping.role, null)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        {selectedFile.columns?.length || 0} columns
                                                    </div>
                                                    {errors && (
                                                        <div className="text-xs text-amber-600">
                                                            ⚠️ {errors.join(', ')}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-400">No file selected</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* File Selection Dropdown */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Select file for {mapping.role}:
                                        </label>
                                        <select
                                            value={selectedFile?.file_id || ''}
                                            onChange={(e) => {
                                                const fileId = e.target.value;
                                                const file = files.find(f => f.file_id === fileId);
                                                handleFileRoleSelection(mapping.role, file);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select a file...</option>
                                            {availableFiles.map(file => (
                                                <option key={file.file_id} value={file.file_id}>
                                                    {file.filename} ({file.columns?.length || 0} columns)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* File Upload Section */}
            <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Available Files</h4>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={onRefreshFiles}
                            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                        >
                            <RotateCcw size={14} />
                            <span>Refresh</span>
                        </button>
                        <label className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50 cursor-pointer">
                            <input
                                type="file"
                                multiple
                                accept=".csv,.xlsx,.xls"
                                onChange={onFileUpload}
                                className="hidden"
                            />
                            <Plus size={14} />
                            <span>Upload Files</span>
                        </label>
                    </div>
                </div>

                {/* File List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {files.map(file => {
                        const assignedRole = Object.keys(selectedFileMappings).find(role => 
                            selectedFileMappings[role]?.file_id === file.file_id
                        );
                        
                        return (
                            <div
                                key={file.file_id}
                                className={`p-3 rounded-lg border text-sm ${
                                    assignedRole 
                                        ? 'border-green-200 bg-green-50' 
                                        : 'border-gray-200 bg-white'
                                }`}
                            >
                                <div className="flex items-center space-x-2 mb-1">
                                    <FileText size={14} className={assignedRole ? 'text-green-600' : 'text-gray-400'} />
                                    <span className="font-medium truncate">{file.filename}</span>
                                </div>
                                <div className="text-xs text-gray-600">
                                    {file.columns?.length || 0} columns
                                </div>
                                {assignedRole && (
                                    <div className="text-xs text-green-600 mt-1">
                                        Assigned to {assignedRole}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {files.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                        <FileText size={32} className="mx-auto mb-2 text-gray-300" />
                        <p>No files uploaded yet. Upload files to get started.</p>
                    </div>
                )}
            </div>

            {/* Status and Instructions */}
            <div className="space-y-3">
                {/* Completion Status */}
                {isComplete() ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="text-green-500" size={16} />
                            <span className="text-sm font-medium text-green-800">
                                All files mapped successfully!
                            </span>
                        </div>
                        {hasValidationErrors() && (
                            <p className="text-xs text-amber-700 mt-1">
                                ⚠️ Some file structures don't match perfectly, but you can proceed. 
                                Column mapping will be handled automatically.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="text-amber-500" size={16} />
                            <span className="text-sm font-medium text-amber-800">
                                Please assign files to all required roles before proceeding
                            </span>
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                        <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Instructions:</p>
                            <ul className="space-y-1 text-xs">
                                <li>• Each file must be assigned to exactly one role (file1, file2, etc.)</li>
                                <li>• Files will be processed in the order specified by the use case</li>
                                <li>• Column names will be automatically matched during processing</li>
                                <li>• If automatic matching fails, you'll be prompted to map columns manually</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UseCaseFileSelection;