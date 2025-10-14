/**
 * COBOL Explanation Display Component
 * Displays structured explanation of COBOL code from LLM
 */

import React, { useState } from 'react';
import {
    BookOpen,
    Code,
    Database,
    ArrowRight,
    FileText,
    Calculator,
    GitBranch,
    Lightbulb,
    TrendingUp,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

const CobolExplanationDisplay = ({ explanation }) => {
    const [expandedSections, setExpandedSections] = useState({
        purpose: true,
        inputs: true,
        logic: true,
        outputs: false,
        rules: false,
        calculations: false,
        conditions: false,
        summary: true,
        takeaways: true
    });

    if (!explanation) {
        return null;
    }

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const renderSection = (sectionKey, title, icon, content, alwaysExpanded = false) => {
        const Icon = icon;
        const isExpanded = alwaysExpanded || expandedSections[sectionKey];

        return (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <button
                    onClick={() => !alwaysExpanded && toggleSection(sectionKey)}
                    className={`w-full px-4 py-3 flex items-center justify-between ${
                        alwaysExpanded ? 'cursor-default' : 'hover:bg-gray-50'
                    } transition-colors`}
                >
                    <div className="flex items-center space-x-3">
                        <Icon className="text-blue-600" size={20} />
                        <h3 className="font-semibold text-gray-900">{title}</h3>
                    </div>
                    {!alwaysExpanded && (
                        isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />
                    )}
                </button>

                {isExpanded && (
                    <div className="px-4 py-3 border-t border-gray-100">
                        {content}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-2">
                    <BookOpen size={28} />
                    <h2 className="text-2xl font-bold">COBOL Code Explanation</h2>
                </div>
                <p className="text-blue-100">
                    AI-powered detailed analysis of your COBOL program
                </p>
            </div>

            {/* Program Name & Purpose */}
            {renderSection(
                'purpose',
                explanation.program_name || 'COBOL Program',
                Code,
                <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700">{explanation.program_purpose}</p>
                    <div className="mt-2 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        Complexity: {explanation.complexity_assessment || 'SIMPLE'}
                    </div>
                </div>,
                true
            )}

            {/* Input Data Structures */}
            {explanation.input_data_structures && explanation.input_data_structures.length > 0 &&
                renderSection(
                    'inputs',
                    'Input Data Structures',
                    Database,
                    <div className="space-y-2">
                        {explanation.input_data_structures.map((field, index) => (
                            <div
                                key={index}
                                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                                <div className="flex items-start justify-between mb-1">
                                    <code className="text-sm font-mono font-semibold text-blue-600">
                                        {field.field_name}
                                    </code>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {field.pic_clause}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600">{field.purpose}</p>
                                <div className="mt-1">
                                    <span className="inline-block px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                                        {field.data_type}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            {/* Business Logic Steps */}
            {explanation.business_logic_steps && explanation.business_logic_steps.length > 0 &&
                renderSection(
                    'logic',
                    'Business Logic Steps',
                    GitBranch,
                    <div className="space-y-4">
                        {explanation.business_logic_steps.map((step, index) => (
                            <div key={index} className="relative pl-8">
                                {/* Step number */}
                                <div className="absolute left-0 top-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {step.step_number}
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    {/* COBOL statement */}
                                    <code className="block text-xs font-mono text-gray-800 mb-3 bg-white p-2 rounded border border-gray-200">
                                        {step.cobol_statement}
                                    </code>

                                    {/* What it does */}
                                    <div className="mb-2">
                                        <span className="text-xs font-semibold text-gray-700">What it does:</span>
                                        <p className="text-sm text-gray-700 mt-1">{step.what_it_does}</p>
                                    </div>

                                    {/* Why it does it */}
                                    <div className="mb-2">
                                        <span className="text-xs font-semibold text-gray-700">Why:</span>
                                        <p className="text-sm text-gray-600 mt-1">{step.why_it_does_it}</p>
                                    </div>

                                    {/* Result */}
                                    <div>
                                        <span className="text-xs font-semibold text-gray-700">Result:</span>
                                        <p className="text-sm text-green-700 mt-1">{step.result}</p>
                                    </div>
                                </div>

                                {/* Connector line */}
                                {index < explanation.business_logic_steps.length - 1 && (
                                    <div className="absolute left-3 top-6 w-0.5 h-8 bg-blue-300" />
                                )}
                            </div>
                        ))}
                    </div>
                )}

            {/* Output Data Structures */}
            {explanation.output_data_structures && explanation.output_data_structures.length > 0 &&
                renderSection(
                    'outputs',
                    'Output Data Structures',
                    ArrowRight,
                    <div className="space-y-2">
                        {explanation.output_data_structures.map((field, index) => (
                            <div
                                key={index}
                                className="p-3 bg-green-50 rounded-lg border border-green-200"
                            >
                                <div className="flex items-start justify-between mb-1">
                                    <code className="text-sm font-mono font-semibold text-green-600">
                                        {field.field_name}
                                    </code>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {field.pic_clause}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600">{field.derivation}</p>
                                <div className="mt-1">
                                    <span className="inline-block px-2 py-0.5 bg-green-200 text-green-700 rounded text-xs">
                                        {field.data_type}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            {/* Business Rules */}
            {explanation.business_rules && explanation.business_rules.length > 0 &&
                renderSection(
                    'rules',
                    'Business Rules',
                    FileText,
                    <ul className="space-y-2">
                        {explanation.business_rules.map((rule, index) => (
                            <li key={index} className="flex items-start space-x-2">
                                <span className="text-blue-600 mt-1">•</span>
                                <span className="text-sm text-gray-700">{rule}</span>
                            </li>
                        ))}
                    </ul>
                )}

            {/* Calculations */}
            {explanation.calculations && explanation.calculations.length > 0 &&
                renderSection(
                    'calculations',
                    'Calculations',
                    Calculator,
                    <div className="space-y-3">
                        {explanation.calculations.map((calc, index) => (
                            <div key={index} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <div className="font-semibold text-purple-900 mb-1 text-sm">
                                    {calc.operation}
                                </div>
                                <code className="block text-xs font-mono bg-white p-2 rounded border border-purple-200 mb-2">
                                    {calc.formula}
                                </code>
                                <p className="text-xs text-gray-600">{calc.purpose}</p>
                            </div>
                        ))}
                    </div>
                )}

            {/* Conditions & Branches */}
            {explanation.conditions_and_branches && explanation.conditions_and_branches.length > 0 &&
                renderSection(
                    'conditions',
                    'Conditions & Branches',
                    GitBranch,
                    <div className="space-y-3">
                        {explanation.conditions_and_branches.map((condition, index) => (
                            <div key={index} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="mb-3">
                                    <span className="text-xs font-semibold text-gray-700">Condition:</span>
                                    <code className="block text-sm font-mono bg-white p-2 rounded border border-yellow-200 mt-1">
                                        {condition.condition}
                                    </code>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <span className="text-xs font-semibold text-green-700">When True:</span>
                                        <p className="text-xs text-gray-700 mt-1">{condition.when_true}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-semibold text-red-700">When False:</span>
                                        <p className="text-xs text-gray-700 mt-1">{condition.when_false}</p>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-gray-700">Business Reason:</span>
                                    <p className="text-xs text-gray-600 mt-1">{condition.business_reason}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            {/* Summary */}
            {explanation.summary &&
                renderSection(
                    'summary',
                    'Summary',
                    TrendingUp,
                    <p className="text-sm text-gray-700 leading-relaxed">{explanation.summary}</p>,
                    true
                )}

            {/* Key Takeaways */}
            {explanation.key_takeaways && explanation.key_takeaways.length > 0 &&
                renderSection(
                    'takeaways',
                    'Key Takeaways',
                    Lightbulb,
                    <ul className="space-y-2">
                        {explanation.key_takeaways.map((takeaway, index) => (
                            <li key={index} className="flex items-start space-x-2">
                                <Lightbulb className="text-yellow-500 mt-0.5" size={16} />
                                <span className="text-sm text-gray-700">{takeaway}</span>
                            </li>
                        ))}
                    </ul>,
                    true
                )}
        </div>
    );
};

export default CobolExplanationDisplay;
