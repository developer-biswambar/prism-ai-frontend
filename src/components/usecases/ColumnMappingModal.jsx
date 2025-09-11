/**
 * Column Mapping Modal Component
 * Handles user intervention when templates need column mapping
 */

import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle,
    X,
    RefreshCw,
    Info,
    Play,
    Loader
} from 'lucide-react';

const ColumnMappingModal = ({
    isOpen,
    onClose,
    templateData,
    suggestions,
    onApplyMapping,
    isExecuting = false
}) => {
    const [columnMapping, setColumnMapping] = useState({});
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        if (isOpen && suggestions) {
            // Initialize mapping with first suggestion for each column
            const initialMapping = {};
            Object.entries(suggestions).forEach(([templateCol, availableOptions]) => {
                if (availableOptions.length > 0) {
                    initialMapping[templateCol] = availableOptions[0];
                }
            });
            setColumnMapping(initialMapping);
            setValidationErrors({});
        }
    }, [isOpen, suggestions]);

    const handleMappingChange = (templateColumn, selectedColumn) => {
        setColumnMapping(prev => ({
            ...prev,
            [templateColumn]: selectedColumn
        }));
        
        // Clear validation error for this column
        if (validationErrors[templateColumn]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[templateColumn];
                return newErrors;
            });
        }
    };

    const validateMapping = () => {
        const errors = {};
        Object.keys(suggestions).forEach(templateCol => {
            if (!columnMapping[templateCol]) {
                errors[templateCol] = 'Please select a column mapping';
            }
        });
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleApply = () => {
        if (validateMapping()) {
            onApplyMapping(columnMapping);
        }
    };

    const handleAutoMap = () => {
        // Auto-map based on similarity scores (if available) or first suggestions
        const autoMapping = {};
        Object.entries(suggestions).forEach(([templateCol, options]) => {
            if (options.length > 0) {
                // Pick the first option (usually highest similarity)
                autoMapping[templateCol] = options[0];
            }
        });
        setColumnMapping(autoMapping);
        setValidationErrors({});
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="text-orange-600" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Column Mapping Required
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Template needs column mapping to work with your current data
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isExecuting}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {/* Template Info */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center space-x-2 mb-2">
                            <Info className="text-blue-600" size={16} />
                            <h3 className="font-medium text-blue-900">Template: {templateData?.name}</h3>
                        </div>
                        <p className="text-sm text-blue-700">
                            {templateData?.description}
                        </p>
                    </div>

                    {/* Mapping Instructions */}
                    <div className="mb-6">
                        <h3 className="font-medium text-gray-900 mb-2">Map Template Columns to Your Data</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            The template expects certain column names that don't exactly match your file. 
                            Please map each template column to the appropriate column in your data.
                        </p>
                        
                        <div className="flex items-center space-x-2 mb-4">
                            <button
                                onClick={handleAutoMap}
                                disabled={isExecuting}
                                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                            >
                                <RefreshCw size={14} />
                                <span>Auto-map Best Matches</span>
                            </button>
                        </div>
                    </div>

                    {/* Column Mapping Grid */}
                    <div className="space-y-4">
                        {Object.entries(suggestions).map(([templateColumn, availableColumns]) => (
                            <div 
                                key={templateColumn}
                                className={`border rounded-lg p-4 ${
                                    validationErrors[templateColumn] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 flex-1">
                                        {/* Template Column */}
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Template Column
                                            </label>
                                            <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-md font-mono text-sm">
                                                {templateColumn}
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <div className="flex-shrink-0">
                                            <ArrowRight className="text-gray-400" size={20} />
                                        </div>

                                        {/* Your Column Selection */}
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Your Column
                                            </label>
                                            <select
                                                value={columnMapping[templateColumn] || ''}
                                                onChange={(e) => handleMappingChange(templateColumn, e.target.value)}
                                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    validationErrors[templateColumn] 
                                                        ? 'border-red-300' 
                                                        : 'border-gray-300'
                                                }`}
                                                disabled={isExecuting}
                                            >
                                                <option value="">Select a column...</option>
                                                {availableColumns.map((column, index) => (
                                                    <option key={index} value={column}>
                                                        {column}
                                                        {index === 0 ? ' (best match)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Status Indicator */}
                                    <div className="flex-shrink-0 ml-4">
                                        {columnMapping[templateColumn] ? (
                                            <CheckCircle className="text-green-500" size={20} />
                                        ) : (
                                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                                        )}
                                    </div>
                                </div>

                                {/* Validation Error */}
                                {validationErrors[templateColumn] && (
                                    <div className="mt-2 text-sm text-red-600">
                                        {validationErrors[templateColumn]}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Preview of Mapping */}
                    {Object.keys(columnMapping).length > 0 && (
                        <div className="mt-6 bg-green-50 rounded-lg p-4">
                            <h4 className="font-medium text-green-900 mb-2">Mapping Preview</h4>
                            <div className="text-sm text-green-700">
                                {Object.entries(columnMapping)
                                    .filter(([_, value]) => value)
                                    .map(([templateCol, yourCol]) => (
                                        <div key={templateCol} className="flex items-center space-x-2">
                                            <span className="font-mono">{templateCol}</span>
                                            <ArrowRight size={12} />
                                            <span className="font-mono">{yourCol}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                        This mapping will be saved to make future executions faster
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={onClose}
                            disabled={isExecuting}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        
                        <button
                            onClick={handleApply}
                            disabled={isExecuting || Object.keys(validationErrors).length > 0 || Object.keys(columnMapping).length === 0}
                            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExecuting ? (
                                <>
                                    <Loader className="animate-spin" size={16} />
                                    <span>Applying & Executing...</span>
                                </>
                            ) : (
                                <>
                                    <Play size={16} />
                                    <span>Apply Mapping & Execute</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ColumnMappingModal;