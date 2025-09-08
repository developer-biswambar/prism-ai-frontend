import React, {useEffect, useState} from 'react';
import {
    Brain,
    ChevronLeft,
    ChevronRight,
    Database,
    Download,
    ExternalLink,
    FileText,
    Play,
    Save,
    Trash2,
    Upload,
    Wand2,
    X
} from 'lucide-react';
import MiscellaneousFileSelection from './MiscellaneousFileSelection.jsx';
import MiscellaneousPromptInput from './MiscellaneousPromptInput.jsx';
import MiscellaneousPreview from './MiscellaneousPreview.jsx';
import {miscellaneousService} from '../../services/miscellaneousService.js';

const MiscellaneousFlow = ({
    files,
    selectedFiles,
    flowData,
    onComplete,
    onCancel,
    onSendMessage
}) => {
    // State management
    const [currentStep, setCurrentStep] = useState('file_selection');
    const [selectedFilesForProcessing, setSelectedFilesForProcessing] = useState({});
    const [userPrompt, setUserPrompt] = useState('');
    const [processName, setProcessName] = useState('Data Analysis');
    const [outputFormat, setOutputFormat] = useState('json');
    
    // Processing state
    const [isProcessing, setIsProcessing] = useState(false);
    const [processResults, setProcessResults] = useState(null);
    const [processId, setProcessId] = useState(null);
    const [generatedSQL, setGeneratedSQL] = useState('');
    const [processingError, setProcessingError] = useState(null);
    
    // Track if prompt changed after results were generated
    const [originalPrompt, setOriginalPrompt] = useState('');
    const [hasPromptChanged, setHasPromptChanged] = useState(false);

    // Step definitions
    const steps = [
        {id: 'file_selection', title: 'Select Files', icon: FileText},
        {id: 'prompt_input', title: 'Natural Language Query', icon: Wand2},
        {id: 'preview_process', title: 'Process & View Results', icon: Database}
    ];

    // Helper functions
    const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);

    const getSelectedFilesArray = () => {
        return Object.keys(selectedFilesForProcessing)
            .sort()
            .map(key => selectedFilesForProcessing[key])
            .filter(file => file !== null && file !== undefined);
    };

    // Handle prompt changes to track if reprocessing is needed
    const handlePromptChange = (newPrompt) => {
        setUserPrompt(newPrompt);
        
        // If results exist and prompt changed from the original, mark as changed
        if (processResults && originalPrompt && newPrompt !== originalPrompt) {
            setHasPromptChanged(true);
        }
    };

    const canProceedToNext = () => {
        switch(currentStep) {
            case 'file_selection':
                return getSelectedFilesArray().length >= 1 && getSelectedFilesArray().length <= 5;
            case 'prompt_input':
                return userPrompt.trim().length > 10 && processName.trim().length > 0;
            case 'preview_process':
                return true;
            default:
                return false;
        }
    };

    // Navigation handlers
    const nextStep = () => {
        const currentIndex = getCurrentStepIndex();
        if (currentIndex < steps.length - 1) {
            const nextStepId = steps[currentIndex + 1].id;
            
            // If moving from prompt_input to preview_process and prompt has changed,
            // clear outdated results
            if (currentStep === 'prompt_input' && nextStepId === 'preview_process' && hasPromptChanged) {
                setProcessResults(null);
                setProcessId(null);
                setGeneratedSQL('');
                setProcessingError(null);
                setHasPromptChanged(false);
            }
            
            setCurrentStep(nextStepId);
        }
    };

    const prevStep = () => {
        const currentIndex = getCurrentStepIndex();
        if (currentIndex > 0) {
            setCurrentStep(steps[currentIndex - 1].id);
        }
    };

    // Process data with natural language
    const processData = async () => {
        if (!canProceedToNext()) return;

        setIsProcessing(true);
        setProcessingError(null);
        
        try {
            onSendMessage('system', '🔄 Starting data processing with natural language query...');
            
            const filesArray = getSelectedFilesArray();
            const fileReferences = filesArray.map((file, index) => ({
                file_id: file.file_id,
                role: `file_${index}`,
                label: file.filename || `File ${index + 1}`
            }));

            const response = await miscellaneousService.processData({
                process_type: "data_analysis",
                process_name: processName,
                user_prompt: userPrompt,
                files: fileReferences,
                output_format: outputFormat
            });

            if (response.success) {
                setProcessId(response.process_id);
                setGeneratedSQL(response.generated_sql);
                
                // Get the results
                const resultsResponse = await miscellaneousService.getResults(response.process_id);
                setProcessResults(resultsResponse);
                
                // Store the prompt that generated these results
                setOriginalPrompt(userPrompt);
                setHasPromptChanged(false);
                
                onSendMessage('system', `✅ Processing completed! Generated ${response.row_count} result rows using AI-generated SQL.`);
            } else {
                throw new Error(response.message || 'Processing failed');
            }
        } catch (error) {
            console.error('Processing failed:', error);
            setProcessingError(error.message);
            onSendMessage('system', `❌ Processing failed: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // Download results
    const downloadResults = async (format = 'csv') => {
        if (!processId) return;
        
        try {
            onSendMessage('system', `📁 Downloading results as ${format.toUpperCase()}...`);
            await miscellaneousService.downloadResults(processId, format);
            onSendMessage('system', `✅ Download started successfully!`);
        } catch (error) {
            console.error('Download failed:', error);
            onSendMessage('system', `❌ Download failed: ${error.message}`);
        }
    };

    // Reprocess with new prompt
    const reprocessWithNewPrompt = async () => {
        // Clear previous results
        setProcessResults(null);
        setProcessId(null);
        setGeneratedSQL('');
        setProcessingError(null);
        setHasPromptChanged(false);
        
        // Move to preview step and process
        setCurrentStep('preview_process');
        
        // Trigger processing after a brief delay to ensure UI updates
        setTimeout(() => {
            processData();
        }, 100);
    };

    // Process data directly from prompt input step
    const processDataFromPromptInput = async () => {
        // Clear any existing results first
        setProcessResults(null);
        setProcessId(null);
        setGeneratedSQL('');
        setProcessingError(null);
        setHasPromptChanged(false);
        
        // Move to preview step first
        setCurrentStep('preview_process');
        
        // Process the data
        await processData();
    };

    // Clear results and start over
    const clearResults = () => {
        setProcessResults(null);
        setProcessId(null);
        setGeneratedSQL('');
        setProcessingError(null);
        setOriginalPrompt('');
        setHasPromptChanged(false);
        setCurrentStep('file_selection');
    };

    // Handle ESC key and click outside
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 'file_selection':
                return (
                    <MiscellaneousFileSelection
                        files={files}
                        selectedFiles={selectedFilesForProcessing}
                        onSelectionChange={setSelectedFilesForProcessing}
                        maxFiles={5}
                    />
                );

            case 'prompt_input':
                return (
                    <MiscellaneousPromptInput
                        userPrompt={userPrompt}
                        onPromptChange={handlePromptChange}
                        processName={processName}
                        onProcessNameChange={setProcessName}
                        outputFormat={outputFormat}
                        onOutputFormatChange={setOutputFormat}
                        selectedFiles={getSelectedFilesArray()}
                        hasExistingResults={!!processResults}
                        hasPromptChanged={hasPromptChanged}
                        onReprocess={reprocessWithNewPrompt}
                        onProcessData={processDataFromPromptInput}
                        isProcessing={isProcessing}
                    />
                );

            case 'preview_process':
                return (
                    <MiscellaneousPreview
                        userPrompt={userPrompt}
                        processName={processName}
                        selectedFiles={getSelectedFilesArray()}
                        isProcessing={isProcessing}
                        processResults={processResults}
                        generatedSQL={generatedSQL}
                        processingError={processingError}
                        processId={processId}
                        onProcess={processData}
                        onDownload={downloadResults}
                        onClear={clearResults}
                    />
                );

            default:
                return <div>Unknown step</div>;
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleOverlayClick}
        >
            <div className="bg-white border border-gray-300 rounded-lg shadow-lg max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto w-full max-h-[90vh] xl:max-h-[95vh] overflow-hidden flex flex-col relative">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Miscellaneous Data Processing</h1>
                            <p className="text-purple-100 mt-1">
                                Process multiple files using natural language queries with AI-powered engine
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Brain className="text-white" size={32} />
                            <button
                                onClick={onCancel}
                                className="text-white hover:text-gray-200 p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                                title="Close"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="bg-gray-50 px-6 py-4">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                            const isCurrent = step.id === currentStep;
                            const isCompleted = getCurrentStepIndex() > index;
                            const IconComponent = step.icon;

                            return (
                                <div key={step.id} className="flex items-center">
                                    <div className={`flex items-center space-x-2 ${
                                        isCurrent ? 'text-blue-600' : 
                                        isCompleted ? 'text-green-600' : 'text-gray-400'
                                    }`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            isCurrent ? 'bg-blue-100' :
                                            isCompleted ? 'bg-green-100' : 'bg-gray-100'
                                        }`}>
                                            <IconComponent size={16} />
                                        </div>
                                        <span className="text-sm font-medium">{step.title}</span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`ml-4 w-12 h-0.5 ${
                                            isCompleted ? 'bg-green-300' : 'bg-gray-200'
                                        }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {renderStepContent()}
                </div>
                
                {/* Floating Process Data Button for Natural Language Query step */}
                {currentStep === 'prompt_input' && (
                    <div className="absolute bottom-20 right-6 z-30">
                        <button
                            onClick={processDataFromPromptInput}
                            disabled={!canProceedToNext() || isProcessing}
                            className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                            title="Process your data with AI"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <Brain size={20} className="text-white" />
                                    <span>Process Data</span>
                                    <Play size={16} className="text-white" />
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Footer Navigation */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={onCancel}
                            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            <span>Cancel</span>
                        </button>
                        
                        {processResults && (
                            <div className="text-sm text-green-600 font-medium">
                                ✅ Processed {processResults.data?.length || 0} records
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-3">
                        {getCurrentStepIndex() > 0 && (
                            <button
                                onClick={prevStep}
                                className="flex items-center space-x-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                                <ChevronLeft size={16} />
                                <span>Previous</span>
                            </button>
                        )}

                        {currentStep === 'preview_process' ? (
                            <div className="flex items-center space-x-2">
                                {processResults && (
                                    <>
                                        <button
                                            onClick={() => downloadResults('csv')}
                                            className="flex items-center space-x-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                        >
                                            <Download size={16} />
                                            <span>CSV</span>
                                        </button>
                                        
                                        <button
                                            onClick={() => downloadResults('excel')}
                                            className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                        >
                                            <Download size={16} />
                                            <span>Excel</span>
                                        </button>

                                        <button
                                            onClick={() => window.open(`/viewer/${processId}`, `viewer_${processId}`, 'toolbar=yes,scrollbars=yes,resizable=yes,width=1400,height=900,menubar=yes,location=yes,directories=no,status=yes')}
                                            className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            <ExternalLink size={16} />
                                            <span>Open in Data Viewer</span>
                                        </button>

                                        <button
                                            onClick={clearResults}
                                            className="flex items-center space-x-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                        >
                                            <Trash2 size={16} />
                                            <span>Clear</span>
                                        </button>
                                    </>
                                )}

                                {!processResults && (
                                    <button
                                        onClick={processData}
                                        disabled={!canProceedToNext() || isProcessing}
                                        className="flex items-center space-x-1 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Play size={16} />
                                                <span>Process Data</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        ) : currentStep !== 'prompt_input' ? (
                            <button
                                onClick={nextStep}
                                disabled={!canProceedToNext()}
                                className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <span>Next</span>
                                <ChevronRight size={16} />
                            </button>
                        ) : (
                            // For prompt_input step, show a subtle next button as alternative
                            <button
                                onClick={nextStep}
                                disabled={!canProceedToNext()}
                                className="flex items-center space-x-1 px-4 py-2 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                            >
                                <span>Skip to Preview</span>
                                <ChevronRight size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MiscellaneousFlow;