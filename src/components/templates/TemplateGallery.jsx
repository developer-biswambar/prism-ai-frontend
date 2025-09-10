/**
 * Template Gallery Component
 * Displays browsable gallery of templates with search, filtering, and selection
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
    X
} from 'lucide-react';
import { templateService } from '../../services/templateService';
import TemplateCard from './TemplateCard';
import TemplateListItem from './TemplateListItem';

const TemplateGallery = ({ 
    onTemplateSelect, 
    selectedTemplate = null,
    showCreateButton = true,
    onCreateNew = null,
    userPrompt = '',
    fileSchemas = []
}) => {
    // State management
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // Filter states
    const [filters, setFilters] = useState({
        template_type: '',
        category: '',
        is_public: true
    });
    const [showFilters, setShowFilters] = useState(false);
    const [categories, setCategories] = useState([]);
    const [templateTypes, setTemplateTypes] = useState([]);
    
    // View states
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);


    // Load templates when filters change
    useEffect(() => {
        if (!searchQuery) {
            loadTemplates();
        }
    }, [filters]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load all data in parallel
            const [templatesRes, categoriesRes, typesRes] = await Promise.all([
                templateService.listTemplates({ limit: 100, is_public: true }),
                templateService.getCategories(),
                templateService.getTemplateTypes()
            ]);

            setTemplates(templatesRes.templates || []);
            setCategories(categoriesRes || []);
            setTemplateTypes(typesRes || []);

        } catch (err) {
            console.error('Error loading template data:', err);
            setError('Failed to load templates. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const response = await templateService.listTemplates({
                ...filters,
                limit: 50
            });
            setTemplates(response.templates || []);
        } catch (err) {
            console.error('Error loading templates:', err);
            setError('Failed to load templates');
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
            const response = await templateService.searchTemplates(query, filters);
            setSearchResults(response.templates || []);
        } catch (err) {
            console.error('Error searching templates:', err);
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
            template_type: '',
            category: '',
            is_public: true
        });
        setSearchQuery('');
        setSearchResults([]);
    };

    const [localSelectedTemplate, setLocalSelectedTemplate] = useState(null);

    const handleTemplateSelect = (template) => {
        // Only update local selection, don't trigger the parent callback yet
        setLocalSelectedTemplate(template);
    };

    const handleTemplateApply = (template) => {
        console.log('Apply button clicked for template:', template.name);
        // This will actually apply the template and trigger navigation
        if (onTemplateSelect) {
            console.log('Calling onTemplateSelect with template:', template.id);
            onTemplateSelect(template);
        } else {
            console.log('No onTemplateSelect callback provided');
        }
    };

    const handleTemplateDelete = async (template) => {
        if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
            return;
        }

        try {
            await templateService.deleteTemplate(template.id);
            // Refresh the template list
            await loadTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            setError(`Failed to delete template: ${error.message}`);
        }
    };

    const [viewTemplate, setViewTemplate] = useState(null);

    const handleTemplateView = (template) => {
        console.log('View button clicked for template:', template.name);
        setViewTemplate(template);
    };

    const closeViewModal = () => {
        setViewTemplate(null);
    };

    const getCurrentTemplates = () => {
        if (searchQuery) {
            return searchResults;
        }
        
        return templates;
    };

    const renderTemplateGrid = () => {
        const currentTemplates = getCurrentTemplates();
        
        if (currentTemplates.length === 0) {
            return (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg mb-2">No templates found</p>
                    <p className="text-gray-400 text-sm">
                        {searchQuery ? 'Try adjusting your search terms' : 'Try changing your filters'}
                    </p>
                </div>
            );
        }

        if (viewMode === 'grid') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {currentTemplates.map(template => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            isSelected={localSelectedTemplate?.id === template.id}
                            onSelect={() => handleTemplateSelect(template)}
                            onRate={(rating) => templateService.rateTemplate(template.id, rating)}
                            onDelete={handleTemplateDelete}
                            onView={handleTemplateView}
                            onApply={handleTemplateApply}
                        />
                    ))}
                </div>
            );
        } else {
            return (
                <div className="space-y-2">
                    {currentTemplates.map(template => (
                        <TemplateListItem
                            key={template.id}
                            template={template}
                            isSelected={localSelectedTemplate?.id === template.id}
                            onSelect={() => handleTemplateSelect(template)}
                            onRate={(rating) => templateService.rateTemplate(template.id, rating)}
                            onDelete={handleTemplateDelete}
                            onView={handleTemplateView}
                            onApply={handleTemplateApply}
                        />
                    ))}
                </div>
            );
        }
    };

    if (loading && templates.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-500">Loading templates...</p>
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
                    <h2 className="text-2xl font-bold text-gray-900">Template Gallery</h2>
                    <p className="text-gray-600">Choose from pre-built templates or create your own</p>
                </div>
            </div>

            {/* Search and Controls */}
            <div className="flex items-center justify-between space-x-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search templates..."
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
                        {/* Template Type Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                            <select
                                value={filters.template_type}
                                onChange={(e) => handleFilterChange('template_type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Types</option>
                                {templateTypes.map(type => (
                                    <option key={type} value={type}>
                                        {templateService.formatTemplateTypeDisplay(type)}
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
                                <option value={true}>Public Templates</option>
                                <option value={false}>Private Templates</option>
                            </select>
                        </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                                {getCurrentTemplates().length} templates found
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

            {/* Templates Section Header */}
            <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                        All Templates ({templates.length})
                    </h3>
                </div>
            </div>

            {/* Templates Grid/List */}
            {renderTemplateGrid()}

            {/* View Template Modal */}
            {viewTemplate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">{viewTemplate.name}</h3>
                            <button 
                                onClick={closeViewModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-2">Description:</h4>
                                <p className="text-gray-600">{viewTemplate.description}</p>
                            </div>
                            
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-2">Template Content:</h4>
                                <div className="bg-gray-50 p-3 rounded border max-h-40 overflow-y-auto">
                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {viewTemplate.template_content || viewTemplate.description || 'No content available'}
                                    </pre>
                                </div>
                            </div>
                            
                            {viewTemplate.template_metadata && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Metadata:</h4>
                                    <div className="bg-gray-50 p-3 rounded border max-h-40 overflow-y-auto">
                                        <pre className="text-xs text-gray-600">
                                            {JSON.stringify(viewTemplate.template_metadata, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-700">Type:</span> {viewTemplate.template_type}
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Category:</span> {viewTemplate.category}
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Created by:</span> {viewTemplate.created_by || 'Anonymous'}
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Usage count:</span> {viewTemplate.usage_count || 0}
                                </div>
                            </div>
                            
                            {viewTemplate.tags && viewTemplate.tags.length > 0 && (
                                <div>
                                    <span className="font-medium text-gray-700">Tags:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {viewTemplate.tags.map(tag => (
                                            <span key={tag} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-end space-x-2 mt-6">
                            <button
                                onClick={closeViewModal}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    handleTemplateApply(viewTemplate);
                                    closeViewModal();
                                }}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                Apply Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplateGallery;