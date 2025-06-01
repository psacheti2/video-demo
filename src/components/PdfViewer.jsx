'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

const PDFViewer = ({ file }) => {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1.5);

  useEffect(() => {
    const handleZoom = (e) => {
      if (e.detail === 'in') {
        setScale(prev => Math.min(5, prev + 0.25));
      } else if (e.detail === 'out') {
        setScale(prev => Math.max(0.5, prev - 0.25));
      }
    };

    window.addEventListener('pdf-zoom', handleZoom);
    return () => window.removeEventListener('pdf-zoom', handleZoom);
  }, []);

  const renderPDF = useCallback(async () => {
    if (!file || typeof file === 'string') return;

    const fileURL = URL.createObjectURL(file);
    const loadingTask = getDocument(fileURL);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
    URL.revokeObjectURL(fileURL);
  }, [file, scale]);

  useEffect(() => {
    renderPDF();
  }, [renderPDF]);

  return (
    <div className="w-full">
<div className="max-h-[65vh] overflow-auto border border-[#008080]/30 rounded-b-md shadow-inner px-2 py-2 bg-white">
<canvas ref={canvasRef} className="block mx-auto" />
      </div>
    </div>
  );
};

export default PDFViewer;