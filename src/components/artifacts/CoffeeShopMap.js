'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(
  () => import('./CoffeeShopMapComponent'),
  {
    ssr: false,  
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  }
);

function CoffeeShopMap(props) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const updatedProps = {
    ...props,
    radius: 1  
  };
  
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

export default CoffeeShopMap;