'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled
const MapComponent = dynamic(
  () => import('./AffordableHousingMapComponent'),
  { 
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading affordable housing map...</p>
    </div>
  }
);

function AffordableHousingMap(props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="w-full h-full">
      {isClient ? <MapComponent {...props} /> : 
        <div className="h-full w-full flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Initializing affordable housing map...</p>
        </div>
      }
    </div>
  );
}

export default AffordableHousingMap;