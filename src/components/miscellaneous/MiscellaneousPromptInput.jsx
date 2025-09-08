import React, {useState} from 'react';
import {
    AlertCircle,
    Database,
    FileSpreadsheet,
    FileText,
    Lightbulb,
    MessageSquare,
    Sparkles,
    RefreshCw,
    CheckCircle,
    Brain,
    Play
} from 'lucide-react';

const MiscellaneousPromptInput = ({
    userPrompt,
    onPromptChange,
    processName,
    onProcessNameChange,
    outputFormat,
    onOutputFormatChange,
    selectedFiles,
    hasExistingResults = false,
    hasPromptChanged = false,
    onReprocess,
    onProcessData,
    isProcessing = false
}) => {

    const [showExamples, setShowExamples] = useState(false);

    const examplePrompts = [
        {
            category: "Data Reconciliation",
            examples: [
                "Compare file_0 and file_1 to find records missing from file_1",
                "Find mismatches between file_0 and file_1 based on transaction_id and amount",
                "Show records that exist in file_0 but not in file_1",
                "Reconcile customer data between file_0 and file_1 using email address"
            ]
        },
        {
            category: "Data Merging & Deduplication",
            examples: [
                "Merge all files and remove duplicates based on email address",
                "Combine file_0 and file_1 and keep only unique records",
                "Join file_0 with file_1 on customer_id and merge their data",
                "Merge files and show consolidated customer information"
            ]
        },
        {
            category: "Delta Analysis",
            examples: [
                "Show differences between January data (file_0) and February data (file_1)",
                "Compare sales between file_0 and file_1 and highlight changes",
                "Find products with changed prices between file_0 and file_1",
                "Calculate month-over-month growth from file_0 to file_1"
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
            reference: `file_${index}`,
            name: file.filename,
            rows: file.totalRows,
            columns: file.columns.slice(0, 5).join(', ') + (file.columns.length > 5 ? '...' : '')
        }));
    };

    const insertExample = (example) => {
        onPromptChange(example);
        setShowExamples(false);
    };

    const getCharacterCount = () => userPrompt.length;
    const isPromptValid = () => userPrompt.trim().length >= 10;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-800">Natural Language Query</h3>
                <p className="text-sm text-gray-600">
                    Describe what you want to do with your data in plain English. Our AI will convert your request into efficient SQL queries.
                </p>
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
                    maxLength={100}
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
                            onClick={() => setShowExamples(!showExamples)}
                            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
                        >
                            <Lightbulb size={14} />
                            <span>Examples</span>
                        </button>
                    </div>
                </div>

                <textarea
                    value={userPrompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                        isPromptValid() ? 'border-gray-300' : 'border-red-300'
                    }`}
                    placeholder="Describe what you want to do with your data... For example:
• 'Compare file_0 and file_1 to find missing records'
• 'Calculate running totals by customer'  
• 'Find customers who spent more than $1000'
• 'Merge all files and remove duplicates'"
                    rows={6}
                    maxLength={1000}
                />

                {!isPromptValid() && (
                    <div className="text-xs text-red-500 mt-1 flex items-center space-x-1">
                        <AlertCircle size={12} />
                        <span>Please provide at least 10 characters describing your data operation</span>
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

            {/* Output Format Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Output Format
                </label>
                <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            value="json"
                            checked={outputFormat === 'json'}
                            onChange={(e) => onOutputFormatChange(e.target.value)}
                            className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700">JSON (for viewing)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            value="csv"
                            checked={outputFormat === 'csv'}
                            onChange={(e) => onOutputFormatChange(e.target.value)}
                            className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700">CSV (for download)</span>
                    </label>
                </div>
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

            {/* Tips Section */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                    <MessageSquare size={16} className="text-green-600 mt-0.5"/>
                    <div className="text-sm text-green-800">
                        <p className="font-medium mb-2">Tips for Better Results:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li><strong>Be specific</strong>: "Compare amounts in file_0 with file_1" vs "compare files"</li>
                            <li><strong>Use file references</strong>: file_0, file_1, etc. to refer to your selected files</li>
                            <li><strong>Mention column names</strong>: if you know specific columns to work with</li>
                            <li><strong>State your goal clearly</strong>: find differences, calculate totals, merge data, etc.</li>
                            <li><strong>Include conditions</strong>: "where status = 'active'" or "for last 30 days"</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* AI Processing Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                    <Sparkles size={16} className="text-purple-600 mt-0.5"/>
                    <div className="text-sm text-purple-800">
                        <p className="font-medium mb-1">How AI Processing Works:</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs">
                            <li>AI analyzes your selected files and their column structures</li>
                            <li>Converts your natural language query into optimized SQL</li>
                            <li>Executes the query using DuckDB for high performance</li>
                            <li>Returns results in your chosen format</li>
                            <li>Shows you the generated SQL for transparency</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MiscellaneousPromptInput;