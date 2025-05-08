import React, { useEffect, useState, useRef } from 'react';
import { Layers, X, ChevronDown, ChevronUp } from 'lucide-react';

// This is the updated Legend component that allows reordering
const DraggableLegend = ({ 
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
setTopInteractiveLayer,
currentMapView,
  handleMapViewChange,
  toggleBaseMap,
  drawnLayers,
  setDrawnLayers,
  drawnLayersOrder,
  toggleDrawnLayer,
  updateDrawnLayerColor
}) => {
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [layerOrder, setLayerOrder] = useState([]);
  const dragOverItemIndex = useRef(null);
  const [baseMapVisible, setBaseMapVisible] = useState(true);


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
  

  // Initialize the layer order based on z-index when the component mounts
  useEffect(() => {
    if (!layerZIndexes) return;
    
    // Convert the z-index object to an array of items sorted by z-index value (highest first)
    const sortedLayers = Object.entries(layerZIndexes)
      .sort(([, aZIndex], [, bZIndex]) => bZIndex - aZIndex)
      .map(([id]) => id);
    
    setLayerOrder(sortedLayers);
  }, [layerZIndexes]);
  
  // The layer config with visual properties
  const layerConfig = {
    coffeeShops: {
        name: customLayerNames['coffeeShops'] || 'Coffee Shops',
        icon: <div className="w-4 h-4 rounded-full" style={{ backgroundColor: layerColors.existingShop }} />,
      legend: [
        { label: 'Existing Shops', color: layerColors.existingShop },
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
      ]
    },
    radius: {
        name: customLayerNames['radius'] || '1-Mile Radius',
        icon: <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-dashed" style={{ backgroundColor: 'transparent' }} />,
      legend: [
        { label: 'Times Square Radius', color: '#4169E1', dashed: true }
      ]
    }
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
            setTopInteractiveLayer(newLayerOrder[0]);
            console.log("Setting top interactive layer to:", newLayerOrder[0]);
        } else {
            // If top layer is not active, find the first active layer
            const firstActiveLayer = newLayerOrder.find(layerId => activeLayers[layerId]);
            if (firstActiveLayer) {
                setTopInteractiveLayer(firstActiveLayer);
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

    return '';
  };
  
  if (!showLegend) return null;
  
  return (
    <div className="absolute bottom-4 left-4 w-[300px] bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-[1000] overflow-y-auto max-h-[70vh]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold text-[#2C3E50] flex items-center">
          <Layers className="mr-2 text-[#008080]" size={18} /> Layers & Legend
        </h3>
        <button
          onClick={() => setShowLegend(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mb-2">Drag layers to change their display order</p>
      
      <div className="space-y-4">
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
  <span
    onDoubleClick={() => setEditingLayerId(layerId)}
    className="text-sm font-medium text-[#2C3E50] cursor-text"
  >
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
                        <span>{item.label}</span>
                      </div>
                    )
                  )}
                </div>
              )}
              
            </div>
          );
        })}
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