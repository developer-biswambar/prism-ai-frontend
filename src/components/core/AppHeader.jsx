import React from 'react';
import {Brain, ChevronLeft, FolderOpen, X, Zap} from 'lucide-react';
import ForteLogo from './ForteLogo.jsx';

const AppHeader = ({
                       title = "AI based Data Processing",
                       subtitle = null,
                       showBackButton = false,
                       onBackClick = null,
                       showCloseButton = false,
                       onCloseClick = null,
                       showFileLibrary = true,
                       onFileLibraryClick = null,
                       className = ""
                   }) => {
    const handleFileLibraryClick = () => {
        if (onFileLibraryClick) {
            onFileLibraryClick();
        } else {
            // Default behavior - open in new window
            window.open('/file-library', '_blank');
        }
    };

    return (
        <div className={`relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 px-6 py-4 shadow-xl border-b border-slate-700/50 ${className}`}>
            {/* Background overlay with subtle pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(120,119,198,0.1),transparent_50%)]"></div>
            
            <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    {/* Back Button */}
                    {showBackButton && onBackClick && (
                        <button
                            onClick={onBackClick}
                            className="text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm p-2.5 rounded-xl border border-white/10 hover:border-white/20 flex items-center space-x-2 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                            title="Back to Use Case Gallery"
                        >
                            <ChevronLeft size={18}/>
                            <span className="text-sm font-medium">Back</span>
                        </button>
                    )}

                    {/* App Logo/Brand */}
                    <div className="flex items-center space-x-3">
                        {/* Enhanced Logo */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl blur-lg opacity-30"></div>
                            <div className="relative">
                                <ForteLogo size={40} animated={true} />
                            </div>
                        </div>

                        {/* Title and Subtitle */}
                        <div>
                            <div className="flex items-center space-x-2">
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                                    {title}
                                </h1>
                                <Zap className="text-blue-400" size={16}/>
                            </div>
                            {subtitle && (
                                <p className="text-sm text-blue-200/80 font-medium mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center space-x-3">
                    {/* File Library Button */}
                    {showFileLibrary && (
                        <button
                            onClick={handleFileLibraryClick}
                            className="text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 flex items-center space-x-2 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group"
                            title="Open File Library"
                        >
                            <FolderOpen size={18} className="group-hover:scale-110 transition-transform duration-200"/>
                            <span className="text-sm font-medium">File Library</span>
                        </button>
                    )}

                    {/* Close Button */}
                    {showCloseButton && onCloseClick && (
                        <button
                            onClick={onCloseClick}
                            className="text-white/90 hover:text-white bg-white/10 hover:bg-red-500/20 backdrop-blur-sm p-2.5 rounded-xl border border-white/10 hover:border-red-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 group"
                            title="Close"
                        >
                            <X size={18} className="group-hover:rotate-90 transition-transform duration-200"/>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppHeader;