import React from 'react';
import {
    AlertCircle,
    Check,
    File,
    FileSpreadsheet,
    FileText,
    X
} from 'lucide-react';

const MiscellaneousFileSelection = ({
    files,
    selectedFiles,
    onSelectionChange,
    maxFiles = 5
}) => {
    
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

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-800">Select Files for Processing</h3>
                <p className="text-sm text-gray-600">
                    Choose 1 to {maxFiles} files for your data processing operation. The AI will analyze these files and generate appropriate SQL queries.
                </p>
            </div>

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
                        {Object.entries(selectedFiles).map(([key, file]) => (
                            <div key={key} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    {getFileIcon(file.filename)}
                                    <span className="text-sm text-green-700">
                                        <strong>{key}</strong>: {file.filename}
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
                <h4 className="text-md font-medium text-gray-700">Available Files:</h4>
                
                {files.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <FileText size={48} className="mx-auto mb-4 text-gray-400"/>
                        <p className="text-gray-600 mb-2">No files available</p>
                        <p className="text-sm text-gray-500">
                            Upload some files first to use in data processing
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {files.map((file) => {
                            const isSelected = isFileSelected(file);
                            const canSelect = selectedCount < maxFiles || isSelected;
                            
                            return (
                                <div
                                    key={file.file_id}
                                    className={`
                                        relative p-4 rounded-lg border-2 cursor-pointer transition-all
                                        ${isSelected 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : canSelect 
                                                ? 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                                                : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                                        }
                                    `}
                                    onClick={() => canSelect && handleFileToggle(file)}
                                >
                                    {/* Selection indicator */}
                                    <div className="absolute top-2 right-2">
                                        {isSelected ? (
                                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                <Check className="text-white" size={14} />
                                            </div>
                                        ) : canSelect ? (
                                            <div className="w-6 h-6 border-2 border-gray-300 rounded-full bg-white"></div>
                                        ) : (
                                            <div className="w-6 h-6 border-2 border-gray-300 rounded-full bg-gray-200">
                                                <X className="text-gray-400" size={14} />
                                            </div>
                                        )}
                                    </div>

                                    {/* File info */}
                                    <div className="pr-8">
                                        <div className="flex items-center space-x-2 mb-2">
                                            {getFileIcon(file.filename)}
                                            <span className={`text-sm font-medium ${
                                                isSelected ? 'text-blue-800' : 
                                                canSelect ? 'text-gray-800' : 'text-gray-500'
                                            }`}>
                                                {file.filename}
                                            </span>
                                        </div>
                                        
                                        <div className={`text-xs space-y-1 ${
                                            isSelected ? 'text-blue-600' : 
                                            canSelect ? 'text-gray-600' : 'text-gray-400'
                                        }`}>
                                            <div>Rows: {(file.totalRows || file.total_rows || 0).toLocaleString()}</div>
                                            <div>Columns: {file.columns?.length || 0}</div>
                                            <div className="truncate">
                                                Size: {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : 'Unknown'}
                                            </div>
                                        </div>

                                        {/* Column preview */}
                                        <div className="mt-2">
                                            <div className={`text-xs ${
                                                isSelected ? 'text-blue-600' : 
                                                canSelect ? 'text-gray-500' : 'text-gray-400'
                                            }`}>
                                                Columns: {file.columns ? file.columns.slice(0, 3).join(', ') : 'None'}
                                                {file.columns && file.columns.length > 3 && `, +${file.columns.length - 3} more`}
                                            </div>
                                        </div>
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
                            <li>Files will be referenced as file_0, file_1, etc. in your natural language queries</li>
                            <li>The AI can join, merge, compare, or analyze data across all selected files</li>
                            <li>Choose files with common columns for data matching operations</li>
                            <li>All file formats (CSV, Excel, JSON) are supported</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MiscellaneousFileSelection;