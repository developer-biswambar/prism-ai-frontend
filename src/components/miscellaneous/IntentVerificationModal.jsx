import React, { useState, useEffect } from 'react';
import {
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  ArrowRight, 
  ArrowDown,
  Users,
  Database,
  TrendingUp,
  Clock,
  HardDrive,
  Zap,
  Edit3,
  Eye,
  Play,
  AlertCircle
} from 'lucide-react';

const IntentVerificationModal = ({ 
  isOpen, 
  onClose, 
  intentData, 
  originalPrompt,
  onConfirm,
  onClarify,
  isLoading = false 
}) => {
  const [showSqlQuery, setShowSqlQuery] = useState(false);
  
  if (!isOpen) return null;

  const confidence = intentData?.confidence || 'MEDIUM';
  const confidenceColor = confidence === 'HIGH' ? 'text-green-600' : 
                         confidence === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600';
  const confidenceBg = confidence === 'HIGH' ? 'bg-green-50' : 
                      confidence === 'MEDIUM' ? 'bg-yellow-50' : 'bg-red-50';

  // Data Flow Diagram Component
  const DataFlowDiagram = ({ steps }) => {
    if (!steps || steps.length === 0) return null;

    const getStepIcon = (step) => {
      switch (step.type) {
        case 'input': return <Database size={16} />;
        case 'preparation': return <Edit3 size={16} />;
        case 'matching': return <Users size={16} />;
        case 'tolerance': return <AlertTriangle size={16} />;
        case 'classification': return <CheckCircle size={16} />;
        case 'join': return <Zap size={16} />;
        case 'filter': return <Eye size={16} />;
        case 'grouping': return <Users size={16} />;
        case 'aggregation': return <TrendingUp size={16} />;
        case 'output': return <TrendingUp size={16} />;
        default: return <Zap size={16} />;
      }
    };

    const getStepColor = (step) => {
      switch (step.type) {
        case 'input': return 'bg-blue-50 border border-blue-200';
        case 'preparation': return 'bg-yellow-50 border border-yellow-200';
        case 'matching': return 'bg-purple-50 border border-purple-200';
        case 'tolerance': return 'bg-orange-50 border border-orange-200';
        case 'classification': return 'bg-indigo-50 border border-indigo-200';
        case 'join': return 'bg-purple-50 border border-purple-200';
        case 'filter': return 'bg-red-50 border border-red-200';
        case 'grouping': return 'bg-cyan-50 border border-cyan-200';
        case 'aggregation': return 'bg-emerald-50 border border-emerald-200';
        case 'output': return 'bg-green-50 border border-green-200';
        default: return 'bg-gray-50 border border-gray-200';
      }
    };

    const getIconColor = (step) => {
      switch (step.type) {
        case 'input': return 'bg-blue-100 text-blue-600';
        case 'preparation': return 'bg-yellow-100 text-yellow-600';
        case 'matching': return 'bg-purple-100 text-purple-600';
        case 'tolerance': return 'bg-orange-100 text-orange-600';
        case 'classification': return 'bg-indigo-100 text-indigo-600';
        case 'join': return 'bg-purple-100 text-purple-600';
        case 'filter': return 'bg-red-100 text-red-600';
        case 'grouping': return 'bg-cyan-100 text-cyan-600';
        case 'aggregation': return 'bg-emerald-100 text-emerald-600';
        case 'output': return 'bg-green-100 text-green-600';
        default: return 'bg-gray-100 text-gray-600';
      }
    };

    return (
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start space-x-4">
            {/* Step Number */}
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center font-medium mt-1">
              {index + 1}
            </div>
            
            {/* Step Content */}
            <div className={`flex-1 p-4 rounded-lg ${getStepColor(step)}`}>
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(step)}`}>
                  {getStepIcon(step)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">
                    {step.name || step.file || step.description}
                  </div>
                  
                  {step.description && step.type !== 'output' && (
                    <div className="text-sm text-gray-600 mt-1">
                      {step.description}
                    </div>
                  )}
                  
                  {/* Additional details */}
                  {step.type === 'input' && (
                    <div className="text-xs text-gray-500 mt-2">
                      {step.rows?.toLocaleString()} rows • {step.columns} columns
                    </div>
                  )}
                  
                  {step.condition && (
                    <div className="text-xs bg-white rounded px-2 py-1 mt-2 font-mono">
                      {step.condition}
                    </div>
                  )}
                  
                  {step.details && (
                    <div className="text-xs text-gray-600 mt-2">
                      <ul className="list-disc list-inside space-y-1">
                        {step.details.map((detail, i) => (
                          <li key={i}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {step.categories && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {step.categories.map((category, i) => (
                        <span key={i} className="text-xs bg-white rounded-full px-2 py-1 text-gray-600">
                          {category}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {step.operations && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {step.operations.map((op, i) => (
                        <span key={i} className="text-xs bg-white rounded px-2 py-1 font-mono text-gray-700">
                          {op}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {step.type === 'output' && step.estimated_rows && (
                    <div className="text-sm text-gray-600 mt-2">
                      Expected: {typeof step.estimated_rows === 'number' 
                        ? step.estimated_rows.toLocaleString() 
                        : step.estimated_rows} rows
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Arrow between steps */}
            {index < steps.length - 1 && (
              <div className="flex-shrink-0 flex flex-col items-center mt-8">
                <ArrowDown size={16} className="text-gray-400" />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Sample Data Preview Component
  const SampleDataPreview = ({ filesInvolved, expectedOutput }) => {
    if (!filesInvolved || filesInvolved.length === 0) return null;

    return (
      <div className="space-y-6">
        {/* Input Files Sample */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Input Data Sample</h4>
          <div className="grid gap-4">
            {filesInvolved.slice(0, 2).map((file, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">{file.file}</span>
                    <span className="text-xs text-gray-500">
                      {file.statistics?.rows?.toLocaleString()} rows, {file.statistics?.columns} cols
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  {file.sample_data && file.sample_data.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            {Object.keys(file.sample_data[0]).slice(0, 4).map((key) => (
                              <th key={key} className="px-2 py-1 text-left font-medium text-gray-600">
                                {key}
                              </th>
                            ))}
                            {Object.keys(file.sample_data[0]).length > 4 && (
                              <th className="px-2 py-1 text-left font-medium text-gray-500">...</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {file.sample_data.slice(0, 2).map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-t">
                              {Object.entries(row).slice(0, 4).map(([key, value]) => (
                                <td key={key} className="px-2 py-1 text-gray-800">
                                  {value !== null && value !== undefined ? String(value).substring(0, 20) : 'null'}
                                </td>
                              ))}
                              {Object.keys(row).length > 4 && (
                                <td className="px-2 py-1 text-gray-500">...</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-2">No sample data available</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expected Output Sample */}
        {expectedOutput?.sample_result && expectedOutput.sample_result.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Expected Output Sample</h4>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-green-50 px-3 py-2 border-b">
                <span className="font-medium text-gray-700">Result Preview</span>
              </div>
              <div className="p-3">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        {expectedOutput.columns?.slice(0, 5).map((col) => (
                          <th key={col} className="px-2 py-1 text-left font-medium text-gray-600">
                            {col}
                          </th>
                        ))}
                        {expectedOutput.columns?.length > 5 && (
                          <th className="px-2 py-1 text-left font-medium text-gray-500">...</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {expectedOutput.sample_result.slice(0, 2).map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t">
                          {Object.entries(row).slice(0, 5).map(([key, value]) => (
                            <td key={key} className="px-2 py-1 text-gray-800">
                              {value !== null && value !== undefined ? String(value).substring(0, 20) : 'null'}
                            </td>
                          ))}
                          {Object.keys(row).length > 5 && (
                            <td className="px-2 py-1 text-gray-500">...</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Statistics Cards Component
  const StatisticsCards = ({ filesInvolved, expectedOutput, processingEstimates }) => {
    const totalInputRows = filesInvolved?.reduce((sum, file) => sum + (file.statistics?.rows || 0), 0) || 0;
    const totalInputSize = filesInvolved?.reduce((sum, file) => sum + (file.statistics?.size_mb || 0), 0) || 0;
    const estimatedRows = expectedOutput?.estimated_rows?.likely || expectedOutput?.estimated_rows?.actual || 'Unknown';
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Database size={16} className="text-blue-600" />
            <div className="text-sm font-medium text-blue-700">Input Rows</div>
          </div>
          <div className="text-lg font-semibold text-blue-900 mt-1">
            {totalInputRows.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <TrendingUp size={16} className="text-green-600" />
            <div className="text-sm font-medium text-green-700">Expected Output</div>
          </div>
          <div className="text-lg font-semibold text-green-900 mt-1">
            {typeof estimatedRows === 'number' ? estimatedRows.toLocaleString() : estimatedRows}
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <HardDrive size={16} className="text-purple-600" />
            <div className="text-sm font-medium text-purple-700">Data Size</div>
          </div>
          <div className="text-lg font-semibold text-purple-900 mt-1">
            {totalInputSize.toFixed(1)} MB
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Clock size={16} className="text-yellow-600" />
            <div className="text-sm font-medium text-yellow-700">Complexity</div>
          </div>
          <div className="text-lg font-semibold text-yellow-900 mt-1">
            {processingEstimates?.complexity || 'Unknown'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl max-h-[90vh] overflow-y-auto w-full mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Query Intent Verification</h2>
              <p className="text-blue-100 mt-1">Review what your query will do before execution</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${confidenceBg} ${confidenceColor}`}>
              Confidence: {confidence}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Original Prompt */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Request</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 italic">"{originalPrompt}"</p>
            </div>
          </div>

          {/* Section 1: Data Flow Diagram */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ArrowRight size={20} className="mr-2 text-blue-600" />
              Data Processing Flow
            </h3>
            <DataFlowDiagram steps={intentData?.data_flow?.steps || []} />
          </div>

          {/* Section 2: Sample Data Preview */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Eye size={20} className="mr-2 text-purple-600" />
              Data Preview
            </h3>
            <SampleDataPreview 
              filesInvolved={intentData?.files_involved || []}
              expectedOutput={intentData?.expected_output || {}}
            />
          </div>

          {/* Section 3: Summary Statistics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp size={20} className="mr-2 text-green-600" />
              Processing Summary
            </h3>
            <StatisticsCards 
              filesInvolved={intentData?.files_involved || []}
              expectedOutput={intentData?.expected_output || {}}
              processingEstimates={intentData?.processing_estimates || {}}
            />
          </div>

          {/* Section 4: Plain Language Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users size={20} className="mr-2 text-indigo-600" />
              What This Will Do
            </h3>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-indigo-900 text-lg">
                {intentData?.plain_language_summary || "Processing your data as requested..."}
              </p>
            </div>
          </div>

          {/* Risk Factors & Warnings */}
          {(intentData?.risk_factors?.length > 0 && !intentData.risk_factors.includes("None detected")) || 
           (intentData?.data_quality_warnings?.length > 0) ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle size={20} className="mr-2 text-yellow-600" />
                Considerations
              </h3>
              <div className="space-y-3">
                {intentData.risk_factors?.length > 0 && !intentData.risk_factors.includes("None detected") && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Risk Factors:</h4>
                    <ul className="list-disc list-inside text-yellow-700 space-y-1">
                      {intentData.risk_factors.map((risk, index) => (
                        <li key={index}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {intentData.data_quality_warnings?.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-orange-800 mb-2">Data Quality Warnings:</h4>
                    <ul className="list-disc list-inside text-orange-700 space-y-1">
                      {intentData.data_quality_warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* SQL Query Toggle */}
          {intentData?.generated_sql && (
            <div>
              <button
                onClick={() => setShowSqlQuery(!showSqlQuery)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <FileText size={16} />
                <span>Show Generated SQL Query</span>
                <ArrowDown size={16} className={`transform transition-transform ${showSqlQuery ? 'rotate-180' : ''}`} />
              </button>
              
              {showSqlQuery && (
                <div className="mt-3 bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {intentData.generated_sql}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClarify}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Edit3 size={16} />
              <span>Modify Query</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Confirm & Process Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntentVerificationModal;