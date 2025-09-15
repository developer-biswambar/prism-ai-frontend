import React, {useState} from 'react';
import {
    AlertCircle,
    CheckCircle,
    Code,
    Copy,
    Database,
    Download,
    Edit,
    Eye,
    EyeOff,
    ExternalLink,
    FileSpreadsheet,
    FileText,
    Play,
    RefreshCw,
    Save,
    Sparkles,
    Table,
    Trash2,
    XCircle
} from 'lucide-react';
import { formatSQL } from '../../utils/sqlFormatter';
import { API_ENDPOINTS } from '../../config/environment';
import PromptSaveLoad from './PromptSaveLoad';
import ColumnMappingModal from './ColumnMappingModal';

// Save Prompt Modal Component
const SavePromptModal = ({ idealPrompt, onSave, onCancel, saving, error, originalPrompt, processName, selectedFiles }) => {
    const [editedPrompt, setEditedPrompt] = useState(idealPrompt);
    const [promptName, setPromptName] = useState('');
    const [promptDescription, setPromptDescription] = useState('');
    const [promptCategory, setPromptCategory] = useState('Data Processing');

    React.useEffect(() => {
        setEditedPrompt(idealPrompt);
        // Generate a default name based on the process
        if (processName) {
            setPromptName(`${processName} - Optimized`);
        }
    }, [idealPrompt, processName]);

    const handleSave = () => {
        if (!editedPrompt.trim() || !promptName.trim()) return;

        const promptData = {
            name: promptName.trim(),
            ideal_prompt: editedPrompt.trim(),
            original_prompt: originalPrompt,
            description: promptDescription.trim() || `Optimized version of: "${originalPrompt}"`,
            category: promptCategory,
            file_pattern: `Works with ${selectedFiles.length} file(s) - ${selectedFiles.map(f => f.filename).join(', ')}`,
            tags: ['ai-optimized', 'data-processing']
        };

        console.log('💾 SavePromptModal handleSave - promptData:', promptData);
        console.log('💾 editedPrompt:', editedPrompt);
        console.log('💾 originalPrompt:', originalPrompt);

        onSave(promptData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                            <Sparkles className="text-purple-600" size={20} />
                            <span>Save Optimized Prompt</span>
                        </h3>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XCircle size={20} />
                        </button>
                    </div>

                    {/* AI Generated Comparison */}
                    <div className="mb-6 space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-amber-800 mb-2">Original Prompt:</h4>
                            <p className="text-sm text-amber-700 italic bg-white p-2 rounded border">
                                "{originalPrompt}"
                            </p>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center space-x-1">
                                <Sparkles size={14} />
                                <span>AI-Optimized Prompt:</span>
                            </h4>
                            <textarea
                                value={editedPrompt}
                                onChange={(e) => setEditedPrompt(e.target.value)}
                                className="w-full h-32 bg-white border border-green-300 rounded p-3 text-sm text-green-800 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="AI-generated optimized prompt..."
                            />
                        </div>
                    </div>

                    {/* Prompt Metadata */}
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prompt Name *
                            </label>
                            <input
                                type="text"
                                value={promptName}
                                onChange={(e) => setPromptName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Give your prompt a descriptive name..."
                                maxLength={100}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                value={promptDescription}
                                onChange={(e) => setPromptDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                rows={2}
                                placeholder="Describe what this prompt does and when to use it..."
                                maxLength={300}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <select
                                value={promptCategory}
                                onChange={(e) => setPromptCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="Data Processing">Data Processing</option>
                                <option value="Data Reconciliation">Data Reconciliation</option>
                                <option value="Data Merging">Data Merging</option>
                                <option value="Delta Analysis">Delta Analysis</option>
                                <option value="Analytics">Analytics</option>
                                <option value="Filtering">Filtering</option>
                                <option value="Custom">Custom</option>
                            </select>
                        </div>
                    </div>

                    {/* File Requirements Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">File Requirements:</h4>
                        <div className="text-xs text-blue-700">
                            <p>• Works with {selectedFiles.length} file(s)</p>
                            <p>• Supports: CSV, Excel, JSON formats</p>
                            <p>• Example files: {selectedFiles.map((f, i) => `file_${i + 1}`).join(', ')}</p>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <div className="flex items-start space-x-2">
                                <XCircle className="text-red-600 mt-0.5" size={14} />
                                <div>
                                    <span className="text-sm font-medium text-red-800">Error</span>
                                    <p className="text-sm text-red-700 mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onCancel}
                            disabled={saving}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !editedPrompt.trim() || !promptName.trim()}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw className="animate-spin" size={16} />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>Save Prompt</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MiscellaneousPreview = ({
    userPrompt,
    processName,
    selectedFiles,
    isProcessing,
    processResults,
    generatedSQL,
    processingError,
    processId,
    processingTimeSeconds,
    onProcess,
    onDownload,
    onClear,
    onCreateTemplate
}) => {

    const [showSQL, setShowSQL] = useState(false);
    const [showAllRows, setShowAllRows] = useState(false);
    const [copied, setCopied] = useState(false);
    const [editableSQL, setEditableSQL] = useState('');
    const [isEditingSQL, setIsEditingSQL] = useState(false);
    const [executingSQL, setExecutingSQL] = useState(false);
    const [executeResults, setExecuteResults] = useState(null);
    const [executeError, setExecuteError] = useState(null);
    const [showSavePromptModal, setShowSavePromptModal] = useState(false);
    const [savingPrompt, setSavingPrompt] = useState(false);
    const [savePromptError, setSavePromptError] = useState(null);
    const [idealPrompt, setIdealPrompt] = useState('');
    const [showColumnMappingModal, setShowColumnMappingModal] = useState(false);
    const [columnMappingProcessing, setColumnMappingProcessing] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);

    // Initialize editable SQL when generatedSQL changes
    React.useEffect(() => {
        if (generatedSQL && !editableSQL) {
            setEditableSQL(formatSQL(generatedSQL));
        }
    }, [generatedSQL, editableSQL]);

    // Copy SQL to clipboard
    const copySQL = async () => {
        try {
            const sqlToCopy = isEditingSQL ? editableSQL : formatSQL(generatedSQL);
            await navigator.clipboard.writeText(sqlToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy SQL:', err);
        }
    };

    // Execute custom SQL query
    const executeSQL = async () => {
        if (!editableSQL.trim()) return;

        console.log('🔍 executeSQL called with:', {
            processId, 
            editableSQL: editableSQL?.substring(0, 50) + '...',
            processingError
        });

        setExecutingSQL(true);
        setExecuteError(null);
        setExecuteResults(null);

        try {
            const response = await fetch(`${API_ENDPOINTS.MISCELLANEOUS}/execute-query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sql_query: editableSQL,
                    process_id: processId, // Use the same process ID to access same data
                }),
            });

            const data = await response.json();

            if (data.success) {
                setExecuteResults(data);
                setExecuteError(null);
            } else {
                setExecuteError(data.error || 'Query execution failed');
                setExecuteResults(null);
            }
        } catch (error) {
            console.error('Error executing SQL:', error);
            setExecuteError('Failed to execute query: ' + error.message);
            setExecuteResults(null);
        } finally {
            setExecutingSQL(false);
        }
    };

    // Generate ideal prompt and open save modal
    const generateIdealPrompt = async () => {
        setSavingPrompt(true);
        setSavePromptError(null);
        
        try {
            const response = await fetch(`${API_ENDPOINTS.MISCELLANEOUS}/generate-ideal-prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    original_prompt: userPrompt,
                    generated_sql: generatedSQL,
                    ai_description: processResults?.metadata?.processing_info?.description || null,
                    files_info: selectedFiles.map((file, index) => ({
                        reference: `file_${index + 1}`,
                        filename: file.filename,
                        columns: file.columns || [],
                        total_rows: file.totalRows || 0
                    })),
                    results_summary: {
                        total_rows: processResults?.data?.length || 0,
                        columns: getResultColumns(),
                        query_type: processResults?.metadata?.processing_info?.query_type || 'unknown'
                    },
                    process_id: processId
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setIdealPrompt(data.ideal_prompt);
                setShowSavePromptModal(true);
                setSavePromptError(null);
            } else {
                setSavePromptError(data.error || 'Failed to generate ideal prompt');
            }
        } catch (error) {
            console.error('Error generating ideal prompt:', error);
            setSavePromptError('Failed to generate ideal prompt: ' + error.message);
        } finally {
            setSavingPrompt(false);
        }
    };

    // Save the ideal prompt
    const saveIdealPrompt = async (promptData) => {
        console.log('💾 saveIdealPrompt called with:', promptData);
        
        setSavingPrompt(true);
        setSavePromptError(null);
        
        try {
            const response = await fetch(`${API_ENDPOINTS.MISCELLANEOUS}/save-prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(promptData),
            });

            const data = await response.json();
            console.log('💾 Backend response:', data);

            if (response.ok) {
                setShowSavePromptModal(false);
                setIdealPrompt('');
                // Show success message (you could add a toast notification here)
                console.log('✅ Prompt saved successfully:', data.message);
            } else {
                setSavePromptError(data.error || 'Failed to save prompt');
                console.error('❌ Save failed:', data);
            }
        } catch (error) {
            console.error('❌ Error saving prompt:', error);
            setSavePromptError('Failed to save prompt: ' + error.message);
        } finally {
            setSavingPrompt(false);
        }
    };

    // Function to open results in viewer tab
    const openResultsInViewer = () => {
        if (!processId) return;
        
        const viewerUrl = `/viewer/${processId}`;
        const newWindow = window.open(
            viewerUrl,
            `viewer_${processId}`,
            'toolbar=yes,scrollbars=yes,resizable=yes,width=1400,height=900,menubar=yes,location=yes,directories=no,status=yes'
        );

        if (newWindow) {
            newWindow.focus();
        } else {
            // Fallback for popup blockers
            alert('Please allow popups to view results in a new tab');
        }
    };

    const getResultsPreview = () => {
        if (!processResults?.data) return [];
        
        if (showAllRows) {
            return processResults.data;
        } else {
            return processResults.data.slice(0, 10);
        }
    };

    // Column mapping functions
    const handleOpenColumnMapping = () => {
        setShowErrorModal(false);
        setShowColumnMappingModal(true);
    };

    const handleColumnMappingApply = async (columnMapping) => {
        setColumnMappingProcessing(true);
        try {
            // Apply the column mapping to the SQL and re-execute
            console.log('🔧 Applying column mapping:', columnMapping);
            
            // Transform the SQL by replacing missing columns with mapped columns
            let updatedSQL = generatedSQL || editableSQL;
            Object.entries(columnMapping).forEach(([missingCol, mappedCol]) => {
                // Replace column references in the SQL
                const regex = new RegExp(`\\b${missingCol}\\b`, 'gi');
                updatedSQL = updatedSQL.replace(regex, mappedCol);
            });

            console.log('📝 Updated SQL with mapping:', updatedSQL);
            
            // Execute the updated SQL
            await handleExecuteSQL(updatedSQL);
            setShowColumnMappingModal(false);
        } catch (error) {
            console.error('❌ Error applying column mapping:', error);
        } finally {
            setColumnMappingProcessing(false);
        }
    };

    const handleColumnMappingCancel = () => {
        // Return to the SQL execution error modal
        setShowColumnMappingModal(false);
        setShowErrorModal(true);
    };

    // Extract columns from error analysis for column mapping
    const getAvailableColumns = () => {
        if (processResults?.error_analysis?.available_columns) {
            return processResults.error_analysis.available_columns;
        }
        
        // Fallback: extract from file data if available
        if (selectedFiles.length > 0 && selectedFiles[0].columns) {
            return selectedFiles[0].columns;
        }
        
        return [];
    };

    const getMissingColumns = () => {
        if (processResults?.error_analysis?.missing_columns) {
            return processResults.error_analysis.missing_columns;
        }
        
        // Extract missing columns from error message if available
        const errorMessage = processResults?.error || processResults?.errors?.[0] || '';
        const columnMatches = errorMessage.match(/Referenced column "([^"]+)" not found/g);
        if (columnMatches) {
            return columnMatches.map(match => match.match(/Referenced column "([^"]+)"/)[1]);
        }
        
        return [];
    };

    // Generic SQL execution function
    const handleExecuteSQL = async (sqlQuery) => {
        if (!sqlQuery?.trim()) return;
        
        // processId should always be available when this function is called
        console.log('🔍 handleExecuteSQL: processId:', processId);
        
        setExecutingSQL(true);
        setExecuteError(null);
        setExecuteResults(null);
        try {
            const response = await fetch(`${API_ENDPOINTS.MISCELLANEOUS}/execute-query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sql_query: sqlQuery,
                    process_id: processId, // Use the same process ID to access same data
                }),
            });
            const data = await response.json();

            if (response.ok) {
                setExecuteResults(data);
                setEditableSQL(sqlQuery); // Update the editable SQL
            } else {
                setExecuteError(data.detail || data.error || 'Failed to execute query');
            }
        } catch (error) {
            console.error('Execute SQL error:', error);
            setExecuteError('Failed to execute query: ' + error.message);
        } finally {
            setExecutingSQL(false);
        }
    };

    const getResultColumns = () => {
        if (!processResults?.data || processResults.data.length === 0) return [];
        return Object.keys(processResults.data[0]);
    };

    const formatCellValue = (value) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'number') return value.toLocaleString();
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'string' && value.length > 50) {
            return value.substring(0, 50) + '...';
        }
        return String(value);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-800">Process & View Results</h3>
                <p className="text-sm text-gray-600">
                    Review your query and selected files, then process the data to see results.
                </p>
            </div>

            {/* Query Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center space-x-2">
                    <FileText size={16} />
                    <span>Query Summary</span>
                </h4>
                
                <div className="space-y-3">
                    <div>
                        <span className="text-xs font-medium text-blue-700">Process Name:</span>
                        <p className="text-sm text-blue-800">{processName}</p>
                    </div>
                    
                    <div>
                        <span className="text-xs font-medium text-blue-700">Selected Files ({selectedFiles.length}):</span>
                        <div className="mt-1 space-y-1">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="text-sm text-blue-700 flex items-center space-x-2">
                                    <FileSpreadsheet size={14} />
                                    <span><strong>file_{index + 1}</strong>: {file.filename} ({file.totalRows} rows)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <span className="text-xs font-medium text-blue-700">Your Query:</span>
                        <p className="text-sm text-blue-800 bg-white p-2 rounded border italic whitespace-pre-wrap">
                            "{userPrompt}"
                        </p>
                    </div>
                </div>
            </div>

            {/* Processing Status */}
            {isProcessing && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="animate-spin text-yellow-600" size={16} />
                        <span className="text-sm font-medium text-yellow-800">Processing your request...</span>
                    </div>
                    <div className="text-xs text-yellow-700 mt-2">
                        AI is analyzing your files and generating queries. This may take a few moments.
                    </div>
                </div>
            )}

            {/* Error Display */}
            {processingError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                        <XCircle className="text-red-600 mt-0.5" size={16} />
                        <div className="flex-1">
                            <span className="text-sm font-medium text-red-800">Processing Failed</span>
                            <p className="text-sm text-red-700 mt-1">{processingError}</p>
                            {processId && (
                                <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3">
                                    <div className="flex items-start space-x-2">
                                        <Database className="text-blue-600 mt-0.5" size={14} />
                                        <div>
                                            <p className="text-xs font-medium text-blue-800">Manual Data Exploration Available</p>
                                            <p className="text-xs text-blue-700 mt-1">
                                                Your raw data is still available for custom SQL queries. 
                                                Use table names: <code className="bg-blue-100 px-1 rounded">file_1</code>, <code className="bg-blue-100 px-1 rounded">file_2</code>, etc.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Manual SQL Query for Failed Processing */}
            {processingError && processId && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                            <Database className="text-gray-600" size={16} />
                            <span>Manual Data Exploration</span>
                        </h3>
                    </div>
                    
                    <div className="space-y-3">
                        <p className="text-xs text-gray-600">
                            Write custom SQL queries to explore your uploaded data. 
                            Your files are available as: <code className="bg-gray-100 px-1 rounded">file_1</code>, <code className="bg-gray-100 px-1 rounded">file_2</code>, etc.
                        </p>
                        
                        <div className="relative">
                            <textarea
                                value={editableSQL}
                                onChange={(e) => setEditableSQL(e.target.value)}
                                placeholder="SELECT * FROM file_1 LIMIT 10;"
                                className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm font-mono bg-gray-900 text-green-400 resize-none"
                            />
                        </div>
                        
                        <button
                            onClick={executeSQL}
                            disabled={executingSQL || !editableSQL.trim()}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded text-sm flex items-center space-x-2 disabled:cursor-not-allowed"
                        >
                            {executingSQL ? (
                                <>
                                    <RefreshCw className="animate-spin" size={14} />
                                    <span>Executing...</span>
                                </>
                            ) : (
                                <>
                                    <Play size={14} />
                                    <span>Execute SQL</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Process Button */}
            {!processResults && !isProcessing && (
                <div className="flex justify-center">
                    <button
                        onClick={onProcess}
                        disabled={isProcessing}
                        className="flex items-center space-x-2 px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        <Play size={16} />
                        <span>Process Data with AI</span>
                    </button>
                </div>
            )}

            {/* Results Section */}
            {processResults && (
                <div className="space-y-4">
                    {/* Success Header */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="text-green-600" size={20} />
                                <span className="text-sm font-medium text-green-800">Processing Completed Successfully</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                {processingTimeSeconds && (
                                    <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-md">
                                        <span className="text-xs text-green-700">⚡</span>
                                        <span className="text-xs font-medium text-green-700">
                                            {processingTimeSeconds < 1 
                                                ? `${(processingTimeSeconds * 1000).toFixed(0)}ms`
                                                : `${processingTimeSeconds.toFixed(2)}s`
                                            }
                                        </span>
                                    </div>
                                )}
                                <span className="text-sm text-green-700">
                                    {processResults.total_count && processResults.total_count !== processResults.data?.length ? 
                                        `Showing ${processResults.data?.length || 0} of ${processResults.total_count.toLocaleString()} total records` :
                                        `${processResults.data?.length || 0} records returned`
                                    }
                                </span>
                            </div>
                        </div>
                        
                        {processResults.metadata?.processing_info && (
                            <div className="mt-2 text-xs text-green-700">
                                Query Type: {processResults.metadata.processing_info.query_type} | 
                                Files Used: {processResults.metadata.processing_info.input_files || selectedFiles.length}
                                {processResults.total_count && processResults.total_count !== processResults.data?.length && (
                                    <span> | Total Records: {processResults.total_count.toLocaleString()} (sample of {processResults.data?.length || 0} shown)</span>
                                )}
                                {processingTimeSeconds && (
                                    <span> | Processing Time: {processingTimeSeconds < 1 
                                        ? `${(processingTimeSeconds * 1000).toFixed(0)}ms`
                                        : `${processingTimeSeconds.toFixed(2)}s`
                                    }</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Generated SQL Display */}
                    {generatedSQL && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg">
                            <div 
                                className="flex items-center justify-between p-3 cursor-pointer"
                                onClick={() => setShowSQL(!showSQL)}
                            >
                                <div className="flex items-center space-x-2">
                                    <Code className="text-gray-600" size={16} />
                                    <span className="text-sm font-medium text-gray-700">Generated Query</span>
                                    {isEditingSQL && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            Modified
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500">Click to {showSQL ? 'hide' : 'view'}</span>
                                    {showSQL ? <EyeOff size={14} /> : <Eye size={14} />}
                                </div>
                            </div>
                            
                            {showSQL && (
                                <div className="px-3 pb-3">
                                    <div className="relative">
                                        {!isEditingSQL ? (
                                            // Read-only view
                                            <>
                                                <pre className="bg-gray-900 text-green-400 p-4 pr-20 rounded text-sm overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed border border-gray-700">
                                                    <code>{formatSQL(generatedSQL)}</code>
                                                </pre>
                                                <div className="absolute top-2 right-2 flex items-center space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditableSQL(formatSQL(generatedSQL));
                                                            executeSQL();
                                                        }}
                                                        disabled={executingSQL}
                                                        className="text-xs text-gray-400 hover:text-green-400 bg-gray-800 px-2 py-1 rounded flex items-center space-x-1 transition-colors disabled:opacity-50"
                                                        title={!processId ? "Process your data first to execute SQL" : "Execute SQL"}
                                                    >
                                                        {executingSQL ? (
                                                            <RefreshCw className="animate-spin" size={12} />
                                                        ) : (
                                                            <Play size={12} />
                                                        )}
                                                        <span>{executingSQL ? 'Running...' : 'Execute'}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setIsEditingSQL(true)}
                                                        className="text-xs text-gray-400 hover:text-blue-400 bg-gray-800 px-2 py-1 rounded flex items-center space-x-1 transition-colors"
                                                        title="Edit SQL"
                                                    >
                                                        <Edit size={12} />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={copySQL}
                                                        className="text-xs text-gray-400 hover:text-blue-400 bg-gray-800 px-2 py-1 rounded flex items-center space-x-1 transition-colors"
                                                        title="Copy SQL"
                                                    >
                                                        <Copy size={12} />
                                                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                                                    </button>
                                                    <div className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                                                        SQL
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            // Editable view
                                            <>
                                                <textarea
                                                    ref={(ref) => {
                                                        if (ref && isEditingSQL) {
                                                            // Ensure textarea is focused when edit mode starts
                                                            setTimeout(() => ref.focus(), 100);
                                                        }
                                                    }}
                                                    value={editableSQL}
                                                    onChange={(e) => setEditableSQL(e.target.value)}
                                                    className="w-full h-64 bg-gray-900 text-green-400 p-4 rounded text-sm font-mono leading-relaxed border border-gray-700 resize-none focus:outline-none focus:border-blue-500"
                                                    placeholder="Edit your query here..."
                                                    spellCheck={false}
                                                    onKeyDown={(e) => {
                                                        // Don't prevent default for standard editing keys
                                                        if (e.key === 'Tab') {
                                                            e.preventDefault();
                                                            const start = e.target.selectionStart;
                                                            const end = e.target.selectionEnd;
                                                            const value = e.target.value;
                                                            setEditableSQL(value.substring(0, start) + '    ' + value.substring(end));
                                                            // Set cursor position after the tab
                                                            setTimeout(() => {
                                                                e.target.selectionStart = e.target.selectionEnd = start + 4;
                                                            }, 0);
                                                        }
                                                        // Let all other keys work normally (including Ctrl+A, Delete, Backspace)
                                                    }}
                                                    onFocus={(e) => {
                                                        // Ensure the textarea is properly focused and cursor is positioned
                                                        setTimeout(() => {
                                                            e.target.setSelectionRange(0, 0);
                                                        }, 0);
                                                    }}
                                                />
                                                <div className="flex justify-between items-center mt-3">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                setIsEditingSQL(false);
                                                                setEditableSQL(formatSQL(generatedSQL)); // Reset to original
                                                            }}
                                                            className="text-xs text-gray-600 hover:text-gray-800 px-3 py-1 rounded border"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={copySQL}
                                                            className="text-xs text-gray-600 hover:text-blue-600 px-3 py-1 rounded border flex items-center space-x-1"
                                                        >
                                                            <Copy size={12} />
                                                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={executeSQL}
                                                        disabled={executingSQL || !editableSQL.trim()}
                                                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded text-sm flex items-center space-x-2 disabled:cursor-not-allowed"
                                                    >
                                                        {executingSQL ? (
                                                            <>
                                                                <RefreshCw className="animate-spin" size={14} />
                                                                <span>Executing...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Play size={14} />
                                                                <span>Execute Query</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Quick Execute Button below SQL */}
                            {showSQL && !isEditingSQL && (
                                <div className="px-3 pb-3 pt-0">
                                    <button
                                        onClick={() => {
                                            setEditableSQL(formatSQL(generatedSQL));
                                            executeSQL();
                                        }}
                                        disabled={executingSQL}
                                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm flex items-center justify-center space-x-2 font-medium disabled:cursor-not-allowed transition-colors"
                                    >
                                        {executingSQL ? (
                                            <>
                                                <RefreshCw className="animate-spin" size={16} />
                                                <span>Executing Query...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Play size={16} />
                                                <span>Execute This SQL Query</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Execute Results Section */}
                    {executeResults && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="text-blue-600" size={16} />
                                    <span className="text-sm font-medium text-blue-800">Query Executed Successfully</span>
                                </div>
                                <span className="text-sm text-blue-700">
                                    {executeResults.data?.length || 0} rows returned
                                </span>
                            </div>
                            
                            {executeResults.data && executeResults.data.length > 0 && (
                                <div className="bg-white border border-blue-200 rounded overflow-hidden">
                                    <div className="overflow-x-auto max-h-64">
                                        <table className="w-full text-xs">
                                            <thead className="bg-blue-50 sticky top-0">
                                                <tr>
                                                    {Object.keys(executeResults.data[0]).map((column) => (
                                                        <th key={column} className="px-3 py-2 text-left font-medium text-blue-800 border-b border-blue-200">
                                                            {column}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {executeResults.data.slice(0, 10).map((row, rowIndex) => (
                                                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-blue-25'}>
                                                        {Object.keys(executeResults.data[0]).map((column) => (
                                                            <td key={column} className="px-3 py-2 text-gray-700 border-b border-blue-100">
                                                                {formatCellValue(row[column])}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {executeResults.data.length > 10 && (
                                        <div className="bg-blue-50 px-4 py-2 text-center text-xs text-blue-700 border-t border-blue-200">
                                            Showing first 10 of {executeResults.data.length} rows from custom query execution.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Execute Error Display */}
                    {executeError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start space-x-2">
                                <XCircle className="text-red-600 mt-0.5" size={16} />
                                <div>
                                    <span className="text-sm font-medium text-red-800">Query Execution Failed</span>
                                    <p className="text-sm text-red-700 mt-1">{executeError}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Description Display */}
                    {processResults?.metadata?.processing_info?.description && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-start space-x-2">
                                <Sparkles className="text-purple-600 mt-0.5" size={16} />
                                <div>
                                    <span className="text-sm font-medium text-purple-800">What the AI Did:</span>
                                    <p className="text-sm text-purple-700 mt-1">
                                        {processResults.metadata.processing_info.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results Table */}
                    {processResults.data && processResults.data.length > 0 ? (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                                <div className="flex items-center space-x-2">
                                    <Table className="text-gray-600" size={16} />
                                    <span className="text-sm font-medium text-gray-700">Results Preview</span>
                                    <span className="text-xs text-gray-500">
                                        {processResults.total_count && processResults.total_count > processResults.data.length ? 
                                            `(showing ${processResults.data.length} of ${processResults.total_count.toLocaleString()} total rows)` :
                                            `(${processResults.data.length} rows)`
                                        }
                                    </span>
                                </div>
                                
                                {(processResults.data.length > 10 || processResults.is_limited) && (
                                    <button
                                        onClick={processResults.is_limited ? openResultsInViewer : () => setShowAllRows(!showAllRows)}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        {processResults.is_limited ? 
                                            `View all ${(processResults.total_count || processResults.row_count || 0).toLocaleString()} rows in Data Viewer` : 
                                            (showAllRows ? 'Show first 10 rows' : 'Show all rows')
                                        }
                                    </button>
                                )}
                            </div>
                            
                            <div className="overflow-x-auto max-h-96">
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            {getResultColumns().map((column) => (
                                                <th key={column} className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-200">
                                                    {column}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getResultsPreview().map((row, rowIndex) => (
                                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                {getResultColumns().map((column) => (
                                                    <td key={column} className="px-3 py-2 text-gray-700 border-b border-gray-100">
                                                        {formatCellValue(row[column])}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {!showAllRows && processResults.data.length > 10 && !processResults.is_limited && (
                                <div className="bg-gray-50 px-4 py-2 text-center text-xs text-gray-500 border-t border-gray-200">
                                    Showing first 10 of {processResults.data.length} rows. 
                                    <button 
                                        onClick={() => setShowAllRows(true)}
                                        className="text-blue-600 hover:text-blue-700 ml-1"
                                    >
                                        Show all
                                    </button>
                                </div>
                            )}
                            
                            {processResults.is_limited && (
                                <div className="bg-blue-50 px-4 py-2 text-center text-xs text-blue-700 border-t border-blue-200">
                                    Showing first {processResults.data?.length || 0} of {(processResults.total_count || processResults.row_count || 0).toLocaleString()} rows. 
                                    <button 
                                        onClick={openResultsInViewer}
                                        className="text-blue-600 hover:text-blue-800 ml-1 font-medium"
                                    >
                                        View all {(processResults.total_count || processResults.row_count || 0).toLocaleString()} rows in Data Viewer
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : processResults && processResults.error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <div className="flex items-start space-x-3">
                                <XCircle className="text-red-600 mt-0.5" size={20} />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-red-800">SQL Execution Failed</p>
                                    <p className="text-sm text-red-700 mt-1">
                                        {processResults.error || 'An error occurred while executing the query'}
                                    </p>
                                    
                                    
                                    {/* AI Error Analysis Section */}
                                    {processResults.error_analysis && (
                                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-start space-x-2">
                                                <Sparkles className="text-blue-600 mt-0.5" size={16} />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-blue-800 mb-2">🤖 AI Error Analysis</p>
                                                    
                                                    {processResults.error_analysis.user_friendly_message && (
                                                        <div className="mb-3">
                                                            <p className="text-sm text-blue-700">
                                                                {processResults.error_analysis.user_friendly_message}
                                                            </p>
                                                        </div>
                                                    )}
                                                    
                                                    {processResults.error_analysis.technical_details && (
                                                        <div className="mb-3">
                                                            <p className="text-xs font-medium text-blue-800 mb-1">Technical Details:</p>
                                                            <p className="text-xs text-blue-700 bg-white p-2 rounded border">
                                                                {processResults.error_analysis.technical_details}
                                                            </p>
                                                        </div>
                                                    )}
                                                    
                                                    {processResults.error_analysis.suggested_fixes && processResults.error_analysis.suggested_fixes.length > 0 && (
                                                        <div className="mb-3">
                                                            <p className="text-xs font-medium text-blue-800 mb-2">💡 Suggested Fixes:</p>
                                                            <ul className="text-xs text-blue-700 space-y-1">
                                                                {processResults.error_analysis.suggested_fixes.map((fix, index) => (
                                                                    <li key={index} className="flex items-start space-x-2">
                                                                        <span className="text-blue-600 mt-0.5">•</span>
                                                                        <span>{fix}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    
                                                    {processResults.error_analysis.prevention_tip && (
                                                        <div className="mb-2">
                                                            <p className="text-xs font-medium text-blue-800 mb-1">💭 Prevention Tip:</p>
                                                            <p className="text-xs text-blue-700 italic bg-white p-2 rounded border">
                                                                {processResults.error_analysis.prevention_tip}
                                                            </p>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2 text-xs">
                                                            <span className="text-blue-600">Error Type:</span>
                                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                {processResults.error_analysis.error_type || 'unknown'}
                                                            </span>
                                                            <span className="text-blue-600">Confidence:</span>
                                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                {processResults.error_analysis.confidence || 'medium'}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Column Mapping Button - show only for column-related errors */}
                                                        {(processResults.error_analysis.error_type === 'column_not_found' || 
                                                          getMissingColumns().length > 0) && (
                                                            <button
                                                                onClick={handleOpenColumnMapping}
                                                                className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 flex items-center space-x-1"
                                                            >
                                                                <Settings size={12} />
                                                                <span>Fix Columns</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {processResults.errors && processResults.errors.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs font-medium text-red-800 mb-1">Error Details:</p>
                                            <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
                                                {processResults.errors.map((error, index) => (
                                                    <li key={index}>{error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {processResults.warnings && processResults.warnings.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs font-medium text-red-800 mb-1">Warnings:</p>
                                            <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
                                                {processResults.warnings.map((warning, index) => (
                                                    <li key={index}>{warning}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                            <AlertCircle className="text-yellow-600 mx-auto mb-2" size={24} />
                            <p className="text-sm font-medium text-yellow-800">No Results Found</p>
                            <p className="text-xs text-yellow-700 mt-1">
                                Your query completed successfully but returned no data. Try adjusting your query or checking your data.
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-center space-x-3">
                        <button
                            onClick={() => setShowSavePromptModal(true)}
                            disabled={!processResults?.data || processResults.data.length === 0 || !userPrompt}
                            className="flex items-center space-x-1 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            <Save size={16} />
                            <span>Save Prompt</span>
                        </button>
                        <button
                            onClick={() => onCreateTemplate && onCreateTemplate({
                                user_prompt: userPrompt,
                                file_schemas: selectedFiles.map(file => ({
                                    filename: file.filename,
                                    columns: file.columns || [],
                                    sample_data: file.sample_data || {}
                                })),
                                process_results: processResults,
                                generated_sql: generatedSQL,
                                process_id: processId
                            })}
                            disabled={!processResults?.data || processResults.data.length === 0 || !userPrompt || !onCreateTemplate}
                            className="flex items-center space-x-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            <Sparkles size={16} />
                            <span>Save as UseCase</span>
                        </button>
                        <button
                            onClick={onProcess}
                            disabled={isProcessing}
                            className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            <RefreshCw size={16} />
                            <span>Reprocess</span>
                        </button>
                        <button
                            onClick={onClear}
                            className="flex items-center space-x-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            <Trash2 size={16} />
                            <span>Clear Results</span>
                        </button>
                    </div>

                    {/* Save Prompt Error */}
                    {savePromptError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-start space-x-2">
                                <XCircle className="text-red-600 mt-0.5" size={14} />
                                <div>
                                    <span className="text-sm font-medium text-red-800">Failed to Generate Prompt</span>
                                    <p className="text-sm text-red-700 mt-1">{savePromptError}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Help Section */}
            {!processResults && !isProcessing && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                        <Database size={16} className="text-purple-600 mt-0.5"/>
                        <div className="text-sm text-purple-800">
                            <p className="font-medium mb-2">What happens when you process:</p>
                            <ol className="list-decimal list-inside space-y-1 text-xs">
                                <li>AI analyzes your files and generates optimized SQL queries</li>
                                <li>DuckDB processes your data efficiently in-memory</li>
                                <li>Results are returned in real-time with preview</li>
                                <li>You can download results in CSV or Excel format</li>
                                <li>View the generated SQL for transparency and learning</li>
                            </ol>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Prompt Modal */}
            {showSavePromptModal && (
                <PromptSaveLoad
                    currentPrompt={userPrompt}
                    processName={processName}
                    selectedFiles={selectedFiles}
                    processResults={processResults}
                    generatedSQL={generatedSQL}
                    processId={processId}
                    onPromptLoaded={() => {}} // Not used in save mode
                    onPromptSaved={() => {
                        setShowSavePromptModal(false);
                        console.log('✅ Prompt saved from results section');
                    }}
                    onClose={() => setShowSavePromptModal(false)}
                    defaultTab="save"
                />
            )}

            {/* Column Mapping Modal */}
            {showColumnMappingModal && (
                <ColumnMappingModal
                    isOpen={showColumnMappingModal}
                    onClose={() => setShowColumnMappingModal(false)}
                    onApplyMapping={handleColumnMappingApply}
                    onReturnToError={handleColumnMappingCancel}
                    errorData={processResults}
                    availableColumns={getAvailableColumns()}
                    missingColumns={getMissingColumns()}
                    generatedSQL={generatedSQL}
                    processing={columnMappingProcessing}
                />
            )}
        </div>
    );
};

export default MiscellaneousPreview;