// src/components/LeftSidebar.jsx - Enhanced with Reusable File Upload Modal
import React, {useRef, useState} from 'react';
import {
    AlertTriangle,
    CheckCircle,
    ExternalLink,
    Eye,
    FileText,
    FolderOpen,
    RefreshCw,
    Trash2,
    Upload,
    X
} from 'lucide-react';
import {apiService} from '../../services/defaultApi.js';
import FileUploadModal from '../../fileManagement/FileUploadModal.jsx';

const LeftSidebar = ({
                         files,
                         templates,
                         selectedFiles,
                         setSelectedFiles,
                         selectedTemplate,
                         requiredFiles,
                         currentInput,
                         uploadProgress,
                         onFileUpload,
                         onTemplateSelect,
                         onRefreshFiles,
                         onOpenFileLibrary
                     }) => {
    // Fixed width - no resizing functionality
    const width = 320;
    const fileInputRef = useRef(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null);
    const [deleteInProgress, setDeleteInProgress] = useState(false);

    // File upload modal states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFileForUpload, setSelectedFileForUpload] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const openFileViewer = (fileId) => {
        const viewerUrl = `/viewer/${fileId}`;
        const newWindow = window.open(
            viewerUrl,
            `viewer_${fileId}`,
            'toolbar=yes,scrollbars=yes,resizable=yes,width=1400,height=900,menubar=yes,location=yes,directories=no,status=yes'
        );

        if (newWindow) {
            newWindow.focus();
        } else {
            window.open(viewerUrl, '_blank');
        }
    };

    const handleDeleteFile = (file, event) => {
        event.preventDefault();
        event.stopPropagation();
        setFileToDelete(file);
        setShowDeleteModal(true);
    };

    const confirmDeleteFile = async () => {
        if (!fileToDelete) return;

        setDeleteInProgress(true);
        try {
            const result = await apiService.deleteFile(fileToDelete.file_id);

            if (result.success) {
                // Remove file from selected files if it was selected
                const updatedSelectedFiles = {...selectedFiles};
                Object.keys(updatedSelectedFiles).forEach(key => {
                    if (updatedSelectedFiles[key]?.file_id === fileToDelete.file_id) {
                        delete updatedSelectedFiles[key];
                    }
                });
                setSelectedFiles(updatedSelectedFiles);

                // Refresh the file list
                await onRefreshFiles();

                // Close modal and reset state
                setShowDeleteModal(false);
                setFileToDelete(null);
            } else {
                throw new Error(result.message || 'Delete failed');
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            alert(`Failed to delete file: ${error.message}`);
        } finally {
            setDeleteInProgress(false);
        }
    };

    const closeDeleteModal = () => {
        if (deleteInProgress) return; // Prevent closing during deletion
        setShowDeleteModal(false);
        setFileToDelete(null);
    };

    // Handle upload modal confirmation
    const handleUploadConfirm = async (uploadConfig) => {
        const {file, sheetName, customName} = uploadConfig;

        // Close modal first
        setShowUploadModal(false);
        setSelectedFileForUpload(null);

        try {
            // Use ONLY the enhanced upload method - don't call the original onFileUpload
            if (sheetName) {
                await apiService.uploadFileWithOptions(file, sheetName, customName);
            } else {
                await apiService.uploadFileWithOptions(file, '', customName);
            }

            // Refresh the file list to show the new file
            if (onRefreshFiles) {
                await onRefreshFiles();
            }

            // Note: We don't call onFileUpload here anymore to avoid duplicate uploads
            // The onFileUpload was designed for the old flow where it handled the actual upload
            // Now we handle the upload directly with apiService.uploadFileWithOptions

        } catch (error) {
            console.error('Error in file upload:', error);
            // You could add error message display here if needed
        }
    };

    // Handle upload modal cancellation
    const handleUploadCancel = () => {
        setShowUploadModal(false);
        setSelectedFileForUpload(null);
    };

    const handleFileInputChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Clear the input
        event.target.value = '';

        // Set file for upload modal and open modal
        setSelectedFileForUpload(file);
        setShowUploadModal(true);
    };

    const handleFileSelection = (fileKey, file) => {
        setSelectedFiles(prev => ({
            ...prev,
            [fileKey]: file
        }));
    };

    const getFileSelectionStatus = () => {
        if (!selectedTemplate) {
            return {complete: false, selected: 0, required: 0};
        }

        const selected = requiredFiles.filter(rf => selectedFiles[rf.key]).length;
        return {
            complete: selected === requiredFiles.length,
            selected,
            required: requiredFiles.length
        };
    };

    const isFileInUse = (file) => {
        return Object.values(selectedFiles).some(selectedFile =>
            selectedFile?.file_id === file.file_id
        );
    };

    const status = getFileSelectionStatus();

    const getProcessIcon = (category) => {
        switch (category) {
            case 'reconciliation':
            case 'ai-reconciliation':
                return '🔄';
            case 'delta-generation':
                return '📊';
            case 'validation':
                return '🔍';
            case 'cleaning':
                return '🧹';
            case 'extraction':
                return '📋';
            case 'consolidation':
                return '📚';
            case 'ai-analysis':
                return '🤖';
            case 'ai-generation':
                return '🎲';
            default:
                return '⚙️';
        }
    };

    const getProcessColor = (category, index) => {
        const colors = [
            'from-blue-500 to-purple-600',
            'from-green-500 to-blue-600',
            'from-purple-500 to-pink-600',
            'from-orange-500 to-red-600',
            'from-teal-500 to-green-600',
            'from-indigo-500 to-purple-600',
            'from-pink-500 to-rose-600',
            'from-cyan-500 to-blue-600'
        ];

        if (category?.includes('ai')) {
            return 'from-purple-500 to-pink-600';
        }
        if (category === 'delta-generation') {
            return 'from-orange-500 to-red-600';
        }

        return colors[index % colors.length];
    };

    const getFileTypeIcon = (filename) => {
        if (filename.toLowerCase().endsWith('.csv')) {
            return '📄';
        } else if (filename.toLowerCase().endsWith('.xlsx') || filename.toLowerCase().endsWith('.xls')) {
            return '📊';
        }
        return '📄';
    };

    const renderFileItem = (file) => {
        const displayName = file.custom_name || file.filename;
        const isExcel = file.filename.toLowerCase().endsWith('.xlsx') || file.filename.toLowerCase().endsWith('.xls');
        const fileInUse = isFileInUse(file);

        return (
            <div
                key={file.file_id}
                className="group bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-md transition-all duration-200"
            >
                <div className="p-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className="text-lg">{getFileTypeIcon(file.filename)}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-1 mb-0.5">
                                    <p className="text-sm font-medium text-gray-900 truncate"
                                       title={displayName}>
                                        {displayName}
                                    </p>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                        isExcel
                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                                    }`}>
                                        {isExcel ? 'Excel' : 'CSV'}
                                    </span>
                                    {fileInUse && (
                                        <span
                                            className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                            In Use
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-700">
                                    {file.total_rows?.toLocaleString()} rows • {file.columns?.length} cols
                                    {file.sheet_name && (
                                        <span className="ml-1 text-blue-700">• {file.sheet_name}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openFileViewer(file.file_id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all duration-200"
                                title="View/Edit File"
                            >
                                <Eye size={14}/>
                            </button>
                            <button
                                onClick={(e) => handleDeleteFile(file, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all duration-200"
                                title="Delete File"
                                disabled={fileInUse}
                            >
                                <Trash2 size={14}/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div
                className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg h-screen flex-shrink-0"
                style={{width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px`}}
            >
                {/* Upload Progress Indicator */}
                {uploadProgress && (
                    <div className="p-4 bg-blue-50 border-b border-blue-200">
                        <div className="flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900">
                                    Uploading file...
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse"
                                         style={{width: '60%'}}></div>
                                </div>
                                <div className="text-xs text-gray-700 mt-2 font-medium">
                                    Processing file content...
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="border-b border-gray-200 bg-white flex-shrink-0 p-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                            <FileText className="text-white" size={18}/>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Files
                            </h2>
                            <p className="text-xs text-gray-600 font-medium">
                                Manage your data files
                            </p>
                        </div>
                    </div>
                </div>

                {/* Dynamic Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">

                    {/* File Upload */}
                    <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                        <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-sm font-semibold text-gray-900">Upload Files</h3>
                        </div>

                        <div className="space-y-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileInputChange}
                                accept=".csv,.xlsx,.xls"
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadProgress === true}
                                className="w-full py-2 px-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                                {uploadProgress === true ? (
                                    <>
                                        <div
                                            className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={16}/>
                                        <span>Upload Files</span>
                                    </>
                                )}
                            </button>

                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-700">
                                {files.length} file{files.length !== 1 ? 's' : ''} available
                            </span>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={async () => {
                                        setIsRefreshing(true);
                                        try {
                                            await onRefreshFiles();
                                        } finally {
                                            setIsRefreshing(false);
                                        }
                                    }}
                                    disabled={isRefreshing}
                                    className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md border border-blue-200 hover:border-blue-300 flex items-center space-x-1 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''}/>
                                    <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                                </button>
                            </div>
                        </div>
                        </div>
                    </div>


                    {/* File Library - Full Section */}
                    <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white">
                        <div className="p-3 pb-2 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <h3 className="text-sm font-semibold text-gray-900">File Library</h3>
                                </div>
                                {onOpenFileLibrary && (
                                    <button
                                        onClick={onOpenFileLibrary}
                                        className="px-3 py-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md border border-blue-200 hover:border-blue-300 flex items-center space-x-1 transition-all duration-200 font-medium"
                                        title="Open full File Library in new tab"
                                    >
                                        <FolderOpen size={14}/>
                                        <span>Open Full Library</span>
                                        <ExternalLink size={12}/>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
                            {isRefreshing || !files ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                                    <p className="text-sm text-gray-600 font-medium">
                                        {isRefreshing ? 'Refreshing files...' : 'Loading files...'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Please wait while we update your file list</p>
                                </div>
                            ) : files.length === 0 ? (
                                <div className="text-center py-12 text-gray-600">
                                    <FileText size={48} className="mx-auto mb-4 opacity-40 text-gray-400"/>
                                    <p className="text-lg font-medium mb-2 text-gray-800">No files uploaded yet</p>
                                    <p className="text-sm mb-4">Upload CSV or Excel files to get started</p>
                                    {onOpenFileLibrary && (
                                        <button
                                            onClick={onOpenFileLibrary}
                                            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                                        >
                                            Open File Library
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {files.map(renderFileItem)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && fileToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="text-red-600" size={20}/>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
                            </div>
                            <button
                                onClick={closeDeleteModal}
                                disabled={deleteInProgress}
                                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            >
                                <X size={20}/>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                <p className="text-sm text-red-800 mb-2">
                                    Are you sure you want to delete this file? This action cannot be undone.
                                </p>

                                <div className="bg-white border border-red-200 rounded p-2">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-lg">{getFileTypeIcon(fileToDelete.filename)}</span>
                                        <span className="text-sm font-medium text-gray-800">
                                            {fileToDelete.custom_name || fileToDelete.filename}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {fileToDelete.total_rows?.toLocaleString()} rows
                                        • {fileToDelete.columns?.length} columns
                                        {fileToDelete.sheet_name && (
                                            <span className="ml-1 text-blue-600">• {fileToDelete.sheet_name}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {isFileInUse(fileToDelete) && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                    <div className="flex items-center space-x-2">
                                        <AlertTriangle className="text-yellow-600" size={16}/>
                                        <p className="text-sm text-yellow-800">
                                            <strong>Warning:</strong> This file is currently selected for use in the
                                            process.
                                            Deleting it will remove it from your selection.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={closeDeleteModal}
                                disabled={deleteInProgress}
                                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteFile}
                                disabled={deleteInProgress}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                                {deleteInProgress ? (
                                    <>
                                        <div
                                            className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16}/>
                                        <span>Delete File</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File Upload Modal */}
            <FileUploadModal
                isOpen={showUploadModal}
                file={selectedFileForUpload}
                onUpload={handleUploadConfirm}
                onCancel={handleUploadCancel}
                existingFiles={files}
            />
        </>
    );
};

export default LeftSidebar;