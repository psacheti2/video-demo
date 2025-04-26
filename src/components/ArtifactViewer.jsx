// ArtifactViewer.jsx
import React from 'react';
import AdditionalLayersMapComponent from './artifacts/AdditionalLayersMapComponent';
import CoffeeShopMapComponent from './artifacts/CoffeeShopMapComponent';
import ROIAnalysisDashboard from './artifacts/ROIAnalysisDashboard';

const ArtifactViewer = ({ artifact, onClose }) => {
  if (!artifact) return null;

  // Based on the component type, render the appropriate component
  const renderArtifact = () => {
    switch (artifact.component) {
      case 'AdditionalLayersMapComponent':
        return (
          <AdditionalLayersMapComponent
            key={artifact.id}
            title={artifact.title}
            center={artifact.props?.center || [40.7589, -73.9866]}
            radius={artifact.props?.radius || 3}
            activeLayers={artifact.props?.activeLayers}
            onBack={onClose}
            layerColors={artifact.props?.layerColors}
          />
        );
        case 'CoffeeShopMapComponent':
            return (
              <CoffeeShopMapComponent
                key={artifact.id}
                title={artifact.title}
                center={artifact.props?.center || [40.7589, -73.9866]}
                radius={artifact.props?.radius || 3}
                activeLayers={artifact.props?.activeLayers}
                onBack={onClose}
                layerColors={artifact.props?.layerColors}
              />
            );
            case 'ROIAnalysisDashboard':
                return (
                  <ROIAnalysisDashboard
                    key={artifact.id}
                    title={artifact.title}
                    center={artifact.props?.center || [40.7589, -73.9866]}
                    radius={artifact.props?.radius || 3}
                    activeLayers={artifact.props?.activeLayers}
                    onBack={onClose}
                    layerColors={artifact.props?.layerColors}
                  />
                );
      default:
        return <div>Unknown artifact type: {artifact.component}</div>;
    }
  };

  return (
    <div className="h-full w-full relative">
      {renderArtifact()}
    </div>
  );
};

export default ArtifactViewer;