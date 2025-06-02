import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Layers, X, ChevronDown, ChevronUp } from 'lucide-react';

// This is the updated Legend component that allows reordering
const DraggableLegend = ({ 
  isFullscreen,
  showLegend, 
  setShowLegend, 
  activeLayers, 
  toggleLayer, 
  expandedSections, 
  toggleSection, 
  layerColors,
  setLayerColors,
  setLayerZIndexes, 
  layerZIndexes,
  customLayerNames,
setCustomLayerNames,
currentMapView,
  handleMapViewChange,
  toggleBaseMap,
  drawnLayers,
  setDrawnLayers,
  drawnLayersOrder,
  toggleDrawnLayer,
  updateDrawnLayerColor,
  mapContainerRef
}) => {
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [layerOrder, setLayerOrder] = useState([]);
  const dragOverItemIndex = useRef(null);
  const [baseMapVisible, setBaseMapVisible] = useState(true);
  const [showSourcesPopup, setShowSourcesPopup] = useState(null);
  const [legendPosition, setLegendPosition] = useState({ bottom: 4, left: 4 });
  const [isDraggingLegend, setIsDraggingLegend] = useState(false);
  const legendRef = useRef(null);
  const dragStartPosition = useRef({ x: 0, y: 0 });
const [editingLayerId, setEditingLayerId] = useState(null);
useEffect(() => {
    const storedNames = localStorage.getItem('customLayerNames');
    if (storedNames) {
      setCustomLayerNames(JSON.parse(storedNames));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('customLayerNames', JSON.stringify(customLayerNames));
  }, [customLayerNames]);
  
  useEffect(() => {
    if (isDraggingLegend) {
      document.addEventListener('mousemove', handleLegendDragMove);
      document.addEventListener('mouseup', handleLegendDragEnd);
    }
  
    return () => {
      document.removeEventListener('mousemove', handleLegendDragMove);
      document.removeEventListener('mouseup', handleLegendDragEnd);
    };
  }, [isDraggingLegend]);
  
  // Initialize the layer order based on z-index when the component mounts
  useEffect(() => {
    if (!layerZIndexes) return;
    
    // Convert the z-index object to an array of items sorted by z-index value (highest first)
    const sortedLayers = Object.entries(layerZIndexes)
      .sort(([, aZIndex], [, bZIndex]) => bZIndex - aZIndex)
      .map(([id]) => id);
    
    setLayerOrder(sortedLayers);
  }, [layerZIndexes]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSourcesPopup && !event.target.closest('.relative')) {
        setShowSourcesPopup(null);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSourcesPopup]);

  const layerConfig = useMemo(() => ({
    uploadedLocations: {
    name: customLayerNames['uploadedLocations'] || 'Client Sites',
    icon: <div className="w-4 h-4 rounded-full" style={{ backgroundColor: layerColors.uploadedLocations || '#FF6B35' }} />,
    legend: [
      { label: 'Client Locations', color: layerColors.uploadedLocations || '#FF6B35' },
    ],
    sources: [
      { title: 'Client Site Data', url: '#' },
      { title: 'Location Analysis Requirements', url: '#' }
    ]
  },
  substations: {
  name: customLayerNames['substations'] || 'Power Substations',
  icon: <div className="w-4 h-4 transform rotate-45" style={{ backgroundColor: layerColors.substations || '#4ECDC4' }} />,
  legend: [
    { label: 'Substations (various voltages)', color: layerColors.substations || '#4ECDC4', note: 'Size indicates capacity' }
  ],
  sources: [
    { title: 'OpenStreetMap Power Infrastructure', url: 'https://overpass-turbo.eu/' },
    { title: 'Spanish Electrical Grid Data', url: 'https://www.ree.es/en' },
    { title: 'ENTSO-E Transmission Map', url: 'https://www.entsoe.eu/' }
  ]
},
  powerlines: {
    name: customLayerNames['powerlines'] || 'Power Lines',
    icon: <div className="w-4 h-1" style={{ backgroundColor: layerColors.powerlines400kv || '#E74C3C' }} />,
    legend: [
      { label: '400kV Lines', color: layerColors.powerlines400kv || '#E74C3C', lineWeight: 'Heavy' },
      { label: '220kV Lines', color: layerColors.powerlines220kv || '#F39C12', lineWeight: 'Medium' },
      { label: 'Other Lines', color: layerColors.powerlinesOther || '#9B59B6', lineWeight: 'Light' }
    ],
    sources: [
      { title: 'Red Eléctrica de España', url: 'https://www.ree.es/en' },
      { title: 'OpenStreetMap Power Lines', url: 'https://overpass-turbo.eu/' },
      { title: 'European Transmission Grid', url: 'https://www.entsoe.eu/' }
    ]
  },
  bufferZones: {
    name: customLayerNames['bufferZones'] || 'Infrastructure Zones',
    icon: <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-dashed" style={{ backgroundColor: 'transparent' }} />,
    legend: [
      { label: 'Infrastructure Buffer Zones', color: layerColors.bufferZones || '#3498DB', dashed: true }
    ],
    sources: [
      { title: 'Infrastructure Density Analysis', url: '#' },
      { title: 'Proximity Assessment Data', url: '#' }
    ]
  },
  dataCenters: {
    name: customLayerNames['dataCenters'] || 'Data Centers',
    icon: <div className="w-4 h-4 rounded-full" style={{ backgroundColor: layerColors.existingDataCenter || '#008080' }} />,
    legend: [
      { label: 'Data Centers', color: layerColors.existingDataCenter || '#008080' },
    ],
    sources: [
      { title: 'Madrid Data Center Registry', url: '#' },
      { title: 'European Colocation Database', url: '#' },
      { title: 'Infrastructure Site Analysis', url: '#' }
    ]
  },
  coffeeShops: {
    name: customLayerNames['coffeeShops'] || 'Coffee Shops',
    icon: <div className="w-4 h-4 rounded-full" style={{ backgroundColor: layerColors.existingShop }} />,
    legend: [
      { label: 'Existing Shops', color: layerColors.existingShop },
    ],
    sources: [
      { title: 'Coffee Shop Locations', url: 'https://data.cityofnewyork.us/Health/Coffee-Shop-Inspections-2023/xyz123' }
    ]
  },
  footTraffic: {
    name: customLayerNames['footTraffic'] || 'Foot Traffic',
    icon: <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: layerColors.highTraffic }} />,
    legend: [
      {
        label: 'Heatmap Intensity',
        gradient: [layerColors.lowTraffic, layerColors.mediumTraffic, layerColors.highTraffic]
      }
    ],
    sources: [
      { title: 'Foot Traffic Data', url: 'https://data.nyc.gov/Transportation/Foot-Traffic-Counts-2023/abc456' },
      { title: 'Pedestrian Analytics', url: 'https://example.com/pedestrian-data' },
      { title: 'NYC Walking Patterns', url: 'https://opendata.cityofnewyork.us/walking-patterns' }
    ]
  },
  radius: {
    name: customLayerNames['radius'] || '1-Mile Radius',
    icon: <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-dashed" style={{ backgroundColor: 'transparent' }} />,
    legend: [
      { label: 'Times Square Radius', color: '#4169E1', dashed: true }
    ],
    sources: [
      { title: 'Times Square Location', url: 'https://en.wikipedia.org/wiki/Times_Square' }
    ]
  },
  floodZones: {
    name: customLayerNames['floodZones'] || 'Flood Risk Zones',
    icon: <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: layerColors.floodZones || '#FF6B6B' }} />,
    legend: [
      { label: 'High Risk Flood Areas', color: layerColors.floodZones || '#FF6B6B' }
    ],
    sources: [
      { title: 'Madrid Flood Risk Assessment', url: '#' },
      { title: 'Spanish Hydrological Agency', url: '#' },
      { title: 'EU Flood Risk Management', url: '#' }
    ]
  },
  waterBodies: {
    name: customLayerNames['waterBodies'] || 'Water Bodies',
    icon: <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: layerColors.waterBodies || '#3498DB' }} />,
    legend: [
      { label: 'Lakes and Reservoirs', color: layerColors.waterBodies || '#3498DB' }
    ],
    sources: [
      { title: 'Madrid Water Resources', url: '#' },
      { title: 'OpenStreetMap Water Features', url: 'https://overpass-turbo.eu/' },
      { title: 'Spanish Water Authority', url: '#' }
    ]
  },
  waterways: {
    name: customLayerNames['waterways'] || 'Waterways',
    icon: <div className="w-4 h-1" style={{ backgroundColor: layerColors.waterways || '#2980B9' }} />,
    legend: [
      { label: 'Rivers and Streams', color: layerColors.waterways || '#2980B9', lineWeight: 'Medium' }
    ],
    sources: [
      { title: 'Madrid River Network', url: '#' },
      { title: 'OpenStreetMap Waterways', url: 'https://overpass-turbo.eu/' },
      { title: 'Hydrographic Confederation', url: '#' }
    ]
  },
  zoningBoundaries: {
    name: customLayerNames['zoningBoundaries'] || 'Zoning Boundaries',
    icon: <div className="w-4 h-4 rounded-sm border-2 border-purple-500 border-dashed" style={{ backgroundColor: 'transparent' }} />,
    legend: [
      { label: 'Zoning Districts', color: layerColors.zoningBoundaries || '#8E44AD', dashed: true }
    ],
    sources: [
      { title: 'Madrid Urban Planning', url: '#' },
      { title: 'Municipal Zoning Database', url: '#' },
      { title: 'Land Use Regulations', url: '#' }
    ]
  },
  environmentalRisk: {
    name: customLayerNames['environmentalRisk'] || 'Heat Risk',
    icon: <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: layerColors.environmentalRisk || '#E67E22' }} />,
    legend: [
      {
        label: 'Risk Intensity Heatmap',
        gradient: ['#27AE60', '#F1C40F', '#F39C12', '#E67E22', '#E74C3C', '#8B0000']
      }
    ],
    sources: [
      { title: 'Environmental Risk Assessment', url: '#' },
      { title: 'Industrial Zone Analysis', url: '#' },
      { title: 'Pollution Risk Modeling', url: '#' }
    ]
  },
  complianceIndicators: {
    name: customLayerNames['complianceIndicators'] || 'Compliance Status',
    icon: <div className="w-4 h-4 rounded-full" style={{ backgroundColor: layerColors.complianceIndicators || '#27AE60' }} />,
    legend: [
      { label: 'Compliant', color: '#27AE60' },
      { label: 'Needs Review', color: '#F39C12' },
      { label: 'Violation', color: '#E74C3C' }
    ],
    sources: [
      { title: 'Environmental Compliance Database', url: '#' },
      { title: 'Regulatory Status Reports', url: '#' },
      { title: 'Permit Tracking System', url: '#' }
    ]
  },
  weightedScoring: {
  name: customLayerNames['weightedScoring'] || 'Weighted Site Scoring',
  icon: <div className="w-4 h-4 rounded-full" style={{ backgroundColor: layerColors.weightedScoring || '#3498DB' }} />,
  legend: [
    { label: 'Score 8.0+ (Excellent)', color: '#27AE60' },
    { label: 'Score 7.0-7.9 (Good)', color: '#F39C12' },
    { label: 'Score 6.0-6.9 (Fair)', color: '#E67E22' },
    { label: 'Score <6.0 (Poor)', color: '#E74C3C' }
  ],
  sources: [
    { title: 'Infrastructure Weighting Analysis', url: '#' },
    { title: 'Multi-Criteria Decision Matrix', url: '#' },
    { title: 'Site Evaluation Methodology', url: '#' }
  ]
},
costAnalysisZones: {
  name: customLayerNames['costAnalysisZones'] || 'Cost Analysis Zones',
  icon: <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: layerColors.costAnalysisZones || '#9B59B6' }} />,
  legend: [
    { label: 'Premium Zone (€180-220/sqm)', color: '#E74C3C' },
    { label: 'High-Cost Zone (€120-180/sqm)', color: '#F39C12' },
    { label: 'Moderate Zone (€80-120/sqm)', color: '#F1C40F' },
    { label: 'Affordable Zone (€50-80/sqm)', color: '#27AE60' }
  ],
  sources: [
    { title: 'Madrid Real Estate Market Data', url: '#' },
    { title: 'Commercial Land Pricing Analysis', url: '#' },
    { title: 'Industrial Zone Cost Assessment', url: '#' }
  ]
},
rankingLabels: {
  name: customLayerNames['rankingLabels'] || 'Final Site Rankings',
  icon: <div className="w-4 h-4 rounded-full" style={{ backgroundColor: layerColors.rankingLabels || '#E74C3C' }} />,
  legend: [
    { label: '1st Choice', color: '#27AE60' },
    { label: '2nd Choice', color: '#F39C12' },
    { label: '3rd Choice', color: '#E67E22' }
  ],
  sources: [
    { title: 'Final Ranking Methodology', url: '#' },
    { title: 'Decision Support Analysis', url: '#' },
    { title: 'Site Selection Recommendations', url: '#' }
  ]
}
}), [layerColors, customLayerNames]);
  
  const handleLegendDragStart = (e) => {
    setIsDraggingLegend(true);
    dragStartPosition.current = {
      x: e.clientX,
      y: e.clientY,
      initialLeft: legendPosition.left,
      initialBottom: legendPosition.bottom
    };
    
    document.addEventListener('mousemove', handleLegendDragMove);
    document.addEventListener('mouseup', handleLegendDragEnd);
    
    e.preventDefault();
  };
  
  const handleLegendDragMove = (e) => {
    if (!isDraggingLegend || !mapContainerRef.current || !legendRef.current) return;
  
    const containerRect = mapContainerRef.current.getBoundingClientRect();
    const legendRect = legendRef.current.getBoundingClientRect();
  
    const dx = e.clientX - dragStartPosition.current.x;
    const dy = e.clientY - dragStartPosition.current.y;
  
    // Proposed new positions
    let newLeft = dragStartPosition.current.initialLeft + dx;
    let newBottom = dragStartPosition.current.initialBottom - dy;
  
    // Clamp left: not less than 4px
    newLeft = Math.max(4, newLeft);
  
    // Clamp bottom: not less than 4px
    newBottom = Math.max(4, newBottom);
  
    // Clamp top: legend should not go above the top of container
    const legendHeight = legendRect.height;
    const containerHeight = containerRect.height;
    const maxBottom = containerHeight - legendHeight - 4;
    newBottom = Math.min(newBottom, maxBottom);
  
    // Clamp right: legend should not go beyond right edge
    const legendWidth = legendRect.width;
    const containerWidth = containerRect.width;
    const maxLeft = containerWidth - legendWidth - 4;
    newLeft = Math.min(newLeft, maxLeft);
  
    setLegendPosition({ left: newLeft, bottom: newBottom });
  };
  

  const handleLegendDragEnd = () => {
    setIsDraggingLegend(false);
    document.removeEventListener('mousemove', handleLegendDragMove);
    document.removeEventListener('mouseup', handleLegendDragEnd);
  };

  // Handlers for drag and drop functionality
  const handleDragStart = (index) => {
    setDraggingIndex(index);
  };
  
  const handleDragEnter = (index) => {
    dragOverItemIndex.current = index;
  };
  
  const mapStyles = [
    { id: 'light', name: 'Light' },
    { id: 'dark', name: 'Dark' },
    { id: 'satellite', name: 'Satellite' },
    { id: 'streets', name: 'Streets' },
    { id: 'outdoors', name: 'Outdoors' },
    { id: 'hybrid', name: 'Hybrid' }
  ];
 
  const handleDragEnd = () => {
    if (draggingIndex !== null && dragOverItemIndex.current !== null && draggingIndex !== dragOverItemIndex.current) {
        // Create a copy of the current order
        const newLayerOrder = [...layerOrder];
        
        // Get the item being dragged
        const draggedItem = newLayerOrder[draggingIndex];
        
        // Remove it from the array
        newLayerOrder.splice(draggingIndex, 1);
        
        // Insert it at the new position
        newLayerOrder.splice(dragOverItemIndex.current, 0, draggedItem);
        
        // Update the state with the new order
        setLayerOrder(newLayerOrder);
        
        // Calculate new z-indexes based on the new order (highest index = highest z-index)
        const newZIndexes = {};
        newLayerOrder.forEach((layerId, index) => {
            // Reverse the index so the first item gets the highest z-index
            // We multiply by 10 to leave room for potential sub-layers
            newZIndexes[layerId] = (newLayerOrder.length - index) * 10;
        });
        
        // Update the parent component's z-index state
        setLayerZIndexes(newZIndexes);
        
        // Always set only the topmost layer as the interactive layer
        // This ensures only one layer is interactive at a time
        if (newLayerOrder.length > 0 && activeLayers[newLayerOrder[0]]) {
            console.log("Setting top interactive layer to:", newLayerOrder[0]);
        } else {
            // If top layer is not active, find the first active layer
            const firstActiveLayer = newLayerOrder.find(layerId => activeLayers[layerId]);
            if (firstActiveLayer) {
                console.log("Setting top interactive layer to first active:", firstActiveLayer);
            }
        }
    }
    
    // Reset drag state
    setDraggingIndex(null);
    dragOverItemIndex.current = null;
};

  const getLayerKeyFromLegend = (layerId, label) => {
    const clean = (str) => str.toLowerCase().replace(/[^a-z]/g, '');
if (layerId === 'floodZones') {
    return 'floodZones';
  }

  if (layerId === 'waterBodies') {
    return 'waterBodies';
  }

  if (layerId === 'waterways') {
    return 'waterways';
  }

  if (layerId === 'zoningBoundaries') {
    return 'zoningBoundaries';
  }

  if (layerId === 'complianceIndicators') {
    if (label.includes('Compliant')) return 'complianceIndicators';
    if (label.includes('Review')) return 'complianceIndicators';
    if (label.includes('Violation')) return 'complianceIndicators';
    return 'complianceIndicators';
  }

     if (layerId === 'uploadedLocations') {
    return 'uploadedLocations';
  }

  if (layerId === 'substations') {
    return 'substations';
  }

  if (layerId === 'powerlines') {
    if (label.includes('400kV')) return 'powerlines400kv';
    if (label.includes('220kV')) return 'powerlines220kv';
    if (label.includes('Other')) return 'powerlinesOther';
    return 'powerlines400kv'; // default
  }

  if (layerId === 'bufferZones') {
    return 'bufferZones';
  }

if (layerId === 'dataCenters') {
    return 'existingDataCenter';
  }

    if (layerId === 'coffeeShops') {
      if (label.includes('Existing')) return 'existingShop';
      if (label.includes('High Potential')) return 'highPotential';
      if (label.includes('Medium Potential')) return 'mediumPotential';
      if (label.includes('Low Potential')) return 'lowPotential';
    }

    if (layerId === 'footTraffic') {
      if (label.includes('High')) return 'highTraffic';
      if (label.includes('Medium')) return 'mediumTraffic';
      if (label.includes('Low')) return 'lowTraffic';
    }
    if (layerId === 'weightedScoring') {
  return 'weightedScoring';
}

if (layerId === 'costAnalysisZones') {
  return 'costAnalysisZones';
}

if (layerId === 'rankingLabels') {
  return 'rankingLabels';
}

    return '';
  };
  
  if (!showLegend) return null;
  
  return (
    <div 
      ref={legendRef}
      className={`absolute ${isFullscreen ? 'w-[300px]' : 'w-[220px]'} bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-[1000] overflow-y-auto max-h-[70vh]`}
      style={{ 
        bottom: `${legendPosition.bottom}px`,
        left: `${legendPosition.left}px`
      }}
    >
<div 
  className="absolute -top-0 left-1/2 transform -translate-x-1/2 flex justify-center items-center cursor-grab z-10"
  onMouseDown={handleLegendDragStart}
>
  <div className="w-10 h-4 flex flex-col justify-center items-center gap-[4px]">
    <div className="flex space-x-[3px]">
      <span className="block w-[1.5px] h-[1.6px] bg-gray-300 rounded-full"></span>
      <span className="block w-[1.5px] h-[1.6px] bg-gray-300 rounded-full"></span>
      <span className="block w-[1.5px] h-[1.6px] bg-gray-300 rounded-full"></span>
    </div>
    <div className="flex space-x-[3px]">
      <span className="block w-[1.5px] h-[1.6px] bg-gray-300 rounded-full"></span>
      <span className="block w-[1.5px] h-[1.6px] bg-gray-300 rounded-full"></span>
      <span className="block w-[1.5px] h-[1.6px] bg-gray-300 rounded-full"></span>
    </div>
  </div>
</div>
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold text-[#2C3E50] flex items-center">
          <Layers className="mr-2 text-[#008080]" size={18} /> Legend
        </h3>
        <button
          onClick={() => setShowLegend(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>
      
      
      <div className="space-y-4">

        {layerOrder.map((layerId, index) => {
          const section = layerConfig[layerId];
          if (!section) return null;
          
          return (
            <div 
              key={layerId} 
              className={`border-t border-gray-200 pt-3 first:border-none first:pt-0 ${draggingIndex === index ? 'opacity-50' : ''}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="flex justify-between items-center cursor-move">
                <label className="flex items-center space-x-2 text-sm font-medium text-[#2C3E50]">
                  <input
                    type="checkbox"
                    checked={activeLayers[layerId]}
                    onChange={() => toggleLayer(layerId)}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer"
                  />
                  <span className="drag-handle mr-2 text-gray-400">⋮⋮</span>

{editingLayerId === layerId ? (
  <input
    type="text"
    value={customLayerNames[layerId] || section.name}
    onChange={(e) =>
      setCustomLayerNames((prev) => ({
        ...prev,
        [layerId]: e.target.value,
      }))
    }
    onBlur={() => setEditingLayerId(null)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') setEditingLayerId(null);
    }}
    autoFocus
    className="text-sm font-medium text-[#2C3E50] bg-transparent border-b border-gray-300 focus:outline-none focus:border-[#008080] w-full"
  />
) : (
  <span className="text-sm font-medium text-[#2C3E50] cursor-text break-words">
  {customLayerNames[layerId] || section.name}
</span>
)}

                </label>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSection(layerId);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {expandedSections[layerId] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>


              {expandedSections[layerId] && (
                  <>
                <div className="mt-2 pl-6 text-xs space-y-2">
                  {section.legend.map((item, idx) =>
  item.gradient ? (
    <div key={idx}>
      <div
        className="h-2 rounded"
        style={{
          background: `linear-gradient(to right, ${item.gradient.join(', ')})`
        }}
      />
      <div className="flex justify-between text-[10px] mt-1 text-gray-500">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  ) : item.markers ? (
    <div key={idx} className="flex space-x-3">
      {item.markers.map((m, i) => (
        <div key={i} className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: m.color }}
          ></div>
          <span>{m.label}</span>
        </div>
      ))}
    </div>
  ) : item.dashed ? (
    <div key={idx} className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        <div
          className="w-2 h-2 rounded-full border-2"
          style={{ 
            borderColor: item.color,
            borderStyle: 'dashed',
            backgroundColor: 'transparent'
          }}
        ></div>
        <span className="text-xs">{item.label}</span>
      </div>
      <input
        type="color"
        value={item.color}
        onChange={(e) => {
          const newColor = e.target.value;
          setLayerColors((prev) => ({
            ...prev,
            [getLayerKeyFromLegend(layerId, item.label)]: newColor
          }));
        }}
        className="w-6 h-4 border rounded cursor-pointer"
      />
    </div>
  ) : item.lineWeight ? (
    <div key={idx} className="flex items-center space-x-2">
      <div className="flex items-center space-x-2">
        <div
          className={`rounded ${
            item.lineWeight === 'Heavy' ? 'w-4 h-1' :
            item.lineWeight === 'Medium' ? 'w-4 h-0.5' : 'w-4 h-px'
          }`}
          style={{ backgroundColor: item.color }}
        ></div>
        <span className="text-xs">{item.label}</span>
      </div>
      <input
        type="color"
        value={item.color}
        onChange={(e) => {
          const newColor = e.target.value;
          setLayerColors((prev) => ({
            ...prev,
            [getLayerKeyFromLegend(layerId, item.label)]: newColor
          }));
        }}
        className="w-6 h-4 border rounded cursor-pointer"
      />
    </div>
  ) : item.size ? (
    <div key={idx} className="flex items-center space-x-2">
      <div className="flex items-center space-x-2">
        <div
          className={`transform rotate-45 ${
            item.size === 'Large' ? 'w-3 h-3' :
            item.size === 'Medium' ? 'w-2.5 h-2.5' : 'w-2 h-2'
          }`}
          style={{ backgroundColor: item.color }}
        ></div>
        <span className="text-xs">{item.label}</span>
      </div>
      <input
        type="color"
        value={item.color}
        onChange={(e) => {
          const newColor = e.target.value;
          setLayerColors((prev) => ({
            ...prev,
            [getLayerKeyFromLegend(layerId, item.label)]: newColor
          }));
        }}
        className="w-6 h-4 border rounded cursor-pointer"
      />
    </div>
  ) : (
  <div key={idx} className="flex items-center space-x-2">
    <input
      type="color"
      value={item.color}
      onChange={(e) => {
        const newColor = e.target.value;
        setLayerColors((prev) => ({
          ...prev,
          [getLayerKeyFromLegend(layerId, item.label)]: newColor
        }));
      }}
      className="w-6 h-4 border rounded cursor-pointer"
    />
    <div className="flex flex-col">
      <span>{item.label}</span>
      {item.note && <span className="text-xs text-gray-500 italic">{item.note}</span>}
    </div>
  </div>
)
)}
            {section.sources && section.sources.length > 0 && (
  <div className="mt-2 text-[11px] text-gray-500 w-full px-2">
    {section.sources.length === 1 ? (
      <a 
        href={section.sources[0].url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-[#008080] underline hover:text-[#006666]"
      >
        {section.sources[0].title}
      </a>
    ) : (
      <div className="relative">
        <button
          onClick={() => setShowSourcesPopup(showSourcesPopup === layerId ? null : layerId)}
          className="text-[#008080] underline hover:text-[#006666] cursor-pointer"
        >
          Sources ({section.sources.length})
        </button>
        
        {showSourcesPopup === layerId && (
          <div className="absolute left-0 top-5 bg-white border border-gray-300 rounded shadow-lg p-2 z-50 min-w-48">
            {section.sources.map((source, idx) => (
              <div key={idx} className="mb-1 last:mb-0">
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#008080] underline hover:text-[#006666] text-xs block"
                >
                  {source.title}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
)}
                </div>
                </>
              )}
              
            </div>
          );
        })}
{drawnLayersOrder && drawnLayersOrder.length > 0 && (

<div className="border-t border-gray-200 pt-3 first:border-none first:pt-0 mb-4">
  <div className="flex justify-between items-center">
    <label className="flex items-center space-x-2 text-sm font-medium text-[#2C3E50]">
      <span>Drawn Shapes</span>
    </label>
    <button 
      onClick={() => toggleSection('drawnShapes')}
      className="text-gray-500 hover:text-gray-700"
    >
      {expandedSections['drawnShapes'] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
  </div>

  {expandedSections['drawnShapes'] && (
  <div className="mt-2 pl-6 text-xs space-y-2">
    {drawnLayersOrder && drawnLayersOrder.length > 0 ? (
      drawnLayersOrder.map(layerId => {
        const layer = drawnLayers[layerId];
        if (!layer) return null;
        
        return (
          <div key={layerId} className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={layer.visible}
                onChange={() => toggleDrawnLayer(layerId)}
                className="mr-2 h-3 w-3"
              />
              <span className="text-xs text-gray-600">{layer.name}</span>
            </div>
            <input
              type="color"
              value={layer.color || '#008080'}
              onChange={(e) => updateDrawnLayerColor(layerId, e.target.value)}
              className="w-6 h-4 border rounded cursor-pointer"
            />
          </div>
        );
      })
    ) : (
      <div className="text-xs text-gray-500 italic">No shapes drawn yet</div>
    )}
  </div>
)}
</div>
)}
           {/* Base Map Section */}
<div className="border-t border-gray-200 pt-3 first:border-none first:pt-0 mb-4">
  <div className="flex justify-between items-center">
    <label className="flex items-center space-x-2 text-sm font-medium text-[#2C3E50]">
      <input
        type="checkbox"
        checked={baseMapVisible}
        onChange={() => {
          const newState = !baseMapVisible;
          setBaseMapVisible(newState);
          toggleBaseMap(newState);
        }}
        className="cursor-pointer"
      />
      <span>Base Map</span>
    </label>
    <button 
      onClick={() => toggleSection('baseMap')}
      className="text-gray-500 hover:text-gray-700"
    >
      {expandedSections['baseMap'] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
  </div>

  {expandedSections['baseMap'] && (
    <div className="mt-2 pl-6 text-xs space-y-2">
      <div className="grid grid-cols-2 gap-2 mt-2">
        {mapStyles.map(style => (
          <button
            key={style.id}
            onClick={() => handleMapViewChange(style.id)}
            className={`px-2 py-1 text-xs rounded ${
              currentMapView === style.id 
                ? 'bg-[#008080] text-white font-medium' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {style.name}
          </button>
        ))}
      </div>
    </div>
  )}
</div>
      </div>
      
      <style jsx>{`
        .drag-handle {
          cursor: grab;
        }
        [draggable=true] {
          cursor: grab;
        }
        [draggable=true]:active {
          cursor: grabbing;
        }
      `}</style>
    </div>
  );
};

export default DraggableLegend;