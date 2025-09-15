import React, {useEffect, useState} from 'react';
import {
    Brain,
    ChevronLeft,
    ChevronRight,
    Database,
    Download,
    ExternalLink,
    FileText,
    FolderOpen,
    HelpCircle,
    Loader,
    Play,
    Save,
    Sparkles,
    Trash2,
    Upload,
    Wand2,
    X
} from 'lucide-react';
import MiscellaneousFileSelection from './MiscellaneousFileSelection.jsx';
import MiscellaneousPromptInput from './MiscellaneousPromptInput.jsx';
import MiscellaneousPreview from './MiscellaneousPreview.jsx';
import EnhancedIntentVerificationModal from './EnhancedIntentVerificationModal.jsx';
import UseCaseGallery from '../usecases/UseCaseGallery.jsx';
import UseCaseCreationModal from '../usecases/UseCaseCreationModal.jsx';
import ColumnMappingModal from '../usecases/ColumnMappingModal.jsx';
import ExecutionErrorModal from '../usecases/ExecutionErrorModal.jsx';
import {miscellaneousService} from '../../services/miscellaneousService.js';
import {useCaseService} from '../../services/useCaseService.js';

const MiscellaneousFlow = ({
    files,
    selectedFiles,
    flowData,
    onComplete,
    onCancel,
    onSendMessage,
    onFilesRefresh // Callback to refresh file list
}) => {
    // State management
    const [currentStep, setCurrentStep] = useState('file_selection');
    const [selectedFilesForProcessing, setSelectedFilesForProcessing] = useState({});
    const [userPrompt, setUserPrompt] = useState('');
    const [processName, setProcessName] = useState('Data Analysis');
    const [outputFormat, setOutputFormat] = useState('json');
    
    // Processing state
    const [isProcessing, setIsProcessing] = useState(false);
    const [processResults, setProcessResults] = useState(null);
    const [processId, setProcessId] = useState(null);
    const [generatedSQL, setGeneratedSQL] = useState('');
    const [processingError, setProcessingError] = useState(null);
    const [processingTimeSeconds, setProcessingTimeSeconds] = useState(null);
    
    // Track if prompt changed after results were generated
    const [originalPrompt, setOriginalPrompt] = useState('');
    const [hasPromptChanged, setHasPromptChanged] = useState(false);
    
    // Intent verification state
    const [showIntentModal, setShowIntentModal] = useState(false);
    const [intentData, setIntentData] = useState(null);
    const [isVerifyingIntent, setIsVerifyingIntent] = useState(false);
    
    // Template state
    const [selectedUseCase, setSelectedUseCase] = useState(null);
    const [showUseCaseCreationModal, setShowUseCaseCreationModal] = useState(false);
    const [useCaseCreationData, setUseCaseCreationData] = useState(null);
    
    // Column mapping state
    const [showColumnMappingModal, setShowColumnMappingModal] = useState(false);
    const [columnMappingSuggestions, setColumnMappingSuggestions] = useState(null);
    const [pendingUseCaseExecution, setPendingUseCaseExecution] = useState(null);
    const [isExecutingUseCase, setIsExecutingUseCase] = useState(false);
    const [executionType, setExecutionType] = useState(''); // 'ai_assisted' or 'column_mapping'
    
    // Execution error state
    const [showExecutionErrorModal, setShowExecutionErrorModal] = useState(false);
    const [executionErrorData, setExecutionErrorData] = useState(null);

    // Step definitions
    const steps = [
        {id: 'file_selection', title: 'Select Files', icon: FileText},
        {id: 'use_case_selection', title: 'Choose Your Use Case', icon: Sparkles},
        {id: 'prompt_input', title: 'Natural Language Query', icon: Wand2},
        {id: 'intent_verification', title: 'Verify Intent', icon: Brain},
        {id: 'preview_process', title: 'Process & View Results', icon: Database}
    ];

    // Helper functions
    const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);

    const getSelectedFilesArray = () => {
        return Object.keys(selectedFilesForProcessing)
            .sort()
            .map(key => selectedFilesForProcessing[key])
            .filter(file => file !== null && file !== undefined);
    };

    // Handle prompt changes to track if reprocessing is needed
    const handlePromptChange = (newPrompt) => {
        console.log('🔄 MiscellaneousFlow handlePromptChange called with:', newPrompt);
        console.log('🔄 Current userPrompt before update:', userPrompt);
        
        setUserPrompt(newPrompt);
        
        console.log('✅ setUserPrompt called with:', newPrompt);
        
        // If results exist and prompt changed from the original, mark as changed
        if (processResults && originalPrompt && newPrompt !== originalPrompt) {
            setHasPromptChanged(true);
            console.log('🔄 Marked prompt as changed');
        }
        
        // Clear intent data when prompt changes - requires re-verification
        if (intentData && newPrompt !== userPrompt) {
            setIntentData(null);
            setShowIntentModal(false);
            console.log('🔄 Cleared intent data due to prompt change');
        }
    };

    const canProceedToNext = () => {
        switch(currentStep) {
            case 'file_selection':
                return getSelectedFilesArray().length >= 1 && getSelectedFilesArray().length <= 10;
            case 'use_case_selection':
                return true; // Use Case selection is optional - users can skip to write custom prompt
            case 'prompt_input':
                return userPrompt && userPrompt.trim().length > 10 && processName && processName.trim().length > 0;
            case 'intent_verification':
                return intentData !== null; // Can proceed ONLY if intent has been verified
            case 'preview_process':
                return true;
            default:
                return false;
        }
    };

    // Navigation handlers
    const nextStep = () => {
        const currentIndex = getCurrentStepIndex();
        if (currentIndex < steps.length - 1) {
            const nextStepId = steps[currentIndex + 1].id;
            
            // If moving from prompt_input to intent_verification, trigger intent verification
            if (currentStep === 'prompt_input' && nextStepId === 'intent_verification') {
                setCurrentStep(nextStepId);
                // Automatically start intent verification when entering this step
                setTimeout(() => verifyIntent(), 100);
                return;
            }
            
            // If moving from intent_verification to preview_process and prompt has changed,
            // clear outdated results
            if (currentStep === 'intent_verification' && nextStepId === 'preview_process' && hasPromptChanged) {
                setProcessResults(null);
                setProcessId(null);
                setGeneratedSQL('');
                setProcessingError(null);
                setProcessingTimeSeconds(null);
                setHasPromptChanged(false);
            }
            
            setCurrentStep(nextStepId);
        }
    };

    const prevStep = () => {
        const currentIndex = getCurrentStepIndex();
        if (currentIndex > 0) {
            setCurrentStep(steps[currentIndex - 1].id);
        }
    };

    // Intent verification methods
    const verifyIntent = async () => {
        if (!canProceedToNext()) return;
        await verifyIntentWithPrompt(userPrompt);
    };

    const verifyIntentWithPrompt = async (promptToVerify) => {
        console.log('🔍 Starting intent verification - setting loading states');
        setIsVerifyingIntent(true);
        setShowIntentModal(true);
        console.log('🔍 Modal opened immediately with isVerifyingIntent=true');
        try {
            onSendMessage('system', '🔍 Analyzing your query intent...');
            
            const filesArray = getSelectedFilesArray();
            const fileReferences = filesArray.map((file, index) => ({
                file_id: file.file_id,
                role: `file_${index}`,
                label: file.filename || `File ${index + 1}`
            }));

            const response = await miscellaneousService.verifyIntent({
                user_prompt: promptToVerify,
                files: fileReferences
            });

            console.log('🔍 Intent Verification API Response:', response);
            console.log('🔍 Response structure keys:', Object.keys(response));
            
            if (response.success) {
                // Enhanced API returns verification_results instead of intent_summary
                const verificationData = {
                    verification_results: response.verification_results
                };
                console.log('🔍 Setting intent data:', verificationData);
                console.log('🔍 Verification results keys:', Object.keys(response.verification_results || {}));
                
                // Show results after delay (modal already opened above)
                setTimeout(() => {
                    setIntentData(verificationData);
                    setIsVerifyingIntent(false);
                    console.log('🔍 Loading state cleared after delay - showing results');
                    onSendMessage('system', '✅ Intent analysis complete! Please review before execution.');
                }, 800);
            } else {
                console.error('❌ Intent verification failed:', response);
                setIsVerifyingIntent(false);
                setShowIntentModal(false);
                throw new Error(response.message || 'Intent verification failed');
            }
        } catch (error) {
            console.error('Intent verification failed:', error);
            setIsVerifyingIntent(false);
            setShowIntentModal(false);
            onSendMessage('system', `❌ Intent verification failed: ${error.message}`);
            // Fall back to proceeding without verification
            setCurrentStep('preview_process');
        }
    };

    const handleIntentConfirm = (selectedSuggestions = {}) => {
        console.log('🔧 Intent confirmed with suggestions:', selectedSuggestions);
        setShowIntentModal(false);
        
        // Store the selected suggestions for use during processing
        if (Object.keys(selectedSuggestions).length > 0) {
            console.log('💡 User accepted column suggestions:', selectedSuggestions);
            // You could store these suggestions in state if needed for the actual processing
            // For now, we'll proceed with the understanding that the user has confirmed the intent
        }
        
        // Move to next step with verified intent and immediately trigger processing
        setCurrentStep('preview_process');
        
        // Clear any existing results first
        setProcessResults(null);
        setProcessId(null);
        setGeneratedSQL('');
        setProcessingError(null);
        setProcessingTimeSeconds(null);
        
        // Trigger processing after a brief delay to ensure UI updates
        setTimeout(() => {
            processData();
        }, 100);
    };

    const handleApplyToPrompt = (enhancedPrompt, selectedSuggestions) => {
        console.log('🎯 MiscellaneousFlow.handleApplyToPrompt called');
        console.log('📝 Received enhanced prompt:', enhancedPrompt);
        console.log('💡 Received selected suggestions:', selectedSuggestions);
        console.log('🔍 Current userPrompt before update:', userPrompt);
        
        // Update the user prompt with the enhanced version
        setUserPrompt(enhancedPrompt);
        console.log('✅ setUserPrompt called with:', enhancedPrompt);
        
        // Close current modal and go back to prompt input step
        setShowIntentModal(false);
        setIntentData(null);
        console.log('🚪 Modal closed, intentData cleared');
        
        // Go back to prompt input step so user can see and edit the enhanced prompt
        setCurrentStep('prompt_input');
        console.log('🔄 Current step set to: prompt_input');
        
        onSendMessage('system', '📝 Suggestions applied to your prompt! You can now review and modify before proceeding.');
        console.log('💬 System message sent');
        
        // Add a delay to ensure state updates, then log the new prompt
        setTimeout(() => {
            console.log('⏰ After timeout - checking userPrompt state');
            console.log('📝 userPrompt should now be:', enhancedPrompt);
        }, 100);
    };

    const handleIntentClarify = () => {
        setShowIntentModal(false);
        setIntentData(null);
        // Go back to prompt input to modify query
        setCurrentStep('prompt_input');
    };

    const handleIntentModalClose = () => {
        setShowIntentModal(false);
        // Stay on current step, user can try verification again
    };

    // User Case handling functions
    const handleUseCaseSelect = async (useCase) => {
        try {
            setSelectedUseCase(useCase);
            setIsExecutingUseCase(true);
            
            onSendMessage('system', `🔄 Executing Use Case: ${useCase.name}...`);
            
            // Prepare files for smart execution
            const filesForExecution = getSelectedFilesArray().map(file => ({
                file_id: file.file_id,
                filename: file.filename,
                columns: file.columns || [],
                total_rows: file.total_rows || 0
            }));
            
            const result = await useCaseService.smartExecuteUseCase(
                useCase.id,
                filesForExecution,
                {} // Default parameters for now
            );
            
            if (result.success === true) {
                // Smart execution succeeded - update state with results
                setProcessResults({
                    data: result.data || [],
                    total_count: result.row_count || result.data?.length || 0
                });
                setProcessId(result.process_id);
                setGeneratedSQL(result.generated_sql || ''); // Add this line to show the query
                setUserPrompt(useCase.description || useCase.name);
                setProcessName(useCase.name);
                setOriginalPrompt(useCase.description || useCase.name);
                setHasPromptChanged(false);
                
                onSendMessage('system', `✅ Use Case executed successfully! Generated ${result.data?.length || 0} result rows using ${result.execution_method} method.`);
                
                // Skip to results step
                setCurrentStep('preview_process');
                
            } else if (result.status === 'needs_mapping') {
                // Column mapping required - show modal
                setColumnMappingSuggestions(result.suggestions);
                setPendingUseCaseExecution({ useCase, files: filesForExecution });
                setShowColumnMappingModal(true);
                
                onSendMessage('system', `🔧 Use Case needs column mapping - please review and confirm the mapping.`);
                
            } else if (result.success === false && result.error_analysis) {
                // Execution failed with detailed error analysis - show error modal
                console.log('🚨 Use case needs user intervention:', result);
                setExecutionErrorData({
                    ...result,
                    useCase,
                    files: filesForExecution
                });
                setShowExecutionErrorModal(true);
                
                onSendMessage('system', `⚠️ Use Case execution failed: ${result.error_analysis?.user_hint || 'Column mismatch detected'}. Please choose how to proceed.`);
                
            } else {
                // Execution failed with unknown status
                console.error('🚨 Unknown execution status:', result.status, result);
                onSendMessage('system', `❌ Use Case execution failed: ${result.error || result.execution_error || 'Unknown error occurred'}`);
            }
        } catch (error) {
            console.error('Error executing useCase:', error);
            onSendMessage('system', `❌ Error executing Use Case: ${error.message}`);
        } finally {
            setIsExecutingUseCase(false);
        }
    };

    const handleSkipUseCase = () => {
        setSelectedUseCase(null);
        setCurrentStep('prompt_input');
    };

    const handleCreateUseCase = (queryData) => {
        console.log('🎯 handleCreateUseCase called with:', queryData);
        setUseCaseCreationData(queryData);
        setShowUseCaseCreationModal(true);
    };

    const handleUseCaseCreated = (newUseCase) => {
        onSendMessage('system', `✅ Template "${newUseCase.name}" created successfully!`);
        setShowUseCaseCreationModal(false);
    };

    // Column mapping handlers
    const handleColumnMappingApply = async (columnMapping) => {
        if (!pendingUseCaseExecution) return;
        
        try {
            setExecutionType('column_mapping');
            setIsExecutingUseCase(true);
            setShowColumnMappingModal(false);
            
            onSendMessage('system', `🔄 Applying column mapping and executing use case...`);
            
            const result = await useCaseService.executeWithUserMapping(
                pendingUseCaseExecution.useCase.id,
                pendingUseCaseExecution.files,
                columnMapping,
                {}
            );
            
            if (result.success === true) {
                // Execution succeeded with mapping
                setProcessResults({
                    data: result.data || [],
                    total_count: result.row_count || result.data?.length || 0
                });
                setProcessId(result.process_id);
                setGeneratedSQL(result.generated_sql || ''); // Add this line to show the query
                setUserPrompt(pendingUseCaseExecution.useCase.description || pendingUseCaseExecution.useCase.name);
                setProcessName(pendingUseCaseExecution.useCase.name);
                setOriginalPrompt(pendingUseCaseExecution.useCase.description || pendingUseCaseExecution.useCase.name);
                setHasPromptChanged(false);
                
                onSendMessage('system', `✅ Use Case executed successfully with column mapping! Generated ${result.data?.length || 0} result rows.`);
                
                // Skip to results step
                setCurrentStep('preview_process');
                
            } else {
                onSendMessage('system', `❌ Use Case execution failed: ${result.error}`);
            }
            
        } catch (error) {
            console.error('Error applying column mapping:', error);
            onSendMessage('system', `❌ Error applying column mapping: ${error.message}`);
        } finally {
            setIsExecutingUseCase(false);
            setExecutionType('');
            setPendingUseCaseExecution(null);
            setColumnMappingSuggestions(null);
        }
    };
    
    const handleColumnMappingClose = () => {
        setShowColumnMappingModal(false);
        setPendingUseCaseExecution(null);
        setColumnMappingSuggestions(null);
        setIsExecutingUseCase(false);
    };

    const handleReturnToError = () => {
        console.log('🔧 Returning to ExecutionErrorModal');
        setShowColumnMappingModal(false);
        setColumnMappingSuggestions(null);
        setPendingUseCaseExecution(null);
        // Restore the ExecutionErrorModal with preserved error data
        setShowExecutionErrorModal(true);
    };

    // Execution error handlers
    const handleRetryWithAI = async () => {
        if (!executionErrorData) return;
        
        try {
            setExecutionType('ai_assisted');
            setIsExecutingUseCase(true);
            setShowExecutionErrorModal(false);
            
            onSendMessage('system', `🤖 Retrying with AI assistance - adapting query to your data...`);
            
            const result = await useCaseService.executeUseCaseWithAI(
                executionErrorData.useCase.id,
                executionErrorData.files,
                {}
            );
            
            if (result.success === true) {
                // AI execution succeeded
                setProcessResults({
                    data: result.data || [],
                    total_count: result.row_count || result.data?.length || 0
                });
                setProcessId(result.process_id);
                setGeneratedSQL(result.generated_sql || ''); // Add this line to show the query
                setUserPrompt(executionErrorData.useCase.description || executionErrorData.useCase.name);
                setProcessName(executionErrorData.useCase.name);
                setOriginalPrompt(executionErrorData.useCase.description || executionErrorData.useCase.name);
                setHasPromptChanged(false);
                
                onSendMessage('system', `✅ AI-assisted execution succeeded! Generated ${result.data?.length || 0} result rows. ${result.ai_adaptations || ''}`);
                
                // Skip to results step
                setCurrentStep('preview_process');
            } else {
                throw new Error(result.error || 'AI-assisted execution failed');
            }
            
        } catch (error) {
            console.error('AI retry failed:', error);
            onSendMessage('system', `❌ AI-assisted execution failed: ${error.message}`);
        } finally {
            setIsExecutingUseCase(false);
            setExecutionType('');
            setExecutionErrorData(null);
        }
    };

    const handleManualMapping = () => {
        if (!executionErrorData) return;
        
        console.log('🔧 Manual mapping - FULL error data:', executionErrorData);
        console.log('🔧 Manual mapping - error_analysis:', executionErrorData.error_analysis);
        console.log('🔧 Manual mapping - execution_error:', executionErrorData.execution_error);
        
        // Convert error data to column mapping format
        const suggestions = {};
        const availableColumns = executionErrorData.error_analysis?.available_columns || [];
        const missingColumns = executionErrorData.error_analysis?.missing_columns || [];
        const backendSuggestions = executionErrorData.error_analysis?.suggestions || [];
        
        console.log('🔧 Available columns for mapping:', availableColumns);
        console.log('🔧 Missing columns:', missingColumns);
        console.log('🔧 Backend suggestions (detailed):', backendSuggestions);
        
        // Log each suggestion individually to see its structure
        backendSuggestions.forEach((suggestion, index) => {
            console.log(`🔧 Suggestion ${index}:`, suggestion, typeof suggestion);
        });
        
        if (missingColumns.length > 0) {
            // Use missing columns when available
            missingColumns.forEach(missingCol => {
                suggestions[missingCol] = availableColumns;
                console.log(`🔧 Available columns for missing '${missingCol}':`, availableColumns);
            });
        } else if (backendSuggestions.length > 0) {
            // Use backend suggestions when no specific missing columns
            backendSuggestions.forEach(suggestion => {
                if (typeof suggestion === 'string') {
                    suggestions[suggestion] = availableColumns;
                } else if (suggestion && suggestion.column) {
                    suggestions[suggestion.column] = availableColumns;
                }
                console.log(`🔧 Available columns for suggested '${suggestion}':`, availableColumns);
            });
        } else {
            console.log('🔧 No missing columns or backend suggestions available - backend needs to provide missing column names');
        }
        
        console.log('🔧 Final suggestions object:', suggestions);
        
        console.log('🔧 Opening column mapping modal with suggestions:', suggestions);
        
        // Close error modal and open mapping modal - but preserve error data for returning
        setShowExecutionErrorModal(false);
        setColumnMappingSuggestions(suggestions);
        setPendingUseCaseExecution({ 
            useCase: executionErrorData.useCase, 
            files: executionErrorData.files 
        });
        setShowColumnMappingModal(true);
        // Keep executionErrorData for returning to error modal - don't clear it
    };

    const handleExecutionErrorClose = () => {
        setShowExecutionErrorModal(false);
        setExecutionErrorData(null);
        setIsExecutingUseCase(false);
    };

    // Process data with natural language
    const processData = async () => {
        if (!canProceedToNext()) return;

        setIsProcessing(true);
        setProcessingError(null);
        
        try {
            onSendMessage('system', '🔄 Starting data processing with natural language query...');
            
            const filesArray = getSelectedFilesArray();
            const fileReferences = filesArray.map((file, index) => ({
                file_id: file.file_id,
                role: `file_${index}`,
                label: file.filename || `File ${index + 1}`
            }));

            const response = await miscellaneousService.processData({
                process_type: "data_analysis",
                process_name: processName,
                user_prompt: userPrompt,
                files: fileReferences,
                output_format: outputFormat
            });

            // Store process ID even if processing failed (allows manual SQL exploration)
            console.log('🔍 Processing response:', {
                success: response.success,
                process_id: response.process_id,
                message: response.message
            });
            setProcessId(response.process_id);
            
            if (response.success) {
                setGeneratedSQL(response.generated_sql);
                console.log('Total Time taken:'+ response.processing_time_seconds);
                setProcessingTimeSeconds(response.processing_time_seconds);
                
                // Get the results
                const resultsResponse = await miscellaneousService.getResults(response.process_id);
                setProcessResults(resultsResponse);
                
                // Store the prompt that generated these results
                setOriginalPrompt(userPrompt);
                setHasPromptChanged(false);
                
                const totalCountMsg = response.total_count && response.total_count > response.row_count 
                    ? ` (showing ${response.row_count} of ${response.total_count} total records)`
                    : '';
                onSendMessage('system', `✅ Processing completed! Generated ${response.row_count} result rows${totalCountMsg} using AI-generated SQL in ${response.processing_time_seconds}s.`);
            } else {
                // Processing failed but we might have generated SQL and error analysis
                console.log('🔧 Processing failed with response:', response);
                setProcessingError(response.message || 'Processing failed');
                
                // Extract generated SQL even from failed response
                if (response.generated_sql) {
                    setGeneratedSQL(response.generated_sql);
                    console.log('🔧 Extracted SQL from failed response');
                }
                
                // Set process results to include error analysis for display
                if (response.error_analysis) {
                    setProcessResults({
                        data: response.data || [],
                        error_analysis: response.error_analysis,
                        success: false,
                        ...response
                    });
                    console.log('🔧 Set processResults with error analysis');
                }
                
                onSendMessage('system', `❌ Processing failed: ${response.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Processing failed with exception:', error);
            setProcessingError(error.message);
            onSendMessage('system', `❌ Processing failed: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // Download results
    const downloadResults = async (format = 'csv') => {
        if (!processId) return;
        
        try {
            onSendMessage('system', `📁 Downloading results as ${format.toUpperCase()}...`);
            await miscellaneousService.downloadResults(processId, format);
            onSendMessage('system', `✅ Download started successfully!`);
        } catch (error) {
            console.error('Download failed:', error);
            onSendMessage('system', `❌ Download failed: ${error.message}`);
        }
    };

    // Reprocess with new prompt
    const reprocessWithNewPrompt = async () => {
        // Clear previous results
        setProcessResults(null);
        setProcessId(null);
        setGeneratedSQL('');
        setProcessingError(null);
        setProcessingTimeSeconds(null);
        setHasPromptChanged(false);
        
        // Move to preview step and process
        setCurrentStep('preview_process');
        
        // Trigger processing after a brief delay to ensure UI updates
        setTimeout(() => {
            processData();
        }, 100);
    };

    // Process data directly from prompt input step
    const processDataFromPromptInput = async () => {
        // Clear any existing results first
        setProcessResults(null);
        setProcessId(null);
        setGeneratedSQL('');
        setProcessingError(null);
        setProcessingTimeSeconds(null);
        setHasPromptChanged(false);
        setIntentData(null); // Clear previous intent data
        
        // Move to intent verification step first (required step)
        setCurrentStep('intent_verification');
        
        // Automatically start intent verification
        setTimeout(() => verifyIntent(), 100);
    };

    // Clear results and start over
    const clearResults = () => {
        setProcessResults(null);
        setProcessId(null);
        setGeneratedSQL('');
        setProcessingError(null);
        setProcessingTimeSeconds(null);
        setOriginalPrompt('');
        setHasPromptChanged(false);
        setIntentData(null); // Clear intent data
        setShowIntentModal(false); // Close modal if open
        setCurrentStep('file_selection');
    };

    // Open File Library in new tab
    const openFileLibrary = () => {
        const fileLibraryUrl = '/file-library';
        const newWindow = window.open(
            fileLibraryUrl,
            'file_library',
            'toolbar=yes,scrollbars=yes,resizable=yes,width=1600,height=1000,menubar=yes,location=yes,directories=no,status=yes'
        );

        if (newWindow) {
            newWindow.focus();
        } else {
            window.open(fileLibraryUrl, '_blank');
        }
    };

    // Handle ESC key and click outside
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 'file_selection':
                return (
                    <MiscellaneousFileSelection
                        files={files}
                        selectedFiles={selectedFilesForProcessing}
                        onSelectionChange={setSelectedFilesForProcessing}
                        onFilesRefresh={onFilesRefresh}
                        maxFiles={10}
                    />
                );

            case 'use_case_selection':
                const fileSchemas = getSelectedFilesArray().map(file => ({
                    filename: file.filename,
                    columns: file.columns || [],
                    sample_data: file.sample_data || {}
                }));
                
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Choose a Use Case</h3>
                            <p className="text-gray-600">
                                Select from pre-built Use Cases or skip to write a custom query
                            </p>
                        </div>
                        
                        <UseCaseGallery
                            onUseCaseSelect={handleUseCaseSelect}
                            selectedUseCase={selectedUseCase}
                            showCreateButton={true}
                            onCreateNew={() => {
                                setUseCaseCreationData(null); // Will use fallback data
                                setShowUseCaseCreationModal(true);
                            }}
                            userPrompt={userPrompt}
                            fileSchemas={fileSchemas}
                        />
                        
                        <div className="flex justify-center">
                            <button
                                onClick={handleSkipUseCase}
                                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Skip Use Case and write custom query →
                            </button>
                        </div>
                    </div>
                );

            case 'prompt_input':
                return (
                    <MiscellaneousPromptInput
                        userPrompt={userPrompt}
                        onPromptChange={handlePromptChange}
                        processName={processName}
                        onProcessNameChange={setProcessName}
                        outputFormat={outputFormat}
                        onOutputFormatChange={setOutputFormat}
                        selectedFiles={getSelectedFilesArray()}
                        hasExistingResults={!!processResults}
                        hasPromptChanged={hasPromptChanged}
                        onReprocess={reprocessWithNewPrompt}
                        onProcessData={processDataFromPromptInput}
                        isProcessing={isProcessing}
                    />
                );

            case 'intent_verification':
                return (
                    <div className="p-8 text-center space-y-6">
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                                <Brain size={48} className="text-blue-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Intent Verification
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Get AI-powered verification of your query before execution to ensure accuracy and see exactly what will happen.
                                </p>
                                
                                <button
                                    onClick={verifyIntent}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Verify Intent with AI
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'preview_process':
                return (
                    <MiscellaneousPreview
                        userPrompt={userPrompt}
                        processName={processName}
                        selectedFiles={getSelectedFilesArray()}
                        isProcessing={isProcessing}
                        processResults={processResults}
                        generatedSQL={generatedSQL}
                        processingError={processingError}
                        processId={processId}
                        processingTimeSeconds={processingTimeSeconds}
                        onProcess={processData}
                        onDownload={downloadResults}
                        onClear={clearResults}
                        onCreateTemplate={handleCreateUseCase}
                    />
                );

            default:
                return <div>Unknown step</div>;
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
            onClick={handleOverlayClick}
        >
            <div className="bg-white w-full h-full overflow-hidden flex flex-col relative">
                {/* Use Case Execution Loading Overlay */}
                {isExecutingUseCase && (
                    <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
                        <div className="text-center">
                            <Loader className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-gray-800 mb-2">
                                {executionType === 'ai_assisted' ? 'AI Analyzing Your Data...' :
                                 executionType === 'column_mapping' ? 'Applying Column Mapping...' :
                                 'Executing Use Case...'}
                            </p>
                            <p className="text-sm text-gray-600">
                                {executionType === 'ai_assisted' ? 'AI is adapting the query to work with your data structure' :
                                 executionType === 'column_mapping' ? 'Running the query with your column mappings' :
                                 'This may take a few moments'}
                            </p>
                        </div>
                    </div>
                )}
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Brain className="text-white" size={24} />
                            <h1 className="text-xl font-bold text-white">Miscellaneous Data Processing</h1>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={openFileLibrary}
                                className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white hover:bg-opacity-20 flex items-center space-x-1"
                                title="Open File Library"
                            >
                                <FolderOpen size={18} />
                                <span className="text-sm font-medium">File Library</span>
                            </button>
                            <button
                                onClick={onCancel}
                                className="text-white hover:text-gray-200 p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                                title="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="bg-gray-50 px-6 lg:px-8 xl:px-10 py-4 lg:py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-between flex-1">
                            {steps.map((step, index) => {
                                const isCurrent = step.id === currentStep;
                                const isCompleted = getCurrentStepIndex() > index;
                                const IconComponent = step.icon;

                                const getStepTooltip = (stepId) => {
                                    switch(stepId) {
                                        case 'file_selection':
                                            return 'Select 1-5 CSV or Excel files to process. You can drag & drop files or upload new ones.';
                                        case 'use_case_selection':
                                            return 'Choose from pre-built templates to quickly apply common data operations, or skip to write a custom query.';
                                        case 'prompt_input':
                                            return 'Write a natural language query describing what you want to do with your data. The AI will convert this to SQL.';
                                        case 'intent_verification':
                                            return 'AI analyzes your query and shows exactly what will happen, with data flow diagrams and sample previews.';
                                        case 'preview_process':
                                            return 'Review your configuration and process the data. You can then download results or view them in detail.';
                                        default:
                                            return '';
                                    }
                                };

                                return (
                                    <div key={step.id} className="flex items-center">
                                        <div className={`group relative flex items-center space-x-2 ${
                                            isCurrent ? 'text-blue-600' : 
                                            isCompleted ? 'text-green-600' : 'text-gray-400'
                                        }`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                isCurrent ? 'bg-blue-100' :
                                                isCompleted ? 'bg-green-100' : 'bg-gray-100'
                                            }`}>
                                                <IconComponent size={16} />
                                            </div>
                                            <span className="text-sm font-medium">{step.title}</span>
                                            
                                            {/* Step tooltip */}
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 max-w-xs">
                                                {getStepTooltip(step.id)}
                                            </div>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className={`ml-4 w-12 h-0.5 ${
                                                isCompleted ? 'bg-green-300' : 'bg-gray-200'
                                            }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Progress Steps Help */}
                        <div className="group relative ml-4">
                            <HelpCircle size={16} className="text-gray-400 cursor-help hover:text-gray-600" />
                            <div className="absolute top-full right-0 mt-2 w-72 p-3 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 text-gray-800">
                                <h4 className="font-semibold text-gray-900 mb-2">Progress Steps:</h4>
                                <div className="text-xs space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>Current step</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>Completed step</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        <span>Upcoming step</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-8 xl:p-10">
                    <div className="max-w-full mx-auto">
                        {renderStepContent()}
                    </div>
                </div>
                
                {/* Floating Verify Intent Button for Natural Language Query step */}
                {currentStep === 'prompt_input' && (
                    <div className="absolute bottom-20 lg:bottom-24 right-6 lg:right-8 xl:right-10 z-30">
                        <div className="group relative">
                            <button
                                onClick={nextStep}
                                disabled={!canProceedToNext()}
                                className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                            >
                                <Brain size={20} className="text-white" />
                                <span>Verify Intent</span>
                                <Play size={16} className="text-white" />
                            </button>
                            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                {!canProceedToNext() 
                                    ? 'Complete your query and process name first'
                                    : 'Verify your query intent before processing'
                                }
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Navigation */}
                <div className="bg-gray-50 px-6 lg:px-8 xl:px-10 py-4 lg:py-5 flex items-center justify-between border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={onCancel}
                            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            <span>Cancel</span>
                        </button>
                        
                        {processResults && (
                            <div className="text-sm text-green-600 font-medium">
                                ✅ Processed {processResults.data?.length || 0} records
                                {processResults.total_count && processResults.total_count > (processResults.data?.length || 0) && (
                                    <span className="text-gray-600 ml-1">
                                        (showing {processResults.data?.length || 0} of {processResults.total_count} total)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-3">
                        {getCurrentStepIndex() > 0 && (
                            <div className="group relative">
                                <button
                                    onClick={prevStep}
                                    className="flex items-center space-x-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                >
                                    <ChevronLeft size={16} />
                                    <span>Previous</span>
                                </button>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                    Go back to the previous step
                                </div>
                            </div>
                        )}

                        {currentStep === 'preview_process' ? (
                            <div className="flex items-center space-x-2">
                                {processResults && (
                                    <>
                                        <div className="group relative">
                                            <button
                                                onClick={() => downloadResults('csv')}
                                                className="flex items-center space-x-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                            >
                                                <Download size={16} />
                                                <span>CSV</span>
                                            </button>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                                Download results as CSV file
                                            </div>
                                        </div>
                                        
                                        <div className="group relative">
                                            <button
                                                onClick={() => downloadResults('excel')}
                                                className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                                <Download size={16} />
                                                <span>Excel</span>
                                            </button>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                                Download results as Excel file
                                            </div>
                                        </div>

                                        <div className="group relative">
                                            <button
                                                onClick={() => window.open(`/viewer/${processId}`, `viewer_${processId}`, 'toolbar=yes,scrollbars=yes,resizable=yes,width=1400,height=900,menubar=yes,location=yes,directories=no,status=yes')}
                                                className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                <ExternalLink size={16} />
                                                <span>Open in Data Viewer</span>
                                            </button>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                                View results in interactive data viewer
                                            </div>
                                        </div>

                                        <div className="group relative">
                                            <button
                                                onClick={clearResults}
                                                className="flex items-center space-x-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                            >
                                                <Trash2 size={16} />
                                                <span>Clear</span>
                                            </button>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                                Clear results and start over
                                            </div>
                                        </div>
                                    </>
                                )}

                                {!processResults && (
                                    <div className="group relative">
                                        <button
                                            onClick={processData}
                                            disabled={!canProceedToNext() || isProcessing}
                                            className="flex items-center space-x-1 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                                    <span>Processing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Play size={16} />
                                                    <span>Process Data</span>
                                                </>
                                            )}
                                        </button>
                                        {!isProcessing && (
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                                {!canProceedToNext() 
                                                    ? 'Go back and complete the previous steps first'
                                                    : 'Start processing your data with AI'
                                                }
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : currentStep !== 'prompt_input' ? (
                            <div className="group relative">
                                <button
                                    onClick={nextStep}
                                    disabled={!canProceedToNext()}
                                    className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    <span>Next</span>
                                    <ChevronRight size={16} />
                                </button>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                    {!canProceedToNext() 
                                        ? 'Complete this step first to continue'
                                        : 'Proceed to the next step'
                                    }
                                </div>
                            </div>
                        ) : (
                            // For prompt_input step, show a subtle next button as alternative
                            <div className="group relative">
                                <button
                                    onClick={nextStep}
                                    disabled={!canProceedToNext()}
                                    className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                                >
                                    <span>Verify Intent</span>
                                    <ChevronRight size={14} />
                                </button>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                    {!canProceedToNext() 
                                        ? 'Complete your query and process name first'
                                        : 'Proceed to intent verification step'
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Enhanced Intent Verification Modal */}
            <EnhancedIntentVerificationModal
                isOpen={showIntentModal}
                onClose={handleIntentModalClose}
                verificationData={intentData?.verification_results}
                originalPrompt={userPrompt}
                onConfirm={handleIntentConfirm}
                onModifyQuery={handleIntentClarify}
                onApplyToPrompt={handleApplyToPrompt}
                isLoading={isVerifyingIntent || isProcessing}
            />

            {/* Template Creation Modal */}
            <UseCaseCreationModal
                isOpen={showUseCaseCreationModal}
                onClose={() => {
                    setShowUseCaseCreationModal(false);
                    setUseCaseCreationData(null);
                }}
                queryData={useCaseCreationData || {
                    user_prompt: userPrompt,
                    file_schemas: getSelectedFilesArray().map(file => ({
                        filename: file.filename,
                        columns: file.columns || [],
                        sample_data: file.sample_data || {}
                    })),
                    process_results: processResults
                }}
                onUseCaseCreated={handleUseCaseCreated}
                initialValues={{
                    category: 'Custom',
                    created_by: 'User'
                }}
            />

            {/* Column Mapping Modal */}
            {console.log('🔧 Rendering ColumnMappingModal with props:', {
                isOpen: showColumnMappingModal,
                suggestions: columnMappingSuggestions,
                templateData: pendingUseCaseExecution?.useCase
            })}
            <ColumnMappingModal
                isOpen={showColumnMappingModal}
                onClose={handleColumnMappingClose}
                templateData={pendingUseCaseExecution?.useCase}
                suggestions={columnMappingSuggestions}
                onApplyMapping={handleColumnMappingApply}
                isExecuting={isExecutingUseCase}
                onReturnToError={executionErrorData ? handleReturnToError : null}
            />

            {/* Execution Error Modal */}
            <ExecutionErrorModal
                isOpen={showExecutionErrorModal}
                onClose={handleExecutionErrorClose}
                errorData={executionErrorData}
                onRetryWithAI={handleRetryWithAI}
                onManualMapping={handleManualMapping}
            />
        </div>
    );
};

export default MiscellaneousFlow;