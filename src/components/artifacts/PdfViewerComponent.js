import React, { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, Upload, FileText } from 'lucide-react';

const AdvancedDrivePdfViewer = ({ driveUrl, title = 'Document Viewer' }) => {
  const [viewMode, setViewMode] = useState('preview');
  const [loadFailed, setLoadFailed] = useState(false);
  const [fileUpload, setFileUpload] = useState(null);
  const [loading, setLoading] = useState(true);

  // Extract file ID from Google Drive URL
  const extractFileId = (url) => {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };
  
  const fileId = extractFileId(driveUrl);
  
  // Generate different embedding URLs
  const embedUrls = {
    // Standard preview URL
    preview: `https://drive.google.com/file/d/1NWkBAF4oxqItoifMBL9PORPT3d_WmkSD/edit`,
    // Alternative embed URL
    embed: `https://drive.google.com/file/d/1NWkBAF4oxqItoifMBL9PORPT3d_WmkSD/view?usp=sharing`,
    // View URL with minimal UI
    view: `https://drive.google.com/file/d/${fileId}/view?embedded=true`
  };

  // Handle iframe load events
  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setLoadFailed(true);
  };

  // Try next embedding method if current one fails
  useEffect(() => {
    if (loadFailed && viewMode === 'preview') {
      setViewMode('embed');
      setLoadFailed(false);
      setLoading(true);
    } else if (loadFailed && viewMode === 'embed') {
      setViewMode('view');
      setLoadFailed(false);
      setLoading(true);
    }
  }, [loadFailed, viewMode]);

  // Handle file upload
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setFileUpload(URL.createObjectURL(file));
        setViewMode('uploaded');
        setLoadFailed(false);
      } else {
        alert('Please upload a PDF file');
      }
    }
  };

  // Open Drive link in new tab
  const openInNewTab = () => {
    window.open(driveUrl, '_blank');
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-3 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <div className="flex space-x-2">
          {(viewMode === 'uploaded' || loadFailed) && (
            <button 
              onClick={() => {
                setViewMode('preview');
                setLoadFailed(false);
                setLoading(true);
              }}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center gap-1"
            >
              <RefreshCw size={14} />
              <span>Try Drive Again</span>
            </button>
          )}
          <button 
            onClick={openInNewTab}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center gap-1"
          >
            <ExternalLink size={14} />
            <span>Open in New Tab</span>
          </button>
          {viewMode !== 'upload' && (
            <button 
              onClick={() => setViewMode('upload')}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center gap-1"
            >
              <Upload size={14} />
              <span>Upload PDF</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 w-full relative">
        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-gray-600">Loading document...</p>
            </div>
          </div>
        )}
        
        {/* Google Drive embedding - different methods */}
        {['preview', 'embed', 'view'].includes(viewMode) && fileId && !loadFailed && (
          <iframe 
            src={embedUrls[viewMode]}
            className="w-full h-full border-0" 
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={title}
            allow="autoplay"
          />
        )}
        
        {/* Upload interface */}
        {viewMode === 'upload' && (
          <div className="p-8 flex flex-col items-center justify-center h-full">
            <Upload size={48} className="text-blue-500 mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">Upload PDF Document</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Upload a PDF file from your device to view it here.
            </p>
            <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <FileText size={18} />
              <span>Select PDF File</span>
              <input 
                type="file" 
                accept="application/pdf" 
                className="hidden" 
                onChange={handleFileChange} 
              />
            </label>
          </div>
        )}
        
        {/* Uploaded PDF viewer */}
        {viewMode === 'uploaded' && fileUpload && (
          <iframe 
            src={fileUpload}
            className="w-full h-full border-0" 
            title="Uploaded PDF"
          />
        )}
        
        {/* Error state */}
        {loadFailed && ['preview', 'embed', 'view'].includes(viewMode) && (
          <div className="p-8 flex flex-col items-center justify-center h-full">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <ExternalLink size={24} className="text-red-500" />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">Unable to Load Document</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              We're having trouble embedding this Google Drive document. 
              Google Drive security settings might be preventing it from displaying here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={openInNewTab}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <ExternalLink size={18} />
                Open in Google Drive
              </button>
              <button
                onClick={() => setViewMode('upload')}
                className="flex items-center justify-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                <Upload size={18} />
                Upload PDF Instead
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Example usage with the specific Google Drive link
export default () => {
  const driveUrl = "https://drive.google.com/file/d/1NWkBAF4oxqItoifMBL9PORPT3d_WmkSD/view?usp=sharing";
  
  return (
    <AdvancedDrivePdfViewer 
      driveUrl={driveUrl} 
      title="Google Drive PDF Document" 
    />
  );
};