import React, { useState } from 'react';
import InfrastructureFloodMap from './InfrastructureFloodMap';

export default function MapWithToolsPanelWithFallback() {
  const [savedMaps, setSavedMaps] = useState([]);

  // Handler for saving maps
  const handleSaveMap = (name, content) => {
    console.log(`Saved map: ${name}`, content);
    setSavedMaps(prev => [...prev, { name, content }]);
  };

  // Handler for when map layers are ready
  const handleLayersReady = () => {
    console.log('Map layers are ready.');
  };

  return (
    <div className="h-screen overflow-hidden">
      <InfrastructureFloodMap 
        onLayersReady={handleLayersReady} 
        onSaveMap={handleSaveMap}
        savedMaps={savedMaps}
      />
    </div>
  );
}