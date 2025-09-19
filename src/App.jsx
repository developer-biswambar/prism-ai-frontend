// Clean App.jsx - Simple 3-panel layout
import React from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import {useAnalyticsManagement, useDocumentTitle, useFileManagement, usePanelResize} from './hooks/useAppState';
import LeftSidebar from './components/core/LeftSideBar.jsx';
import RightSidebar from './components/core/RightSidebar.jsx';
import AppHeader from './components/core/AppHeader.jsx';
import UseCaseGallery from './components/usecases/UseCaseGallery.jsx';
import MiscellaneousFlow from './components/miscellaneous/MiscellaneousFlow.jsx';
import ViewerPage from './pages/ViewerPage';
import FileLibraryPage from './pages/FileLibraryPage';

const MainApp = () => {
    console.log('🔥 MainApp component render start');
    // Hooks
    console.log('🔥 About to call useFileManagement');
    const {files, uploadProgress, loadFiles, uploadFile} = useFileManagement();
    console.log('🔥 useFileManagement completed');
    // Mock values instead of complex hooks
    const isProcessing = false;
    const activeProcess = null;

    const initializeChat = () => {
    };

    const selectedFiles = {};
    const setSelectedFiles = () => {
    };
    const {leftPanelWidth, rightPanelWidth} = usePanelResize();
    console.log('🔥 usePanelResize completed');

    console.log('🔥 About to call useAnalyticsManagement');
    const {
        analyticsData,
        processes,
        loading: analyticsLoading,
        error: analyticsError,
        loadAnalytics
    } = useAnalyticsManagement();
    console.log('🔥 useAnalyticsManagement completed');

    // UI state
    console.log('🔥 About to call useState hooks');
    const [currentView, setCurrentView] = React.useState('gallery');
    console.log('🔥 currentView useState completed');
    console.log('🔥 About to call selectedUseCase useState');
    const [selectedUseCase, setSelectedUseCase] = React.useState(null);
    console.log('🔥 selectedUseCase useState completed');
    console.log('🔥 About to call miscellaneousData useState');
    const [miscellaneousData, setMiscellaneousData] = React.useState({
        userPrompt: '',
        selectedFiles: [],
        processId: null,
        results: null
    });
    console.log('🔥 miscellaneousData useState completed');

    // Navigation ref to handle delayed navigation
    console.log('🔥 About to call useRef');
    const navigationRef = React.useRef(null);
    console.log('🔥 useRef completed');

    // Set document title
    console.log('🔥 About to call useDocumentTitle');
    useDocumentTitle(isProcessing, activeProcess, uploadProgress, selectedFiles);
    console.log('🔥 useDocumentTitle completed');

    // Initialize chat on mount
    console.log('🔥 About to call useEffect for initializeChat');
    React.useEffect(() => {
        initializeChat();
    }, []);
    console.log('🔥 initializeChat useEffect completed');

    // Handle delayed navigation
    console.log('🔥 About to call useEffect for navigation');
    React.useEffect(() => {
        if (navigationRef.current) {
            const {action, data} = navigationRef.current;
            if (action === 'navigate') {
                setCurrentView(data.view);
                navigationRef.current = null;
            }
        }
    });
    console.log('🔥 navigation useEffect completed');

    // File upload handler
    const handleFileUpload = async (file) => {
        if (file) {
            const result = await uploadFile(file);
            // Handle result...
        }
    };

    // File Library
    const openFileLibrary = () => {
        window.open('/file-library', '_blank');
    };

    // Use case handlers
    const handleUseCaseSelect = (useCase) => {
        console.log('Use case selected:', useCase);

        // Only update data, don't navigate immediately
        setSelectedUseCase(useCase);

        // Always set miscellaneous data - determine userPrompt based on use case
        const userPrompt = (useCase && useCase.id !== 'start_fresh') ? (useCase.user_prompt || '') : '';

        setMiscellaneousData({
            userPrompt: userPrompt,
            selectedFiles: [],
            processId: null,
            results: null
        });

        // Queue navigation for next render cycle
        navigationRef.current = {
            action: 'navigate',
            data: {view: 'miscellaneous'}
        };
    };

    const handleBackToGallery = () => {
        setCurrentView('gallery');
        setSelectedUseCase(null);
        setMiscellaneousData({
            userPrompt: '',
            selectedFiles: [],
            processId: null,
            results: null
        });
    };

    console.log('🔥 About to return JSX - all hooks completed');
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Full screen Miscellaneous Flow - always render but hide when not needed */}
            <div style={{display: currentView === 'miscellaneous' ? 'block' : 'none', width: '100%', height: '100%'}}>
                <MiscellaneousFlow
                    selectedFiles={miscellaneousData.selectedFiles}
                    setSelectedFiles={(files) => setMiscellaneousData(prev => ({...prev, selectedFiles: files}))}
                    userPrompt={miscellaneousData.userPrompt}
                    setUserPrompt={(prompt) => setMiscellaneousData(prev => ({...prev, userPrompt: prompt}))}
                    processResults={miscellaneousData.results}
                    processId={miscellaneousData.processId}
                    setProcessResults={(results) => setMiscellaneousData(prev => ({...prev, results: results}))}
                    setProcessId={(id) => setMiscellaneousData(prev => ({...prev, processId: id}))}
                    files={files}
                    onBackToGallery={handleBackToGallery}
                    selectedUseCase={selectedUseCase}
                    onRefreshFiles={loadFiles}
                    onCancel={handleBackToGallery}
                />
            </div>

            {/* Main 3-Panel Layout - always render but hide when not needed */}
            <div style={{display: currentView !== 'miscellaneous' ? 'block' : 'none'}}
                 className="flex flex-col h-full w-full">
                {/* Header */}
                <AppHeader
                    title="Forte AI - Data Processing Platform"
                    subtitle="Select a use case or start fresh with AI based data processing"
                    showBackButton={false}
                    showCloseButton={false}
                    showFileLibrary={true}
                    onFileLibraryClick={openFileLibrary}
                />

                {/* Main Content - 3 Panel Layout */}
                <div className="flex-1 flex">
                    {/* Left Panel */}
                    <LeftSidebar
                        files={files}
                        templates={[]}
                        selectedFiles={selectedFiles}
                        setSelectedFiles={setSelectedFiles}
                        selectedTemplate={null}
                        requiredFiles={0}
                        currentInput={''}
                        uploadProgress={uploadProgress}
                        onFileUpload={handleFileUpload}
                        onTemplateSelect={() => {
                        }}
                        onRefreshFiles={loadFiles}
                        onOpenFileLibrary={openFileLibrary}
                        width={leftPanelWidth}
                    />

                    {/* Middle Panel - Use Case Gallery */}
                    <div className="flex-1 bg-white flex flex-col">
                        <div className="flex-1 overflow-auto p-6">
                            <UseCaseGallery
                                onUseCaseSelect={handleUseCaseSelect}
                                selectedUseCase={selectedUseCase}
                                showCreateButton={true}
                                userPrompt=""
                                fileSchemas={files.map(f => ({filename: f.filename, columns: f.columns || []}))}
                            />
                        </div>
                    </div>

                    {/* Right Panel */}
                    <RightSidebar
                        analyticsData={analyticsData}
                        processes={processes}
                        loading={analyticsLoading}
                        error={analyticsError}
                        onRefresh={React.useCallback(() => loadAnalytics(true), [loadAnalytics])}
                    />
                </div>
            </div>
        </div>
    );
};

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainApp/>}/>
                <Route path="/viewer/:fileId" element={<ViewerPage/>}/>
                <Route path="/file-library" element={<FileLibraryPage/>}/>
            </Routes>
        </Router>
    );
};

export default App;