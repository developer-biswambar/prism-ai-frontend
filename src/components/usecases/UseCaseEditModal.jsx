/**
 * Use Case Edit Modal Component
 * Allows users to edit all aspects of a use case including basic info, content, configuration, and metadata
 */

import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    Loader,
    AlertCircle,
    CheckCircle,
    FileText,
    Settings,
    Database,
    Info,
    Tag,
    Plus,
    Trash2,
    Code,
    Brain,
    Layers
} from 'lucide-react';
import { useCaseService } from '../../services/useCaseService';

const UseCaseEditModal = ({ 
    isOpen, 
    onClose, 
    useCase,
    onSave = null 
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');

    // Categories and types for dropdowns
    const [categories, setCategories] = useState([]);
    const [useCaseTypes, setUseCaseTypes] = useState([]);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        use_case_type: 'data_processing',
        category: '',
        tags: [],
        use_case_content: '',
        use_case_config: {},
        use_case_metadata: {}
    });

    // Load options and initialize form when modal opens
    useEffect(() => {
        if (isOpen && useCase) {
            console.log('🔧 UseCaseEditModal: Initializing with use case:', useCase);
            loadOptions();
            initializeForm();
        }
    }, [isOpen, useCase]);

    const loadOptions = async () => {
        try {
            const [categoriesRes, typesRes] = await Promise.all([
                useCaseService.getCategories(),
                useCaseService.getUseCaseTypes()
            ]);
            setCategories(categoriesRes || []);
            setUseCaseTypes(typesRes || []);
        } catch (err) {
            console.error('Error loading options:', err);
        }
    };

    const initializeForm = () => {
        if (!useCase) return;

        console.log('🔧 UseCaseEditModal: Initializing form with data:', useCase);
        
        setFormData({
            name: useCase.name || '',
            description: useCase.description || '',
            use_case_type: useCase.use_case_type || 'data_processing',
            category: useCase.category || '',
            tags: useCase.tags || [],
            use_case_content: useCase.use_case_content || '',
            use_case_config: useCase.use_case_config || {},
            use_case_metadata: useCase.use_case_metadata || {}
        });
    };

    const handleInputChange = (field, value) => {
        console.log('🔧 UseCaseEditModal: Field changed:', field, value);
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setError('');
    };

    const handleNestedChange = (parentField, childField, value) => {
        console.log('🔧 UseCaseEditModal: Nested field changed:', parentField, childField, value);
        setFormData(prev => ({
            ...prev,
            [parentField]: {
                ...prev[parentField],
                [childField]: value
            }
        }));
        setError('');
    };

    const handleTagAdd = (newTag) => {
        if (!newTag.trim() || formData.tags.includes(newTag.trim())) return;
        
        const updatedTags = [...formData.tags, newTag.trim()];
        handleInputChange('tags', updatedTags);
    };

    const handleTagRemove = (tagToRemove) => {
        const updatedTags = formData.tags.filter(tag => tag !== tagToRemove);
        handleInputChange('tags', updatedTags);
    };

    const validateForm = () => {
        if (!formData.name.trim()) return 'Use case name is required';
        if (!formData.description.trim()) return 'Description is required';
        if (!formData.category.trim()) return 'Category is required';
        return '';
    };

    const handleSave = async () => {
        console.log('🔧 UseCaseEditModal: Save button clicked');
        
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('🔧 UseCaseEditModal: Saving use case with data:', formData);
            
            const updateData = {
                name: formData.name,
                description: formData.description,
                category: formData.category,
                tags: formData.tags,
                use_case_content: formData.use_case_content,
                use_case_metadata: formData.use_case_metadata
            };

            const updatedUseCase = await useCaseService.updateUseCase(
                useCase.id, 
                updateData, 
                useCase.use_case_type
            );

            console.log('🔧 UseCaseEditModal: Use case updated successfully:', updatedUseCase);
            
            setSuccess(true);
            
            // Call the onSave callback if provided
            if (onSave) {
                onSave(updatedUseCase);
            }

            setTimeout(() => {
                onClose();
                resetForm();
            }, 1500);

        } catch (err) {
            console.error('🔧 UseCaseEditModal: Error saving use case:', err);
            setError(err.message || 'Failed to save use case');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            use_case_type: 'data_processing',
            category: '',
            tags: [],
            use_case_content: '',
            use_case_config: {},
            use_case_metadata: {}
        });
        setError('');
        setSuccess(false);
        setActiveTab('basic');
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
            setTimeout(resetForm, 300);
        }
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'basic', label: 'Basic Info', icon: FileText },
        { id: 'content', label: 'Content', icon: Brain },
        { id: 'config', label: 'Configuration', icon: Settings },
        { id: 'metadata', label: 'Metadata', icon: Info }
    ];

    const renderBasicTab = () => (
        <div className="space-y-6">
            {/* Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Use Case Name *
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter use case name"
                />
            </div>

            {/* Type and Category */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Use Case Type
                    </label>
                    <select
                        value={formData.use_case_type}
                        onChange={(e) => handleInputChange('use_case_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled // Type shouldn't be changed after creation
                    >
                        {useCaseTypes.map(type => (
                            <option key={type} value={type}>
                                {useCaseService.formatUseCaseTypeDisplay(type)}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Type cannot be changed after creation</p>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter category"
                    />
                    <datalist id="categories">
                        {categories.map(category => (
                            <option key={category} value={category} />
                        ))}
                    </datalist>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Describe what this use case does and when to use it"
                />
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
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                            >
                                <Tag size={12} className="mr-1" />
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => handleTagRemove(tag)}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Add Tag Input */}
                <div className="flex space-x-2">
                    <input
                        type="text"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                handleTagAdd(e.target.value);
                                e.target.value = '';
                            }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Type tags and press Enter"
                    />
                </div>
            </div>
        </div>
    );

    const renderContentTab = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Use Case Content
                </label>
                <p className="text-sm text-gray-600 mb-3">
                    This is the core content that will be used for processing. Include detailed instructions, prompts, or requirements.
                </p>
                <textarea
                    value={formData.use_case_content}
                    onChange={(e) => handleInputChange('use_case_content', e.target.value)}
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                    placeholder="Enter the detailed use case content, instructions, or prompts..."
                />
            </div>
        </div>
    );

    const renderConfigTab = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Configuration (JSON)
                </label>
                <p className="text-sm text-gray-600 mb-3">
                    Advanced configuration settings for smart execution, column mapping, and execution strategies.
                </p>
                <textarea
                    value={JSON.stringify(formData.use_case_config, null, 2)}
                    onChange={(e) => {
                        try {
                            const parsed = JSON.parse(e.target.value);
                            handleInputChange('use_case_config', parsed);
                        } catch (err) {
                            // Keep the raw text if JSON is invalid, don't update until valid
                        }
                    }}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                    placeholder="Enter JSON configuration..."
                />
                <p className="text-xs text-gray-500 mt-1">
                    Must be valid JSON. Invalid JSON will not be saved.
                </p>
            </div>
        </div>
    );

    const renderMetadataTab = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metadata (JSON)
                </label>
                <p className="text-sm text-gray-600 mb-3">
                    Additional metadata including original prompts, AI improvements, file schemas, and processing context.
                </p>
                <textarea
                    value={JSON.stringify(formData.use_case_metadata, null, 2)}
                    onChange={(e) => {
                        try {
                            const parsed = JSON.parse(e.target.value);
                            handleInputChange('use_case_metadata', parsed);
                        } catch (err) {
                            // Keep the raw text if JSON is invalid, don't update until valid
                        }
                    }}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                    placeholder="Enter JSON metadata..."
                />
                <p className="text-xs text-gray-500 mt-1">
                    Must be valid JSON. Invalid JSON will not be saved.
                </p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                            <Settings className="text-blue-500" size={24} />
                            <span>Edit Use Case</span>
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Modify all aspects of your use case
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

                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-6 px-6">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 py-3 border-b-2 text-sm font-medium transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Icon size={16} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'basic' && renderBasicTab()}
                    {activeTab === 'content' && renderContentTab()}
                    {activeTab === 'config' && renderConfigTab()}
                    {activeTab === 'metadata' && renderMetadataTab()}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                    {/* Error/Success Messages */}
                    <div className="flex-1">
                        {error && (
                            <div className="flex items-center space-x-2 text-red-600">
                                <AlertCircle size={16} />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center space-x-2 text-green-600">
                                <CheckCircle size={16} />
                                <span className="text-sm">Use case updated successfully!</span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        
                        <button
                            onClick={handleSave}
                            disabled={loading || success || !formData.name.trim() || !formData.description.trim() || !formData.category.trim()}
                            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <>
                                    <Loader className="animate-spin" size={16} />
                                    <span>Saving...</span>
                                </>
                            ) : success ? (
                                <>
                                    <CheckCircle size={16} />
                                    <span>Saved!</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UseCaseEditModal;