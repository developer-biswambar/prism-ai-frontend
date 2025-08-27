import React, {useEffect, useState} from 'react';
import {AlertCircle, Calendar, ChevronDown, Filter, Minus, Plus, Search, X} from 'lucide-react';
import {deltaApiService} from '../../services/deltaApiService.js';

const TransformationFilterDataStep = ({
                                         config,
                                         setConfig,
                                         getFileByIndex,
                                         fileColumns,
                                         onSendMessage,
                                         onValidationChange
                                     }) => {
    const [fileFilters, setFileFilters] = useState({});
    const [uniqueValueCache, setUniqueValueCache] = useState({});
    const [loadingValues, setLoadingValues] = useState({});
    const [expandedFilters, setExpandedFilters] = useState({});

    // Initialize file filters from config
    useEffect(() => {
        const initialFileFilters = {};

        // Initialize filters for source files
        config.source_files.forEach((sourceFile, fileIndex) => {
            const fileKey = `file_${fileIndex}`;
            // Check if we have filter data in the config already
            const existingFilters = config.file_filters?.[fileKey] || [];
            initialFileFilters[fileKey] = existingFilters.map(filter => ({
                column: filter.column,
                values: filter.values || []
            }));
        });

        setFileFilters(initialFileFilters);
    }, [config.source_files]);

    // Convert file filters back to config format and sync with main config
    useEffect(() => {
        const updatedConfig = {...config};

        // Add file_filters to config if not present
        if (!updatedConfig.file_filters) {
            updatedConfig.file_filters = {};
        }

        Object.keys(fileFilters).forEach(fileKey => {
            const filters = fileFilters[fileKey] || [];
            
            // Convert to simple filter format for transformation
            updatedConfig.file_filters[fileKey] = filters.filter(filter => 
                filter.column && filter.values && filter.values.length > 0
            ).map(filter => ({
                column: filter.column,
                values: filter.values
            }));
        });

        setConfig(updatedConfig);

        // Check if there are incomplete filters and notify parent
        if (onValidationChange) {
            const hasIncompleteFilters = Object.values(fileFilters).some(filters =>
                filters && filters.some(filter => {
                    const hasColumn = filter.column && filter.column.trim() !== '';
                    const hasValues = filter.values && filter.values.length > 0;
                    // Filter is incomplete if it has a column but no values, or has values but no column
                    return (!hasColumn && !hasValues) || (hasColumn && !hasValues) || (!hasColumn && hasValues);
                })
            );
            onValidationChange(hasIncompleteFilters);
        }
    }, [fileFilters, onValidationChange]);

    // Get all available columns for a file
    const getAllAvailableColumns = (fileIndex) => {
        const sourceFile = config.source_files[fileIndex];
        if (!sourceFile) return [];
        
        // For transformation, we only work with original file columns
        // No extracted columns like in reconciliation
        return fileColumns[sourceFile.file_id] || [];
    };

    // Fetch unique values for a column
    const fetchUniqueValues = async (fileId, columnName, filterKey) => {
        const cacheKey = `${fileId}_${columnName}`;

        if (uniqueValueCache[cacheKey]) {
            return uniqueValueCache[cacheKey];
        }

        setLoadingValues(prev => ({...prev, [filterKey]: true}));

        try {
            const response = await deltaApiService.getColumnUniqueValues(fileId, columnName, 1000);

            setUniqueValueCache(prev => ({
                ...prev,
                [cacheKey]: response
            }));

            return response;
        } catch (error) {
            console.error('Error fetching unique values:', error);
            onSendMessage?.('system', `❌ Error fetching values for ${columnName}: ${error.message}`);
            return {unique_values: [], is_date_column: false, total_unique: 0};
        } finally {
            setLoadingValues(prev => ({...prev, [filterKey]: false}));
        }
    };

    // Add filter to a file
    const addFilter = (fileKey) => {
        setFileFilters(prev => ({
            ...prev,
            [fileKey]: [
                ...(prev[fileKey] || []),
                {column: '', values: []}
            ]
        }));
    };

    // Update filter
    const updateFilter = (fileKey, filterIndex, field, value) => {
        setFileFilters(prev => {
            const fileFilters = [...(prev[fileKey] || [])];
            if (field === 'column') {
                // Clear values when column changes
                fileFilters[filterIndex] = {column: value, values: []};

                // Clear cache for new column
                const fileIndex = parseInt(fileKey.split('_')[1]);
                const sourceFile = config.source_files[fileIndex];
                const cacheKey = `${sourceFile?.file_id}_${value}`;
                setUniqueValueCache(prevCache => {
                    const newCache = {...prevCache};
                    delete newCache[cacheKey];
                    return newCache;
                });
            } else {
                fileFilters[filterIndex] = {...fileFilters[filterIndex], [field]: value};
            }

            return {
                ...prev,
                [fileKey]: fileFilters
            };
        });
    };

    // Remove filter
    const removeFilter = (fileKey, filterIndex) => {
        setFileFilters(prev => {
            const fileFilters = [...(prev[fileKey] || [])];
            fileFilters.splice(filterIndex, 1);

            return {
                ...prev,
                [fileKey]: fileFilters
            };
        });
    };

    // Toggle value selection in filter
    const toggleValueInFilter = (fileKey, filterIndex, value) => {
        setFileFilters(prev => {
            const fileFilters = [...(prev[fileKey] || [])];
            const currentFilter = {...fileFilters[filterIndex]};
            const currentValues = currentFilter.values || [];

            let newValues;
            if (currentValues.includes(value)) {
                newValues = currentValues.filter(v => v !== value);
            } else {
                newValues = [...currentValues, value];
            }

            currentFilter.values = newValues;
            fileFilters[filterIndex] = currentFilter;

            return {
                ...prev,
                [fileKey]: fileFilters
            };
        });
    };

    // Select all values in filter
    const selectAllValues = (fileKey, filterIndex, allValues) => {
        setFileFilters(prev => {
            const fileFilters = [...(prev[fileKey] || [])];
            const currentFilter = {...fileFilters[filterIndex]};
            currentFilter.values = [...allValues];
            fileFilters[filterIndex] = currentFilter;

            return {
                ...prev,
                [fileKey]: fileFilters
            };
        });
    };

    // Clear all values in filter
    const clearAllValues = (fileKey, filterIndex) => {
        setFileFilters(prev => {
            const fileFilters = [...(prev[fileKey] || [])];
            const currentFilter = {...fileFilters[filterIndex]};
            currentFilter.values = [];
            fileFilters[filterIndex] = currentFilter;

            return {
                ...prev,
                [fileKey]: fileFilters
            };
        });
    };

    // Toggle filter expansion
    const toggleFilterExpansion = (filterKey) => {
        setExpandedFilters(prev => ({
            ...prev,
            [filterKey]: !prev[filterKey]
        }));
    };

    const renderFileFilterSection = (fileIndex) => {
        const sourceFile = config.source_files[fileIndex];
        if (!sourceFile) return null;

        // Get file info for display
        const fileInfo = getFileByIndex ? getFileByIndex(fileIndex) : null;
        const filename = fileInfo?.filename || sourceFile.file_id;

        const fileKey = `file_${fileIndex}`;
        const filters = fileFilters[fileKey] || [];
        const availableColumns = getAllAvailableColumns(fileIndex);
        
        // Color scheme for different files
        const colors = ['blue', 'green', 'purple', 'orange', 'red'];
        const colorIndex = fileIndex % colors.length;
        const color = colors[colorIndex];
        
        const labels = ['Primary Source', 'Secondary Source', 'Tertiary Source', 'Additional Source'];
        const label = labels[fileIndex] || `Source ${fileIndex + 1}`;

        return (
            <div key={fileIndex}
                 className={`p-4 border border-${color}-200 bg-${color}-50 rounded-lg`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <div
                            className={`w-8 h-8 bg-${color}-500 rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                            {fileIndex + 1}
                        </div>
                        <div>
                            <h4 className={`text-md font-medium text-${color}-800`}>
                                {label}
                            </h4>
                            <p className={`text-xs text-${color}-600`}>{filename}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => addFilter(fileKey)}
                        className={`flex items-center space-x-1 px-3 py-1 bg-${color}-500 text-white rounded hover:bg-${color}-600 text-sm`}
                    >
                        <Plus size={14}/>
                        <span>Add Filter</span>
                    </button>
                </div>

                <div className="space-y-3">
                    {filters.map((filter, filterIndex) => {
                        const filterKey = `${fileKey}_${filterIndex}`;
                        const isExpanded = expandedFilters[filterKey];
                        const isLoading = loadingValues[filterKey];

                        return (
                            <div key={filterIndex}
                                 className={`p-3 bg-white border border-${color}-200 rounded-lg`}>
                                {/* Filter Header */}
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Column to Filter
                                        </label>
                                        <select
                                            value={filter.column || ''}
                                            onChange={(e) => updateFilter(fileKey, filterIndex, 'column', e.target.value)}
                                            className={`w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-${color}-500`}
                                        >
                                            <option value="">Select Column</option>
                                            {availableColumns.map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {filter.column && (
                                            <button
                                                onClick={() => toggleFilterExpansion(filterKey)}
                                                className={`flex items-center space-x-1 px-3 py-2 bg-${color}-100 text-${color}-700 rounded text-sm hover:bg-${color}-200`}
                                            >
                                                <Filter size={14}/>
                                                <span>
                                                    {filter.values?.length || 0} selected
                                                </span>
                                                <ChevronDown
                                                    size={14}
                                                    className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => removeFilter(fileKey, filterIndex)}
                                            className="p-2 text-red-400 hover:text-red-600"
                                            title="Remove filter"
                                        >
                                            <Minus size={14}/>
                                        </button>
                                    </div>
                                </div>

                                {/* Filter Values Selection */}
                                {filter.column && isExpanded && (
                                    <FilterValueSelector
                                        fileId={sourceFile.file_id}
                                        columnName={filter.column}
                                        selectedValues={filter.values || []}
                                        onValueToggle={(value) => toggleValueInFilter(fileKey, filterIndex, value)}
                                        onSelectAll={(allValues) => selectAllValues(fileKey, filterIndex, allValues)}
                                        onClearAll={() => clearAllValues(fileKey, filterIndex)}
                                        fetchUniqueValues={() => fetchUniqueValues(sourceFile.file_id, filter.column, filterKey)}
                                        isLoading={isLoading}
                                        colorScheme={color}
                                    />
                                )}

                                {/* Filter Summary */}
                                {filter.column && filter.values && filter.values.length > 0 && (
                                    <div className={`mt-2 p-2 bg-${color}-50 rounded text-xs`}>
                                        <span className={`text-${color}-700 font-medium`}>Active Filter:</span>
                                        <span className={`ml-1 text-${color}-600`}>
                                            {filter.column} equals {filter.values.length} value{filter.values.length !== 1 ? 's' : ''}
                                        </span>
                                        {filter.values.length <= 3 && (
                                            <span className={`ml-1 text-${color}-500`}>
                                                ({filter.values.join(', ')})
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {filters.length === 0 && (
                        <div className="text-center text-gray-500 py-4">
                            <Filter size={32} className="mx-auto mb-2 opacity-50"/>
                            <p className="text-sm">No filters applied to this file.</p>
                            <p className="text-xs">Add filters to reduce the data before transformation.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-800">Data Filtering (Optional)</h3>
                <p className="text-sm text-gray-600">
                    Apply filters to source files before transformation. This can help reduce processing time and focus on
                    specific data subsets. Filters support exact matching with automatic date format handling.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {config.source_files.map((_, fileIndex) => renderFileFilterSection(fileIndex))}
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p><strong>Filter Information:</strong></p>
                <ul className="mt-1 ml-4 list-disc space-y-1">
                    <li>Select from actual data values with Excel-like dropdowns</li>
                    <li>Date columns are automatically detected and formatted consistently</li>
                    <li>Multiple values per column act as OR conditions</li>
                    <li>Multiple columns act as AND conditions</li>
                    <li>Filters are applied during transformation processing</li>
                    <li>Filtered data is used as input for all transformation rules</li>
                </ul>
            </div>
        </div>
    );
};

// Filter Value Selector Component (reused from reconciliation with minor changes)
const FilterValueSelector = ({
                                 fileId,
                                 columnName,
                                 selectedValues,
                                 onValueToggle,
                                 onSelectAll,
                                 onClearAll,
                                 fetchUniqueValues,
                                 isLoading,
                                 colorScheme
                             }) => {
    const [uniqueValuesData, setUniqueValuesData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        if (columnName) {
            loadUniqueValues();
        }
    }, [columnName]);

    const loadUniqueValues = async () => {
        try {
            const data = await fetchUniqueValues();
            setUniqueValuesData(data);
        } catch (error) {
            console.error('Error loading unique values:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="text-center py-4">
                <div className={`animate-spin rounded-full h-6 w-6 border-b-2 border-${colorScheme}-600 mx-auto`}></div>
                <p className="text-xs text-gray-500 mt-2">Loading values...</p>
            </div>
        );
    }

    if (!uniqueValuesData) {
        return (
            <div className="text-center py-4">
                <AlertCircle size={24} className="mx-auto mb-2 text-gray-400"/>
                <p className="text-xs text-gray-500">Failed to load values</p>
                <button
                    onClick={loadUniqueValues}
                    className={`text-xs text-${colorScheme}-600 hover:text-${colorScheme}-800 mt-1`}
                >
                    Retry
                </button>
            </div>
        );
    }

    const {unique_values, is_date_column, total_unique, has_more} = uniqueValuesData;

    // Filter values based on search term
    const filteredValues = unique_values.filter(value =>
        value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Limit display for performance
    const displayValues = showAll ? filteredValues : filteredValues.slice(0, 100);

    return (
        <div className={`border border-${colorScheme}-200 rounded p-3 bg-white`}>
            {/* Header with controls */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    {is_date_column && (
                        <Calendar size={14} className={`text-${colorScheme}-600`}/>
                    )}
                    <span className="text-xs font-medium text-gray-700">
                        {total_unique.toLocaleString()} unique values
                        {has_more && ` (showing first 1000)`}
                    </span>
                </div>

                <div className="flex space-x-2">
                    <button
                        onClick={() => onSelectAll(filteredValues)}
                        className={`text-xs px-2 py-1 bg-${colorScheme}-500 text-white rounded hover:bg-${colorScheme}-600`}
                    >
                        Select All
                    </button>
                    <button
                        onClick={onClearAll}
                        className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
                <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"/>
                <input
                    type="text"
                    placeholder="Search values..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-8 pr-3 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-${colorScheme}-500`}
                />
            </div>

            {/* Values list */}
            <div className="max-h-48 overflow-y-auto space-y-1">
                {displayValues.map((value, index) => (
                    <label key={`${value}-${index}`}
                           className="flex items-center space-x-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                            type="checkbox"
                            checked={selectedValues.includes(value)}
                            onChange={(e) => {
                                e.stopPropagation();
                                onValueToggle(value);
                            }}
                            className={`rounded border-gray-300 text-${colorScheme}-600 focus:ring-${colorScheme}-500`}
                        />
                        <span
                            className={`flex-1 ${is_date_column ? 'font-mono' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                onValueToggle(value);
                            }}
                        >
                            {value}
                        </span>
                    </label>
                ))}
            </div>

            {/* Show more button */}
            {!showAll && filteredValues.length > 100 && (
                <div className="text-center mt-2">
                    <button
                        onClick={() => setShowAll(true)}
                        className={`text-xs text-${colorScheme}-600 hover:text-${colorScheme}-800`}
                    >
                        Show all {filteredValues.length} values...
                    </button>
                </div>
            )}

            {/* Selection summary */}
            {selectedValues.length > 0 && (
                <div className={`mt-2 p-2 bg-${colorScheme}-50 rounded text-xs`}>
                    <span className={`text-${colorScheme}-700 font-medium`}>
                        {selectedValues.length} value{selectedValues.length !== 1 ? 's' : ''} selected
                    </span>
                    {selectedValues.length <= 5 && (
                        <span className={`ml-1 text-${colorScheme}-600`}>
                            ({selectedValues.join(', ')})
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default TransformationFilterDataStep;