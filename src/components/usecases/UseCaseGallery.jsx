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
import UseCaseDetailModal from './UseCaseDetailModal.jsx';
import UseCaseEditModal from './UseCaseEditModal.jsx';

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
    
    // Debug: Log viewMode changes
    useEffect(() => {
        console.log('🔍 viewMode changed to:', viewMode);
        
        // Debug layout measurements after a small delay
        setTimeout(() => {
            const gallery = document.querySelector('[data-debug="use-case-gallery"]');
            const listContainer = document.querySelector('[data-debug="list-container"]');
            const gridContainer = document.querySelector('[data-debug="grid-container"]');
            const startFreshItem = document.querySelector('[data-debug="start-fresh-item"]');
            const centerPanel = document.querySelector('[data-debug="center-panel"]');
            const centerPanelInner = document.querySelector('[data-debug="center-panel-inner"]');
            
            console.log('🔍 === LAYOUT DEBUG MEASUREMENTS ===');
            if (centerPanel) {
                console.log('🔍 Center Panel width:', centerPanel.offsetWidth, 'scrollWidth:', centerPanel.scrollWidth);
            }
            if (centerPanelInner) {
                console.log('🔍 Center Panel Inner width:', centerPanelInner.offsetWidth, 'scrollWidth:', centerPanelInner.scrollWidth);
            }
            if (gallery) {
                console.log('🔍 Gallery container width:', gallery.offsetWidth, 'scrollWidth:', gallery.scrollWidth);
            }
            if (gridContainer) {
                console.log('🔍 Grid container width:', gridContainer.offsetWidth, 'scrollWidth:', gridContainer.scrollWidth);
            }
            if (listContainer) {
                console.log('🔍 List container width:', listContainer.offsetWidth, 'scrollWidth:', listContainer.scrollWidth);
            }
            if (startFreshItem) {
                console.log('🔍 Start Fresh item width:', startFreshItem.offsetWidth, 'scrollWidth:', startFreshItem.scrollWidth);
            }
            console.log('🔍 === END LAYOUT DEBUG ===');
        }, 100);
    }, [viewMode]);

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

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await loadInitialData();
        } finally {
            setIsRefreshing(false);
        }
    };

    const [localSelectedUseCase, setLocalSelectedUseCase] = useState(null);
    const [loadingUseCases, setLoadingUseCases] = useState(new Set());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleUseCaseSelect = (useCase) => {
        // Only update local selection, don't trigger the parent callback yet
        setLocalSelectedUseCase(useCase);
    };

    const handleUseCaseApply = (useCase) => {
        console.log('Apply button clicked for use case:', useCase.name);
        
        // Set loading state for this specific use case
        setLoadingUseCases(prev => new Set([...prev, useCase.id]));
        
        // This will actually apply the use case and trigger navigation
        if (onUseCaseSelect) {
            console.log('Calling onUseCaseSelect with use case:', useCase.id);
            onUseCaseSelect(useCase).finally(() => {
                // Remove loading state when done (whether success or failure)
                setLoadingUseCases(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(useCase.id);
                    return newSet;
                });
            });
        } else {
            console.log('No onUseCaseSelect callback provided');
            // Remove loading state if no callback
            setLoadingUseCases(prev => {
                const newSet = new Set(prev);
                newSet.delete(useCase.id);
                return newSet;
            });
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
    };

    const [editingUseCase, setEditingUseCase] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleUseCaseEdit = async (useCase) => {
        console.log('🔧 UseCaseGallery: handleUseCaseEdit called with:', useCase.name);
        console.log('🔧 Use case object:', useCase);
        
        // Set the use case to edit and open edit modal
        setEditingUseCase(useCase);
        setIsEditModalOpen(true);
        
        console.log('🔧 Edit modal state set to open');
    };


    const closeViewModal = () => {
        setViewUseCase(null);
    };

    const getCurrentUseCases = () => {
        if (searchQuery) {
            return searchResults;
        }
        
        return useCases;
    };

    const renderUseCaseGrid = () => {
        const currentUseCases = getCurrentUseCases();
        
        console.log('🔍 renderUseCaseGrid - viewMode:', viewMode);
        console.log('🔍 renderUseCaseGrid - currentUseCases length:', currentUseCases.length);
        
        if (viewMode === 'grid') {
            console.log('🔍 Rendering GRID mode');
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 auto-rows-max" data-debug="grid-container">
                    {/* Start Fresh Card - Always first */}
                    <div 
                        className="relative group bg-white rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden h-[280px] flex flex-col"
                        onClick={() => handleUseCaseApply({ id: 'start_fresh', name: 'Start Fresh', description: 'Begin with a blank prompt' })}
                    >
                        {/* Background gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 group-hover:from-blue-100/80 group-hover:to-indigo-100/80 transition-all duration-200" />
                        
                        {/* Content */}
                        <div className="relative flex-1 p-4 flex flex-col text-center">
                            {/* Icon */}
                            <div className="flex justify-center mb-3">
                                <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors duration-200">
                                    <Plus className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            
                            {/* Title */}
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Start Fresh</h3>
                            
                            {/* Description */}
                            <p className="text-xs text-gray-600 mb-3 flex-1">
                                Begin with a blank prompt for custom data processing
                            </p>
                            
                            {/* Badge */}
                            <div className="flex justify-center mb-3">
                                <span className="inline-flex items-center px-2 py-1 bg-blue-100 group-hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-full transition-colors duration-200">
                                    New Process
                                </span>
                            </div>
                            
                            {/* Action Button */}
                            <div className="flex justify-center mt-auto">
                                <button className="px-4 py-2 bg-blue-600 group-hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm">
                                    Get Started
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Saved Use Cases */}
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
                            isLoading={loadingUseCases.has(useCase.id)}
                            loadingMessage="Applying..."
                        />
                    ))}
                    
                    {/* No use cases message - only show if no saved use cases */}
                    {currentUseCases.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-lg mb-2">No saved use cases found</p>
                            <p className="text-gray-400 text-sm">
                                {searchQuery ? 'Try adjusting your search terms' : 'Create your first use case by using "Start Fresh"'}
                            </p>
                        </div>
                    )}
                </div>
            );
        } else {
            console.log('🔍 Rendering LIST mode');
            return (
                <div className="space-y-2 w-full overflow-x-hidden" style={{maxWidth: '100%', width: '100%', boxSizing: 'border-box', minWidth: 0, flex: 'none'}} data-debug="list-container">
                    {/* Start Fresh List Item */}
                    <div 
                        className="flex items-center justify-between p-4 md:p-6 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-lg transition-all duration-200 cursor-pointer group bg-gradient-to-r from-blue-50/50 to-indigo-50/50 min-w-0 w-full overflow-hidden"
                        style={{maxWidth: '100%', width: '100%', boxSizing: 'border-box'}}
                        data-debug="start-fresh-item"
                        onClick={() => handleUseCaseApply({ id: 'start_fresh', name: 'Start Fresh', description: 'Begin with a blank prompt' })}
                    >
                        <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors flex-shrink-0">
                                <Plus className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-base md:text-lg text-gray-900 truncate">Start Fresh</h4>
                                <p className="text-xs md:text-sm text-gray-600 truncate">Begin with a blank prompt for custom data processing and analysis</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
                            <span className="hidden sm:inline-flex items-center px-2 md:px-3 py-1 md:py-1.5 bg-blue-100 group-hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-full transition-colors">
                                ✨ New Process
                            </span>
                            <button className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 group-hover:bg-blue-700 text-white text-xs md:text-sm font-medium rounded-lg transition-colors shadow-sm">
                                Get Started
                            </button>
                        </div>
                    </div>

                    {/* Saved Use Cases */}
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
                            isLoading={loadingUseCases.has(useCase.id)}
                            loadingMessage="Applying..."
                        />
                    ))}
                    
                    {/* No use cases message - only show if no saved use cases */}
                    {currentUseCases.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-lg mb-2">No saved use cases found</p>
                            <p className="text-gray-400 text-sm">
                                {searchQuery ? 'Try adjusting your search terms' : 'Create your first use case by using "Start Fresh"'}
                            </p>
                        </div>
                    )}
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
        <div className="space-y-6 w-full max-w-full overflow-hidden" style={{maxWidth: '100%', width: '100%'}} data-debug="use-case-gallery">
            {/* Header */}
            <div className="flex items-center justify-between w-full max-w-full" style={{maxWidth: '100%'}}>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Use Case Gallery</h2>
                    <p className="text-gray-600">Choose from pre-built use cases or create your own</p>
                </div>
            </div>

            {/* Search and Controls */}
            <div className="flex items-center justify-between space-x-4 w-full max-w-full overflow-hidden">
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

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                    {/* Refresh Button */}
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing || loading}
                        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh use cases"
                    >
                        <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                        <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
                    </button>

                    {/* View Mode Toggle */}
                    <button
                        onClick={() => {
                            console.log('🔍 Grid mode button clicked');
                            setViewMode('grid');
                        }}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Grid view"
                    >
                        <Grid size={16} />
                    </button>
                    <button
                        onClick={() => {
                            console.log('🔍 List mode button clicked');
                            setViewMode('list');
                        }}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="List view"
                    >
                        <List size={16} />
                    </button>
                    
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
            <div className="w-full max-w-full overflow-hidden">
                {renderUseCaseGrid()}
            </div>

            {/* Use Case Detail Modal */}
            <UseCaseDetailModal
                isOpen={!!viewUseCase}
                onClose={closeViewModal}
                useCase={viewUseCase}
                onEdit={handleUseCaseEdit}
                onDelete={handleUseCaseDelete}
                onApply={(useCase) => {
                    handleUseCaseApply(useCase);
                    closeViewModal();
                }}
            />

            {/* Use Case Edit Modal */}
            <UseCaseEditModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    console.log('🔧 UseCaseGallery: Closing edit modal');
                    setIsEditModalOpen(false);
                    setEditingUseCase(null);
                }}
                useCase={editingUseCase}
                onSave={(updatedUseCase) => {
                    console.log('🔧 UseCaseGallery: Use case saved:', updatedUseCase.name);
                    // Refresh the use cases list
                    loadUseCases();
                    // If we were viewing this use case, update the view
                    if (viewUseCase && viewUseCase.id === updatedUseCase.id) {
                        setViewUseCase(updatedUseCase);
                    }
                }}
            />
        </div>
    );
};

export default UseCaseGallery;