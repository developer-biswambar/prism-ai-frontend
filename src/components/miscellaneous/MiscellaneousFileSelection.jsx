import React, { useState, useRef } from 'react';
import {
    AlertCircle,
    Check,
    File,
    FileSpreadsheet,
    FileText,
    X,
    Upload,
    HelpCircle,
    RefreshCw,
    Search
} from 'lucide-react';
import { apiService } from '../../services/defaultApi.js';
import FileUploadModal from '../../fileManagement/FileUploadModal.jsx';

const MiscellaneousFileSelection = ({
    files,
    selectedFiles,
    onSelectionChange,
    onFilesRefresh, // Callback to refresh file list after upload
    maxFiles = 5
}) => {
    
    // Drag & drop state
    const [isDragOver, setIsDragOver] = useState(false);
    const [dragCounter, setDragCounter] = useState(0);
    
    // File upload state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [currentUploadFile, setCurrentUploadFile] = useState(null);
    const [uploadQueue, setUploadQueue] = useState([]);
    const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    
    const fileInputRef = useRef(null);
    
    // Drag & drop handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter(prev => prev + 1);
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragOver(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter(prev => {
            const newCount = prev - 1;
            if (newCount <= 0) {
                setIsDragOver(false);
            }
            return newCount;
        });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        setDragCounter(0);
        
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
            handleFilesSelected(droppedFiles);
        }
    };

    // File selection handlers (from FileLibraryPage)
    const handleFileInputChange = (event) => {
        const selectedFiles = Array.from(event.target.files);
        if (selectedFiles.length === 0) return;
        
        // Clear the input
        event.target.value = '';
        
        handleFilesSelected(selectedFiles);
    };

    const handleFilesSelected = (selectedFiles) => {
        setUploadError('');
        
        // Check file count limit
        if (selectedFiles.length > 5) {
            setUploadError('You can upload a maximum of 5 files at once.');
            return;
        }

        // Validate file types
        const invalidFiles = selectedFiles.filter(file =>
            !apiService.isExcelFile(file) && !file.name.toLowerCase().endsWith('.csv')
        );

        if (invalidFiles.length > 0) {
            setUploadError(`Invalid file types: ${invalidFiles.map(f => f.name).join(', ')}. Only CSV and Excel files are supported.`);
            return;
        }

        // If single file, show modal immediately
        if (selectedFiles.length === 1) {
            setCurrentUploadFile(selectedFiles[0]);
            setShowUploadModal(true);
        } else {
            // Multiple files - set up queue
            setUploadQueue(selectedFiles);
            setCurrentUploadIndex(0);
            setCurrentUploadFile(selectedFiles[0]);
            setShowUploadModal(true);
        }
    };

    const handleUploadConfirm = async (uploadConfig) => {
        setShowUploadModal(false);
        setIsUploading(true);
        setUploadError('');

        try {
            const response = await apiService.uploadFileWithOptions(
                uploadConfig.file,
                uploadConfig.sheetName,
                uploadConfig.customName
            );

            if (response.success) {
                setUploadSuccess(response.data);
                setTimeout(() => setUploadSuccess(null), 4000);

                // If there are more files in queue, process next
                if (uploadQueue.length > 1 && currentUploadIndex < uploadQueue.length - 1) {
                    const nextIndex = currentUploadIndex + 1;
                    setCurrentUploadIndex(nextIndex);
                    setCurrentUploadFile(uploadQueue[nextIndex]);

                    // Small delay before showing next modal
                    setTimeout(() => {
                        setShowUploadModal(true);
                    }, 500);
                } else {
                    // All files processed, clear queue
                    setUploadQueue([]);
                    setCurrentUploadIndex(0);
                    setCurrentUploadFile(null);
                }

                // Refresh file list
                if (onFilesRefresh) {
                    onFilesRefresh();
                }
            } else {
                setUploadError(response.message || 'Upload failed');
                // Stop processing queue on error
                setUploadQueue([]);
                setCurrentUploadIndex(0);
                setCurrentUploadFile(null);
            }
        } catch (err) {
            setUploadError(err.message || 'Upload failed');
            // Stop processing queue on error
            setUploadQueue([]);
            setCurrentUploadIndex(0);
            setCurrentUploadFile(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleUploadCancel = () => {
        setShowUploadModal(false);

        // If there are more files in queue, ask user what to do
        if (uploadQueue.length > 1 && currentUploadIndex < uploadQueue.length - 1) {
            const remainingFiles = uploadQueue.length - currentUploadIndex - 1;
            const continueWithNext = window.confirm(
                `You have ${remainingFiles} more file(s) to upload. Do you want to continue with the next file?`
            );

            if (continueWithNext) {
                const nextIndex = currentUploadIndex + 1;
                setCurrentUploadIndex(nextIndex);
                setCurrentUploadFile(uploadQueue[nextIndex]);
                setShowUploadModal(true);
            } else {
                // Cancel entire queue
                setUploadQueue([]);
                setCurrentUploadIndex(0);
                setCurrentUploadFile(null);
            }
        } else {
            // Single file or last file, just clear
            setUploadQueue([]);
            setCurrentUploadIndex(0);
            setCurrentUploadFile(null);
        }
    };

    const handleFileToggle = (file) => {
        const currentSelected = Object.keys(selectedFiles).length;
        const isCurrentlySelected = isFileSelected(file);
        
        if (isCurrentlySelected) {
            // Remove file
            const newSelection = { ...selectedFiles };
            const fileKey = Object.keys(newSelection).find(key => newSelection[key]?.file_id === file.file_id);
            if (fileKey) {
                delete newSelection[fileKey];
            }
            
            // Reorder remaining files
            const remainingFiles = Object.values(newSelection).filter(f => f);
            const reorderedSelection = {};
            remainingFiles.forEach((f, index) => {
                reorderedSelection[`file_${index}`] = f;
            });
            
            onSelectionChange(reorderedSelection);
        } else {
            // Add file if under limit
            if (currentSelected < maxFiles) {
                const newSelection = {
                    ...selectedFiles,
                    [`file_${currentSelected}`]: file
                };
                onSelectionChange(newSelection);
            }
        }
    };

    const isFileSelected = (file) => {
        return Object.values(selectedFiles).some(selectedFile => selectedFile?.file_id === file.file_id);
    };

    const handleRefresh = async () => {
        if (isRefreshing || !onFilesRefresh) return;
        
        setIsRefreshing(true);
        try {
            await onFilesRefresh();
        } catch (error) {
            console.error('Error refreshing files:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const getFileIcon = (filename) => {
        const ext = filename.toLowerCase().split('.').pop();
        switch(ext) {
            case 'csv':
                return <FileSpreadsheet className="text-green-500" size={20} />;
            case 'xlsx':
            case 'xls':
                return <FileSpreadsheet className="text-blue-500" size={20} />;
            case 'json':
                return <FileText className="text-orange-500" size={20} />;
            default:
                return <File className="text-gray-500" size={20} />;
        }
    };

    const selectedCount = Object.keys(selectedFiles).length;

    // Sort files by date with proper error handling
    const sortedFiles = React.useMemo(() => {
        if (!files || !Array.isArray(files) || files.length === 0) {
            return [];
        }
        
        const getFileDate = (file) => {
            const dateStr = file.last_modified || 
                           file.upload_time || 
                           file.uploadTime || 
                           file._storage_metadata?.created_at;
            
            if (!dateStr) return new Date(0); // Fallback to epoch
            
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? new Date(0) : date;
        };
        
        // Create a new array and sort by date (newest first)
        const sorted = [...files].sort((a, b) => {
            const dateA = getFileDate(a);
            const dateB = getFileDate(b);
            return dateB.getTime() - dateA.getTime();
        });
        
        
        return sorted;
    }, [files]);

    // Format date for display with detailed relative times
    const formatDate = (file) => {
        const date = file.last_modified || 
                    file.upload_time || 
                    file.uploadTime || 
                    file._storage_metadata?.created_at;
        if (!date) return 'Unknown';
        
        // Parse UTC timestamp and convert to local time for comparison
        const dateObj = new Date(date + (date.includes('Z') ? '' : 'Z')); // Ensure UTC parsing
        const now = new Date();
        const diffTime = now - dateObj;
        
        // Calculate different time units
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        
        // Return detailed relative time for recent uploads
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
        if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
        
        // For very old files, show actual date
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Filter sorted files based on search term
    const filteredFiles = sortedFiles.filter(file => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        const fileName = (file.custom_name || file.filename || '').toLowerCase();
        
        return fileName.includes(searchLower);
    });

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <span>Select Files for Processing</span>
                    <div className="group relative">
                        <HelpCircle size={16} className="text-gray-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                            Choose 1-{maxFiles} files • Drag & drop or click to upload new files
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                    </div>
                </h3>
                <p className="text-sm text-gray-600">
                    Choose 1 to {maxFiles} files for your data processing operation. The AI will analyze these files and generate appropriate SQL queries.
                </p>
            </div>

            {/* Compact Drag & Drop Upload Zone */}
            <div
                className={`relative border-2 border-dashed rounded-lg transition-all duration-200 ${
                    isDragOver 
                        ? 'border-blue-500 bg-blue-50' 
                        : isUploading 
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <div className="p-3 text-center">
                    <div className={`transition-all duration-200 ${isDragOver ? 'scale-105' : ''}`}>
                        {isUploading ? (
                            <div className="animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        ) : (
                            <Upload size={24} className={`mx-auto mb-2 ${
                                isDragOver ? 'text-blue-500' : 'text-gray-400'
                            }`} />
                        )}
                        <p className="text-sm text-gray-600 mb-2">
                            {isUploading 
                                ? 'Uploading...'
                                : isDragOver 
                                    ? 'Drop files here'
                                    : 'Drag & drop files or'
                            }
                        </p>
                        {!isUploading && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                            >
                                Choose Files
                            </button>
                        )}
                    </div>
                    
                    <div className="flex items-center justify-center space-x-3 text-xs text-gray-500 mt-2">
                        <span>CSV, Excel</span>
                        <span>•</span>
                        <span>Max 5 files</span>
                    </div>
                    
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileInputChange}
                        className="hidden"
                    />
                </div>
            </div>

            {/* Upload Error */}
            {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                        <AlertCircle className="text-red-600 mt-0.5" size={16} />
                        <div>
                            <span className="text-sm font-medium text-red-800">Upload Error</span>
                            <p className="text-sm text-red-700 mt-1">{uploadError}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Success */}
            {uploadSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                        <Check className="text-green-600 mt-0.5" size={16} />
                        <div>
                            <span className="text-sm font-medium text-green-800">File Uploaded Successfully</span>
                            <p className="text-sm text-green-700 mt-1">
                                {uploadSuccess.custom_name || uploadSuccess.filename} • {uploadSuccess.totalRows} rows
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Selection Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-800">
                        <strong>{selectedCount}</strong> of {maxFiles} files selected
                    </div>
                    <div className="text-xs text-blue-600">
                        {selectedCount === 0 && "Select at least 1 file to proceed"}
                        {selectedCount > 0 && selectedCount < maxFiles && "You can select more files"}
                        {selectedCount === maxFiles && "Maximum files selected"}
                    </div>
                </div>
                
                {selectedCount > 0 && (
                    <div className="mt-2 text-xs text-blue-600">
                        Files will be referenced as: {Object.keys(selectedFiles).join(', ')} in your queries
                    </div>
                )}
            </div>

            {/* Selected Files Summary */}
            {selectedCount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-800 mb-2">Selected Files:</h4>
                    <div className="space-y-2">
                        {Object.entries(selectedFiles).map(([key, file], index) => (
                            <div key={key} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    {getFileIcon(file.filename)}
                                    <span className="text-sm text-green-700">
                                        <strong>file_{index + 1}</strong>: {file.custom_name || file.filename}
                                    </span>
                                </div>
                                <div className="text-xs text-green-600">
                                    {file.totalRows || file.total_rows || 0} rows
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* File List */}
            <div className="space-y-3">
                {/* Search Input */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search files by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <h4 className="text-md font-medium text-gray-700">
                        Available Files:
                        {searchTerm && (
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                ({filteredFiles.length} of {files.length} shown)
                            </span>
                        )}
                    </h4>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors shadow-sm ${
                            isRefreshing 
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                        title={isRefreshing ? "Refreshing..." : "Refresh file list"}
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                </div>
                
                {files.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <FileText size={48} className="mx-auto mb-4 text-gray-400"/>
                        <p className="text-gray-600 mb-2">No files available</p>
                        <p className="text-sm text-gray-500">
                            Upload some files first to use in data processing
                        </p>
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="text-center py-8 bg-yellow-50 rounded-lg border-2 border-dashed border-yellow-300">
                        <Search size={48} className="mx-auto mb-4 text-yellow-400"/>
                        <p className="text-yellow-600 mb-2">No files match your search</p>
                        <p className="text-sm text-yellow-500">
                            Try adjusting your search term or <button 
                                onClick={() => setSearchTerm('')}
                                className="text-blue-500 hover:text-blue-700 underline"
                            >clear the search</button>
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {filteredFiles.map((file, index) => {
                            const isSelected = isFileSelected(file);
                            const canSelect = selectedCount < maxFiles || isSelected;
                            
                            return (
                                <div
                                    key={`${file.file_id}_${index}`}
                                    className={`
                                        relative p-3 rounded-lg border cursor-pointer transition-all min-h-[120px]
                                        ${isSelected 
                                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                                            : canSelect 
                                                ? 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 hover:shadow-sm'
                                                : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                                        }
                                    `}
                                    onClick={() => canSelect && handleFileToggle(file)}
                                    title={file.custom_name || file.filename}
                                >
                                    {/* Selection indicator */}
                                    <div className="absolute top-2 right-2">
                                        {isSelected ? (
                                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                <Check className="text-white" size={12} />
                                            </div>
                                        ) : canSelect ? (
                                            <div className="w-5 h-5 border border-gray-300 rounded-full bg-white"></div>
                                        ) : (
                                            <div className="w-5 h-5 border border-gray-300 rounded-full bg-gray-200">
                                                <X className="text-gray-400" size={10} />
                                            </div>
                                        )}
                                    </div>

                                    {/* File info */}
                                    <div className="pr-8">
                                        {/* File icon and name */}
                                        <div className="flex items-start space-x-2 mb-2">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getFileIcon(file.filename)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-xs font-medium leading-tight break-words block ${
                                                    isSelected ? 'text-blue-800' : 
                                                    canSelect ? 'text-gray-800' : 'text-gray-500'
                                                }`}>
                                                    {file.custom_name || file.filename}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Stats */}
                                        <div className={`text-xs space-y-1 ${
                                            isSelected ? 'text-blue-600' : 
                                            canSelect ? 'text-gray-600' : 'text-gray-400'
                                        }`}>
                                            <div>{(file.totalRows || file.total_rows || 0).toLocaleString()} rows</div>
                                            <div>{file.columns?.length || 0} columns</div>
                                            <div className="truncate text-xs opacity-75">
                                                {formatDate(file)}
                                            </div>
                                        </div>

                                        {/* Column preview - condensed */}
                                        {file.columns && file.columns.length > 0 && (
                                            <div className="mt-2">
                                                <div className={`text-xs leading-tight opacity-75 ${
                                                    isSelected ? 'text-blue-600' : 
                                                    canSelect ? 'text-gray-500' : 'text-gray-400'
                                                }`}>
                                                    {file.columns.slice(0, 2).join(', ')}
                                                    {file.columns.length > 2 && `, +${file.columns.length - 2}`}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Help/Info Section */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                    <AlertCircle size={16} className="text-amber-600 mt-0.5"/>
                    <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">File Selection Tips:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Select related files that you want to analyze together</li>
                            <li>Files will be referenced as file_1, file_2, etc. in your natural language queries</li>
                            <li>The AI can join, merge, compare, or analyze data across all selected files</li>
                            <li>Choose files with common columns for data matching operations</li>
                            <li>All file formats (CSV, Excel, JSON) are supported</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* File Upload Modal */}
            {showUploadModal && currentUploadFile && (
                <FileUploadModal
                    isOpen={showUploadModal}
                    file={currentUploadFile}
                    onUpload={handleUploadConfirm}
                    onCancel={handleUploadCancel}
                    existingFiles={files}
                />
            )}
        </div>
    );
};

export default MiscellaneousFileSelection;