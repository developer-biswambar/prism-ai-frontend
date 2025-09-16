import React, {useState, useEffect, useRef} from 'react';
import {
    AlertCircle,
    Database,
    Lightbulb,
    MessageSquare,
    Sparkles,
    RefreshCw,
    CheckCircle,
    BookOpen,
    Brain,
    Zap,
    Target,
    TrendingUp,
    X,
    Loader,
    ArrowRight,
    Copy,
    CheckCircle2,
    Maximize2,
    Save
} from 'lucide-react';
import { API_ENDPOINTS } from '../../config/environment';
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
    
    const textareaRef = useRef(null);
    const expandedTextareaRef = useRef(null);

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

    const getCharacterCount = () => userPrompt ? userPrompt.length : 0;
    const isPromptValid = () => userPrompt && userPrompt.trim().length >= 10;


    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-800">Natural Language Query</h3>
                <p className="text-sm text-gray-600">
                    Describe what you want to do with your data in plain English. Our AI will convert your request into efficient SQL queries.
                </p>
            </div>

            {/* Manage Prompts Section */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <BookOpen className="text-purple-600" size={16} />
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
                        <BookOpen size={14} />
                        <span>Manage Prompts</span>
                    </button>
                </div>
                
                <div className="mt-3">
                    {savedPrompts.length === 0 ? (
                        <p className="text-xs text-purple-600">
                            No saved prompts yet. Use "Save Prompt" after successful data processing to build your library.
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
                    <Database size={16} />
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
                            onClick={improvePrompt}
                            disabled={isImprovingPrompt || !isPromptValid() || !selectedFiles || selectedFiles.length === 0}
                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                            title="Get AI suggestions to improve your prompt"
                        >
                            {isImprovingPrompt ? (
                                <Loader size={18} className="animate-spin" />
                            ) : (
                                <Brain size={18} />
                            )}
                            <span>{isImprovingPrompt ? 'Improving...' : '✨ Improve with AI'}</span>
                        </button>
                        <button
                            onClick={openExpandedModal}
                            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-300 hover:border-blue-300"
                            title="Expand to full screen for easier editing"
                        >
                            <Maximize2 size={14} />
                            <span>Expand</span>
                        </button>
                        <button
                            onClick={() => setShowExamples(!showExamples)}
                            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
                        >
                            <Lightbulb size={14} />
                            <span>Examples</span>
                        </button>
                    </div>
                </div>


                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        value={userPrompt || ''}
                        onChange={handleTextareaChange}
                        className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-y transition-all duration-200 bg-gradient-to-br from-white to-gray-50/30 shadow-sm hover:shadow-md font-medium text-gray-800 leading-relaxed ${
                            isPromptValid() ? 'border-gray-200' : 'border-red-300'
                        }`}
                        placeholder="Describe what you want to do with your data in plain English...

Examples:
• Compare file_1 and file_2 to find missing records
• Find duplicates in customer_email column  
• Count total sales by region
• Show customers who spent more than $1000"
                        rows={12}
                        maxLength={50000}
                        style={{
                            lineHeight: '1.7',
                            fontSize: '15px'
                        }}
                    />
                    
                    {/* Character counter */}
                    <div className="absolute bottom-3 right-3 flex items-center space-x-3">
                        {userPrompt && userPrompt.length > 0 && (
                            <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-gray-200">
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
                            <div className="flex items-center space-x-1 bg-green-50 border border-green-200 px-2 py-1 rounded-lg">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-green-700 font-medium">Ready</span>
                            </div>
                        )}
                    </div>
                </div>

                {!isPromptValid() && (
                    <div className="text-xs text-red-500 mt-1 flex items-center space-x-1">
                        <AlertCircle size={12} />
                        <span>Please provide at least 10 characters describing your data operation</span>
                    </div>
                )}
                
                {/* Improvement Error */}
                {improvementError && (
                    <div className="text-xs text-red-500 mt-1 flex items-center space-x-1">
                        <AlertCircle size={12} />
                        <span>{improvementError}</span>
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
                                        <RefreshCw size={14} className="text-amber-600" />
                                        <span className="text-sm text-amber-800 font-medium">
                                            Prompt modified - reprocess to see new results
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={14} className="text-green-600" />
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
                                    <RefreshCw size={14} />
                                    <span>Reprocess</span>
                                </button>
                            )}
                        </div>
                        
                        {hasPromptChanged && (
                            <div className="text-xs text-amber-700 mt-2">
                                Your query has been modified. Click "Reprocess" or use "Next" to generate new results with the updated prompt.
                            </div>
                        )}
                    </div>
                )}
            </div>



            {/* Examples Panel */}
            {showExamples && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center space-x-2">
                        <Sparkles size={16} />
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
                                    <Brain className="text-purple-500" size={24} />
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
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Intent & Confidence */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Target className="text-blue-600" size={16} />
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
                                        <TrendingUp className="text-green-600" size={16} />
                                        <span className="text-sm font-medium text-green-800">Confidence Score</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="flex-1 bg-green-200 rounded-full h-2">
                                            <div 
                                                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${(improvementData.confidence_score || 0.8) * 100}%` }}
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
                                        <MessageSquare className="text-gray-500" size={16} />
                                        <span>Your Original Prompt</span>
                                    </h3>
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-32 overflow-y-auto">
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            {improvementData.original_prompt}
                                        </p>
                                    </div>
                                </div>

                                {/* Improved Prompt */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                                        <Sparkles className="text-purple-500" size={16} />
                                        <span>AI-Improved Prompt</span>
                                    </h3>
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 h-32 overflow-y-auto">
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
                                        <Database className="text-green-500" size={16} />
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
                                        <Zap className="text-orange-500" size={16} />
                                        <span>Key Improvements</span>
                                    </h3>
                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                        <ul className="space-y-2">
                                            {improvementData.improvements_made.map((improvement, index) => (
                                                <li key={index} className="flex items-start space-x-2">
                                                    <CheckCircle2 className="text-orange-600 flex-shrink-0 mt-0.5" size={14} />
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
                                        <Lightbulb className="text-yellow-500" size={16} />
                                        <span>Additional Suggestions</span>
                                    </h3>
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <ul className="space-y-2">
                                            {improvementData.suggestions.map((suggestion, index) => (
                                                <li key={index} className="flex items-start space-x-2">
                                                    <ArrowRight className="text-yellow-600 flex-shrink-0 mt-0.5" size={14} />
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
                                    <Copy size={16} />
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
                                    <Sparkles size={16} />
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
                                <MessageSquare className="text-blue-600" size={24} />
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
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 p-6 flex flex-col overflow-hidden">
                            <div className="mb-4">
                                <p className="text-sm text-gray-600">
                                    ✨ Write your natural language query here. Be as detailed as possible about your requirements.
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
                                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-500 border border-gray-200">
                                    {expandedPrompt ? expandedPrompt.length : 0} / 50,000
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
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
                                    <Save size={16} />
                                    <span>Save Query</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MiscellaneousPromptInput;