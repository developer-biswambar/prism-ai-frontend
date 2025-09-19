import React, {useState} from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Database,
  Edit3,
  HelpCircle,
  Lightbulb,
  Play,
  Target,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  XCircle
} from 'lucide-react';

const EnhancedIntentVerificationModal = ({
                                             isOpen,
                                             onClose,
                                             verificationData,
                                             originalPrompt,
                                             onConfirm,
                                             onModifyQuery,
                                             onApplyToPrompt,
                                             isLoading = false
                                         }) => {
    const [selectedSuggestions, setSelectedSuggestions] = useState({});

    // Debug logging
    console.log('🎯 EnhancedIntentVerificationModal props:', {
        isOpen,
        verificationData,
        originalPrompt,
        isLoading
    });
    console.log('🎯 Verification data keys:', verificationData ? Object.keys(verificationData) : 'null/undefined');
    console.log('🎯 Should show loading screen:', isOpen && isLoading);
    console.log('🎯 Modal render decision:', {
        isOpen,
        isLoading,
        hasVerificationData: !!verificationData,
        willShowLoading: isOpen && isLoading,
        willShowModal: isOpen && !isLoading && !!verificationData,
        willReturnNull: !isOpen || (!isLoading && !verificationData)
    });
    const [showAllIssues, setShowAllIssues] = useState(false);

    // Debug button conditions
    React.useEffect(() => {
        if (verificationData) {
            const suggestions = verificationData.intelligent_suggestions || [];
            console.log('🔍 Button conditions:', {
                intelligentSuggestionsLength: suggestions.length,
                selectedSuggestions,
                hasSelectedSuggestions: Object.keys(selectedSuggestions).some(k => selectedSuggestions[k]),
                shouldShowButton: suggestions.length > 0 && Object.keys(selectedSuggestions).some(k => selectedSuggestions[k])
            });
        }
    }, [verificationData, selectedSuggestions]);

    // Loading Screen Component
    const LoadingScreen = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
                <div className="space-y-6">
                    {/* Animated Icon */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                            <div
                                className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing Your Query</h3>
                        <p className="text-gray-600">
                            Our AI is performing comprehensive intent verification...
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="space-y-3 text-left">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-700">Validating column references</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                                 style={{animationDelay: '0.5s'}}></div>
                            <span className="text-sm text-gray-700">Analyzing data relationships</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"
                                 style={{animationDelay: '1s'}}></div>
                            <span className="text-sm text-gray-700">Generating intelligent suggestions</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse"
                                 style={{animationDelay: '1.5s'}}></div>
                            <span className="text-sm text-gray-700">Calculating feasibility score</span>
                        </div>
                    </div>

                    {/* Tip */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                            <Lightbulb size={16} className="text-blue-600 mt-0.5"/>
                            <div className="text-sm text-blue-800">
                                <strong>Tip:</strong> Our AI will suggest alternative column names if your references
                                don't match exactly.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!isOpen) return null;

    // Show loading screen when intent verification is running
    if (isLoading) {
        return <LoadingScreen/>;
    }

    // Don't render modal if no verification data
    if (!verificationData) return null;

    const feasibilityScore = verificationData.feasibility_score || 0;
    const columnValidation = verificationData.column_validation || {};
    const intelligentSuggestions = verificationData.intelligent_suggestions || [];
    const potentialIssues = verificationData.potential_issues || [];
    const requiresConfirmation = verificationData.requires_user_confirmation || false;

    // Feasibility score color and messaging
    const getFeasibilityColor = (score) => {
        if (score >= 0.8) return {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-800',
            icon: 'text-green-600'
        };
        if (score >= 0.6) return {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            text: 'text-yellow-800',
            icon: 'text-yellow-600'
        };
        return {bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600'};
    };

    const feasibilityColors = getFeasibilityColor(feasibilityScore);
    const feasibilityPercentage = Math.round(feasibilityScore * 100);

    // Handle suggestion selection
    const handleSuggestionToggle = (missingColumn, actualColumn) => {
        const key = `${missingColumn}_${actualColumn}`;
        setSelectedSuggestions(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const createEnhancedPrompt = () => {
        console.log('🔧 createEnhancedPrompt started');
        console.log('📝 Original prompt:', `"${originalPrompt}"`);
        console.log('🧠 Intelligent suggestions:', intelligentSuggestions);
        console.log('🧠 Number of suggestions:', intelligentSuggestions.length);

        let enhancedPrompt = originalPrompt;
        const suggestionMappings = [];

        if (intelligentSuggestions.length > 0) {
            console.log('🔄 Collecting ALL suggestions to append...');

            // Collect all suggestions (no text replacement)
            intelligentSuggestions.forEach((suggestion, suggestionIndex) => {
                console.log(`\n📋 === Processing suggestion ${suggestionIndex + 1}/${intelligentSuggestions.length} ===`);
                console.log('📋 Full suggestion object:', suggestion);
                console.log('📋 Missing column:', `"${suggestion.missing_column}"`);
                console.log('📋 Available suggestions:', suggestion.suggestions);

                // Take the first (best) suggestion for each missing column
                if (suggestion.suggestions && suggestion.suggestions.length > 0) {
                    const bestSuggestion = suggestion.suggestions[0]; // Use the first (highest confidence) suggestion
                    const missingCol = suggestion.missing_column;
                    const actualCol = bestSuggestion.actual_column;

                    console.log(`🎯 Best suggestion - Missing: "${missingCol}" → Actual: "${actualCol}"`);
                    console.log(`🎯 Confidence: ${bestSuggestion.confidence}`);

                    // Add to mappings list
                    suggestionMappings.push(`"${missingCol}" → "${actualCol}"`);
                } else {
                    console.log('❌ No suggestions available for this missing column');
                }
            });

            // Append suggestions to the bottom of the original prompt
            if (suggestionMappings.length > 0) {
                console.log('✅ Adding suggestions to bottom of prompt');
                enhancedPrompt = originalPrompt + '\n\nColumn mapping suggestions:\n' + suggestionMappings.join('\n');
            }
        } else {
            console.log('❌ No suggestions to apply');
        }

        console.log(`\n🎯 === SUMMARY ===`);
        console.log(`📝 Original prompt: "${originalPrompt}"`);
        console.log(`📝 Final enhanced prompt: "${enhancedPrompt}"`);
        console.log(`🔢 Total suggestions added: ${suggestionMappings.length}`);
        console.log(`✅ Prompt changed: ${originalPrompt !== enhancedPrompt}`);

        return enhancedPrompt;
    };

    const handleApplyToPrompt = () => {
        console.log('🚀 handleApplyToPrompt clicked');
        console.log('📊 Current selectedSuggestions state:', selectedSuggestions);
        console.log('📋 Available intelligentSuggestions:', intelligentSuggestions);
        console.log('📋 intelligentSuggestions length:', intelligentSuggestions.length);
        console.log('📋 intelligentSuggestions structure:', JSON.stringify(intelligentSuggestions, null, 2));

        const enhancedPrompt = createEnhancedPrompt();
        console.log('📝 Enhanced prompt result:', enhancedPrompt);
        console.log('🔗 onApplyToPrompt function exists:', !!onApplyToPrompt);

        if (onApplyToPrompt) {
            console.log('✅ Calling onApplyToPrompt with:', {enhancedPrompt, selectedSuggestions});
            onApplyToPrompt(enhancedPrompt, selectedSuggestions);
        } else {
            console.error('❌ onApplyToPrompt function not provided');
        }
    };

    // Column Validation Section
    const ColumnValidationSection = () => {
        const foundColumns = columnValidation.found_columns || [];
        const missingColumns = columnValidation.missing_columns || [];
        const successRate = columnValidation.validation_summary?.success_rate || 0;

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Database size={20} className="mr-2 text-blue-600"/>
                        Column Validation
                    </h3>
                    <div className="flex items-center space-x-2">
                        <div
                            className={`w-3 h-3 rounded-full ${successRate === 1 ? 'bg-green-500' : successRate > 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-600">{Math.round(successRate * 100)}% found</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Found Columns */}
                    {foundColumns.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-3">
                                <CheckCircle size={16} className="text-green-600"/>
                                <span
                                    className="font-medium text-green-800">Found Columns ({foundColumns.length})</span>
                            </div>
                            <div className="space-y-1">
                                {foundColumns && foundColumns.map(column => (
                                    <span key={column}
                                          className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2 mb-1">
                    {column}
                  </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Missing Columns */}
                    {missingColumns.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-3">
                                <XCircle size={16} className="text-red-600"/>
                                <span
                                    className="font-medium text-red-800">Missing Columns ({missingColumns.length})</span>
                            </div>
                            <div className="space-y-1">
                                {missingColumns && missingColumns.map(column => (
                                    <span key={column}
                                          className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-2 mb-1">
                    {column}
                  </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Intelligent Suggestions Section
    const IntelligentSuggestionsSection = () => {
        if (!intelligentSuggestions.length) return null;

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Lightbulb size={20} className="mr-2 text-purple-600"/>
                    Intelligent Suggestions
                </h3>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-800 mb-4">
                        AI found similar columns that might match what you're looking for. Select the ones you want to
                        use:
                    </p>

                    <div className="space-y-4">
                        {intelligentSuggestions && intelligentSuggestions.map((suggestion, index) => (
                            <div key={index} className="bg-white border border-purple-200 rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <span className="font-medium text-gray-900">Missing: </span>
                                        <span
                                            className="text-red-600 font-mono text-sm">{suggestion.missing_column}</span>
                                    </div>
                                    <AlertTriangle size={16} className="text-orange-500 mt-0.5"/>
                                </div>

                                <div className="space-y-2">
                                    {suggestion.suggestions && suggestion.suggestions.map((sug, sugIndex) => (
                                        <div key={sugIndex} className="border border-gray-200 rounded p-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSuggestions[`${suggestion.missing_column}_${sug.actual_column}`] || false}
                                                            onChange={() => handleSuggestionToggle(suggestion.missing_column, sug.actual_column)}
                                                            className="rounded border-gray-300"
                                                        />
                                                        <span className="font-mono text-sm font-medium text-blue-600">
                              {sug.actual_column}
                            </span>
                                                        <span className="text-xs text-gray-500">
                              from {sug.file_source}
                            </span>
                                                    </div>

                                                    <div className="mt-1 text-xs text-gray-600">
                                                        {sug.reasoning}
                                                    </div>

                                                    {sug.sample_values && sug.sample_values.length > 0 && (
                                                        <div className="mt-1 flex items-center space-x-1">
                                                            <span className="text-xs text-gray-500">Samples:</span>
                                                            {sug.sample_values.map((val, i) => (
                                                                <span key={i}
                                                                      className="text-xs bg-gray-100 px-1 rounded">
                                  "{val}"
                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="ml-4 text-right">
                                                    <div className="text-xs text-gray-500">Confidence</div>
                                                    <div
                                                        className="font-medium text-sm">{Math.round(sug.confidence * 100)}%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // Feasibility Score Section
    const FeasibilityScoreSection = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Target size={20} className="mr-2 text-green-600"/>
                Feasibility Assessment
            </h3>

            <div className={`${feasibilityColors.bg} ${feasibilityColors.border} border rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        {feasibilityScore >= 0.8 ? <ThumbsUp size={20} className={feasibilityColors.icon}/> :
                            feasibilityScore >= 0.6 ? <HelpCircle size={20} className={feasibilityColors.icon}/> :
                                <ThumbsDown size={20} className={feasibilityColors.icon}/>}
                        <span className={`font-semibold ${feasibilityColors.text}`}>
              {feasibilityScore >= 0.8 ? 'Highly Feasible' :
                  feasibilityScore >= 0.6 ? 'Moderately Feasible' :
                      'Challenging Query'}
            </span>
                    </div>
                    <div className={`text-2xl font-bold ${feasibilityColors.text}`}>
                        {feasibilityPercentage}%
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full ${feasibilityScore >= 0.8 ? 'bg-green-500' : feasibilityScore >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{width: `${feasibilityPercentage}%`}}
                    ></div>
                </div>

                <div className={`text-sm ${feasibilityColors.text} mt-2`}>
                    {feasibilityScore >= 0.8 ?
                        'Your query looks great! All column references are valid and the logic is sound.' :
                        feasibilityScore >= 0.6 ?
                            'Your query is mostly feasible but may need some adjustments for optimal results.' :
                            'Your query has several issues that need to be addressed before execution.'}
                </div>
            </div>
        </div>
    );

    // Potential Issues Section
    const PotentialIssuesSection = () => {
        if (!potentialIssues.length) return null;

        const highIssues = potentialIssues.filter(issue => issue.severity === 'high');
        const otherIssues = potentialIssues.filter(issue => issue.severity !== 'high');
        const displayIssues = showAllIssues ? potentialIssues : [...highIssues, ...otherIssues.slice(0, 2)];

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <AlertTriangle size={20} className="mr-2 text-orange-600"/>
                        Potential Issues ({potentialIssues.length})
                    </h3>
                    {potentialIssues.length > 3 && (
                        <button
                            onClick={() => setShowAllIssues(!showAllIssues)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            {showAllIssues ? 'Show less' : `Show all ${potentialIssues.length}`}
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {displayIssues && displayIssues.map((issue, index) => (
                        <div
                            key={index}
                            className={`border rounded-lg p-3 ${
                                issue.severity === 'high' ? 'bg-red-50 border-red-200' :
                                    issue.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                                        'bg-blue-50 border-blue-200'
                            }`}
                        >
                            <div className="flex items-start space-x-3">
                                <AlertCircle size={16} className={`mt-0.5 ${
                                    issue.severity === 'high' ? 'text-red-600' :
                                        issue.severity === 'medium' ? 'text-yellow-600' :
                                            'text-blue-600'
                                }`}/>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                    }`}>
                      {issue.severity.toUpperCase()}
                    </span>
                                        <span className="font-medium text-gray-900">{issue.issue}</span>
                                    </div>
                                    <div className="text-sm text-gray-600 mb-2">{issue.impact}</div>
                                    <div
                                        className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
                                        <strong>Suggestion:</strong> {issue.suggestion}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-5xl max-h-[90vh] overflow-y-auto w-full mx-4">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Enhanced Query Verification</h2>
                            <p className="text-blue-100 mt-1">AI-powered feasibility analysis with intelligent
                                suggestions</p>
                        </div>
                        <div
                            className={`px-4 py-2 rounded-full text-sm font-medium ${feasibilityColors.bg} ${feasibilityColors.text} border ${feasibilityColors.border}`}>
                            {feasibilityPercentage}% Feasible
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Original Query */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Query</h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-gray-700 italic">"{originalPrompt}"</p>
                        </div>
                    </div>

                    {/* Feasibility Score */}
                    <FeasibilityScoreSection/>

                    {/* Column Validation */}
                    <ColumnValidationSection/>

                    {/* Intelligent Suggestions */}
                    <IntelligentSuggestionsSection/>

                    {/* Debug Information */}
                    {intelligentSuggestions.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="text-sm text-red-800">
                                <strong>DEBUG:</strong> Found {intelligentSuggestions.length} suggestions.
                                <pre className="mt-2 text-xs overflow-auto max-h-32">
                  {JSON.stringify(intelligentSuggestions, null, 2)}
                </pre>
                            </div>
                        </div>
                    )}


                    {/* Potential Issues */}
                    <PotentialIssuesSection/>

                    {/* Derived Columns */}
                    {verificationData.derived_columns_detected && verificationData.derived_columns_detected.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <TrendingUp size={20} className="mr-2 text-indigo-600"/>
                                Derived Columns Detected
                            </h3>
                            <div className="space-y-3">
                                {verificationData.derived_columns_detected && verificationData.derived_columns_detected.map((derivedCol, index) => (
                                    <div key={index} className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                                        <div className="font-medium text-indigo-900">{derivedCol.requested}</div>
                                        <div className="text-sm text-indigo-700 mt-1">{derivedCol.calculation}</div>
                                        <div className="flex items-center space-x-2 mt-2">
                                            {derivedCol.feasible ? (
                                                <CheckCircle size={16} className="text-green-600"/>
                                            ) : (
                                                <XCircle size={16} className="text-red-600"/>
                                            )}
                                            <span className="text-sm text-gray-600">
                        {derivedCol.feasible ? 'Feasible' : 'Not feasible'}
                      </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={onModifyQuery}
                            className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <Edit3 size={16}/>
                            <span>Modify Query</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            Cancel
                        </button>

                        <div className="flex items-center space-x-3">
                            {/* Apply to Prompt Button */}
                            {intelligentSuggestions.length > 0 && (
                                <button
                                    onClick={handleApplyToPrompt}
                                    disabled={isLoading}
                                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Edit3 size={16}/>
                                    <span>Apply to Query</span>
                                </button>
                            )}

                            {/* Proceed Button */}
                            <button
                                onClick={() => onConfirm(selectedSuggestions)}
                                disabled={isLoading || (requiresConfirmation && Object.keys(selectedSuggestions).length === 0)}
                                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <>
                                        <div
                                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Play size={16}/>
                                        <span>
                    {requiresConfirmation
                        ? `Proceed with ${Object.keys(selectedSuggestions).filter(k => selectedSuggestions[k]).length} suggestions`
                        : 'Proceed with Query'
                    }
                  </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedIntentVerificationModal;