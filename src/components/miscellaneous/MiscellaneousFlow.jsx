import React, {useEffect, useState} from 'react';
import {
    Brain,
    ChevronLeft,
    ChevronRight,
    Database,
    Download,
    ExternalLink,
    FileText,
    HelpCircle,
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
    onSendMessage,
    onFilesRefresh // Callback to refresh file list
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
        console.log('🔄 MiscellaneousFlow handlePromptChange called with:', newPrompt);
        console.log('🔄 Current userPrompt before update:', userPrompt);
        
        setUserPrompt(newPrompt);
        
        console.log('✅ setUserPrompt called with:', newPrompt);
        
        // If results exist and prompt changed from the original, mark as changed
        if (processResults && originalPrompt && newPrompt !== originalPrompt) {
            setHasPromptChanged(true);
            console.log('🔄 Marked prompt as changed');
        }
    };

    const canProceedToNext = () => {
        switch(currentStep) {
            case 'file_selection':
                return getSelectedFilesArray().length >= 1 && getSelectedFilesArray().length <= 5;
            case 'prompt_input':
                return userPrompt && userPrompt.trim().length > 10 && processName && processName.trim().length > 0;
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
                        onFilesRefresh={onFilesRefresh}
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
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4 md:p-6"
            onClick={handleOverlayClick}
        >
            <div className="bg-white border border-gray-300 rounded-lg shadow-2xl w-full h-full max-w-[98vw] max-h-[98vh] lg:max-w-[95vw] lg:max-h-[95vh] xl:max-w-[92vw] xl:max-h-[92vh] overflow-hidden flex flex-col relative">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 lg:px-8 xl:px-10 py-4 lg:py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-3">
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-white">Miscellaneous Data Processing</h1>
                                <p className="text-purple-100 mt-1">
                                    Process multiple files using natural language queries with AI-powered engine
                                </p>
                            </div>
                            <div className="group relative">
                                <HelpCircle size={20} className="text-purple-200 cursor-help hover:text-white transition-colors" />
                                <div className="absolute top-full right-0 mt-2 w-80 p-4 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 text-gray-800">
                                    <h4 className="font-semibold text-gray-900 mb-2">How it works:</h4>
                                    <div className="text-sm space-y-2">
                                        <div className="flex items-start space-x-2">
                                            <span className="text-blue-600 font-medium">1.</span>
                                            <span>Select 1-5 CSV/Excel files to process</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="text-blue-600 font-medium">2.</span>
                                            <span>Write a natural language query describing what you want</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="text-blue-600 font-medium">3.</span>
                                            <span>AI converts your query to SQL and processes the data</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="text-blue-600 font-medium">4.</span>
                                            <span>Download results or view in the data viewer</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                <div className="bg-gray-50 px-6 lg:px-8 xl:px-10 py-4 lg:py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-between flex-1">
                            {steps.map((step, index) => {
                                const isCurrent = step.id === currentStep;
                                const isCompleted = getCurrentStepIndex() > index;
                                const IconComponent = step.icon;

                                const getStepTooltip = (stepId) => {
                                    switch(stepId) {
                                        case 'file_selection':
                                            return 'Select 1-5 CSV or Excel files to process. You can drag & drop files or upload new ones.';
                                        case 'prompt_input':
                                            return 'Write a natural language query describing what you want to do with your data. The AI will convert this to SQL.';
                                        case 'preview_process':
                                            return 'Review your configuration and process the data. You can then download results or view them in detail.';
                                        default:
                                            return '';
                                    }
                                };

                                return (
                                    <div key={step.id} className="flex items-center">
                                        <div className={`group relative flex items-center space-x-2 ${
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
                                            
                                            {/* Step tooltip */}
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 max-w-xs">
                                                {getStepTooltip(step.id)}
                                            </div>
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
                        
                        {/* Progress Steps Help */}
                        <div className="group relative ml-4">
                            <HelpCircle size={16} className="text-gray-400 cursor-help hover:text-gray-600" />
                            <div className="absolute top-full right-0 mt-2 w-72 p-3 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 text-gray-800">
                                <h4 className="font-semibold text-gray-900 mb-2">Progress Steps:</h4>
                                <div className="text-xs space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>Current step</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>Completed step</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        <span>Upcoming step</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-8 xl:p-10">
                    <div className="max-w-full mx-auto">
                        {renderStepContent()}
                    </div>
                </div>
                
                {/* Floating Process Data Button for Natural Language Query step */}
                {currentStep === 'prompt_input' && (
                    <div className="absolute bottom-20 lg:bottom-24 right-6 lg:right-8 xl:right-10 z-30">
                        <div className="group relative">
                            <button
                                onClick={processDataFromPromptInput}
                                disabled={!canProceedToNext() || isProcessing}
                                className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
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
                            {!isProcessing && (
                                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                    {!canProceedToNext() 
                                        ? 'Complete your query and process name first'
                                        : 'Process your data using AI-generated SQL'
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer Navigation */}
                <div className="bg-gray-50 px-6 lg:px-8 xl:px-10 py-4 lg:py-5 flex items-center justify-between border-t border-gray-200">
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
                            <div className="group relative">
                                <button
                                    onClick={prevStep}
                                    className="flex items-center space-x-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                >
                                    <ChevronLeft size={16} />
                                    <span>Previous</span>
                                </button>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                    Go back to the previous step
                                </div>
                            </div>
                        )}

                        {currentStep === 'preview_process' ? (
                            <div className="flex items-center space-x-2">
                                {processResults && (
                                    <>
                                        <div className="group relative">
                                            <button
                                                onClick={() => downloadResults('csv')}
                                                className="flex items-center space-x-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                            >
                                                <Download size={16} />
                                                <span>CSV</span>
                                            </button>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                                Download results as CSV file
                                            </div>
                                        </div>
                                        
                                        <div className="group relative">
                                            <button
                                                onClick={() => downloadResults('excel')}
                                                className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                                <Download size={16} />
                                                <span>Excel</span>
                                            </button>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                                Download results as Excel file
                                            </div>
                                        </div>

                                        <div className="group relative">
                                            <button
                                                onClick={() => window.open(`/viewer/${processId}`, `viewer_${processId}`, 'toolbar=yes,scrollbars=yes,resizable=yes,width=1400,height=900,menubar=yes,location=yes,directories=no,status=yes')}
                                                className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                <ExternalLink size={16} />
                                                <span>Open in Data Viewer</span>
                                            </button>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                                View results in interactive data viewer
                                            </div>
                                        </div>

                                        <div className="group relative">
                                            <button
                                                onClick={clearResults}
                                                className="flex items-center space-x-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                            >
                                                <Trash2 size={16} />
                                                <span>Clear</span>
                                            </button>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                                Clear results and start over
                                            </div>
                                        </div>
                                    </>
                                )}

                                {!processResults && (
                                    <div className="group relative">
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
                                        {!isProcessing && (
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                                {!canProceedToNext() 
                                                    ? 'Go back and complete the previous steps first'
                                                    : 'Start processing your data with AI'
                                                }
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : currentStep !== 'prompt_input' ? (
                            <div className="group relative">
                                <button
                                    onClick={nextStep}
                                    disabled={!canProceedToNext()}
                                    className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    <span>Next</span>
                                    <ChevronRight size={16} />
                                </button>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                    {!canProceedToNext() 
                                        ? 'Complete this step first to continue'
                                        : 'Proceed to the next step'
                                    }
                                </div>
                            </div>
                        ) : (
                            // For prompt_input step, show a subtle next button as alternative
                            <div className="group relative">
                                <button
                                    onClick={nextStep}
                                    disabled={!canProceedToNext()}
                                    className="flex items-center space-x-1 px-4 py-2 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                                >
                                    <span>Skip to Preview</span>
                                    <ChevronRight size={14} />
                                </button>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                    {!canProceedToNext() 
                                        ? 'Complete your query and process name first'
                                        : 'Skip to preview step without processing'
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MiscellaneousFlow;