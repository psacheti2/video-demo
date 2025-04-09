import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Maximize2, Download, ChevronLeft, ChevronRight } from "lucide-react";

// Important: Set the worker source for react-pdf
// In a real app, you would typically do this in your main index.js file
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PdfViewerComponent = ({ pdfFile = "/data/Vickery-data.pdf", title = 'Document Viewer' }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfData, setPdfData] = useState(null);

  // Check if we're in a context with window.fs
  const hasFileSystem = typeof window !== 'undefined' && window.fs && typeof window.fs.readFile === 'function';

  // Load the PDF data once when component mounts
  useEffect(() => {
    // Skip file loading if we don't have access to the file system
    if (!hasFileSystem) {
      console.warn("File system API not available. Using direct file path instead.");
      setLoading(false);
      return;
    }
    
    const loadPdfData = async () => {
      try {
        const data = await window.fs.readFile(pdfFile);
        const blob = new Blob([data], { type: 'application/pdf' });
        setPdfData(blob);
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError("Failed to load the PDF document. Please check if the file is valid.");
        setLoading(false);
      }
    };

    loadPdfData();
  }, [pdfFile, hasFileSystem]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error("Failed to load PDF:", error);
    setError("Failed to load the PDF document. Please check if the file is valid.");
    setLoading(false);
  };

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => Math.min(Math.max(prevPageNumber + offset, 1), numPages));
  };

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

  const handleFullscreen = async () => {
    try {
      if (pdfData) {
        // If we already have the PDF data, use it
        const url = URL.createObjectURL(pdfData);
        window.open(url, '_blank');
        // We don't revoke the URL immediately as it's needed for the new window
        setTimeout(() => URL.revokeObjectURL(url), 30000); // Cleanup after 30 seconds
      } else if (hasFileSystem) {
        // If we have file system access but no data yet
        const data = await window.fs.readFile(pdfFile);
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        // We don't revoke the URL immediately as it's needed for the new window
        setTimeout(() => URL.revokeObjectURL(url), 30000); // Cleanup after 30 seconds
      } else {
        // If neither, just open the file URL directly
        window.open(pdfFile, '_blank');
      }
    } catch (error) {
      console.error("Fullscreen view failed:", error);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
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
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4 flex flex-col items-center">
          <Document
            file={pdfData || pdfFile} // Use the pdfData blob if available, otherwise fall back to file path
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
              </div>
            }
            className="pdf-document"
          >
            {loading ? null : (
              <Page 
                pageNumber={pageNumber} 
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="pdf-page shadow-md"
              />
            )}
          </Document>
          
          {numPages && (
            <div className="flex items-center mt-4 space-x-4">
              <button 
                onClick={() => changePage(-1)} 
                disabled={pageNumber <= 1}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-gray-100"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-gray-700">
                Page {pageNumber} of {numPages}
              </span>
              <button 
                onClick={() => changePage(1)} 
                disabled={pageNumber >= numPages}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-gray-100"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfViewerComponent;