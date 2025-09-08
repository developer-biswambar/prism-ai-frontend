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
    Table,
    Trash2,
    XCircle
} from 'lucide-react';
import { formatSQL } from '../../utils/sqlFormatter';
import { API_ENDPOINTS } from '../../config/environment';

const MiscellaneousPreview = ({
    userPrompt,
    processName,
    selectedFiles,
    isProcessing,
    processResults,
    generatedSQL,
    processingError,
    processId,
    onProcess,
    onDownload,
    onClear
}) => {

    const [showSQL, setShowSQL] = useState(false);
    const [showAllRows, setShowAllRows] = useState(false);
    const [copied, setCopied] = useState(false);
    const [editableSQL, setEditableSQL] = useState('');
    const [isEditingSQL, setIsEditingSQL] = useState(false);
    const [executingSQL, setExecutingSQL] = useState(false);
    const [executeResults, setExecuteResults] = useState(null);
    const [executeError, setExecuteError] = useState(null);

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
                                    <span><strong>file_{index}</strong>: {file.filename} ({file.totalRows} rows)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <span className="text-xs font-medium text-blue-700">Your Query:</span>
                        <p className="text-sm text-blue-800 bg-white p-2 rounded border italic">
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
                        AI is analyzing your files and generating optimized SQL queries. This may take a few moments.
                    </div>
                </div>
            )}

            {/* Error Display */}
            {processingError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                        <XCircle className="text-red-600 mt-0.5" size={16} />
                        <div>
                            <span className="text-sm font-medium text-red-800">Processing Failed</span>
                            <p className="text-sm text-red-700 mt-1">{processingError}</p>
                        </div>
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
                                <span className="text-sm text-green-700">
                                    {processResults.data?.length || 0} rows returned
                                </span>
                            </div>
                        </div>
                        
                        {processResults.metadata?.processing_info && (
                            <div className="mt-2 text-xs text-green-700">
                                Query Type: {processResults.metadata.processing_info.query_type} | 
                                Files Used: {processResults.metadata.processing_info.input_files || selectedFiles.length}
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
                                                        title="Execute SQL"
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
                                                    value={editableSQL}
                                                    onChange={(e) => setEditableSQL(e.target.value)}
                                                    className="w-full h-64 bg-gray-900 text-green-400 p-4 rounded text-sm font-mono leading-relaxed border border-gray-700 resize-none focus:outline-none focus:border-blue-500"
                                                    placeholder="Edit your SQL query here..."
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

                    {/* Results Table */}
                    {processResults.data && processResults.data.length > 0 ? (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                                <div className="flex items-center space-x-2">
                                    <Table className="text-gray-600" size={16} />
                                    <span className="text-sm font-medium text-gray-700">Results Preview</span>
                                    <span className="text-xs text-gray-500">
                                        ({processResults.data.length} total rows)
                                    </span>
                                </div>
                                
                                {(processResults.data.length > 10 || processResults.is_limited) && (
                                    <button
                                        onClick={processResults.is_limited ? openResultsInViewer : () => setShowAllRows(!showAllRows)}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        {processResults.is_limited ? 
                                            `View all ${processResults.row_count} rows in Data Viewer` : 
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
                                    Showing first {processResults.preview_rows} of {processResults.row_count} rows. 
                                    <button 
                                        onClick={openResultsInViewer}
                                        className="text-blue-600 hover:text-blue-800 ml-1 font-medium"
                                    >
                                        View all {processResults.row_count} rows in Data Viewer
                                    </button>
                                </div>
                            )}
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
                            onClick={onClear}
                            className="flex items-center space-x-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            <Trash2 size={16} />
                            <span>Clear Results</span>
                        </button>
                    </div>
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
        </div>
    );
};

export default MiscellaneousPreview;