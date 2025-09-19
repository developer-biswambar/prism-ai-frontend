/**
 * Use Case Creation Modal Component
 * Allows users to save successful queries as reusable use cases
 */

import React, {useEffect, useState} from 'react';
import {AlertCircle, CheckCircle, Eye, FileText, Lightbulb, Loader, Save, Sparkles, Tag, X} from 'lucide-react';
import {useCaseService} from '../../services/useCaseService';
import {API_ENDPOINTS} from '../../config/environment';
import UseCaseDetailModal from './UseCaseDetailModal.jsx';

const UseCaseCreationModal = ({
                                  isOpen,
                                  onClose,
                                  queryData,
                                  onUseCaseCreated = null,
                                  initialValues = {}
                              }) => {
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        use_case_type: 'data_processing',
        category: '',
        tags: [],
        created_by: ''
    });

    // UI state
    const [tagInput, setTagInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Prompt optimization state (reusing from PromptSaveLoad pattern)
    const [generatingIdealPrompt, setGeneratingIdealPrompt] = useState(false);
    const [idealPromptData, setIdealPromptData] = useState(null);

    // Detail view state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [createdUseCase, setCreatedUseCase] = useState(null);

    // Available options
    const [categories, setCategories] = useState([]);
    const [useCaseTypes, setUseCaseTypes] = useState([]);
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
                useCaseService.getCategories(),
                useCaseService.getUseCaseTypes()
            ]);
            setCategories(categoriesRes);
            setUseCaseTypes(typesRes);
        } catch (err) {
            console.error('Error loading options:', err);
        }
    };

    const initializeForm = () => {
        // Initialize with provided values or smart defaults
        setFormData({
            name: initialValues.name || generateSmartName(),
            description: initialValues.description || generateSmartDescription(),
            use_case_type: initialValues.use_case_type || detectUseCaseType(),
            category: initialValues.category || detectCategory(),
            tags: initialValues.tags || [],
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
            return `Custom Use Case - ${timestamp}`;
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
        return `${context} ${operation} Use Case - ${timestamp}`.trim();
    };

    const generateSmartDescription = () => {
        if (!queryData?.user_prompt) {
            return 'Custom use case created for data processing and analysis tasks.';
        }

        const prompt = queryData.user_prompt;

        // Create a more generic description - remove the 100 character limit
        let description = `Use case created from: "${prompt}"`;

        // Add file context with role mappings
        if (queryData.file_schemas?.length > 0) {
            const fileCount = queryData.file_schemas.length;
            description += `\n\nRequires ${fileCount} file${fileCount > 1 ? 's' : ''}:`;

            queryData.file_schemas.forEach((schema, index) => {
                const fileRole = `file${index + 1}`;
                description += `\n- ${fileRole}: ${schema.filename} (${(schema.columns || []).length} columns)`;
            });

            const allColumns = queryData.file_schemas.flatMap(schema => schema.columns || []);
            const uniqueColumns = [...new Set(allColumns)];
            description += `\n\nExpected columns: ${uniqueColumns.slice(0, 5).join(', ')}`;
            if (uniqueColumns.length > 5) {
                description += ` and ${uniqueColumns.length - 5} more`;
            }
        }

        // Only truncate if it's extremely long (over 4500 characters to leave room for editing)
        if (description.length > 4500) {
            description = description.substring(0, 4500) + '...';
        }

        return description;
    };

    const detectUseCaseType = () => {
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

    // Generate ideal prompt using reverse engineering (reused from PromptSaveLoad)
    const generateIdealPrompt = async () => {
        if (!queryData?.user_prompt || !queryData?.process_results) {
            setError('Cannot generate ideal use case content: missing process data');
            return false;
        }

        // Prevent multiple simultaneous requests
        if (generatingIdealPrompt) {
            return false;
        }

        setGeneratingIdealPrompt(true);
        setError('');

        try {
            const response = await fetch(`${API_ENDPOINTS.MISCELLANEOUS}/generate-ideal-prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    original_prompt: queryData.user_prompt,
                    generated_sql: queryData.generated_sql,
                    ai_description: queryData.process_results?.metadata?.processing_info?.description || null,
                    files_info: queryData.file_schemas?.map((file, index) => ({
                        reference: `file_${index + 1}`,
                        filename: file.filename,
                        columns: file.columns || [],
                        total_rows: file.totalRows || 0
                    })) || [],
                    results_summary: {
                        row_count: queryData.process_results?.data?.length || 0,
                        column_count: queryData.process_results?.metadata?.processing_info?.column_count || 0,
                        query_type: queryData.process_results?.metadata?.processing_info?.query_type || 'unknown'
                    },
                    process_id: queryData.process_id
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store the generated ideal prompt data
                setIdealPromptData(data);

                // Auto-populate the form with AI-generated data
                setFormData(prev => ({
                    ...prev,
                    name: data.name || prev.name || '',
                    description: data.description || prev.description,
                    category: data.category || prev.category,
                }));

                // Scroll to show the AI-generated content
                setTimeout(() => {
                    const aiContentSection = document.querySelector('.bg-blue-50');
                    if (aiContentSection) {
                        aiContentSection.scrollIntoView({behavior: 'smooth', block: 'nearest'});
                    }
                }, 100);

                // Show success feedback
                console.log('AI-optimized template data generated:', {
                    ideal_prompt: data.ideal_prompt?.substring(0, 100) + '...',
                    file_pattern: data.file_pattern,
                    improvements: data.improvements_made
                });

                return true;
            } else {
                // Handle different error types
                if (data.error_type === 'quota_exceeded') {
                    setError(data.error || 'AI quota exceeded. You can still create the template manually.');
                } else if (data.error_type === 'rate_limited') {
                    setError(data.error || 'AI service busy. Wait a moment and try again, or create manually.');
                } else {
                    setError(data.error || 'Failed to generate ideal use case content');
                }
                return false;
            }
        } catch (error) {
            console.error('Error generating ideal prompt:', error);

            // Check if it's a rate limiting error
            if (error.message && error.message.includes('429')) {
                setError('OpenAI API is currently rate limited. Please wait a moment and try again.');
            } else {
                setError(error.message || 'Failed to generate ideal use case content');
            }
            return false;
        } finally {
            setGeneratingIdealPrompt(false);
        }
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
        if (!formData.name.trim()) return 'Use case name is required';
        if (!formData.description.trim()) return 'Use case description is required';
        if (!formData.use_case_type) return 'Use case type is required';
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
            // Create enhanced use case data with rich information
            const enhancedUseCaseData = {
                ...formData,
                // Core use case content
                use_case_content: idealPromptData?.ideal_prompt || queryData?.user_prompt || '',

                // Template configuration for smart execution
                template_config: {
                    primary_sql: queryData?.generated_sql || '',
                    column_mapping: {}, // Will be populated during execution
                    fallback_strategy: 'fuzzy_match',
                    execution_method: 'exact', // Default strategy

                    // Store original file schema pattern for matching
                    expected_file_schemas: queryData?.file_schemas?.map(schema => ({
                        filename_pattern: schema.filename,
                        required_columns: schema.columns || [],
                        sample_data_structure: Object.keys(schema.sample_data || {})
                    })) || [],

                    // Performance and reliability metadata
                    reliability_metrics: {
                        tested_with_files: queryData?.file_schemas?.length || 0,
                        successful_execution: Boolean(queryData?.process_results?.data?.length),
                        last_successful_execution: new Date().toISOString()
                    }
                },

                // Rich use case metadata
                use_case_metadata: {
                    original_prompt: queryData?.user_prompt || '',
                    ideal_prompt: idealPromptData?.ideal_prompt || '',
                    file_pattern: idealPromptData?.file_pattern || '',
                    improvements_made: idealPromptData?.improvements_made || '',

                    // File schema information
                    file_schemas: queryData?.file_schemas || [],

                    // NEW: File requirements and mappings
                    file_requirements: {
                        required_file_count: queryData?.file_schemas?.length || 0,
                        file_role_mappings: (queryData?.file_schemas || []).map((schema, index) => ({
                            role: `file${index + 1}`,
                            original_filename: schema.filename,
                            expected_columns: schema.columns || [],
                            column_count: (schema.columns || []).length,
                            sample_data_structure: Object.keys(schema.sample_data || {}),
                            description: `File ${index + 1} used in the original query (${schema.filename})`
                        })),
                        // File usage patterns for AI matching
                        file_usage_patterns: (queryData?.file_schemas || []).map((schema, index) => {
                            const role = `file${index + 1}`;
                            const prompt = queryData?.user_prompt || '';
                            return {
                                role: role,
                                usage_in_prompt: prompt.includes(role) ? `Referenced as "${role}" in prompt` : `Implicitly used as ${role}`,
                                data_characteristics: {
                                    has_headers: true, // assume CSV/Excel files have headers
                                    estimated_row_count: schema.totalRows || 0,
                                    key_columns: (schema.columns || []).slice(0, 3) // first 3 columns as likely keys
                                }
                            };
                        })
                    },

                    // Processing context
                    processing_context: {
                        query_type: queryData?.process_results?.metadata?.processing_info?.query_type || 'unknown',
                        generated_sql: queryData?.generated_sql || '',
                        column_count: queryData?.process_results?.metadata?.processing_info?.column_count || 0,
                        row_count: queryData?.process_results?.data?.length || 0
                    },

                    // Success metrics from original query
                    success_metrics: {
                        has_results: Boolean(queryData?.process_results?.data?.length),
                        execution_success: Boolean(queryData?.process_results?.success),
                        process_id: queryData?.process_id || ''
                    },

                    // Smart execution compatibility
                    smart_execution_compatible: true,
                    created_for_smart_execution: true,
                    version: '2.1' // Updated version for file requirements support
                }
            };

            const result = await useCaseService.createUseCaseFromQuery(
                queryData,
                enhancedUseCaseData
            );

            setSuccess(true);
            setCreatedUseCase(result);

            setTimeout(() => {
                onUseCaseCreated?.(result);
                onClose();
                resetForm();
            }, 1500);

        } catch (err) {
            setError(err.message || 'Failed to create use case');
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
            created_by: ''
        });
        setTagInput('');
        setError('');
        setSuccess(false);
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
                            <Sparkles className="text-purple-500" size={24}/>
                            <span>Create Use Case from Query</span>
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Save this successful query as a reusable use case for future use
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X size={24}/>
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Form - Full Width */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl mx-auto">
                            {/* Template Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Use Case Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter a descriptive name for your use case"
                                    maxLength={200}
                                />
                            </div>

                            {/* Template Type, Category, Author - All in one row */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Use Case Type *
                                    </label>
                                    <select
                                        value={formData.use_case_type}
                                        onChange={(e) => handleInputChange('use_case_type', e.target.value)}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 text-xs"
                                    >
                                        {useCaseTypes.map(type => (
                                            <option key={type} value={type}>
                                                {useCaseService.formatUseCaseTypeDisplay(type)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Category *
                                    </label>
                                    <input
                                        type="text"
                                        list="categories"
                                        value={formData.category}
                                        onChange={(e) => handleInputChange('category', e.target.value)}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent text-xs"
                                        placeholder="Finance, etc."
                                    />
                                    <datalist id="categories">
                                        {categories.map(category => (
                                            <option key={category} value={category}/>
                                        ))}
                                    </datalist>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Author
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.created_by}
                                        onChange={(e) => handleInputChange('created_by', e.target.value)}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent text-xs"
                                        placeholder="Your name"
                                    />
                                </div>
                            </div>

                            {/* Description - Now with more space */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    rows={6}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical"
                                    placeholder="Describe what this use case does and when to use it. Be specific about the scenario, expected inputs, and outcomes. This helps other users understand when and how to apply this use case."
                                    maxLength={5000}
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    {formData.description.length}/5000 characters
                                </div>
                            </div>

                            {/* AI-Generated Rich Content */}
                            {idealPromptData && (
                                <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center space-x-2 mb-3">
                                        <Sparkles className="text-blue-500" size={16}/>
                                        <h4 className="font-medium text-blue-900">AI-Optimized Use Case Content</h4>
                                    </div>

                                    {/* Template Content (Ideal Prompt) */}
                                    <div>
                                        <label className="block text-sm font-medium text-blue-700 mb-2">
                                            Use Case Content (Detailed Instructions)
                                        </label>
                                        <textarea
                                            value={idealPromptData.ideal_prompt || ''}
                                            onChange={(e) => setIdealPromptData(prev => ({
                                                ...prev,
                                                ideal_prompt: e.target.value
                                            }))}
                                            rows={6}
                                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                                            placeholder="AI-generated detailed use case instructions"
                                        />
                                        <div className="text-xs text-blue-600 mt-1">
                                            This detailed content will be used by AI for more accurate processing
                                        </div>
                                    </div>

                                    {/* File Pattern */}
                                    {idealPromptData.file_pattern && (
                                        <div>
                                            <label className="block text-sm font-medium text-blue-700 mb-2">
                                                File Pattern
                                            </label>
                                            <input
                                                type="text"
                                                value={idealPromptData.file_pattern || ''}
                                                onChange={(e) => setIdealPromptData(prev => ({
                                                    ...prev,
                                                    file_pattern: e.target.value
                                                }))}
                                                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                                placeholder="File structure pattern for matching similar datasets"
                                            />
                                        </div>
                                    )}

                                    {/* Improvements Made */}
                                    {idealPromptData.improvements_made && (
                                        <div>
                                            <label className="block text-sm font-medium text-blue-700 mb-2">
                                                AI Improvements
                                            </label>
                                            <textarea
                                                value={idealPromptData.improvements_made || ''}
                                                onChange={(e) => setIdealPromptData(prev => ({
                                                    ...prev,
                                                    improvements_made: e.target.value
                                                }))}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                                                placeholder="Explanation of AI optimizations"
                                                readOnly
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* File Requirements Preview */}
                            {queryData?.file_schemas?.length > 0 && (
                                <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center space-x-2 mb-3">
                                        <FileText className="text-green-500" size={16}/>
                                        <h4 className="font-medium text-green-900">File Requirements (Will be
                                            saved)</h4>
                                    </div>

                                    <div className="text-sm text-green-800">
                                        <p className="font-medium mb-2">This use case
                                            requires {queryData.file_schemas.length} file{queryData.file_schemas.length > 1 ? 's' : ''}:</p>

                                        <div className="space-y-2">
                                            {queryData.file_schemas.map((schema, index) => (
                                                <div key={index}
                                                     className="flex items-start space-x-2 bg-white p-2 rounded border border-green-200">
                                                    <div
                                                        className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div
                                                            className="font-medium">file{index + 1}: {schema.filename}</div>
                                                        <div className="text-xs text-green-600">
                                                            {(schema.columns || []).length} columns: {(schema.columns || []).slice(0, 3).join(', ')}
                                                            {(schema.columns || []).length > 3 && '...'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div
                                            className="mt-3 text-xs text-green-600 bg-white p-2 rounded border border-green-200">
                                            <strong>Note:</strong> When applying this use case, users will be asked to
                                            map their files to these exact roles (file1, file2, etc.)
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                                <Tag size={12} className="mr-1"/>
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => handleTagRemove(tag)}
                                                    className="ml-1 text-purple-600 hover:text-purple-800"
                                                >
                                                    <X size={12}/>
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


                            {/* Error Message */}
                            {error && (
                                <div
                                    className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <AlertCircle className="text-red-500 flex-shrink-0" size={16}/>
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
                                                    <CheckCircle size={12} className="text-green-500"/>
                                                ) : (
                                                    <div className="w-3 h-3 border border-blue-400 rounded-full"></div>
                                                )}
                                                <span
                                                    className={formData.name.trim() ? "text-green-700" : "text-blue-700"}>
                                                    Use Case Name {formData.name.trim() ? "✓" : "(required)"}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {formData.description.trim() ? (
                                                    <CheckCircle size={12} className="text-green-500"/>
                                                ) : (
                                                    <div className="w-3 h-3 border border-blue-400 rounded-full"></div>
                                                )}
                                                <span
                                                    className={formData.description.trim() ? "text-green-700" : "text-blue-700"}>
                                                    Description {formData.description.trim() ? "✓" : "(required)"}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {formData.category.trim() ? (
                                                    <CheckCircle size={12} className="text-green-500"/>
                                                ) : (
                                                    <div className="w-3 h-3 border border-blue-400 rounded-full"></div>
                                                )}
                                                <span
                                                    className={formData.category.trim() ? "text-green-700" : "text-blue-700"}>
                                                    Category {formData.category.trim() ? "✓" : "(required)"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Success Message */}
                            {success && (
                                <div
                                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <CheckCircle className="text-green-500 flex-shrink-0" size={16}/>
                                        <span className="text-sm text-green-700">Use case created successfully!</span>
                                    </div>
                                    {createdUseCase && (
                                        <button
                                            onClick={() => setShowDetailModal(true)}
                                            className="flex items-center space-x-1 px-3 py-1 text-sm text-green-700 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                                        >
                                            <Eye size={14}/>
                                            <span>View Details</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </form>
                    </div>

                </div>

                {/* Footer - Always Visible */}
                <div
                    className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Lightbulb size={16}/>
                        <span>Tip: Choose descriptive names and tags to help others find your use case</span>
                    </div>

                    <div className="flex items-center justify-between w-full">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <div className="flex items-center space-x-3">
                            {/* Save Template Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={loading || success || !formData.name.trim() || !formData.description.trim() || !formData.category.trim()}
                                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-lg hover:shadow-xl transition-all"
                                title={(!formData.name.trim() || !formData.description.trim() || !formData.category.trim()) ? "Please fill in all required fields" : "Save use case"}
                            >
                                {loading ? (
                                    <>
                                        <Loader className="animate-spin" size={16}/>
                                        <span>Saving...</span>
                                    </>
                                ) : success ? (
                                    <>
                                        <CheckCircle size={16}/>
                                        <span>Saved!</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={16}/>
                                        <span>Save Use Case</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Use Case Detail Modal */}
            {createdUseCase && (
                <UseCaseDetailModal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    useCase={createdUseCase}
                />
            )}
        </div>
    );
};

export default UseCaseCreationModal;