import React, { useState, useEffect } from 'react';
import { Maximize2, Download, ChevronLeft, ChevronRight } from "lucide-react";

const PdfViewerComponent = ({ pdfFile = "/data/Vickery-data.pdf", title = 'Vickery Meadow project report' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  // Check if we're in a context with window.fs
  const hasFileSystem = typeof window !== 'undefined' && window.fs && typeof window.fs.readFile === 'function';

  // Load the PDF data once when component mounts
  useEffect(() => {
    if (!hasFileSystem) {
      console.warn("File system API not available. Using direct file path instead.");
      setPdfUrl(pdfFile);
      setLoading(false);
      return;
    }
    
    const loadPdfData = async () => {
      try {
        const data = await window.fs.readFile(pdfFile);
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfData(blob);
        setPdfUrl(url);
        setLoading(false);
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError("Failed to load the PDF document. Please check if the file is valid.");
        setLoading(false);
      }
    };

    loadPdfData();
    
    // Cleanup function to revoke object URL when component unmounts
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfFile, hasFileSystem]);

  const handleDownload = async () => {
    try {
      if (pdfData) {
        // If we already have the PDF data, use it
        const url = URL.createObjectURL(pdfData);
        const link = document.createElement('a');
        link.href = url;
        link.download = pdfFile.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (hasFileSystem) {
        // If we have file system access but no data yet
        const data = await window.fs.readFile(pdfFile);
        const blob = new Blob([data], { type: 'application/pdf' });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = pdfFile.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // If neither, open the file in a new tab (browser will handle download)
        window.open(pdfFile, '_blank');
      }
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleFullscreen = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      window.open(pdfFile, '_blank');
    }
  };

  return (
    <div className="w-full h-160 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <div className="flex space-x-2">
          <button 
            onClick={handleDownload}
            title="Download PDF"
            className="text-teal-600 hover:bg-teal-600 hover:text-white p-2 rounded-full transition-all">
            <Download size={20} />
          </button>
          <button 
            onClick={handleFullscreen}
            title="View Fullscreen"
            className="text-teal-600 hover:bg-teal-600 hover:text-white p-2 rounded-full transition-all">
            <Maximize2 size={20} />
          </button>
        </div>
      </div>
      
      {error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-red-500 mb-2">{error}</p>
            <p className="text-gray-600">The PDF content may be corrupted or in an invalid format.</p>
            <button
              onClick={handleFullscreen}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
            >
              Try opening in browser
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      ) : (
        <div className="flex-1 relative">
          {pdfUrl && (
            <iframe 
              src={`${pdfUrl}#toolbar=0`}
              title="PDF Viewer"
              className="absolute inset-0 w-full h-full border-none"
              loading="lazy"
              style={{ overflow: 'hidden' }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PdfViewerComponent;