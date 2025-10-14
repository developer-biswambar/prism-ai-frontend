/**
 * COBOL File Upload Component
 * Handles COBOL file (.cbl, .cob, .cobol, .txt) upload with preview
 */

import React, { useRef, useState } from 'react';
import { FileCode, Upload, X, Eye, EyeOff } from 'lucide-react';

const CobolFileUpload = ({ file, onFileSelect, onFileRemove }) => {
    const fileInputRef = useRef(null);
    const [showPreview, setShowPreview] = useState(false);
    const [fileContent, setFileContent] = useState('');

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file extension
            const validExtensions = ['.cbl', '.cob', '.cobol', '.txt'];
            const fileName = selectedFile.name.toLowerCase();
            const isValid = validExtensions.some(ext => fileName.endsWith(ext));

            if (!isValid) {
                alert('Invalid file type. Please upload a COBOL file (.cbl, .cob, .cobol, or .txt)');
                return;
            }

            // Read file content for preview
            const content = await readFileContent(selectedFile);
            setFileContent(content);
            onFileSelect(selectedFile);
        }
    };

    const readFileContent = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => resolve('Error reading file');
            reader.readAsText(file);
        });
    };

    const handleRemove = () => {
        setFileContent('');
        setShowPreview(false);
        onFileRemove();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const togglePreview = () => {
        setShowPreview(!showPreview);
    };

    if (file) {
        return (
            <div className="space-y-4">
                {/* File info card */}
                <div className="bg-white border-2 border-green-300 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <FileCode className="text-green-600" size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">{file.name}</h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                                    <span>•</span>
                                    <span>{file.type || 'COBOL file'}</span>
                                    <span>•</span>
                                    <span>{fileContent.split('\n').length} lines</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleRemove}
                            className="text-red-600 hover:text-red-700 transition-colors"
                            title="Remove file"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Preview toggle */}
                    <button
                        onClick={togglePreview}
                        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                        <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                    </button>
                </div>

                {/* Code preview */}
                {showPreview && (
                    <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                        <pre className="text-xs text-green-400 font-mono">
                            {fileContent}
                        </pre>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".cbl,.cob,.cobol,.txt"
                onChange={handleFileChange}
                className="hidden"
            />

            <div className="flex flex-col items-center space-y-4">
                {/* Icon */}
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload className="text-blue-600" size={32} />
                </div>

                {/* Text */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Upload COBOL File
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                        Click to browse or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                        Supported formats: .cbl, .cob, .cobol, .txt
                    </p>
                </div>

                {/* Button */}
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                    Choose File
                </button>
            </div>
        </div>
    );
};

export default CobolFileUpload;
