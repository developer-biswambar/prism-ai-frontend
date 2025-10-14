/**
 * COBOL Transformation Flow Component
 * Independent workflow for COBOL-to-SQL transformation
 */

import React, { useState } from 'react';
import { ArrowLeft, FileCode, Database, Sparkles, Download, Loader, CheckCircle } from 'lucide-react';
import AppHeader from '../core/AppHeader.jsx';
import CobolFileUpload from './CobolFileUpload.jsx';
import CobolExplanationDisplay from './CobolExplanationDisplay.jsx';
import CobolResultsDisplay from './CobolResultsDisplay.jsx';
import { API_ENDPOINTS } from '../../config/environment.js';

const STEPS = {
    UPLOAD_COBOL: 1,
    UPLOAD_DATA: 2,
    PROCESSING: 3,
    RESULTS: 4
};

const CobolTransformationFlow = ({ onBackToGallery }) => {
    // State management
    const [currentStep, setCurrentStep] = useState(STEPS.UPLOAD_COBOL);
    const [cobolFile, setCobolFile] = useState(null);
    const [dataFiles, setDataFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStage, setProcessingStage] = useState('');
    const [transformResults, setTransformResults] = useState(null);
    const [error, setError] = useState(null);

    // Handle COBOL file upload
    const handleCobolFileSelect = (file) => {
        setCobolFile(file);
        setError(null);
    };

    const handleCobolFileRemove = () => {
        setCobolFile(null);
    };

    const handleContinueToDataUpload = () => {
        if (!cobolFile) {
            setError('Please upload a COBOL file first');
            return;
        }
        setCurrentStep(STEPS.UPLOAD_DATA);
    };

    // Handle data files upload
    const handleDataFilesSelect = (files) => {
        if (files.length > 5) {
            setError('Maximum 5 data files allowed');
            return;
        }
        setDataFiles(files);
        setError(null);
    };

    const handleDataFileRemove = (index) => {
        setDataFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleBackToCobolUpload = () => {
        setCurrentStep(STEPS.UPLOAD_COBOL);
        setError(null);
    };

    // Transform COBOL
    const handleTransform = async () => {
        if (!cobolFile) {
            setError('No COBOL file uploaded');
            return;
        }

        if (dataFiles.length === 0) {
            setError('Please upload at least one data file');
            return;
        }

        try {
            setIsProcessing(true);
            setCurrentStep(STEPS.PROCESSING);
            setError(null);

            // Step 1: Read COBOL file
            setProcessingStage('Reading COBOL file...');
            const cobolContent = await readFileAsText(cobolFile);

            // Step 2: Upload data files
            setProcessingStage('Uploading data files...');
            const uploadedDataFiles = [];
            for (let i = 0; i < dataFiles.length; i++) {
                const dataFile = dataFiles[i];
                setProcessingStage(`Uploading data file ${i + 1} of ${dataFiles.length}...`);

                const formData = new FormData();
                formData.append('file', dataFile);

                const uploadResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/api/files/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!uploadResponse.ok) {
                    throw new Error(`Failed to upload data file: ${dataFile.name}`);
                }

                const uploadResult = await uploadResponse.json();
                uploadedDataFiles.push({
                    file_path: uploadResult.file_path,
                    file_type: getFileType(dataFile.name)
                });
            }

            // Step 3: Transform COBOL
            setProcessingStage('Analyzing COBOL code with AI...');
            const transformRequest = {
                cobol_code: cobolContent,
                input_files: uploadedDataFiles,
                copy_books: [],
                output_format: 'json',
                execution_mode: 'direct',
                include_explanation: true
            };

            const transformResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/api/cobol/transform`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transformRequest)
            });

            if (!transformResponse.ok) {
                const errorData = await transformResponse.json();
                throw new Error(errorData.message || 'COBOL transformation failed');
            }

            const transformResult = await transformResponse.json();

            setTransformResults(transformResult);
            setCurrentStep(STEPS.RESULTS);

        } catch (err) {
            console.error('Error transforming COBOL:', err);
            setError(err.message || 'Failed to transform COBOL code');
            setCurrentStep(STEPS.UPLOAD_DATA);
        } finally {
            setIsProcessing(false);
            setProcessingStage('');
        }
    };

    // Helper: Read file as text
    const readFileAsText = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    };

    // Helper: Get file type from extension
    const getFileType = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        if (ext === 'csv') return 'csv';
        if (ext === 'xlsx' || ext === 'xls') return 'excel';
        return 'csv'; // default
    };

    // Reset and start over
    const handleStartOver = () => {
        setCurrentStep(STEPS.UPLOAD_COBOL);
        setCobolFile(null);
        setDataFiles([]);
        setTransformResults(null);
        setError(null);
    };

    // Render step indicator
    const renderStepIndicator = () => {
        const steps = [
            { number: 1, label: 'Upload COBOL', icon: FileCode },
            { number: 2, label: 'Upload Data', icon: Database },
            { number: 3, label: 'Processing', icon: Sparkles },
            { number: 4, label: 'Results', icon: CheckCircle }
        ];

        return (
            <div className="flex items-center justify-center space-x-4 mb-8">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.number;
                    const isCompleted = currentStep > step.number;
                    const isUpcoming = currentStep < step.number;

                    return (
                        <React.Fragment key={step.number}>
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-lg scale-110'
                                            : isCompleted
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-400'
                                    }`}
                                >
                                    <Icon size={20} />
                                </div>
                                <span
                                    className={`text-xs mt-2 font-medium ${
                                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                                    }`}
                                >
                                    {step.label}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`h-0.5 w-16 transition-colors duration-200 ${
                                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                    }`}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    // Render current step content
    const renderStepContent = () => {
        switch (currentStep) {
            case STEPS.UPLOAD_COBOL:
                return (
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload COBOL File</h2>
                            <p className="text-gray-600">
                                Upload your COBOL program (.cbl, .cob, .cobol, or .txt)
                            </p>
                        </div>

                        <CobolFileUpload
                            file={cobolFile}
                            onFileSelect={handleCobolFileSelect}
                            onFileRemove={handleCobolFileRemove}
                        />

                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleContinueToDataUpload}
                                disabled={!cobolFile}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                Continue to Data Upload →
                            </button>
                        </div>
                    </div>
                );

            case STEPS.UPLOAD_DATA:
                return (
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Data Files</h2>
                            <p className="text-gray-600">
                                Upload CSV or Excel files (1-5 files) that the COBOL program will process
                            </p>
                        </div>

                        {/* COBOL file summary */}
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <FileCode className="text-green-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{cobolFile?.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {(cobolFile?.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleBackToCobolUpload}
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                Change
                            </button>
                        </div>

                        {/* Data files upload */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Data Files ({dataFiles.length}/5)
                            </label>
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                multiple
                                onChange={(e) => handleDataFilesSelect(Array.from(e.target.files))}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Supported formats: CSV, Excel (XLSX, XLS)
                            </p>
                        </div>

                        {/* Data files list */}
                        {dataFiles.length > 0 && (
                            <div className="space-y-2 mb-6">
                                {dataFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Database className="text-gray-600" size={18} />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDataFileRemove(index)}
                                            className="text-sm text-red-600 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex justify-between">
                            <button
                                onClick={handleBackToCobolUpload}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleTransform}
                                disabled={dataFiles.length === 0}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                Transform COBOL →
                            </button>
                        </div>
                    </div>
                );

            case STEPS.PROCESSING:
                return (
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="mb-8">
                            <Loader className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing COBOL Code</h2>
                            <p className="text-gray-600">{processingStage}</p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <p className="text-sm text-blue-800 mb-4">
                                Our AI is analyzing your COBOL program and generating equivalent SQL...
                            </p>
                            <div className="space-y-2 text-left text-sm text-gray-700">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle size={16} className="text-green-600" />
                                    <span>Parsing COBOL structure</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <CheckCircle size={16} className="text-green-600" />
                                    <span>Analyzing business logic</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Loader size={16} className="animate-spin text-blue-600" />
                                    <span>Generating SQL queries</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                                    <span className="text-gray-400">Executing on data</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case STEPS.RESULTS:
                return (
                    <div className="max-w-7xl mx-auto">
                        <CobolResultsDisplay
                            results={transformResults}
                            cobolFile={cobolFile}
                            dataFiles={dataFiles}
                            onStartOver={handleStartOver}
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <AppHeader
                title="COBOL-to-SQL Transformation"
                subtitle="Transform legacy COBOL programs into modern SQL queries"
                showBackButton={true}
                onBackClick={onBackToGallery}
                showCloseButton={false}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-8">
                {/* Step Indicator */}
                {renderStepIndicator()}

                {/* Step Content */}
                {renderStepContent()}
            </div>
        </div>
    );
};

export default CobolTransformationFlow;
