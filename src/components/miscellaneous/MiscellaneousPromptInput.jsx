import React, {useEffect, useRef, useState} from 'react';
import {
    AlertCircle,
    ArrowRight,
    BookOpen,
    Brain,
    CheckCircle,
    CheckCircle2,
    Copy,
    Database,
    Lightbulb,
    Loader,
    Maximize2,
    MessageSquare,
    RefreshCw,
    Save,
    Sparkles,
    Target,
    TrendingUp,
    X,
    Zap,
    FileCode,
    Upload,
    Wand2
} from 'lucide-react';
import {API_ENDPOINTS} from '../../config/environment';
import PromptSaveLoad from './PromptSaveLoad';

const MiscellaneousPromptInput = ({
                                      userPrompt,
                                      onPromptChange,
                                      processName,
                                      onProcessNameChange,
                                      selectedFiles,
                                      hasExistingResults = false,
                                      hasPromptChanged = false,
                                      onReprocess,
                                      onProcessData,
                                      isProcessing = false
                                  }) => {

    const [showExamples, setShowExamples] = useState(false);
    const [savedPrompts, setSavedPrompts] = useState([]);
    const [showSavedPrompts, setShowSavedPrompts] = useState(false);
    const [loadingPrompts, setLoadingPrompts] = useState(false);
    const [showPromptManager, setShowPromptManager] = useState(false);

    // Prompt improvement state
    const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
    const [showImprovementModal, setShowImprovementModal] = useState(false);
    const [improvementData, setImprovementData] = useState(null);
    const [improvementError, setImprovementError] = useState('');

    // Expanded modal state
    const [showExpandedModal, setShowExpandedModal] = useState(false);
    const [expandedPrompt, setExpandedPrompt] = useState('');

    // COBOL generation state
    const [showCobolModal, setShowCobolModal] = useState(false);
    const [cobolFiles, setCobolFiles] = useState([]);
    const [isGeneratingFromCobol, setIsGeneratingFromCobol] = useState(false);
    const [cobolGenerationResult, setCobolGenerationResult] = useState(null);
    const [cobolGenerationError, setCobolGenerationError] = useState('');

    const textareaRef = useRef(null);
    const expandedTextareaRef = useRef(null);
    const cobolFileInputRef = useRef(null);
    const cobolResultsRef = useRef(null);

    const examplePrompts = [
        {
            category: "Data Reconciliation",
            examples: [
                "Compare file_1 and file_2 to find records missing from file_2",
                "Find mismatches between file_1 and file_2 based on transaction_id and amount",
                "Show records that exist in file_1 but not in file_2",
                "Reconcile customer data between file_1 and file_2 using email address"
            ]
        },
        {
            category: "Data Merging & Deduplication",
            examples: [
                "Merge all files and remove duplicates based on email address",
                "Combine file_1 and file_2 and keep only unique records",
                "Join file_1 with file_2 on customer_id and merge their data",
                "Merge files and show consolidated customer information"
            ]
        },
        {
            category: "Delta Analysis",
            examples: [
                "Show differences between January data (file_1) and February data (file_2)",
                "Compare sales between file_1 and file_2 and highlight changes",
                "Find products with changed prices between file_1 and file_2",
                "Calculate month-over-month growth from file_1 to file_2"
            ]
        },
        {
            category: "Analytics & Calculations",
            examples: [
                "Calculate running totals by customer ordered by date",
                "Find customers in the top 10% by spending",
                "Show monthly sales trends and identify outliers",
                "Calculate average, sum, and count by product category"
            ]
        },
        {
            category: "Filtering & Segmentation",
            examples: [
                "Show customers who spent more than $1000 in total",
                "Filter transactions from the last 30 days",
                "Find all records where status is 'pending' or 'failed'",
                "Show products with zero inventory"
            ]
        }
    ];

    const getFileInfo = () => {
        return selectedFiles.map((file, index) => ({
            reference: `file_${index + 1}`,
            name: file.filename,
            rows: file.totalRows,
            columns: file.columns.slice(0, 5).join(', ') + (file.columns.length > 5 ? '...' : '')
        }));
    };

    const insertExample = (example) => {
        onPromptChange(example);
        setShowExamples(false);
    };

    const handleTextareaChange = (e) => {
        onPromptChange(e.target.value);
    };

    // Load saved prompts on component mount
    useEffect(() => {
        loadSavedPrompts();
    }, []);

    const loadSavedPrompts = async () => {
        setLoadingPrompts(true);
        try {
            const response = await fetch(`${API_ENDPOINTS.MISCELLANEOUS}/saved-prompts`);
            if (response.ok) {
                const data = await response.json();
                setSavedPrompts(data.prompts || []);
            }
        } catch (error) {
            console.error('Error loading saved prompts:', error);
        } finally {
            setLoadingPrompts(false);
        }
    };

    const loadPrompt = (prompt) => {
        onPromptChange(prompt.ideal_prompt);
        setShowSavedPrompts(false);
    };

    const deletePrompt = async (promptId) => {
        try {
            const response = await fetch(`${API_ENDPOINTS.MISCELLANEOUS}/saved-prompts/${promptId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                // Reload prompts after deletion
                loadSavedPrompts();
            }
        } catch (error) {
            console.error('Error deleting prompt:', error);
        }
    };

    const handlePromptLoaded = (prompt) => {
        onPromptChange(prompt.ideal_prompt || prompt.original_prompt);
        loadSavedPrompts(); // Refresh the quick access list
    };

    const handlePromptSaved = (savedPrompt) => {
        loadSavedPrompts(); // Refresh the quick access list
    };

    // Prompt improvement function
    const improvePrompt = async () => {
        if (!userPrompt || !selectedFiles || selectedFiles.length === 0) {
            setImprovementError('Please enter a prompt and select files first');
            return;
        }

        setIsImprovingPrompt(true);
        setImprovementError('');

        try {
            const requestData = {
                user_prompt: userPrompt,
                files: selectedFiles.map(file => ({
                    file_id: file.file_id,
                    filename: file.filename
                }))
            };

            const response = await fetch(`${API_ENDPOINTS.MISCELLANEOUS}/improve-prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setImprovementData(data);
                setShowImprovementModal(true);
            } else {
                setImprovementError(data.detail || 'Failed to improve prompt');
            }
        } catch (error) {
            console.error('Error improving prompt:', error);
            setImprovementError('Failed to connect to improvement service');
        } finally {
            setIsImprovingPrompt(false);
        }
    };

    const applyImprovedPrompt = () => {
        if (improvementData?.improved_prompt) {
            onPromptChange(improvementData.improved_prompt);
            setShowImprovementModal(false);
        }
    };

    // Expanded modal handlers
    const openExpandedModal = () => {
        setExpandedPrompt(userPrompt || '');
        setShowExpandedModal(true);
        // Focus the textarea after modal opens
        setTimeout(() => {
            expandedTextareaRef.current?.focus();
        }, 100);
    };

    const closeExpandedModal = () => {
        setShowExpandedModal(false);
        setExpandedPrompt('');
    };

    const saveExpandedPrompt = () => {
        onPromptChange(expandedPrompt);
        setShowExpandedModal(false);
        setExpandedPrompt('');
    };

    const handleExpandedPromptChange = (e) => {
        setExpandedPrompt(e.target.value);
    };

    // Handle keyboard shortcuts in expanded modal
    const handleExpandedKeyDown = (e) => {
        if (e.key === 'Escape') {
            closeExpandedModal();
        } else if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            saveExpandedPrompt();
        }
    };

    // COBOL generation handlers
    const openCobolModal = () => {
        if (!selectedFiles || selectedFiles.length === 0) {
            setCobolGenerationError('Please select input data files first');
            return;
        }
        setShowCobolModal(true);
        setCobolGenerationError('');
        setCobolGenerationResult(null);
    };

    const closeCobolModal = () => {
        setShowCobolModal(false);
        setCobolFiles([]);
        setCobolGenerationResult(null);
        setCobolGenerationError('');
    };

    const clearCobolGeneration = () => {
        setCobolFiles([]);
        setCobolGenerationResult(null);
        setCobolGenerationError('');
        if (cobolFileInputRef.current) {
            cobolFileInputRef.current.value = '';
        }
    };

    const handleCobolFilesSelect = (e) => {
        const files = Array.from(e.target.files);

        // Validate file extensions
        const validExtensions = ['.cbl', '.cob', '.cobol', '.txt'];
        const invalidFiles = files.filter(file => {
            const fileName = file.name.toLowerCase();
            return !validExtensions.some(ext => fileName.endsWith(ext));
        });

        if (invalidFiles.length > 0) {
            setCobolGenerationError(`Invalid files: ${invalidFiles.map(f => f.name).join(', ')}. Only .cbl, .cob, .cobol, .txt files are allowed.`);
            return;
        }

        setCobolFiles(files);
        setCobolGenerationError('');
    };

    const removeCobolFile = (index) => {
        setCobolFiles(prev => prev.filter((_, i) => i !== index));
    };

    const generatePromptFromCobol = async () => {
        if (cobolFiles.length === 0) {
            setCobolGenerationError('Please upload at least one COBOL file');
            return;
        }

        if (!selectedFiles || selectedFiles.length === 0) {
            setCobolGenerationError('No input data files selected');
            return;
        }

        setIsGeneratingFromCobol(true);
        setCobolGenerationError('');

        try {
            // Prepare FormData
            const formData = new FormData();

            // Add COBOL files
            cobolFiles.forEach(file => {
                formData.append('cobol_files', file);
            });

            // Add input file IDs (comma-separated)
            const fileIds = selectedFiles.map(f => f.file_id).join(',');
            formData.append('input_file_ids', fileIds);

            // Call API
            const response = await fetch(`${API_ENDPOINTS.BASE}/api/cobol/generate-prompt`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setCobolGenerationResult(data);
                setCobolGenerationError('');

                // Scroll to results after a short delay to allow rendering
                setTimeout(() => {
                    if (cobolResultsRef.current) {
                        cobolResultsRef.current.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }, 300);
            } else {
                setCobolGenerationError(data.detail || 'Failed to generate prompt from COBOL');
                setCobolGenerationResult(null);
            }
        } catch (error) {
            console.error('Error generating prompt from COBOL:', error);
            setCobolGenerationError('Failed to connect to COBOL service');
            setCobolGenerationResult(null);
        } finally {
            setIsGeneratingFromCobol(false);
        }
    };

    const applyCobolGeneratedPrompt = () => {
        if (cobolGenerationResult?.generated_prompt) {
            onPromptChange(cobolGenerationResult.generated_prompt);
            closeCobolModal();
        }
    };

    // Drag and drop handlers for prompt textarea
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);

        // Check if input files are selected
        if (!selectedFiles || selectedFiles.length === 0) {
            setCobolGenerationError('Please select input data files first before dropping COBOL files');
            return;
        }

        const droppedFiles = Array.from(e.dataTransfer.files);

        // Check if files are COBOL files
        const validExtensions = ['.cbl', '.cob', '.cobol', '.txt'];
        const cobolFiles = droppedFiles.filter(file => {
            const fileName = file.name.toLowerCase();
            return validExtensions.some(ext => fileName.endsWith(ext));
        });

        if (cobolFiles.length === 0) {
            setCobolGenerationError('No valid COBOL files detected. Please drop .cbl, .cob, .cobol, or .txt files.');
            return;
        }

        // Set the COBOL files and automatically generate prompt
        setCobolFiles(cobolFiles);
        setShowCobolModal(true);
        setCobolGenerationError('');

        // Auto-generate prompt
        await autoGeneratePromptFromDroppedFiles(cobolFiles);
    };

    const autoGeneratePromptFromDroppedFiles = async (files) => {
        setIsGeneratingFromCobol(true);
        setCobolGenerationError('');

        try {
            // Prepare FormData
            const formData = new FormData();

            // Add COBOL files
            files.forEach(file => {
                formData.append('cobol_files', file);
            });

            // Add input file IDs (comma-separated)
            const fileIds = selectedFiles.map(f => f.file_id).join(',');
            formData.append('input_file_ids', fileIds);

            // Call API
            const response = await fetch(`${API_ENDPOINTS.BASE}/api/cobol/generate-prompt`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setCobolGenerationResult(data);
                setCobolGenerationError('');
            } else {
                setCobolGenerationError(data.detail || 'Failed to generate prompt from COBOL');
                setCobolGenerationResult(null);
            }
        } catch (error) {
            console.error('Error generating prompt from COBOL:', error);
            setCobolGenerationError('Failed to connect to COBOL service');
            setCobolGenerationResult(null);
        } finally {
            setIsGeneratingFromCobol(false);
        }
    };

    const getCharacterCount = () => userPrompt ? userPrompt.length : 0;
    const isPromptValid = () => userPrompt && userPrompt.trim().length >= 10;


    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-800">Natural Language Query</h3>
                <p className="text-sm text-gray-600">
                    Describe what you want to do with your data in plain English. Our AI will convert your request into
                    efficient SQL queries.
                </p>
            </div>

            {/* Manage Prompts Section */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <BookOpen className="text-purple-600" size={16}/>
                        <span className="text-sm font-medium text-purple-800">Saved Prompts</span>
                        {savedPrompts.length > 0 && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                {savedPrompts.length}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setShowPromptManager(true)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <BookOpen size={14}/>
                        <span>Manage Prompts</span>
                    </button>
                </div>

                <div className="mt-3">
                    {savedPrompts.length === 0 ? (
                        <p className="text-xs text-purple-600">
                            No saved prompts yet. Use "Save Prompt" after successful data processing to build your
                            library.
                        </p>
                    ) : (
                        <div>
                            <p className="text-xs text-purple-600 mb-2">
                                {savedPrompts.length} saved prompt{savedPrompts.length !== 1 ? 's' : ''} available
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {savedPrompts.slice(0, 3).map((prompt) => (
                                    <button
                                        key={prompt.id}
                                        onClick={() => loadPrompt(prompt)}
                                        className="text-xs bg-white border border-purple-200 text-purple-700 px-2 py-1 rounded hover:bg-purple-50 transition-colors truncate max-w-32"
                                        title={prompt.description}
                                    >
                                        {prompt.name}
                                    </button>
                                ))}
                                {savedPrompts.length > 3 && (
                                    <button
                                        onClick={() => setShowPromptManager(true)}
                                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                                    >
                                        +{savedPrompts.length - 3} more
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Process Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Process Name
                </label>
                <input
                    type="text"
                    value={processName}
                    onChange={(e) => onProcessNameChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Give your analysis a descriptive name..."
                    maxLength={1000}
                />
                <div className="text-xs text-gray-500 mt-1">
                    This will help you identify your results later
                </div>
            </div>

            {/* File Context */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center space-x-2">
                    <Database size={16}/>
                    <span>Selected Files Context</span>
                </h4>
                <div className="space-y-2">
                    {getFileInfo().map((file, index) => (
                        <div key={index} className="text-sm text-blue-700">
                            <strong>{file.reference}</strong>: {file.name}
                            <span className="text-blue-600 ml-2">
                                ({file.rows} rows)
                            </span>
                            <div className="text-xs text-blue-600 ml-4 mt-1">
                                Columns: {file.columns}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Prompt Input */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Your Data Query
                    </label>
                    <div className="flex items-center space-x-2">
                        <span className={`text-xs ${
                            getCharacterCount() < 10 ? 'text-red-500' :
                                getCharacterCount() > 500 ? 'text-amber-500' : 'text-gray-500'
                        }`}>
                            {getCharacterCount()} characters
                        </span>
                        <button
                            onClick={openCobolModal}
                            disabled={!selectedFiles || selectedFiles.length === 0}
                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                            title="Generate prompt from COBOL files"
                        >
                            <FileCode size={18}/>
                            <span>📋 From COBOL</span>
                        </button>
                        <button
                            onClick={improvePrompt}
                            disabled={isImprovingPrompt || !isPromptValid() || !selectedFiles || selectedFiles.length === 0}
                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                            title="Get AI suggestions to improve your prompt"
                        >
                            {isImprovingPrompt ? (
                                <Loader size={18} className="animate-spin"/>
                            ) : (
                                <Brain size={18}/>
                            )}
                            <span>{isImprovingPrompt ? 'Improving...' : '✨ Improve with AI'}</span>
                        </button>
                        <button
                            onClick={openExpandedModal}
                            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-300 hover:border-blue-300"
                            title="Expand to full screen for easier editing"
                        >
                            <Maximize2 size={14}/>
                            <span>Expand</span>
                        </button>
                        <button
                            onClick={() => setShowExamples(!showExamples)}
                            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
                        >
                            <Lightbulb size={14}/>
                            <span>Examples</span>
                        </button>
                    </div>
                </div>


                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        value={userPrompt || ''}
                        onChange={handleTextareaChange}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-y transition-all duration-200 bg-gradient-to-br from-white to-gray-50/30 shadow-sm hover:shadow-md font-medium text-gray-800 leading-relaxed ${
                            isPromptValid() ? 'border-gray-200' : 'border-red-300'
                        } ${isDraggingOver ? 'border-green-500 border-dashed bg-green-50/50 ring-4 ring-green-500/20' : ''}`}
                        placeholder="Describe what you want to do with your data in plain English...

Examples:
• Compare file_1 and file_2 to find missing records
• Find duplicates in customer_email column
• Count total sales by region
• Show customers who spent more than $1000

💡 TIP: Drag & drop COBOL files (.cbl, .cob, .cobol, .txt) here to auto-generate a prompt!"
                        rows={12}
                        maxLength={50000}
                        style={{
                            lineHeight: '1.7',
                            fontSize: '15px'
                        }}
                    />

                    {/* Drag-over overlay */}
                    {isDraggingOver && (
                        <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 rounded-xl pointer-events-none">
                            <div className="bg-white/95 rounded-lg shadow-lg p-6 border-2 border-green-500 border-dashed">
                                <div className="flex flex-col items-center space-y-2">
                                    <FileCode className="text-green-600" size={48}/>
                                    <p className="text-lg font-semibold text-green-800">Drop COBOL Files Here</p>
                                    <p className="text-sm text-green-600">Auto-generate prompt from your COBOL code</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Character counter */}
                    <div className="absolute bottom-3 right-3 flex items-center space-x-3">
                        {userPrompt && userPrompt.length > 0 && (
                            <div
                                className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-gray-200">
                                <div className={`text-xs ${
                                    userPrompt.length > 40000 ? 'text-red-500' :
                                        userPrompt.length > 25000 ? 'text-amber-500' : 'text-gray-500'
                                }`}>
                                    {userPrompt.length.toLocaleString()}/{(50000).toLocaleString()}
                                </div>
                            </div>
                        )}

                        {/* Writing indicator */}
                        {userPrompt && userPrompt.length > 10 && (
                            <div
                                className="flex items-center space-x-1 bg-green-50 border border-green-200 px-2 py-1 rounded-lg">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-green-700 font-medium">Ready</span>
                            </div>
                        )}
                    </div>
                </div>

                {!isPromptValid() && (
                    <div className="text-xs text-red-500 mt-1 flex items-center space-x-1">
                        <AlertCircle size={12}/>
                        <span>Please provide at least 10 characters describing your data operation</span>
                    </div>
                )}

                {/* Improvement Error */}
                {improvementError && (
                    <div className="text-xs text-red-500 mt-1 flex items-center space-x-1">
                        <AlertCircle size={12}/>
                        <span>{improvementError}</span>
                    </div>
                )}

                {/* COBOL Generation Error */}
                {cobolGenerationError && (
                    <div className="text-xs text-red-500 mt-1 flex items-center space-x-1">
                        <AlertCircle size={12}/>
                        <span>{cobolGenerationError}</span>
                    </div>
                )}

                {/* Drag & Drop Hint */}
                {selectedFiles && selectedFiles.length > 0 && !userPrompt && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                            <FileCode className="text-green-600 flex-shrink-0 mt-0.5" size={16}/>
                            <div>
                                <p className="text-sm text-green-800 font-medium">Quick Tip: COBOL to Prompt</p>
                                <p className="text-xs text-green-700 mt-1">
                                    You can drag and drop COBOL files (.cbl, .cob, .cobol, .txt) directly into the text box above to automatically generate a prompt, or use the "📋 From COBOL" button.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reprocess Section */}
                {hasExistingResults && (
                    <div className={`mt-3 p-3 rounded-lg border ${
                        hasPromptChanged
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-green-50 border-green-200'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                {hasPromptChanged ? (
                                    <>
                                        <RefreshCw size={14} className="text-amber-600"/>
                                        <span className="text-sm text-amber-800 font-medium">
                                            Prompt modified - reprocess to see new results
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={14} className="text-green-600"/>
                                        <span className="text-sm text-green-800 font-medium">
                                            Results generated with current prompt
                                        </span>
                                    </>
                                )}
                            </div>

                            {hasPromptChanged && onReprocess && (
                                <button
                                    onClick={onReprocess}
                                    disabled={!isPromptValid()}
                                    className="flex items-center space-x-1 px-3 py-1.5 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    <RefreshCw size={14}/>
                                    <span>Reprocess</span>
                                </button>
                            )}
                        </div>

                        {hasPromptChanged && (
                            <div className="text-xs text-amber-700 mt-2">
                                Your query has been modified. Click "Reprocess" or use "Next" to generate new results
                                with the updated prompt.
                            </div>
                        )}
                    </div>
                )}
            </div>


            {/* Examples Panel */}
            {showExamples && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center space-x-2">
                        <Sparkles size={16}/>
                        <span>Example Queries</span>
                    </h4>

                    <div className="space-y-4">
                        {examplePrompts.map((category, catIndex) => (
                            <div key={catIndex}>
                                <h5 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                                    {category.category}
                                </h5>
                                <div className="space-y-1">
                                    {category.examples.map((example, exIndex) => (
                                        <button
                                            key={exIndex}
                                            onClick={() => insertExample(example)}
                                            className="w-full text-left text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                                        >
                                            "{example}"
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* Prompt Management Modal */}
            {showPromptManager && (
                <PromptSaveLoad
                    currentPrompt={userPrompt}
                    processName={processName}
                    selectedFiles={selectedFiles}
                    onPromptLoaded={handlePromptLoaded}
                    onPromptSaved={handlePromptSaved}
                    onClose={() => setShowPromptManager(false)}
                    defaultTab="load"
                />
            )}

            {/* Prompt Improvement Modal */}
            {showImprovementModal && improvementData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                                    <Brain className="text-purple-500" size={24}/>
                                    <span>AI-Improved Prompt</span>
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Your prompt has been enhanced for better results
                                </p>
                            </div>
                            <button
                                onClick={() => setShowImprovementModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X size={24}/>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Intent & Confidence */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Target className="text-blue-600" size={16}/>
                                        <span className="text-sm font-medium text-blue-800">Query Intent</span>
                                    </div>
                                    <p className="text-sm text-blue-700 capitalize">
                                        {improvementData.query_intent}
                                    </p>
                                    {improvementData.business_context && (
                                        <p className="text-xs text-blue-600 mt-2">
                                            {improvementData.business_context}
                                        </p>
                                    )}
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <TrendingUp className="text-green-600" size={16}/>
                                        <span className="text-sm font-medium text-green-800">Confidence Score</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="flex-1 bg-green-200 rounded-full h-2">
                                            <div
                                                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                                style={{width: `${(improvementData.confidence_score || 0.8) * 100}%`}}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium text-green-700">
                                            {Math.round((improvementData.confidence_score || 0.8) * 100)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Before & After Comparison */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Original Prompt */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                                        <MessageSquare className="text-gray-500" size={16}/>
                                        <span>Your Original Prompt</span>
                                    </h3>
                                    <div
                                        className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-32 overflow-y-auto">
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            {improvementData.original_prompt}
                                        </p>
                                    </div>
                                </div>

                                {/* Improved Prompt */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                                        <Sparkles className="text-purple-500" size={16}/>
                                        <span>AI-Improved Prompt</span>
                                    </h3>
                                    <div
                                        className="bg-purple-50 border border-purple-200 rounded-lg p-4 h-32 overflow-y-auto">
                                        <p className="text-sm text-purple-700 leading-relaxed">
                                            {improvementData.improved_prompt}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Expected Output Columns */}
                            {improvementData.expected_output_columns && improvementData.expected_output_columns.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                                        <Database className="text-green-500" size={16}/>
                                        <span>Expected Output Columns</span>
                                    </h3>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex flex-wrap gap-2">
                                            {improvementData.expected_output_columns.map((column, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                                                >
                                                    {column}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Improvements Made */}
                            {improvementData.improvements_made && improvementData.improvements_made.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                                        <Zap className="text-orange-500" size={16}/>
                                        <span>Key Improvements</span>
                                    </h3>
                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                        <ul className="space-y-2">
                                            {improvementData.improvements_made.map((improvement, index) => (
                                                <li key={index} className="flex items-start space-x-2">
                                                    <CheckCircle2 className="text-orange-600 flex-shrink-0 mt-0.5"
                                                                  size={14}/>
                                                    <span className="text-sm text-orange-700">{improvement}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Additional Suggestions */}
                            {improvementData.suggestions && improvementData.suggestions.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                                        <Lightbulb className="text-yellow-500" size={16}/>
                                        <span>Additional Suggestions</span>
                                    </h3>
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <ul className="space-y-2">
                                            {improvementData.suggestions.map((suggestion, index) => (
                                                <li key={index} className="flex items-start space-x-2">
                                                    <ArrowRight className="text-yellow-600 flex-shrink-0 mt-0.5"
                                                                size={14}/>
                                                    <span className="text-sm text-yellow-700">{suggestion}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => navigator.clipboard.writeText(improvementData.improved_prompt)}
                                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-white transition-colors"
                                >
                                    <Copy size={16}/>
                                    <span>Copy Improved Prompt</span>
                                </button>
                            </div>

                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => setShowImprovementModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Keep Original
                                </button>
                                <button
                                    onClick={applyImprovedPrompt}
                                    className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    <Sparkles size={16}/>
                                    <span>Use Improved Prompt</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Expanded Prompt Modal */}
            {showExpandedModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-7xl mx-auto rounded-xl shadow-2xl flex flex-col"
                         style={{height: 'min(90vh, 800px)'}}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <MessageSquare className="text-blue-600" size={24}/>
                                <h2 className="text-xl font-semibold text-gray-900">Expanded Prompt Editor</h2>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-500">
                                    {expandedPrompt ? expandedPrompt.length : 0} characters
                                </span>
                                <button
                                    onClick={closeExpandedModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                                    title="Close (Esc)"
                                >
                                    <X size={24}/>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 p-6 flex flex-col overflow-hidden">
                            <div className="mb-4">
                                <p className="text-sm text-gray-600">
                                    ✨ Write your natural language query here. Be as detailed as possible about your
                                    requirements.
                                    <span className="block mt-1 text-xs text-gray-500">
                                        💡 <strong>Tip:</strong> Use Ctrl+Enter to save, or Esc to cancel
                                    </span>
                                </p>
                            </div>

                            <div className="flex-1 relative">
                                <textarea
                                    ref={expandedTextareaRef}
                                    value={expandedPrompt}
                                    onChange={handleExpandedPromptChange}
                                    onKeyDown={handleExpandedKeyDown}
                                    className="w-full h-full resize-none border-2 border-gray-200 rounded-lg px-4 py-4 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gradient-to-br from-white to-gray-50/30 shadow-sm font-medium text-gray-800 leading-relaxed"
                                    placeholder="✨ Describe what you want to do with your data in detail...

For example:
• Compare file_1 and file_2 to find records missing from file_2
• Find mismatches between sales data and inventory data based on product_id
• Show customers who made purchases in Q1 but not in Q2
• Calculate total revenue by region and product category
• Identify duplicate records based on email address and merge them

Be as specific as possible about:
• Which files or data sources to use
• What columns/fields to compare or analyze
• Any filtering conditions or date ranges
• Expected output format and columns
• Business rules or logic to apply"
                                    maxLength={50000}
                                    style={{
                                        lineHeight: '1.7',
                                        fontSize: '15px'
                                    }}
                                />

                                {/* Floating character count */}
                                <div
                                    className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-500 border border-gray-200">
                                    {expandedPrompt ? expandedPrompt.length : 0} / 50,000
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div
                            className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <div className="text-xs text-gray-500">
                                <span className="inline-flex items-center space-x-1">
                                    <span>💡 <strong>Keyboard shortcuts:</strong></span>
                                </span>
                                <span className="ml-2">Ctrl+Enter to save • Esc to cancel</span>
                            </div>

                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={closeExpandedModal}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveExpandedPrompt}
                                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    <Save size={16}/>
                                    <span>Save Query</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* COBOL Generation Modal */}
            {showCobolModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col animate-slideUp">
                        {/* Header */}
                        <div className="flex items-center justify-between p-8 border-b border-gray-200 bg-gradient-to-r from-green-50 via-teal-50 to-cyan-50 rounded-t-2xl">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <FileCode className="text-white" size={24}/>
                                    </div>
                                    <span className="bg-gradient-to-r from-green-700 to-teal-700 bg-clip-text text-transparent">
                                        Generate Prompt from COBOL
                                    </span>
                                </h2>
                                <p className="text-sm text-gray-600 mt-2 ml-1">
                                    🚀 Intelligently analyze your COBOL programs and auto-generate prompts with field mappings
                                </p>
                            </div>
                            <button
                                onClick={closeCobolModal}
                                className="text-gray-400 hover:text-gray-600 hover:bg-white/50 p-2 rounded-lg transition-all duration-200"
                                disabled={isGeneratingFromCobol}
                            >
                                <X size={28}/>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {/* Selected Files Info */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center space-x-2">
                                    <Database size={16}/>
                                    <span>Selected Input Data Files</span>
                                </h3>
                                <div className="space-y-2">
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className="text-sm text-blue-700 flex items-center justify-between">
                                            <div>
                                                <strong>file_{index + 1}</strong>: {file.filename}
                                                <span className="text-blue-600 ml-2">
                                                    ({file.totalRows?.toLocaleString() || 0} rows)
                                                </span>
                                            </div>
                                            <span className="text-xs text-blue-500">
                                                {file.columns?.length || 0} columns
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* COBOL File Upload - Minimized when generating or result exists */}
                            {(isGeneratingFromCobol || cobolGenerationResult) ? (
                                // Minimized view
                                <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 rounded-xl p-5 shadow-sm">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-teal-100 rounded-xl flex items-center justify-center shadow-sm">
                                                <FileCode className="text-green-600" size={20}/>
                                            </div>
                                            <div>
                                                <p className="text-base font-semibold text-gray-800">
                                                    {cobolFiles.length} COBOL file{cobolFiles.length !== 1 ? 's' : ''} uploaded
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    📦 {(cobolFiles.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(1)} KB total
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={clearCobolGeneration}
                                                disabled={isGeneratingFromCobol}
                                                className="flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg border-2 border-red-600 hover:border-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none"
                                                title="Clear and start over"
                                            >
                                                <X size={16}/>
                                                <span>Clear All</span>
                                            </button>
                                            <button
                                                onClick={() => cobolFileInputRef.current?.click()}
                                                disabled={isGeneratingFromCobol}
                                                className="flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 rounded-lg border-2 border-green-600 hover:border-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none"
                                                title="Upload different files"
                                            >
                                                <Upload size={16}/>
                                                <span>Re-upload</span>
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        ref={cobolFileInputRef}
                                        type="file"
                                        accept=".cbl,.cob,.cobol,.txt"
                                        multiple
                                        onChange={handleCobolFilesSelect}
                                        className="hidden"
                                        disabled={isGeneratingFromCobol}
                                    />
                                </div>
                            ) : (
                                // Full upload view
                                <div>
                                    <label className="block text-base font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                                        <Upload className="text-green-600" size={16}/>
                                        <span>Upload COBOL Files</span>
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:border-green-500 hover:bg-green-50/50 transition-all duration-300 cursor-pointer group">
                                        <input
                                            ref={cobolFileInputRef}
                                            type="file"
                                            accept=".cbl,.cob,.cobol,.txt"
                                            multiple
                                            onChange={handleCobolFilesSelect}
                                            className="hidden"
                                            disabled={isGeneratingFromCobol}
                                        />
                                        <div className="flex flex-col items-center space-y-3">
                                            <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-teal-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                                <Upload className="text-green-600 group-hover:text-green-700" size={28}/>
                                            </div>
                                            <div className="space-y-1">
                                                <button
                                                    onClick={() => cobolFileInputRef.current?.click()}
                                                    disabled={isGeneratingFromCobol}
                                                    className="px-5 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white font-medium text-sm rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-400 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none"
                                                >
                                                    📁 Choose COBOL Files
                                                </button>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    <span className="font-mono text-green-700">.cbl, .cob, .cobol, .txt</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Selected COBOL Files List */}
                                    {cobolFiles.length > 0 && (
                                        <div className="mt-5 space-y-3 animate-slideDown">
                                            <div className="flex items-center justify-between">
                                                <p className="text-base font-semibold text-gray-800 flex items-center space-x-2">
                                                    <FileCode className="text-green-600" size={18}/>
                                                    <span>Selected COBOL Files ({cobolFiles.length})</span>
                                                </p>
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                    {(cobolFiles.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(1)} KB total
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                {cobolFiles.map((file, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 rounded-xl hover:shadow-md transition-all duration-200 group"
                                                    >
                                                        <div className="flex items-center space-x-3 flex-1">
                                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <FileCode className="text-green-600" size={20}/>
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                                                                <p className="text-xs text-gray-600">
                                                                    📊 Size: {(file.size / 1024).toFixed(1)} KB
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeCobolFile(index)}
                                                            disabled={isGeneratingFromCobol}
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-100 disabled:text-gray-400 p-2 rounded-lg transition-all duration-200"
                                                            title="Remove file"
                                                        >
                                                            <X size={20}/>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Error Message */}
                            {cobolGenerationError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-2">
                                        <AlertCircle className="text-red-600" size={18}/>
                                        <p className="text-sm text-red-700">{cobolGenerationError}</p>
                                    </div>
                                </div>
                            )}

                            {/* Generation Result */}
                            {cobolGenerationResult && (
                                <div ref={cobolResultsRef} className="space-y-4 scroll-mt-8">
                                    {/* Generated Prompt */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                                            <Wand2 className="text-green-600" size={16}/>
                                            <span>Generated Prompt</span>
                                        </h3>
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                                {cobolGenerationResult.generated_prompt}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Confidence & Analysis Summary */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Confidence Score */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Target className="text-blue-600" size={16}/>
                                                <span className="text-sm font-medium text-blue-800">Confidence Score</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="flex-1 bg-blue-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                                        style={{width: `${(cobolGenerationResult.confidence_score || 0.7) * 100}%`}}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium text-blue-700">
                                                    {Math.round((cobolGenerationResult.confidence_score || 0.7) * 100)}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Complexity */}
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <FileCode className="text-purple-600" size={16}/>
                                                <span className="text-sm font-medium text-purple-800">Complexity</span>
                                            </div>
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                                cobolGenerationResult.cobol_analysis?.complexity === 'SIMPLE' ? 'bg-green-100 text-green-800' :
                                                cobolGenerationResult.cobol_analysis?.complexity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {cobolGenerationResult.cobol_analysis?.complexity || 'UNKNOWN'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* COBOL Analysis Details */}
                                    {cobolGenerationResult.cobol_analysis && (
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-purple-800 mb-3 flex items-center space-x-2">
                                                <FileCode size={16}/>
                                                <span>COBOL Analysis</span>
                                            </h4>

                                            {/* Program Names */}
                                            {cobolGenerationResult.cobol_analysis.program_names && (
                                                <div className="mb-3">
                                                    <p className="text-xs font-medium text-purple-700 mb-1">Programs:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {cobolGenerationResult.cobol_analysis.program_names.map((name, idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700 font-mono">
                                                                {name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Primary Purpose */}
                                            {cobolGenerationResult.cobol_analysis.primary_purpose && (
                                                <div className="mb-3">
                                                    <p className="text-xs font-medium text-purple-700 mb-1">Purpose:</p>
                                                    <p className="text-xs text-purple-600">
                                                        {cobolGenerationResult.cobol_analysis.primary_purpose}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Business Operations */}
                                            {cobolGenerationResult.cobol_analysis.business_operations && cobolGenerationResult.cobol_analysis.business_operations.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-medium text-purple-700 mb-1">Business Operations:</p>
                                                    <ul className="space-y-1">
                                                        {cobolGenerationResult.cobol_analysis.business_operations.map((op, idx) => (
                                                            <li key={idx} className="text-xs text-purple-600 flex items-start">
                                                                <span className="mr-1">•</span>
                                                                <span>{op}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* File Mappings */}
                                    {cobolGenerationResult.file_mappings && cobolGenerationResult.file_mappings.length > 0 && (
                                        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-teal-800 mb-3 flex items-center space-x-2">
                                                <Database size={16}/>
                                                <span>Field Mappings ({cobolGenerationResult.file_mappings.length})</span>
                                            </h4>
                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {cobolGenerationResult.file_mappings.map((mapping, idx) => (
                                                    <div key={idx} className="bg-white border border-teal-100 rounded p-3">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex-1">
                                                                <div className="flex items-center space-x-2 mb-1">
                                                                    <span className="text-xs font-mono font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                                                        {mapping.cobol_field}
                                                                    </span>
                                                                    <span className="text-xs text-gray-400">→</span>
                                                                    <span className="text-xs font-mono font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                                                                        {mapping.data_column}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-xs text-gray-500">
                                                                        {mapping.file_reference}
                                                                    </span>
                                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                                        mapping.mapping_confidence === 'HIGH' ? 'bg-green-100 text-green-700' :
                                                                        mapping.mapping_confidence === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                                                        'bg-red-100 text-red-700'
                                                                    }`}>
                                                                        {mapping.mapping_confidence}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {mapping.notes && (
                                                            <p className="text-xs text-gray-600 italic">
                                                                {mapping.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Expected Output Columns */}
                                    {cobolGenerationResult.expected_output_columns && cobolGenerationResult.expected_output_columns.length > 0 && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center space-x-2">
                                                <CheckCircle size={16}/>
                                                <span>Expected Output Columns ({cobolGenerationResult.expected_output_columns.length})</span>
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {cobolGenerationResult.expected_output_columns.map((col, idx) => (
                                                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 font-mono">
                                                        {col}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Warnings */}
                                    {cobolGenerationResult.warnings && cobolGenerationResult.warnings.length > 0 && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center space-x-2">
                                                <AlertCircle size={16}/>
                                                <span>Warnings ({cobolGenerationResult.warnings.length})</span>
                                            </h4>
                                            <ul className="space-y-1">
                                                {cobolGenerationResult.warnings.map((warning, index) => (
                                                    <li key={index} className="text-xs text-yellow-700 flex items-start">
                                                        <span className="mr-1">⚠️</span>
                                                        <span>{warning}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Suggestions */}
                                    {cobolGenerationResult.suggestions && cobolGenerationResult.suggestions.length > 0 && (
                                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-indigo-800 mb-2 flex items-center space-x-2">
                                                <Lightbulb size={16}/>
                                                <span>Suggestions ({cobolGenerationResult.suggestions.length})</span>
                                            </h4>
                                            <ul className="space-y-1">
                                                {cobolGenerationResult.suggestions.map((suggestion, index) => (
                                                    <li key={index} className="text-xs text-indigo-700 flex items-start">
                                                        <span className="mr-1">💡</span>
                                                        <span>{suggestion}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Metadata */}
                                    {cobolGenerationResult.metadata && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Processing Details</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                                <div>
                                                    <p className="text-gray-500">COBOL Files</p>
                                                    <p className="font-medium text-gray-700">
                                                        {cobolGenerationResult.metadata.cobol_files_analyzed}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">COBOL Lines</p>
                                                    <p className="font-medium text-gray-700">
                                                        {cobolGenerationResult.metadata.total_cobol_lines?.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Input Files</p>
                                                    <p className="font-medium text-gray-700">
                                                        {cobolGenerationResult.metadata.input_files_count}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Processing Time</p>
                                                    <p className="font-medium text-gray-700">
                                                        {cobolGenerationResult.metadata.processing_time_seconds}s
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Processing Indicator */}
                            {isGeneratingFromCobol && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                                    <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4"/>
                                    <p className="text-sm text-blue-800 font-medium">Analyzing COBOL files...</p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        This may take 5-10 seconds
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={closeCobolModal}
                                disabled={isGeneratingFromCobol}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400"
                            >
                                Cancel
                            </button>

                            <div className="flex items-center space-x-3">
                                {!cobolGenerationResult ? (
                                    <button
                                        onClick={generatePromptFromCobol}
                                        disabled={isGeneratingFromCobol || cobolFiles.length === 0}
                                        className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isGeneratingFromCobol ? (
                                            <>
                                                <Loader size={16} className="animate-spin"/>
                                                <span>Generating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 size={16}/>
                                                <span>Generate Prompt</span>
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={applyCobolGeneratedPrompt}
                                        className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <CheckCircle size={16}/>
                                        <span>Use This Prompt</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MiscellaneousPromptInput;