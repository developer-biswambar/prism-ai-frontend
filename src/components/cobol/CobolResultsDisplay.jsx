/**
 * COBOL Results Display Component
 * Shows transformation results including explanation, SQL, and execution results
 */

import React, { useState } from 'react';
import {
    CheckCircle,
    AlertCircle,
    Code,
    Database,
    Download,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    FileCode,
    Clock
} from 'lucide-react';
import CobolExplanationDisplay from './CobolExplanationDisplay.jsx';

const CobolResultsDisplay = ({ results, cobolFile, dataFiles, onStartOver }) => {
    const [showSQL, setShowSQL] = useState(false);
    const [showExplanation, setShowExplanation] = useState(true);
    const [showData, setShowData] = useState(true);

    if (!results) {
        return null;
    }

    const { success, message, generated_sql, cobol_explanation, execution_results, processing_time_seconds, errors, warnings } = results;

    // Download results as JSON
    const handleDownloadJSON = () => {
        const dataStr = JSON.stringify(execution_results?.data || [], null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cobol_results_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Download results as CSV
    const handleDownloadCSV = () => {
        if (!execution_results?.data || execution_results.data.length === 0) return;

        const headers = Object.keys(execution_results.data[0]);
        const csvRows = [
            headers.join(','),
            ...execution_results.data.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Escape quotes and wrap in quotes if contains comma
                    const escaped = String(value).replace(/"/g, '""');
                    return escaped.includes(',') ? `"${escaped}"` : escaped;
                }).join(',')
            )
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cobol_results_${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Download SQL
    const handleDownloadSQL = () => {
        const sqlBlob = new Blob([generated_sql || ''], { type: 'text/plain' });
        const url = URL.createObjectURL(sqlBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `generated_sql_${Date.now()}.sql`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Success/Error Header */}
            <div
                className={`rounded-lg p-6 ${
                    success
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : 'bg-gradient-to-r from-red-500 to-orange-500'
                } text-white`}
            >
                <div className="flex items-center space-x-3 mb-2">
                    {success ? (
                        <CheckCircle size={32} />
                    ) : (
                        <AlertCircle size={32} />
                    )}
                    <h2 className="text-2xl font-bold">
                        {success ? 'Transformation Successful!' : 'Transformation Failed'}
                    </h2>
                </div>
                <p className="text-white/90 mb-4">{message}</p>

                {/* Stats */}
                <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                        <FileCode size={16} />
                        <span>{cobolFile?.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Database size={16} />
                        <span>{dataFiles?.length} data file{dataFiles?.length !== 1 ? 's' : ''}</span>
                    </div>
                    {processing_time_seconds && (
                        <div className="flex items-center space-x-2">
                            <Clock size={16} />
                            <span>{processing_time_seconds.toFixed(2)}s</span>
                        </div>
                    )}
                    {execution_results?.row_count && (
                        <div className="flex items-center space-x-2">
                            <CheckCircle size={16} />
                            <span>{execution_results.row_count} rows</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Errors */}
            {errors && errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-2 flex items-center space-x-2">
                        <AlertCircle size={18} />
                        <span>Errors</span>
                    </h3>
                    <ul className="space-y-1">
                        {errors.map((error, index) => (
                            <li key={index} className="text-sm text-red-700">• {error}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Warnings */}
            {warnings && warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-900 mb-2 flex items-center space-x-2">
                        <AlertCircle size={18} />
                        <span>Warnings</span>
                    </h3>
                    <ul className="space-y-1">
                        {warnings.map((warning, index) => (
                            <li key={index} className="text-sm text-yellow-700">• {warning}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
                <button
                    onClick={onStartOver}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw size={18} />
                    <span>Start Over</span>
                </button>

                <div className="flex items-center space-x-2">
                    {generated_sql && (
                        <button
                            onClick={handleDownloadSQL}
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <Download size={18} />
                            <span>Download SQL</span>
                        </button>
                    )}
                    {execution_results?.data && execution_results.data.length > 0 && (
                        <>
                            <button
                                onClick={handleDownloadCSV}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Download size={18} />
                                <span>Download CSV</span>
                            </button>
                            <button
                                onClick={handleDownloadJSON}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Download size={18} />
                                <span>Download JSON</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* COBOL Explanation */}
            {cobol_explanation && (
                <div>
                    <button
                        onClick={() => setShowExplanation(!showExplanation)}
                        className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors mb-4"
                    >
                        <div className="flex items-center space-x-2">
                            <Code className="text-blue-600" size={20} />
                            <span className="font-semibold text-blue-900">COBOL Code Explanation</span>
                        </div>
                        {showExplanation ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {showExplanation && (
                        <CobolExplanationDisplay explanation={cobol_explanation} />
                    )}
                </div>
            )}

            {/* Generated SQL */}
            {generated_sql && (
                <div>
                    <button
                        onClick={() => setShowSQL(!showSQL)}
                        className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors mb-4"
                    >
                        <div className="flex items-center space-x-2">
                            <Database className="text-purple-600" size={20} />
                            <span className="font-semibold text-purple-900">Generated SQL Query</span>
                        </div>
                        {showSQL ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {showSQL && (
                        <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
                            <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                                {generated_sql}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            {/* Execution Results */}
            {execution_results?.data && execution_results.data.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowData(!showData)}
                        className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors mb-4"
                    >
                        <div className="flex items-center space-x-2">
                            <Database className="text-green-600" size={20} />
                            <span className="font-semibold text-green-900">
                                Execution Results ({execution_results.row_count} rows)
                            </span>
                        </div>
                        {showData ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {showData && (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {execution_results.columns.map((col, index) => (
                                                <th
                                                    key={index}
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {execution_results.data.slice(0, 100).map((row, rowIndex) => (
                                            <tr key={rowIndex} className="hover:bg-gray-50">
                                                {execution_results.columns.map((col, colIndex) => (
                                                    <td
                                                        key={colIndex}
                                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                                    >
                                                        {row[col] !== null && row[col] !== undefined
                                                            ? String(row[col])
                                                            : '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {execution_results.row_count > 100 && (
                                <div className="bg-gray-50 px-6 py-3 text-sm text-gray-500 text-center border-t border-gray-200">
                                    Showing first 100 rows of {execution_results.row_count} total rows.
                                    Download to see all results.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CobolResultsDisplay;
