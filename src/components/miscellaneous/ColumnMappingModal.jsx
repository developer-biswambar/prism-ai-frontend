/**
 * Column Mapping Modal Component
 * Allows users to manually map missing columns from SQL errors to available columns in their data
 */

import React, {useEffect, useState} from 'react';
import {
    AlertTriangle,
    ArrowRight,
    Check,
    CheckCircle,
    Database,
    RefreshCw,
    Search,
    Settings,
    X,
    XCircle
} from 'lucide-react';

const ColumnMappingModal = ({
                                isOpen,
                                onClose,
                                onApplyMapping,
                                onReturnToError,
                                errorData,
                                availableColumns = [],
                                missingColumns = [],
                                generatedSQL = '',
                                processing = false
                            }) => {
    const [columnMapping, setColumnMapping] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredColumns, setFilteredColumns] = useState(availableColumns);

    useEffect(() => {
        if (isOpen) {
            // Initialize mapping with empty selections
            const initialMapping = {};
            missingColumns.forEach(col => {
                initialMapping[col] = '';
            });
            setColumnMapping(initialMapping);
        }
    }, [isOpen, missingColumns]);

    useEffect(() => {
        // Filter available columns based on search term
        const filtered = availableColumns.filter(col =>
            col.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredColumns(filtered);
    }, [searchTerm, availableColumns]);

    if (!isOpen) return null;

    const handleColumnSelect = (missingColumn, selectedColumn) => {
        setColumnMapping(prev => ({
            ...prev,
            [missingColumn]: selectedColumn
        }));
    };

    const handleApplyMapping = () => {
        // Filter out unmapped columns
        const validMapping = {};
        Object.entries(columnMapping).forEach(([missing, selected]) => {
            if (selected) {
                validMapping[missing] = selected;
            }
        });

        onApplyMapping(validMapping);
    };

    const handleCancel = () => {
        // Return to the SQL Execution Error modal instead of closing everything
        onReturnToError();
    };

    const getMappedCount = () => {
        return Object.values(columnMapping).filter(mapping => mapping).length;
    };

    const getUnmappedColumns = () => {
        return Object.entries(columnMapping)
            .filter(([_, mapped]) => !mapped)
            .map(([missing, _]) => missing);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <Settings className="text-purple-500" size={24}/>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Column Mapping Required
                            </h2>
                            <p className="text-sm text-gray-600">
                                Map missing columns to available columns in your data
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleCancel}
                        disabled={processing}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X size={24}/>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Missing Columns */}
                        <div className="lg:col-span-2">
                            <div className="mb-4">
                                <h3 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                                    <XCircle className="text-red-500" size={16}/>
                                    <span>Required Columns ({missingColumns.length})</span>
                                </h3>
                                <p className="text-sm text-gray-600">
                                    These columns are needed for the SQL query but aren't found in your data
                                </p>
                            </div>

                            <div className="space-y-4">
                                {missingColumns.map((missingCol) => (
                                    <div key={missingCol} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-2">
                                                <span
                                                    className="bg-red-100 text-red-800 text-sm px-3 py-1 rounded font-medium">
                                                    {missingCol}
                                                </span>
                                                {columnMapping[missingCol] && (
                                                    <>
                                                        <ArrowRight className="text-gray-400" size={16}/>
                                                        <span
                                                            className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded font-medium">
                                                            {columnMapping[missingCol]}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            {columnMapping[missingCol] && (
                                                <Check className="text-green-500" size={16}/>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Map to available column:
                                            </label>
                                            <select
                                                value={columnMapping[missingCol] || ''}
                                                onChange={(e) => handleColumnSelect(missingCol, e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            >
                                                <option value="">Select a column...</option>
                                                {availableColumns.map(col => (
                                                    <option key={col} value={col}>
                                                        {col}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Available Columns */}
                        <div>
                            <div className="mb-4">
                                <h3 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                                    <CheckCircle className="text-green-500" size={16}/>
                                    <span>Your Data Columns</span>
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Available columns in your dataset
                                </p>
                            </div>

                            {/* Search */}
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                        size={16}/>
                                <input
                                    type="text"
                                    placeholder="Search columns..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                />
                            </div>

                            {/* Column List */}
                            <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                                {filteredColumns.length > 0 ? (
                                    <div className="space-y-1">
                                        {filteredColumns.map(col => {
                                            const isUsed = Object.values(columnMapping).includes(col);
                                            return (
                                                <div key={col} className={`text-sm px-2 py-1 rounded ${
                                                    isUsed ? 'bg-green-50 text-green-700' : 'text-gray-700'
                                                }`}>
                                                    <div className="flex items-center justify-between">
                                                        <span>{col}</span>
                                                        {isUsed && <Check className="text-green-500" size={14}/>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500 text-center py-4">
                                        No columns match your search
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mapping Summary */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Mapping Summary</h4>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-800">
                                {getMappedCount()} of {missingColumns.length} columns mapped
                            </span>
                            <div className="flex items-center space-x-4">
                                {getMappedCount() === missingColumns.length ? (
                                    <span className="text-green-600 flex items-center space-x-1">
                                        <CheckCircle size={16}/>
                                        <span>All columns mapped</span>
                                    </span>
                                ) : (
                                    <span className="text-orange-600 flex items-center space-x-1">
                                        <AlertTriangle size={16}/>
                                        <span>{getUnmappedColumns().length} remaining</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {getUnmappedColumns().length > 0 && (
                            <div className="mt-2 text-xs text-blue-700">
                                <span>Unmapped: </span>
                                {getUnmappedColumns().join(', ')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-600">
                        💡 Tip: You can proceed with partial mapping. Unmapped columns will be excluded from the query.
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleCancel}
                            disabled={processing}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Back to Error
                        </button>
                        <button
                            onClick={handleApplyMapping}
                            disabled={processing || getMappedCount() === 0}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {processing ? (
                                <>
                                    <RefreshCw className="animate-spin" size={16}/>
                                    <span>Applying...</span>
                                </>
                            ) : (
                                <>
                                    <Database size={16}/>
                                    <span>Apply Mapping ({getMappedCount()})</span>
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