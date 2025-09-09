// src/components/miscellaneous/PromptSaveLoad.jsx - Component for saving and loading prompts
import React, { useEffect, useState } from 'react';
import {
    AlertCircle,
    BookOpen,
    Calendar,
    Clock,
    Download,
    Edit3,
    Eye,
    Save,
    Search,
    Sparkles,
    Star,
    Tag,
    Trash2,
    Upload,
    X,
    Copy,
    FileText
} from 'lucide-react';
import { API_ENDPOINTS } from '../../config/environment';

const PromptSaveLoad = ({
    currentPrompt,
    processName,
    selectedFiles,
    onPromptLoaded,
    onPromptSaved,
    onClose,
    defaultTab = 'load' // 'load' for beginning, 'save' for end
}) => {
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [prompts, setPrompts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showPromptDetails, setShowPromptDetails] = useState(null);

    // Save form state
    const [saveForm, setSaveForm] = useState({
        name: processName ? `${processName} - Saved` : '',
        description: '',
        category: 'Data Processing',
        tags: []
    });
    const [saveErrors, setSaveErrors] = useState([]);

    // Categories
    const categories = [
        'all',
        'Data Processing',
        'Data Reconciliation', 
        'Data Merging',
        'Delta Analysis',
        'Analytics',
        'Filtering',
        'Custom'
    ];

    useEffect(() => {
        if (activeTab === 'load') {
            loadPrompts();
        }
    }, [activeTab]);

    const loadPrompts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_ENDPOINTS.MISCELLANEOUS}/saved-prompts`);
            if (response.ok) {
                const data = await response.json();
                setPrompts(data.prompts || []);
            }
        } catch (error) {
            console.error('Error loading prompts:', error);
            setPrompts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePrompt = async () => {
        setSaveErrors([]);
        setLoading(true);

        // Validate form
        const errors = [];
        if (!saveForm.name.trim()) errors.push('Prompt name is required');
        if (!currentPrompt.trim()) errors.push('Prompt content is required');

        if (errors.length > 0) {
            setSaveErrors(errors);
            setLoading(false);
            return;
        }

        try {
            const promptData = {
                name: saveForm.name.trim(),
                ideal_prompt: currentPrompt.trim(),
                original_prompt: currentPrompt.trim(),
                description: saveForm.description.trim(),
                category: saveForm.category,
                file_pattern: selectedFiles.length > 0 
                    ? `Works with ${selectedFiles.length} file(s) - ${selectedFiles.map(f => f.filename).join(', ')}`
                    : 'General purpose'
            };

            console.log('💾 Saving prompt:', promptData);

            const response = await fetch(`${API_ENDPOINTS.MISCELLANEOUS}/save-prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(promptData),
            });

            const data = await response.json();

            if (response.ok) {
                await loadPrompts(); // Refresh list
                setSaveForm({
                    name: '',
                    description: '',
                    category: 'Data Processing',
                    tags: []
                });
                setActiveTab('load'); // Switch to load tab to see saved prompt
                
                if (onPromptSaved) {
                    onPromptSaved(data);
                }
            } else {
                setSaveErrors([data.error || 'Failed to save prompt']);
            }
        } catch (error) {
            console.error('Error saving prompt:', error);
            setSaveErrors([error.message || 'Failed to save prompt']);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadPrompt = (prompt) => {
        console.log('🔍 Loading prompt:', prompt);
        if (onPromptLoaded) {
            onPromptLoaded(prompt);
        }
        onClose();
    };

    const handleDeletePrompt = async (promptId) => {
        if (!confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_ENDPOINTS.MISCELLANEOUS}/saved-prompts/${promptId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadPrompts(); // Refresh list
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete prompt');
            }
        } catch (error) {
            console.error('Error deleting prompt:', error);
            alert('Failed to delete prompt: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredPrompts = prompts.filter(prompt => {
        const matchesSearch = !searchTerm ||
            prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prompt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prompt.ideal_prompt.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const addTag = (tag) => {
        if (tag && !saveForm.tags.includes(tag)) {
            setSaveForm(prev => ({
                ...prev,
                tags: [...prev.tags, tag]
            }));
        }
    };

    const removeTag = (tagToRemove) => {
        setSaveForm(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const exportPrompt = (prompt) => {
        const promptData = {
            metadata: {
                name: prompt.name,
                description: prompt.description,
                category: prompt.category,
                created_at: prompt.created_at,
                exported: true,
                export_version: '1.0'
            },
            promptContent: {
                ideal_prompt: prompt.ideal_prompt,
                original_prompt: prompt.original_prompt,
                file_pattern: prompt.file_pattern
            }
        };

        const blob = new Blob([JSON.stringify(promptData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${prompt.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_prompt.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                            <BookOpen size={20} className="text-purple-600" />
                            <span>Prompt Management</span>
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-1 mt-3">
                        <button
                            onClick={() => setActiveTab('load')}
                            className={`px-4 py-2 text-sm font-medium rounded-md ${
                                activeTab === 'load'
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            <BookOpen size={16} className="inline mr-1" />
                            Load Prompt
                        </button>
                        <button
                            onClick={() => setActiveTab('save')}
                            className={`px-4 py-2 text-sm font-medium rounded-md ${
                                activeTab === 'save'
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            <Save size={16} className="inline mr-1" />
                            Save Prompt
                        </button>
                        <button
                            onClick={() => setActiveTab('import-export')}
                            className={`px-4 py-2 text-sm font-medium rounded-md ${
                                activeTab === 'import-export'
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            <Download size={16} className="inline mr-1" />
                            Import/Export
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                    {activeTab === 'load' && (
                        <div className="space-y-4">
                            {/* Search and Filters */}
                            <div className="flex space-x-4 mb-4">
                                <div className="flex-1 relative">
                                    <Search size={16}
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search prompts..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat === 'all' ? 'All Categories' : cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Prompts List */}
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                                    <p className="text-gray-500 mt-2">Loading prompts...</p>
                                </div>
                            ) : filteredPrompts.length === 0 ? (
                                <div className="text-center py-8">
                                    <Sparkles size={48} className="mx-auto mb-4 text-gray-400" />
                                    <p className="text-gray-500">
                                        {searchTerm || selectedCategory !== 'all'
                                            ? 'No prompts match your filters'
                                            : 'No saved prompts found'
                                        }
                                    </p>
                                    <button
                                        onClick={() => setActiveTab('save')}
                                        className="mt-2 text-purple-600 hover:text-purple-800 text-sm"
                                    >
                                        Save your first prompt →
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredPrompts.map(prompt => (
                                        <div key={prompt.id}
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <h3 className="font-medium text-gray-800">{prompt.name}</h3>
                                                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                                                            {prompt.category}
                                                        </span>
                                                    </div>

                                                    {prompt.description && (
                                                        <p className="text-sm text-gray-600 mb-3">{prompt.description}</p>
                                                    )}

                                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                        <div className="flex items-center space-x-1">
                                                            <Calendar size={12} />
                                                            <span>{formatDate(prompt.created_at)}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <FileText size={12} />
                                                            <span>{prompt.file_pattern || 'General purpose'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Prompt Preview */}
                                                    <div className="mt-3 p-3 bg-gray-50 rounded border">
                                                        <p className="text-sm text-gray-700 italic line-clamp-2">
                                                            "{prompt.ideal_prompt || prompt.original_prompt}"
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2 ml-4">
                                                    <button
                                                        onClick={() => setShowPromptDetails(showPromptDetails === prompt.id ? null : prompt.id)}
                                                        className="p-2 text-gray-400 hover:text-gray-600"
                                                        title="View details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => exportPrompt(prompt)}
                                                        className="p-2 text-gray-400 hover:text-blue-600"
                                                        title="Export prompt"
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleLoadPrompt(prompt)}
                                                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                                                    >
                                                        Load
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePrompt(prompt.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600"
                                                        title="Delete prompt"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expanded Details */}
                                            {showPromptDetails === prompt.id && (
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-700 mb-1">Full Prompt:</h4>
                                                            <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono relative">
                                                                <pre className="whitespace-pre-wrap">{prompt.ideal_prompt || prompt.original_prompt}</pre>
                                                                <button
                                                                    onClick={() => copyToClipboard(prompt.ideal_prompt || prompt.original_prompt)}
                                                                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-green-400"
                                                                    title="Copy prompt"
                                                                >
                                                                    <Copy size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {prompt.original_prompt && prompt.ideal_prompt !== prompt.original_prompt && (
                                                            <div>
                                                                <h4 className="text-sm font-medium text-gray-700 mb-1">Original Prompt:</h4>
                                                                <div className="bg-amber-50 p-3 rounded text-sm">
                                                                    <p className="text-amber-800 italic">"{prompt.original_prompt}"</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'save' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Save Current Prompt</h3>
                                <p className="text-sm text-gray-600">
                                    Save your current prompt for reuse in future data processing tasks.
                                </p>
                            </div>

                            {/* Current Prompt Preview */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Prompt:</h4>
                                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                                    <p className="text-sm text-gray-800 italic">
                                        "{currentPrompt || 'No prompt available'}"
                                    </p>
                                </div>
                            </div>

                            {/* Save Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prompt Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={saveForm.name}
                                        onChange={(e) => setSaveForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Give your prompt a descriptive name..."
                                        maxLength={100}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={saveForm.description}
                                        onChange={(e) => setSaveForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                        rows={3}
                                        placeholder="Describe what this prompt does and when to use it..."
                                        maxLength={500}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={saveForm.category}
                                        onChange={(e) => setSaveForm(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        {categories.filter(cat => cat !== 'all').map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedFiles.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">File Context:</h4>
                                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                            <p className="text-sm text-blue-800">
                                                Works with {selectedFiles.length} file(s): {selectedFiles.map(f => f.filename).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Errors */}
                            {saveErrors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded p-3">
                                    <div className="flex items-start space-x-2">
                                        <AlertCircle className="text-red-600 mt-0.5" size={16} />
                                        <div>
                                            <h4 className="text-sm font-medium text-red-800">Please fix the following errors:</h4>
                                            <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                                                {saveErrors.map((error, index) => (
                                                    <li key={index}>{error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Save Button */}
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePrompt}
                                    disabled={loading || !saveForm.name.trim() || !currentPrompt.trim()}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            <span>Save Prompt</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'import-export' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Import/Export Prompts</h3>
                                <p className="text-sm text-gray-600">
                                    Share prompts between systems or backup your prompt library.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-800 mb-2 flex items-center space-x-2">
                                        <Upload size={16} />
                                        <span>Import Prompt</span>
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Import a prompt from a JSON file.
                                    </p>
                                    <input
                                        type="file"
                                        accept=".json"
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                    />
                                </div>

                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-800 mb-2 flex items-center space-x-2">
                                        <Download size={16} />
                                        <span>Export All Prompts</span>
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Download all your saved prompts as a backup.
                                    </p>
                                    <button
                                        onClick={() => {
                                            const data = { prompts: prompts, exported_at: new Date().toISOString() };
                                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `prompts_backup_${new Date().toISOString().split('T')[0]}.json`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                        }}
                                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                    >
                                        Export All Prompts
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromptSaveLoad;