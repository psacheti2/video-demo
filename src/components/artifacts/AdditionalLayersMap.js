'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Create a dynamic import for the map component with no SSR
const MapComponent = dynamic(
  () => import('./AdditionalLayersMapComponent'),
  {
    ssr: false,  // This is crucial - prevents server-side rendering
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  }
);

// Main component that doesn't import Leaflet directly
function AdditionalLayersMap(props) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Override the radius prop to set it to 0.5 miles
  const updatedProps = {
    ...props,
    radius: 0.8  // Explicitly set radius to 0.5 miles
  };
  
  // Only render the map component on the client
  return (
    <div className="w-full h-full">
      {isClient ? <MapComponent {...updatedProps} /> : 
        <div className="h-full w-full flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Initializing map...</p>
        </div>
      }
    </div>
  );
}

export default AdditionalLayersMap;