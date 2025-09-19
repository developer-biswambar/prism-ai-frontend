import React, {useEffect, useState} from 'react';
import {
    Brain,
    ChevronLeft,
    ChevronRight,
    Database,
    Download,
    ExternalLink,
    FileText,
    HelpCircle,
    Loader,
    Play,
    Trash2,
    Wand2
} from 'lucide-react';
import AppHeader from '../core/AppHeader.jsx';
import MiscellaneousFileSelection from './MiscellaneousFileSelection.jsx';
import UseCaseFileSelection from './UseCaseFileSelection.jsx';
import MiscellaneousPromptInput from './MiscellaneousPromptInput.jsx';
import MiscellaneousPreview from './MiscellaneousPreview.jsx';
import EnhancedIntentVerificationModal from './EnhancedIntentVerificationModal.jsx';
import UseCaseCreationModal from '../usecases/UseCaseCreationModal.jsx';
import ColumnMappingModal from '../usecases/ColumnMappingModal.jsx';
import ExecutionErrorModal from '../usecases/ExecutionErrorModal.jsx';
import {miscellaneousService} from '../../services/miscellaneousService.js';
import {useCaseService} from '../../services/useCaseService.js';

const MiscellaneousFlow = ({
                               files,
                               selectedFiles,
                               setSelectedFiles,
                               userPrompt,
                               setUserPrompt,
                               processResults,
                               processId,
                               setProcessResults,
                               setProcessId,
                               onBackToGallery,
                               selectedUseCase,
                               onRefreshFiles,
                               flowData,
                               onComplete,
                               onCancel
                           }) => {
    // State management
    const [currentStep, setCurrentStep] = useState('file_selection');
    const [selectedFilesForProcessing, setSelectedFilesForProcessing] = useState({});
    const [processName, setProcessName] = useState('Data Analysis');
    const [outputFormat] = useState('json'); // Fixed to JSON format

    // Processing state
    const [isProcessing, setIsProcessing] = useState(false);
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
    const getStepsForFlow = () => {
        const isUseCaseFlow = selectedUseCase && selectedUseCase.id !== 'start_fresh';

        if (isUseCaseFlow) {
            // For use case flow: Skip prompt input step since query is saved
            return [
                {id: 'file_selection', title: 'Select Files', icon: FileText},
                {id: 'preview_process', title: 'Process & View Results', icon: Database}
            ];
        } else {
            // For "Start Fresh" flow: Show all steps including prompt input
            return [
                {id: 'file_selection', title: 'Select Files', icon: FileText},
                {id: 'prompt_input', title: 'Natural Language Query', icon: Wand2},
                {id: 'intent_verification', title: 'Verify Intent', icon: Brain},
                {id: 'preview_process', title: 'Process & View Results', icon: Database}
            ];
        }
    };

    const steps = getStepsForFlow();

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
        switch (currentStep) {
            case 'file_selection':
                const hasUseCaseFileRequirements = selectedUseCase &&
                    selectedUseCase.id !== 'start_fresh' &&
                    selectedUseCase.use_case_metadata?.file_requirements?.required_file_count > 0;

                if (hasUseCaseFileRequirements) {
                    // For use cases, check if exact number of required files are selected
                    const requiredCount = selectedUseCase.use_case_metadata.file_requirements.required_file_count;
                    const selectedCount = getSelectedFilesArray().length;
                    return selectedCount === requiredCount;
                } else {
                    // For "Start Fresh", use the original validation
                    return getSelectedFilesArray().length >= 1 && getSelectedFilesArray().length <= 10;
                }
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
            const isUseCaseFlow = selectedUseCase && selectedUseCase.id !== 'start_fresh';

            // For use case flow: skip from file_selection directly to processing
            if (isUseCaseFlow && currentStep === 'file_selection' && nextStepId === 'preview_process') {
                setCurrentStep(nextStepId);
                // Automatically trigger use case execution
                setTimeout(() => {
                    if (selectedUseCase) {
                        handleUseCaseSelect(selectedUseCase);
                    }
                }, 100);
                return;
            }

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
            console.log('🔍 Analyzing your query intent...');

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
                    console.log('✅ Intent analysis complete! Please review before execution.');
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
            console.log(`❌ Intent verification failed: ${error.message}`);
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

        console.log('📝 Suggestions applied to your prompt! You can now review and modify before proceeding.');
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
            setIsExecutingUseCase(true);

            console.log(`🔄 Executing Use Case: ${useCase.name}...`);

            // Prepare files for smart execution
            const filesForExecution = getSelectedFilesArray().map(file => ({
                file_id: file.file_id,
                filename: file.filename,
                columns: file.columns || [],
                total_rows: file.total_rows || 0
            }));

            // First try: Use saved query directly without prompting
            console.log('🚀 Attempting automatic execution with saved query...');

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
                setGeneratedSQL(result.generated_sql || '');

                // Use saved query content as prompt, not just description
                const savedPrompt = useCase.use_case_content || useCase.ideal_prompt || useCase.description || useCase.name;
                setUserPrompt(savedPrompt);
                setProcessName(useCase.name);
                setOriginalPrompt(savedPrompt);
                setHasPromptChanged(false);

                console.log(`✅ Use Case executed automatically! Generated ${result.data?.length || 0} result rows using ${result.execution_method} method.`);

                // Skip directly to results step - no prompting needed
                setCurrentStep('preview_process');

            } else if (result.status === 'needs_mapping') {
                // Column mapping required - show modal
                setColumnMappingSuggestions(result.suggestions);
                setPendingUseCaseExecution({useCase, files: filesForExecution});
                setShowColumnMappingModal(true);

                console.log(`🔧 Use Case needs column mapping - please review and confirm the mapping.`);

            } else if (result.success === false && result.error_analysis) {
                // Execution failed with detailed error analysis
                console.log('🚨 Automatic execution failed, checking if fallback to manual prompt is needed...');

                // Check if the error is due to query issues that could be resolved manually
                const shouldFallbackToPrompt = result.error_analysis?.needs_manual_prompt ||
                    result.error_analysis?.query_adaptation_failed;

                if (shouldFallbackToPrompt) {
                    console.log('🔄 Falling back to manual prompt input...');

                    // Set the saved prompt and allow user to modify if needed
                    const savedPrompt = useCase.use_case_content || useCase.ideal_prompt || useCase.description || useCase.name;
                    setUserPrompt(savedPrompt);
                    setProcessName(useCase.name);

                    // Go to prompt input step for manual adjustment
                    setCurrentStep('prompt_input');
                    console.log('📝 Please review and adjust the query as needed, then proceed with verification.');
                } else {
                    // Show error modal for other types of failures
                    setExecutionErrorData({
                        ...result,
                        useCase,
                        files: filesForExecution
                    });
                    setShowExecutionErrorModal(true);

                    console.log(`⚠️ Use Case execution failed: ${result.error_analysis?.user_hint || 'Column mismatch detected'}. Please choose how to proceed.`);
                }

            } else {
                // Execution failed with unknown status - fallback to manual prompt
                console.error('🚨 Unknown execution status, falling back to manual prompt:', result.status, result);

                // Set the saved prompt and allow user to modify
                const savedPrompt = useCase.use_case_content || useCase.ideal_prompt || useCase.description || useCase.name;
                setUserPrompt(savedPrompt);
                setProcessName(useCase.name);

                // Go to prompt input step for manual adjustment
                setCurrentStep('prompt_input');
                console.log(`⚠️ Automatic execution failed: ${result.error || result.execution_error || 'Unknown error occurred'}. Please review the query and try again.`);
            }
        } catch (error) {
            console.error('Error executing useCase:', error);

            // Fallback to manual prompt on any exception
            console.log('🔄 Exception occurred, falling back to manual prompt...');

            const savedPrompt = useCase.use_case_content || useCase.ideal_prompt || useCase.description || useCase.name;
            setUserPrompt(savedPrompt);
            setProcessName(useCase.name);

            // Go to prompt input step for manual adjustment
            setCurrentStep('prompt_input');
            console.log(`❌ Error executing Use Case: ${error.message}. Please review the query and try again.`);
        } finally {
            setIsExecutingUseCase(false);
        }
    };

    const handleCreateUseCase = (queryData) => {
        console.log('🎯 handleCreateUseCase called with:', queryData);
        setUseCaseCreationData(queryData);
        setShowUseCaseCreationModal(true);
    };

    const handleUseCaseCreated = (newUseCase) => {
        console.log(`✅ Template "${newUseCase.name}" created successfully!`);
        setShowUseCaseCreationModal(false);
    };

    // Column mapping handlers
    const handleColumnMappingApply = async (columnMapping) => {
        if (!pendingUseCaseExecution) return;

        try {
            setExecutionType('column_mapping');
            setIsExecutingUseCase(true);
            setShowColumnMappingModal(false);

            console.log(`🔄 Applying column mapping and executing use case...`);

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

                console.log(`✅ Use Case executed successfully with column mapping! Generated ${result.data?.length || 0} result rows.`);

                // Skip to results step
                setCurrentStep('preview_process');

            } else {
                console.log(`❌ Use Case execution failed: ${result.error}`);
            }

        } catch (error) {
            console.error('Error applying column mapping:', error);
            console.log(`❌ Error applying column mapping: ${error.message}`);
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

            console.log(`🤖 Retrying with AI assistance - adapting query to your data...`);

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

                console.log(`✅ AI-assisted execution succeeded! Generated ${result.data?.length || 0} result rows. ${result.ai_adaptations || ''}`);

                // Skip to results step
                setCurrentStep('preview_process');
            } else {
                throw new Error(result.error || 'AI-assisted execution failed');
            }

        } catch (error) {
            console.error('AI retry failed:', error);
            console.log(`❌ AI-assisted execution failed: ${error.message}`);
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
            console.log('🔄 Starting data processing with natural language query...');

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
                console.log('Total Time taken:' + response.processing_time_seconds);
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
                console.log(`✅ Processing completed! Generated ${response.row_count} result rows${totalCountMsg} using AI-generated SQL in ${response.processing_time_seconds}s.`);
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

                console.log(`❌ Processing failed: ${response.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Processing failed with exception:', error);
            setProcessingError(error.message);
            console.log(`❌ Processing failed: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // Download results
    const downloadResults = async (format = 'csv') => {
        if (!processId) return;

        try {
            console.log(`📁 Downloading results as ${format.toUpperCase()}...`);
            await miscellaneousService.downloadResults(processId, format);
            console.log(`✅ Download started successfully!`);
        } catch (error) {
            console.error('Download failed:', error);
            console.log(`❌ Download failed: ${error.message}`);
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


    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 'file_selection':
                // Use specialized file selection for use cases, regular selection for "Start Fresh"
                const hasUseCaseFileRequirements = selectedUseCase &&
                    selectedUseCase.id !== 'start_fresh' &&
                    selectedUseCase.use_case_metadata?.file_requirements?.required_file_count > 0;

                if (hasUseCaseFileRequirements) {
                    return (
                        <UseCaseFileSelection
                            useCase={selectedUseCase}
                            files={files}
                            selectedFiles={selectedFilesForProcessing}
                            onFileSelection={(mappings) => {
                                // Convert file role mappings back to the expected format
                                const convertedFiles = {};
                                Object.values(mappings).forEach((file, index) => {
                                    convertedFiles[file.file_id] = file;
                                });
                                setSelectedFilesForProcessing(convertedFiles);
                            }}
                            onRefreshFiles={onRefreshFiles}
                            onFileUpload={(event) => {
                                console.log('🔄 [MiscellaneousFlow] UseCaseFileSelection file upload triggered');
                                // We need to implement proper file upload handling
                                // For now, let's trigger the MiscellaneousFileSelection upload flow
                                const selectedFiles = Array.from(event.target.files);
                                console.log('📁 [MiscellaneousFlow] Files selected from UseCaseFileSelection:', selectedFiles.map(f => f.name));
                                
                                if (selectedFiles.length > 0) {
                                    // Clear the input
                                    event.target.value = '';
                                    // We need to implement a proper upload flow here
                                    console.log('⚠️ [MiscellaneousFlow] File upload not yet implemented for UseCaseFileSelection');
                                }
                            }}
                        />
                    );
                } else {
                    return (
                        <MiscellaneousFileSelection
                            files={files}
                            selectedFiles={selectedFilesForProcessing}
                            onSelectionChange={setSelectedFilesForProcessing}
                            onFilesRefresh={onRefreshFiles}
                            maxFiles={10}
                        />
                    );
                }


            case 'prompt_input':
                return (
                    <MiscellaneousPromptInput
                        userPrompt={userPrompt}
                        onPromptChange={handlePromptChange}
                        processName={processName}
                        onProcessNameChange={setProcessName}
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
                                <Brain size={48} className="text-blue-600 mx-auto mb-4"/>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Intent Verification
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Get AI-powered verification of your query before execution to ensure accuracy and
                                    see exactly what will happen.
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
        <div className="bg-white w-full h-full overflow-hidden flex flex-col relative">
            {/* Use Case Execution Loading Overlay */}
            {isExecutingUseCase && (
                <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
                    <div className="text-center">
                        <Loader className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4"/>
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
            <AppHeader
                title="Forte AI - Data Processing Platform"
                subtitle={selectedUseCase && selectedUseCase.id !== 'start_fresh'
                    ? `Processing: ${selectedUseCase.name}`
                    : 'AI based Data Processing'}
                showBackButton={!!onBackToGallery}
                onBackClick={onBackToGallery}
                showCloseButton={!!onBackToGallery}
                onCloseClick={onBackToGallery}
                showFileLibrary={true}
                onFileLibraryClick={() => window.open('/file-library', '_blank')}
            />

            {/* Progress Steps */}
            <div className="bg-gray-50 px-6 lg:px-8 xl:px-10 py-4 lg:py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center justify-between flex-1">
                        {steps.map((step, index) => {
                            const isCurrent = step.id === currentStep;
                            const isCompleted = getCurrentStepIndex() > index;
                            const IconComponent = step.icon;

                            const getStepTooltip = (stepId) => {
                                switch (stepId) {
                                    case 'file_selection':
                                        return 'Select 1-5 CSV or Excel files to process. You can drag & drop files or upload new ones.';
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
                                            <IconComponent size={16}/>
                                        </div>
                                        <span className="text-sm font-medium">{step.title}</span>

                                        {/* Step tooltip */}
                                        <div
                                            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 max-w-xs">
                                            {getStepTooltip(step.id)}
                                        </div>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`ml-4 w-12 h-0.5 ${
                                            isCompleted ? 'bg-green-300' : 'bg-gray-200'
                                        }`}/>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress Steps Help */}
                    <div className="group relative ml-4">
                        <HelpCircle size={16} className="text-gray-400 cursor-help hover:text-gray-600"/>
                        <div
                            className="absolute top-full right-0 mt-2 w-72 p-3 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 text-gray-800">
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
                            <Brain size={20} className="text-white"/>
                            <span>Verify Intent</span>
                            <Play size={16} className="text-white"/>
                        </button>
                        <div
                            className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                            {!canProceedToNext()
                                ? 'Complete your query and process name first'
                                : 'Verify your query intent before processing'
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Navigation */}
            <div
                className="bg-gray-50 px-6 lg:px-8 xl:px-10 py-4 lg:py-5 flex items-center justify-between border-t border-gray-200">
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
                                <ChevronLeft size={16}/>
                                <span>Previous</span>
                            </button>
                            <div
                                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
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
                                            <Download size={16}/>
                                            <span>CSV</span>
                                        </button>
                                        <div
                                            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                            Download results as CSV file
                                        </div>
                                    </div>

                                    <div className="group relative">
                                        <button
                                            onClick={() => downloadResults('excel')}
                                            className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                        >
                                            <Download size={16}/>
                                            <span>Excel</span>
                                        </button>
                                        <div
                                            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                            Download results as Excel file
                                        </div>
                                    </div>

                                    <div className="group relative">
                                        <button
                                            onClick={() => window.open(`/viewer/${processId}`, `viewer_${processId}`, 'toolbar=yes,scrollbars=yes,resizable=yes,width=1400,height=900,menubar=yes,location=yes,directories=no,status=yes')}
                                            className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            <ExternalLink size={16}/>
                                            <span>Open in Data Viewer</span>
                                        </button>
                                        <div
                                            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                            View results in interactive data viewer
                                        </div>
                                    </div>

                                    <div className="group relative">
                                        <button
                                            onClick={clearResults}
                                            className="flex items-center space-x-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                        >
                                            <Trash2 size={16}/>
                                            <span>Clear</span>
                                        </button>
                                        <div
                                            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
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
                                                <div
                                                    className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"/>
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Play size={16}/>
                                                <span>Process Data</span>
                                            </>
                                        )}
                                    </button>
                                    {!isProcessing && (
                                        <div
                                            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
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
                                <ChevronRight size={16}/>
                            </button>
                            <div
                                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                {!canProceedToNext()
                                    ? 'Complete this step first to continue'
                                    : 'Proceed to the next step'
                                }
                            </div>
                        </div>
                    ) : (
                        // For prompt_input step, show both verify intent and direct process options
                        <div className="flex items-center space-x-3">
                            <div className="group relative">
                                <button
                                    onClick={nextStep}
                                    disabled={!canProceedToNext()}
                                    className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                                >
                                    <Brain size={14}/>
                                    <span>Verify Intent</span>
                                </button>
                                <div
                                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                    {!canProceedToNext()
                                        ? 'Complete your query and process name first'
                                        : 'Verify intent with AI before processing'
                                    }
                                </div>
                            </div>

                            <div className="text-xs text-gray-500">or</div>

                            <div className="group relative">
                                <button
                                    onClick={() => {
                                        // Set processing state first to show loading immediately
                                        setIsProcessing(true);
                                        // Switch to preview step
                                        setCurrentStep('preview_process');
                                        // Start processing after a short delay to ensure UI updates
                                        setTimeout(() => processData(), 100);
                                    }}
                                    disabled={!canProceedToNext() || isProcessing}
                                    className="flex items-center space-x-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div
                                                className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"/>
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play size={14}/>
                                            <span>Process Directly</span>
                                        </>
                                    )}
                                </button>
                                <div
                                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                                    {!canProceedToNext()
                                        ? 'Complete your query and process name first'
                                        : 'Skip verification and process data directly'
                                    }
                                </div>
                            </div>
                        </div>
                    )}
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