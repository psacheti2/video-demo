'use client';

import { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

const ImageViewer = ({ fileUrl, fileName }) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleZoom = (e) => {
      if (e.detail === 'in') {
        setScale((prev) => Math.min(5, prev + 0.25));
      } else if (e.detail === 'out') {
        setScale((prev) => Math.max(0.1, prev - 0.25));
      }
    };

    window.addEventListener('pdf-zoom', handleZoom);
    return () => window.removeEventListener('pdf-zoom', handleZoom);
  }, []);

  return (
    <div className="w-full">
      <div className="max-h-[65vh] overflow-auto border border-[#008080]/30 rounded-b-md shadow-inner bg-white">
        <div
          className="min-w-fit min-h-fit"
          style={{ width: `${scale * 100}%`, height: 'auto' }}
        >
          <img
            src={fileUrl}
            alt={fileName}
            className="w-full h-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
