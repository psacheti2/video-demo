'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled
const MapComponent = dynamic(
  () => import('./RiskIndexMapComponent'),  // Create this file with your actual map code
  { 
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading risk index map...</p>
    </div>
  }
);

function InfrastructureRiskIndexMap(props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="w-full h-full">
      {isClient ? <MapComponent {...props} /> : 
        <div className="h-full w-full flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Initializing risk index map...</p>
        </div>
      }
    </div>
  );
}

export default InfrastructureRiskIndexMap;