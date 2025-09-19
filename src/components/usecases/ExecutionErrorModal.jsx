/**
 * Execution Error Modal Component
 * Shows detailed error analysis and gives user options for resolving execution failures
 */

import React, {useState} from 'react';
import {
    AlertTriangle,
    ArrowRight,
    Brain,
    CheckCircle,
    FileText,
    Lightbulb,
    Loader,
    Settings,
    X,
    XCircle
} from 'lucide-react';

const ExecutionErrorModal = ({
                                 isOpen,
                                 onClose,
                                 errorData,
                                 onRetryWithAI = null,
                                 onManualMapping = null
                             }) => {
    const [retrying, setRetrying] = useState(false);
    const [selectedOption, setSelectedOption] = useState('');
    const [loadingMessage, setLoadingMessage] = useState('');

    if (!isOpen || !errorData) return null;

    const handleOptionSelect = async (option) => {
        console.log('🔧 ExecutionErrorModal: User selected option:', option);
        setSelectedOption(option);

        if (option === 'ai_assisted') {
            if (onRetryWithAI) {
                setRetrying(true);
                setLoadingMessage('Analyzing your data with AI...');
                try {
                    await onRetryWithAI();
                } catch (error) {
                    console.error('AI retry failed:', error);
                } finally {
                    setRetrying(false);
                    setLoadingMessage('');
                }
            }
        } else if (option === 'column_mapping') {
            if (onManualMapping) {
                setLoadingMessage('Opening column mapping...');
                onManualMapping();
                setLoadingMessage('');
            }
        } else if (option === 'cancel') {
            onClose();
        }
    };

    const getErrorIcon = (errorType) => {
        switch (errorType) {
            case 'missing_column':
            case 'missing_required_columns':
                return <FileText className="text-orange-500" size={24}/>;
            default:
                return <AlertTriangle className="text-red-500" size={24}/>;
        }
    };

    const getErrorTitle = (errorType) => {
        switch (errorType) {
            case 'missing_column':
                return 'Column Not Found';
            case 'missing_required_columns':
                return 'Required Columns Missing';
            case 'general_sql_error':
                return 'SQL Execution Error';
            default:
                return 'Execution Failed';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        {getErrorIcon(errorData.error_analysis?.error_type)}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {getErrorTitle(errorData.error_analysis?.error_type)}
                            </h2>
                            <p className="text-sm text-gray-600">
                                The use case couldn't be executed as expected
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={retrying}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X size={24}/>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Error Analysis */}
                    {errorData.error_analysis && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <Lightbulb className="text-orange-500 flex-shrink-0 mt-0.5" size={20}/>
                                <div>
                                    <h3 className="font-medium text-orange-900 mb-2">What went wrong?</h3>
                                    <p className="text-sm text-orange-800 mb-3">
                                        {errorData.error_analysis.user_hint}
                                    </p>

                                    {/* Suggestions */}
                                    {errorData.error_analysis.suggestions && errorData.error_analysis.suggestions.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-orange-900 mb-2">Suggestions:</h4>
                                            <ul className="text-sm text-orange-800 space-y-1">
                                                {errorData.error_analysis.suggestions.map((suggestion, index) => (
                                                    <li key={index} className="flex items-start space-x-2">
                                                        <span className="text-orange-500 mt-0.5">•</span>
                                                        <span>{suggestion}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Missing/Available Columns */}
                    {errorData.error_analysis && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Missing Columns */}
                            {errorData.error_analysis.missing_columns && errorData.error_analysis.missing_columns.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h3 className="font-medium text-red-900 mb-2 flex items-center space-x-2">
                                        <XCircle size={16}/>
                                        <span>Missing Columns</span>
                                    </h3>
                                    <div className="space-y-1">
                                        {errorData.error_analysis.missing_columns.map(column => (
                                            <span key={column}
                                                  className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-2">
                                                {column}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Available Columns */}
                            {errorData.error_analysis.available_columns && errorData.error_analysis.available_columns.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h3 className="font-medium text-green-900 mb-2 flex items-center space-x-2">
                                        <CheckCircle size={16}/>
                                        <span>Your Data Has</span>
                                    </h3>
                                    <div className="space-y-1">
                                        {errorData.error_analysis.available_columns.map(column => (
                                            <span key={column}
                                                  className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2">
                                                {column}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Raw Error (Collapsible) */}
                    <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <summary className="font-medium text-gray-900 cursor-pointer">
                            Technical Details
                        </summary>
                        <pre className="mt-3 text-xs text-gray-600 bg-gray-100 p-3 rounded overflow-x-auto">
                            {errorData.execution_error}
                        </pre>
                    </details>

                    {/* Options */}
                    <div className="space-y-3">
                        <h3 className="font-medium text-gray-900">How would you like to proceed?</h3>

                        {errorData.available_options && errorData.available_options.map(option => (
                            <button
                                key={option.option}
                                onClick={() => handleOptionSelect(option.option)}
                                disabled={retrying}
                                className={`w-full p-4 border rounded-lg text-left hover:bg-gray-50 disabled:opacity-50 transition-colors ${
                                    selectedOption === option.option ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                }`}
                            >
                                <div className="flex items-start space-x-3">
                                    {option.option === 'ai_assisted' &&
                                        <Brain className="text-blue-500 flex-shrink-0 mt-0.5" size={20}/>}
                                    {option.option === 'column_mapping' &&
                                        <Settings className="text-purple-500 flex-shrink-0 mt-0.5" size={20}/>}
                                    {option.option === 'cancel' &&
                                        <XCircle className="text-gray-500 flex-shrink-0 mt-0.5" size={20}/>}

                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium text-gray-900">{option.label}</h4>
                                            {retrying && selectedOption === option.option && (
                                                <div className="flex items-center space-x-2">
                                                    <Loader className="animate-spin text-blue-500" size={16}/>
                                                    <span className="text-sm text-blue-600">{loadingMessage}</span>
                                                </div>
                                            )}
                                            {!retrying && (
                                                <ArrowRight className="text-gray-400" size={16}/>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>

                                        {/* AI Option Warning */}
                                        {option.option === 'ai_assisted' && (
                                            <div
                                                className="mt-2 p-2 bg-blue-100 border border-blue-200 rounded text-xs text-blue-800">
                                                <strong>Note:</strong> AI will analyze your data and adapt the query
                                                automatically.
                                                This may produce different results than the original template.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-600">
                        💡 Tip: AI assistance works best when your data has similar structure to the original template
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExecutionErrorModal;