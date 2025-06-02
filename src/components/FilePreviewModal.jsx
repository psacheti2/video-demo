import { useState, useEffect, useRef, useCallback } from 'react';
import { X, File, ZoomIn, ZoomOut, Map, Eye, Download, ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import ShapefilePreview from './ShapefilePreview'
const PDFViewer = dynamic(() => import('./PDFViewer'), { ssr: false });
const ImageViewer = dynamic(() => import('./ImageViewer'), { ssr: false });

const FilePreviewModal = ({ file, files, onClose }) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const modalContentRef = useRef(null);
  const [showShapefilePreview, setShowShapefilePreview] = useState(false);
  const [allFiles, setAllFiles] = useState([]);

  const isShapefileComponent = (filename) => {
    const ext = filename.toLowerCase().split('.').pop();
    return ['shp', 'dbf', 'shx', 'prj', 'cpg'].includes(ext);
  };

  const isShapefileCollection = () => {
    const currentFiles = files || (file ? [file] : []);
    if (currentFiles.length <= 1) return false;
    
    const extensions = currentFiles.map(f => {
      const name = typeof f === 'string' ? f : f.name;
      return name.toLowerCase().split('.').pop();
    });
    
    return extensions.includes('shp');
  };

  const getShapefileFiles = () => {
    const currentFiles = files || (file ? [file] : []);
    return currentFiles.filter(f => {
      const name = typeof f === 'string' ? f : f.name;
      const ext = name.toLowerCase().split('.').pop();
      return ['shp', 'dbf', 'shx', 'prj', 'cpg'].includes(ext);
    });
  };
useEffect(() => {
  if (file && isShapefileComponent(file.name) && isShapefileCollection()) {
    setShowShapefilePreview(true);
  }
}, [file, files]);
  useEffect(() => {
    const currentFiles = files || (file ? [file] : []);
    setAllFiles(currentFiles);
    
    if (!file) return;
    
    setIsLoading(true);
    
    // If file is a string, it's a reference and we can't preview it
    if (typeof file === 'string') {
      setIsLoading(false);
      return;
    }
    
    // Continue with normal File object handling
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsLoading(false);
    
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, files]);

  const renderPreview = () => {
    if (!file || isLoading) {
      return (
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin h-8 w-8 border-4 border-[#008080] border-t-transparent rounded-full"></div>
        </div>
      );
    }
    if (typeof file === 'string') {
      return (
        <div className="flex flex-col items-center justify-center text-center p-10">
          <File size={48} className="text-gray-400 mb-3" />
          <p className="text-base font-semibold text-gray-800">{file}</p>
          <p className="text-sm text-gray-500 mt-1">Preview not available for saved files</p>
        </div>
      );
    }
    if (file.type.startsWith('image/')) {
      return <ImageViewer fileUrl={previewUrl} fileName={file.name} />;
    } else if (file.type === 'application/pdf') {
      return <PDFViewer file={file} />;
    } else if (isShapefileComponent(file.name)) {
  if (isShapefileCollection()) {
    // Automatically show shapefile preview if it's a collection
    if (!showShapefilePreview) {
      setShowShapefilePreview(true);
    }
    return null; // Don't render anything here, let the conditional rendering handle it
  }
  // Keep the existing dialog for single shapefile components
  return (
    <div className="flex flex-col items-center justify-center text-center p-10">
      <Map size={48} className="text-green-500 mb-3" />
      <p className="text-base font-semibold text-gray-800">{file.name}</p>
      <p className="text-sm text-gray-500 mt-1">Shapefile component detected</p>
    </div>
  );
    } else {
      return (
        <div className="flex flex-col items-center justify-center text-center p-10">
          <File size={48} className="text-gray-400 mb-3" />
          <p className="text-base font-semibold text-gray-800">{file.name}</p>
          <p className="text-sm text-gray-500 mt-1">No preview available</p>
          {previewUrl && (
            <a
              href={previewUrl}
              download={file.name}
              className="mt-6 px-4 py-2 bg-[#008080] text-white text-sm rounded-md shadow hover:bg-[#006666] transition"
            >
              Download File
            </a>
          )}
        </div>
      );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => {
        if (modalContentRef.current && !modalContentRef.current.contains(e.target)) {
          onClose();
        }
      }}
    >     
      <div 
        ref={modalContentRef}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fade-in"
      >
        {/* Conditionally render either the shapefile preview or the normal preview */}
        {showShapefilePreview ? (
          <>
            {/* Header for shapefile preview */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#008080]/30 bg-[#f5f5f5]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowShapefilePreview(false)}
                  className="p-2 rounded-full text-[#008080] bg-[#f5f5f5] hover:bg-[#008080] hover:text-white transition"
                  aria-label="Back to file preview"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="text-sm font-semibold text-[#008080]">
                  Shapefile Map Preview
                  <span className="text-xs text-gray-600 block">
                    {getShapefileFiles().length} files
                  </span>
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-[#008080] bg-[#f5f5f5] hover:bg-[#008080] hover:text-white transition"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Shapefile preview content */}
            <div className="h-[calc(90vh-80px)]">
              <ShapefilePreview
                files={getShapefileFiles()}
                onClose={() => setShowShapefilePreview(false)}
              />
            </div>
          </>
        ) : (
          <>
            {/* Normal file preview header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#008080]/30 bg-[#f5f5f5]">
              <h2 className="text-sm font-semibold text-[#008080] truncate max-w-[70%]">
                {file?.name}
                {isShapefileCollection() && (
                  <span className="text-xs text-gray-600 block">
                    Shapefile bundle ({getShapefileFiles().length} files)
                  </span>
                )}
              </h2>

              <div className="flex items-center gap-2">
                {isShapefileCollection() && (
                  <button
                    onClick={() => setShowShapefilePreview(true)}
                    className="p-2 rounded-full text-[#008080] bg-[#f5f5f5] hover:bg-[#008080] hover:text-white transition"
                    aria-label="View Shapefile Map"
                  >
                    <Map className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-[#008080] bg-[#f5f5f5] hover:bg-[#008080] hover:text-white transition"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Normal file preview content */}
            <div className="px-5 py-4 overflow-auto">{renderPreview()}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default FilePreviewModal;