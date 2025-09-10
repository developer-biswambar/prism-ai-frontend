/**
 * Template Creation Modal Component
 * Allows users to save successful queries as reusable templates
 */

import React, { useState, useEffect } from 'react';
import {
    Save,
    X,
    Sparkles,
    Tag,
    Globe,
    Lock,
    AlertCircle,
    CheckCircle,
    Loader,
    Eye,
    EyeOff,
    FileText,
    Settings,
    Users,
    Lightbulb
} from 'lucide-react';
import { templateService } from '../../services/templateService';

const TemplateCreationModal = ({ 
    isOpen, 
    onClose, 
    queryData,
    onTemplateCreated = null,
    initialValues = {} 
}) => {
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        template_type: 'data_processing',
        category: '',
        tags: [],
        is_public: false,
        created_by: ''
    });

    // UI state
    const [tagInput, setTagInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    
    // Available options
    const [categories, setCategories] = useState([]);
    const [templateTypes, setTemplateTypes] = useState([]);
    const [suggestedTags, setSuggestedTags] = useState([]);

    // Load initial data and options
    useEffect(() => {
        if (isOpen) {
            loadOptions();
            initializeForm();
            generateSuggestions();
        }
    }, [isOpen, queryData, initialValues]);

    const loadOptions = async () => {
        try {
            const [categoriesRes, typesRes] = await Promise.all([
                templateService.getCategories(),
                templateService.getTemplateTypes()
            ]);
            setCategories(categoriesRes);
            setTemplateTypes(typesRes);
        } catch (err) {
            console.error('Error loading options:', err);
        }
    };

    const initializeForm = () => {
        // Initialize with provided values or smart defaults
        setFormData({
            name: initialValues.name || generateSmartName(),
            description: initialValues.description || generateSmartDescription(),
            template_type: initialValues.template_type || detectTemplateType(),
            category: initialValues.category || detectCategory(),
            tags: initialValues.tags || [],
            is_public: initialValues.is_public !== undefined ? initialValues.is_public : false,
            created_by: initialValues.created_by || ''
        });
    };

    const generateSuggestions = async () => {
        if (!queryData) return;
        
        // Generate suggested tags based on query content
        const tags = [];
        const prompt = queryData.user_prompt?.toLowerCase() || '';
        
        // Common patterns
        if (prompt.includes('reconcil')) tags.push('reconciliation');
        if (prompt.includes('match') || prompt.includes('compar')) tags.push('matching');
        if (prompt.includes('tolerance')) tags.push('tolerance-matching');
        if (prompt.includes('amount') || prompt.includes('financial')) tags.push('finance');
        if (prompt.includes('transaction')) tags.push('transactions');
        if (prompt.includes('delta') || prompt.includes('difference')) tags.push('delta-analysis');
        if (prompt.includes('report') || prompt.includes('summary')) tags.push('reporting');
        if (prompt.includes('transform') || prompt.includes('clean')) tags.push('data-cleaning');
        
        setSuggestedTags(tags);
    };

    const generateSmartName = () => {
        if (!queryData?.user_prompt) {
            const timestamp = new Date().toLocaleDateString();
            return `Custom Template - ${timestamp}`;
        }
        
        const prompt = queryData.user_prompt;
        
        // Extract key operation
        let operation = 'Data Processing';
        if (prompt.toLowerCase().includes('reconcil')) operation = 'Reconciliation';
        else if (prompt.toLowerCase().includes('analy')) operation = 'Analysis';
        else if (prompt.toLowerCase().includes('transform')) operation = 'Transformation';
        else if (prompt.toLowerCase().includes('report')) operation = 'Report';
        else if (prompt.toLowerCase().includes('match')) operation = 'Matching';
        
        // Add context
        let context = '';
        if (prompt.toLowerCase().includes('bank')) context = ' Bank';
        else if (prompt.toLowerCase().includes('transaction')) context = ' Transaction';
        else if (prompt.toLowerCase().includes('financial')) context = ' Financial';
        else if (prompt.toLowerCase().includes('invoice')) context = ' Invoice';
        else if (prompt.toLowerCase().includes('payment')) context = ' Payment';
        
        const timestamp = new Date().toLocaleDateString();
        return `${context} ${operation} Template - ${timestamp}`.trim();
    };

    const generateSmartDescription = () => {
        if (!queryData?.user_prompt) {
            return 'Custom template created for data processing and analysis tasks.';
        }
        
        const prompt = queryData.user_prompt;
        
        // Create a more generic description
        let description = `Template created from: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`;
        
        // Add file context
        if (queryData.file_schemas?.length > 0) {
            const fileCount = queryData.file_schemas.length;
            description += `\n\nDesigned for ${fileCount} file${fileCount > 1 ? 's' : ''} with columns: `;
            
            const allColumns = queryData.file_schemas.flatMap(schema => schema.columns || []);
            const uniqueColumns = [...new Set(allColumns)];
            description += uniqueColumns.slice(0, 5).join(', ');
            if (uniqueColumns.length > 5) {
                description += ` and ${uniqueColumns.length - 5} more`;
            }
        }
        
        return description;
    };

    const detectTemplateType = () => {
        if (!queryData?.user_prompt) return 'data_processing';
        
        const prompt = queryData.user_prompt.toLowerCase();
        if (prompt.includes('reconcil') || prompt.includes('match')) return 'reconciliation';
        if (prompt.includes('analy') || prompt.includes('trend')) return 'analysis';
        if (prompt.includes('transform') || prompt.includes('clean')) return 'transformation';
        if (prompt.includes('report') || prompt.includes('summary')) return 'reporting';
        return 'data_processing';
    };

    const detectCategory = () => {
        if (!queryData?.user_prompt) return 'Custom';
        
        const prompt = queryData.user_prompt.toLowerCase();
        if (prompt.includes('bank') || prompt.includes('financial') || prompt.includes('payment')) return 'Finance';
        if (prompt.includes('sale') || prompt.includes('revenue')) return 'Sales';
        if (prompt.includes('inventory') || prompt.includes('supply')) return 'Operations';
        if (prompt.includes('employee') || prompt.includes('hr')) return 'HR';
        return 'Custom';
    };


    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setError('');
    };

    const handleTagAdd = (tag) => {
        if (!tag || formData.tags.includes(tag)) return;
        
        setFormData(prev => ({
            ...prev,
            tags: [...prev.tags, tag]
        }));
        setTagInput('');
    };

    const handleTagRemove = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleTagInputKeyPress = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleTagAdd(tagInput.trim());
        }
    };

    const validateForm = () => {
        if (!formData.name.trim()) return 'Template name is required';
        if (!formData.description.trim()) return 'Template description is required';
        if (!formData.template_type) return 'Template type is required';
        if (!formData.category.trim()) return 'Category is required';
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await templateService.createTemplateFromQuery(
                queryData,
                formData
            );

            setSuccess(true);
            setTimeout(() => {
                onTemplateCreated?.(result);
                onClose();
                resetForm();
            }, 1500);

        } catch (err) {
            setError(err.message || 'Failed to create template');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            template_type: 'data_processing',
            category: '',
            tags: [],
            is_public: false,
            created_by: ''
        });
        setTagInput('');
        setError('');
        setSuccess(false);
        setShowPreview(false);
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
            setTimeout(resetForm, 300);
        }
    };

    if (!isOpen) return null;


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                            <Sparkles className="text-purple-500" size={24} />
                            <span>Create Template from Query</span>
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Save this successful query as a reusable template for future use
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Form */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Template Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Template Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter a descriptive name for your template"
                                    maxLength={200}
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    {formData.name.length}/200 characters
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                    placeholder="Describe what this template does and when to use it"
                                    maxLength={1000}
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    {formData.description.length}/1000 characters
                                </div>
                            </div>

                            {/* Template Type & Category */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Template Type *
                                    </label>
                                    <select
                                        value={formData.template_type}
                                        onChange={(e) => handleInputChange('template_type', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        {templateTypes.map(type => (
                                            <option key={type} value={type}>
                                                {templateService.formatTemplateTypeDisplay(type)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category *
                                    </label>
                                    <input
                                        type="text"
                                        list="categories"
                                        value={formData.category}
                                        onChange={(e) => handleInputChange('category', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="e.g., Finance, Operations, Sales"
                                    />
                                    <datalist id="categories">
                                        {categories.map(category => (
                                            <option key={category} value={category} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tags
                                </label>
                                
                                {/* Current Tags */}
                                {formData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {formData.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 border border-purple-200"
                                            >
                                                <Tag size={12} className="mr-1" />
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => handleTagRemove(tag)}
                                                    className="ml-1 text-purple-600 hover:text-purple-800"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Tag Input */}
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagInputKeyPress}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Type tags and press Enter (e.g., reconciliation, finance, matching)"
                                />

                                {/* Suggested Tags */}
                                {suggestedTags.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-xs text-gray-500 mb-2">Suggested tags:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {suggestedTags.map(tag => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => handleTagAdd(tag)}
                                                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                                >
                                                    + {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Visibility & Author */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Visibility
                                    </label>
                                    <div className="flex items-center space-x-4">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="visibility"
                                                checked={!formData.is_public}
                                                onChange={() => handleInputChange('is_public', false)}
                                                className="text-purple-500 focus:ring-purple-500"
                                            />
                                            <Lock size={16} className="text-gray-400" />
                                            <span className="text-sm">Private</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="visibility"
                                                checked={formData.is_public}
                                                onChange={() => handleInputChange('is_public', true)}
                                                className="text-purple-500 focus:ring-purple-500"
                                            />
                                            <Globe size={16} className="text-gray-400" />
                                            <span className="text-sm">Public</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Author
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.created_by}
                                        onChange={(e) => handleInputChange('created_by', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Your name or identifier (optional)"
                                    />
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
                                    <span className="text-sm text-red-700">{error}</span>
                                </div>
                            )}

                            {/* Form Status Indicator */}
                            {!loading && !success && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="text-sm text-blue-800">
                                        <span className="font-medium">Form Status:</span>
                                        <div className="mt-1 space-y-1">
                                            <div className="flex items-center space-x-2">
                                                {formData.name.trim() ? (
                                                    <CheckCircle size={12} className="text-green-500" />
                                                ) : (
                                                    <div className="w-3 h-3 border border-blue-400 rounded-full"></div>
                                                )}
                                                <span className={formData.name.trim() ? "text-green-700" : "text-blue-700"}>
                                                    Template Name {formData.name.trim() ? "✓" : "(required)"}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {formData.description.trim() ? (
                                                    <CheckCircle size={12} className="text-green-500" />
                                                ) : (
                                                    <div className="w-3 h-3 border border-blue-400 rounded-full"></div>
                                                )}
                                                <span className={formData.description.trim() ? "text-green-700" : "text-blue-700"}>
                                                    Description {formData.description.trim() ? "✓" : "(required)"}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {formData.category.trim() ? (
                                                    <CheckCircle size={12} className="text-green-500" />
                                                ) : (
                                                    <div className="w-3 h-3 border border-blue-400 rounded-full"></div>
                                                )}
                                                <span className={formData.category.trim() ? "text-green-700" : "text-blue-700"}>
                                                    Category {formData.category.trim() ? "✓" : "(required)"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Success Message */}
                            {success && (
                                <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <CheckCircle className="text-green-500 flex-shrink-0" size={16} />
                                    <span className="text-sm text-green-700">Template created successfully!</span>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Preview Panel */}
                    <div className="w-80 border-l border-gray-200 p-6 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-gray-900">Preview</h3>
                            <button
                                type="button"
                                onClick={() => setShowPreview(!showPreview)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        {showPreview && (
                            <div className="space-y-4">
                                {/* Template Card Preview */}
                                <div className="bg-white rounded-lg border p-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                                            {templateService.getTemplateTypeIcon(formData.template_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">
                                                {formData.name || 'Template Name'}
                                            </h4>
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                {formData.description || 'Template description'}
                                            </p>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 border border-gray-200">
                                                    {templateService.formatTemplateTypeDisplay(formData.template_type)}
                                                </span>
                                                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                                                    {formData.category || 'Category'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Original Query Info */}
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <FileText size={14} className="text-blue-500" />
                                        <span className="text-sm font-medium text-blue-900">Original Query</span>
                                    </div>
                                    <p className="text-xs text-blue-800 line-clamp-3">
                                        {queryData?.user_prompt}
                                    </p>
                                </div>

                                {/* Statistics */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Visibility:</span>
                                        <span className={`flex items-center space-x-1 ${formData.is_public ? 'text-green-600' : 'text-gray-600'}`}>
                                            {formData.is_public ? <Globe size={12} /> : <Lock size={12} />}
                                            <span>{formData.is_public ? 'Public' : 'Private'}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Tags:</span>
                                        <span className="text-gray-600">{formData.tags.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Author:</span>
                                        <span className="text-gray-600">{formData.created_by || 'Anonymous'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer - Always Visible */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Lightbulb size={16} />
                        <span>Tip: Choose descriptive names and tags to help others find your template</span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || success || !formData.name.trim() || !formData.description.trim() || !formData.category.trim()}
                            className="flex items-center space-x-3 px-12 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-2xl hover:shadow-purple-500/25 transition-all transform hover:scale-105 border-2 border-purple-500"
                            title={(!formData.name.trim() || !formData.description.trim() || !formData.category.trim()) ? "Please fill in all required fields" : "Create template from this query"}
                        >
                            {loading ? (
                                <>
                                    <Loader className="animate-spin" size={18} />
                                    <span>Creating Template...</span>
                                </>
                            ) : success ? (
                                <>
                                    <CheckCircle size={18} />
                                    <span>Template Created!</span>
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    <span>💾 CREATE TEMPLATE</span>
                                    <div className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                                        SAVE
                                    </div>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateCreationModal;