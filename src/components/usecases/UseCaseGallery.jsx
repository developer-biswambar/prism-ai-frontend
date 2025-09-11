/**
 * Use Case Gallery Component
 * Displays browsable gallery of use cases with search, filtering, and selection
 */

import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Grid,
    List,
    Clock,
    User,
    Tag,
    ChevronDown,
    ChevronUp,
    Loader,
    AlertCircle,
    RefreshCw,
    Plus,
    X,
    Edit,
    Save,
    FileText
} from 'lucide-react';
import { useCaseService } from '../../services/useCaseService';
import UseCaseCard from './UseCaseCard.jsx';
import UseCaseListItem from './UseCaseListItem.jsx';

const UseCaseGallery = ({ 
    onUseCaseSelect, 
    selectedUseCase = null,
    showCreateButton = true,
    onCreateNew = null,
    userPrompt = '',
    fileSchemas = []
}) => {
    // State management
    const [useCases, setUseCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // Filter states
    const [filters, setFilters] = useState({
        use_case_type: '',
        category: '',
        is_public: true
    });
    const [showFilters, setShowFilters] = useState(false);
    const [categories, setCategories] = useState([]);
    const [useCaseTypes, setUseCaseTypes] = useState([]);
    
    // View states
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);

    // Load use cases when filters change
    useEffect(() => {
        if (!searchQuery) {
            loadUseCases();
        }
    }, [filters]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load all data in parallel
            const [useCasesRes, categoriesRes, typesRes] = await Promise.all([
                useCaseService.listUseCases({ limit: 100}),
                useCaseService.getCategories(),
                useCaseService.getUseCaseTypes()
            ]);

            setUseCases(useCasesRes.use_cases || []);
            setCategories(categoriesRes || []);
            setUseCaseTypes(typesRes || []);

        } catch (err) {
            console.error('Error loading use case data:', err);
            setError('Failed to load use cases. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadUseCases = async () => {
        try {
            setLoading(true);
            const response = await useCaseService.listUseCases({
                ...filters,
                limit: 50
            });
            setUseCases(response.use_cases || []);
        } catch (err) {
            console.error('Error loading use cases:', err);
            setError('Failed to load use cases');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        try {
            setIsSearching(true);
            const response = await useCaseService.searchUseCases(query, filters);
            setSearchResults(response.use_cases || []);
        } catch (err) {
            console.error('Error searching use cases:', err);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        // Debounce search
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            handleSearch(query);
        }, 300);
    };

    const handleFilterChange = (filterKey, value) => {
        setFilters(prev => ({
            ...prev,
            [filterKey]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            use_case_type: '',
            category: '',
            is_public: true
        });
        setSearchQuery('');
        setSearchResults([]);
    };

    const [localSelectedUseCase, setLocalSelectedUseCase] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingUseCase, setEditingUseCase] = useState(null);
    const [saving, setSaving] = useState(false);

    const handleUseCaseSelect = (useCase) => {
        // Only update local selection, don't trigger the parent callback yet
        setLocalSelectedUseCase(useCase);
    };

    const handleUseCaseApply = (useCase) => {
        console.log('Apply button clicked for use case:', useCase.name);
        // This will actually apply the use case and trigger navigation
        if (onUseCaseSelect) {
            console.log('Calling onUseCaseSelect with use case:', useCase.id);
            onUseCaseSelect(useCase);
        } else {
            console.log('No onUseCaseSelect callback provided');
        }
    };

    const handleUseCaseDelete = async (useCase) => {
        if (!confirm(`Are you sure you want to delete "${useCase.name}"?`)) {
            return;
        }

        try {
            await useCaseService.deleteUseCase(useCase.id);
            // Refresh the use case list
            await loadUseCases();
        } catch (error) {
            console.error('Error deleting use case:', error);
            setError(`Failed to delete use case: ${error.message}`);
        }
    };

    const [viewUseCase, setViewUseCase] = useState(null);

    const handleUseCaseView = (useCase) => {
        console.log('View button clicked for use case:', useCase.name);
        setViewUseCase(useCase);
        setIsEditing(false);
        setEditingUseCase(null);
    };

    const handleUseCaseEdit = () => {
        setIsEditing(true);
        setEditingUseCase({
            name: viewUseCase.name,
            description: viewUseCase.description,
            category: viewUseCase.category,
            tags: [...(viewUseCase.tags || [])],
            use_case_content: viewUseCase.use_case_content || '',
            use_case_metadata: viewUseCase.use_case_metadata ? JSON.parse(JSON.stringify(viewUseCase.use_case_metadata)) : {
                original_prompt: '',
                file_pattern: '',
                improvements_made: ''
            }
        });
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditingUseCase(null);
    };

    const handleEditSave = async () => {
        if (!editingUseCase) return;

        try {
            setSaving(true);
            
            const updateData = {
                name: editingUseCase.name,
                description: editingUseCase.description,
                category: editingUseCase.category,
                tags: editingUseCase.tags,
                use_case_content: editingUseCase.use_case_content,
                use_case_metadata: editingUseCase.use_case_metadata
            };

            const updatedUseCase = await useCaseService.updateUseCase(viewUseCase.id, updateData, viewUseCase.use_case_type);
            
            // Update the use case in our local state
            setViewUseCase(updatedUseCase);
            setUseCases(prev => prev.map(t => t.id === updatedUseCase.id ? updatedUseCase : t));
            
            // Exit edit mode
            setIsEditing(false);
            setEditingUseCase(null);
            
        } catch (error) {
            console.error('Error updating use case:', error);
            setError(`Failed to update use case: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const closeViewModal = () => {
        setViewUseCase(null);
        setIsEditing(false);
        setEditingUseCase(null);
    };

    const getCurrentUseCases = () => {
        if (searchQuery) {
            return searchResults;
        }
        
        return useCases;
    };

    const renderUseCaseGrid = () => {
        const currentUseCases = getCurrentUseCases();
        
        if (currentUseCases.length === 0) {
            return (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg mb-2">No use cases found</p>
                    <p className="text-gray-400 text-sm">
                        {searchQuery ? 'Try adjusting your search terms' : 'Try changing your filters'}
                    </p>
                </div>
            );
        }

        if (viewMode === 'grid') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {currentUseCases.map(useCase => (
                        <UseCaseCard
                            useCase={useCase}
                            key={useCase.id}
                            isSelected={localSelectedUseCase?.id === useCase.id}
                            onSelect={() => handleUseCaseSelect(useCase)}
                            onRate={(rating) => useCaseService.rateUseCase(useCase.id, rating)}
                            onDelete={handleUseCaseDelete}
                            onView={handleUseCaseView}
                            onApply={handleUseCaseApply}
                        />
                    ))}
                </div>
            );
        } else {
            return (
                <div className="space-y-2">
                    {currentUseCases.map(useCase => (
                        <UseCaseListItem
                            key={useCase.id}
                            useCase={useCase}
                            isSelected={localSelectedUseCase?.id === useCase.id}
                            onSelect={() => handleUseCaseSelect(useCase)}
                            onRate={(rating) => useCaseService.rateUseCase(useCase.id, rating)}
                            onDelete={handleUseCaseDelete}
                            onView={handleUseCaseView}
                            onApply={handleUseCaseApply}
                        />
                    ))}
                </div>
            );
        }
    };

    if (loading && useCases.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-500">Loading use cases...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={loadInitialData}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mx-auto"
                    >
                        <RefreshCw size={16} />
                        <span>Retry</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Use Case Gallery</h2>
                    <p className="text-gray-600">Choose from pre-built use cases or create your own</p>
                </div>
            </div>

            {/* Search and Controls */}
            <div className="flex items-center justify-between space-x-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search use cases..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {isSearching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Loader className="w-4 h-4 animate-spin text-gray-400" />
                        </div>
                    )}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Grid size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <List size={16} />
                    </button>
                </div>

                {/* Filters Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    <Filter size={16} />
                    <span>Filters</span>
                    {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Use Case Type Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                            <select
                                value={filters.use_case_type}
                                onChange={(e) => handleFilterChange('use_case_type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Types</option>
                                {useCaseTypes.map(type => (
                                    <option key={type} value={type}>
                                        {useCaseService.formatUseCaseTypeDisplay(type)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Categories</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>

                        {/* Visibility Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                            <select
                                value={filters.is_public}
                                onChange={(e) => handleFilterChange('is_public', e.target.value === 'true')}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={true}>Public Use Cases</option>
                                <option value={false}>Private Use Cases</option>
                            </select>
                        </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                                {getCurrentUseCases().length} use cases found
                            </span>
                        </div>
                        <button
                            onClick={clearFilters}
                            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                        >
                            <X size={14} />
                            <span>Clear Filters</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Use Cases Section Header */}
            <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                        All Use Cases ({useCases.length})
                    </h3>
                </div>
            </div>

            {/* Use Cases Grid/List */}
            {renderUseCaseGrid()}

            {/* View Use Case Modal */}
            {viewUseCase && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
                            <div className="flex-1">
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={editingUseCase?.name || ''}
                                            onChange={(e) => setEditingUseCase(prev => ({...prev, name: e.target.value}))}
                                            className="text-2xl font-bold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                                        />
                                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                                                {useCaseService.formatUseCaseTypeDisplay(viewUseCase.use_case_type)}
                                            </span>
                                            <select
                                                value={editingUseCase?.category || ''}
                                                onChange={(e) => setEditingUseCase(prev => ({...prev, category: e.target.value}))}
                                                className="bg-white border border-gray-300 rounded-full px-3 py-1 text-green-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Select category</option>
                                                {categories.map(category => (
                                                    <option key={category} value={category}>{category}</option>
                                                ))}
                                            </select>
                                            {viewUseCase.usage_count > 0 && (
                                                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                                                    Used {viewUseCase.usage_count} times
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{viewUseCase.name}</h3>
                                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                                                {useCaseService.formatUseCaseTypeDisplay(viewUseCase.use_case_type)}
                                            </span>
                                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                                                {viewUseCase.category}
                                            </span>
                                            {viewUseCase.usage_count > 0 && (
                                                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                                                    Used {viewUseCase.usage_count} times
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                {isEditing ? (
                                    <>
                                        <button 
                                            onClick={handleEditCancel}
                                            className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-white/50 transition-colors font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleEditSave}
                                            disabled={saving}
                                            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <Loader className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save size={16} />
                                            )}
                                            <span>{saving ? 'Saving...' : 'Save'}</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button 
                                            onClick={handleUseCaseEdit}
                                            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-colors font-medium"
                                        >
                                            <Edit size={16} />
                                            <span>Edit</span>
                                        </button>
                                    </>
                                )}
                                <button 
                                    onClick={closeViewModal}
                                    className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-white/50 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Description */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <div className="w-1 h-6 bg-blue-500 rounded mr-3"></div>
                                    Description
                                </h4>
                                {isEditing ? (
                                    <textarea
                                        value={editingUseCase?.description || ''}
                                        onChange={(e) => setEditingUseCase(prev => ({...prev, description: e.target.value}))}
                                        className="w-full text-gray-700 leading-relaxed bg-white border border-gray-300 p-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={4}
                                        placeholder="Enter use case description..."
                                    />
                                ) : (
                                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                                        {viewUseCase.description}
                                    </p>
                                )}
                            </div>
                            
                            {/* Use Case Content */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <div className="w-1 h-6 bg-green-500 rounded mr-3"></div>
                                    Use Case Content
                                    {isEditing && <FileText size={16} className="ml-2 text-blue-500" />}
                                </h4>
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={editingUseCase?.use_case_content || ''}
                                            onChange={(e) => setEditingUseCase(prev => ({...prev, use_case_content: e.target.value}))}
                                            className="w-full text-sm text-gray-700 font-mono leading-relaxed bg-white border border-gray-300 p-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            rows={10}
                                            placeholder="Enter the use case content (prompts, instructions, etc.)"
                                        />
                                        <p className="text-xs text-gray-500">This is the core use case content that will be used for processing</p>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto">
                                            {viewUseCase.use_case_content || viewUseCase.description || 'No content available'}
                                        </pre>
                                    </div>
                                )}
                            </div>
                            
                            {/* Tags */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <div className="w-1 h-6 bg-pink-500 rounded mr-3"></div>
                                    Tags
                                </h4>
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    {isEditing ? (
                                        <div>
                                            <input
                                                type="text"
                                                value={editingUseCase?.tags?.join(', ') || ''}
                                                onChange={(e) => {
                                                    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                                                    setEditingUseCase(prev => ({...prev, tags}));
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter tags separated by commas (e.g., finance, data-processing, analysis)"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                                        </div>
                                    ) : (
                                        <>
                                            {viewUseCase.tags && viewUseCase.tags.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {viewUseCase.tags.map(tag => (
                                                        <span key={tag} className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 text-sm">No tags</span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <button
                                onClick={closeViewModal}
                                className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    handleUseCaseApply(viewUseCase);
                                    closeViewModal();
                                }}
                                className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-medium shadow-lg hover:shadow-xl transition-all"
                            >
                                Apply Use Case
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UseCaseGallery;