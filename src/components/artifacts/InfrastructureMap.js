import React, { useEffect, useState, useRef } from 'react';
import { Layers, Maximize2, X, Info } from 'lucide-react';
import _ from 'lodash';

const InfrastructureMap = ({ onLayersReady }) => {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const infoRef = useRef(null);

  
  // Enhanced loading states
  const [loadingStage, setLoadingStage] = useState('initializing'); // 'initializing', 'map', 'neighborhoods', 'buildings', 'streets', 'complete'
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showSources, setShowSources] = useState(false);
  
  const [activeLayers, setActiveLayers] = useState({
    buildings: true,
    streets: true,
    neighborhoods: true,
  });

  const [heatmapIntensity] = useState(0.7);
  const [heatmapRadius] = useState(25);

  const COLORS = {
    red: '#E74C3C',
    yellow: '#F1C40F',
    green: '#2ECC71',
    blue: '#3498DB',
    lightblue: '#85C1E9',
    orange: '#E67E22',
    primary: '#2C3E50',
    coral: '#008080',
    white: '#FFFFFF'
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    if (map) {
      setTimeout(() => map.invalidateSize(), 300);
    }
  };

  const toggleLayer = (layerName) => {
    setActiveLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  const updateHeatmapSettings = () => {
    if (!map || !map.buildingHeatmap || !map.streetHeatmap) return;
    map.buildingHeatmap.setOptions({ radius: heatmapRadius, max: heatmapIntensity });
    map.streetHeatmap.setOptions({ radius: heatmapRadius * 0.7, max: heatmapIntensity });
  };

  useEffect(() => {
    if (map) {
      // Give it a moment to paint/render first
      const timeout = setTimeout(() => {
        map.invalidateSize();
      }, 500); // slight delay helps ensure the container has non-zero size
  
      return () => clearTimeout(timeout);
    }
  }, [map]);
  useEffect(() => {
      const handleClickOutside = (event) => {
        if (infoRef.current && !infoRef.current.contains(event.target)) {
          setShowSources(false);
        }
      };
    
      if (showSources) {
        document.addEventListener('mousedown', handleClickOutside);
      }
    
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showSources]);
  
  useEffect(() => {
    const initializeMap = async () => {
      setLoadingStage('initializing');
      setLoadingProgress(10);
      
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      if (map || !mapContainerRef.current) return;

      // Load heatmap plugin
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js';
      document.head.appendChild(script);
      await new Promise(resolve => script.onload = resolve);
      
      setLoadingProgress(20);
      setLoadingStage('map');

      // Initialize base map
      const leafletMap = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 11,
        maxZoom: 18
      }).setView([30.267, -97.743], 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(leafletMap);

      L.control.zoom({ position: 'topright' }).addTo(leafletMap);
      L.control.attribution({ position: 'bottomright' }).addTo(leafletMap);

      const austinLabel = L.divIcon({
        className: 'austin-label',
        iconSize: [80, 30],
        iconAnchor: [40, 15]
      });

      L.marker([30.267, -97.743], { icon: austinLabel }).addTo(leafletMap);
      
      // Store map reference early so user can see the base map
      setMap(leafletMap);
      
      // Wait for base map to be visible
      await new Promise(r => setTimeout(r, 1000));
      setLoadingProgress(30);
      
      // 1. First show the map with no layers
      setMap(leafletMap);
      await new Promise(r => setTimeout(r, 1500)); // Give time for users to see the empty base map
      
      // 2. Load neighborhood data (but don't add to map yet)
      setLoadingStage('neighborhoods');
      
      const fetchNeighborhoods = async () => {
        const res = await fetch('/data/neighborhood-data.json');
        const neighborhoods = await res.json();
        const layer = L.layerGroup();
      
        neighborhoods.forEach(n => {
          try {
            const coords = n.the_geom.coordinates[0][0].map(c => [c[1], c[0]]);
            const polygon = L.polygon(coords, {
              color: COLORS.primary,
              weight: 2,
              opacity: 0,  // Start invisible
              fillOpacity: 0
            }).bindPopup(`<strong>${n.neighname}</strong><br>Area: ${parseFloat(n.sqmiles).toFixed(2)} sq miles`);
            layer.addLayer(polygon);
          } catch {}
        });
      
        return layer;
      };
      
      const neighborhoodLayer = await fetchNeighborhoods();
      neighborhoodLayer.addTo(leafletMap);
      leafletMap.neighborhoodLayer = neighborhoodLayer;
      
      // Animate neighborhoods fading in
      let opacity = 0;
      const fadeInNeighborhoods = () => {
        opacity += 0.05;
        if (opacity <= 0.7) {
          neighborhoodLayer.eachLayer(layer => {
            if (layer.setStyle) {
              layer.setStyle({ opacity: opacity });
            }
          });
          setTimeout(fadeInNeighborhoods, 50);
        }
      };
      
      fadeInNeighborhoods();
      setLoadingProgress(50);
      await new Promise(r => setTimeout(r, 2000));
      
      // 3. Fetch buildings but add them incrementally
      setLoadingStage('buildings');
      
      const fetchBuildingData = async () => {
        const res = await fetch('/data/building-data.json');
        return await res.json();
      };
      
      const buildingData = await fetchBuildingData();
      const buildingMarkerLayer = L.layerGroup().addTo(leafletMap);
      leafletMap.buildingMarkerLayer = buildingMarkerLayer;
      
      // Add building markers in batches to create visual loading effect
      const batchSize = Math.ceil(buildingData.length / 10); // 10 batches
      const buildingHeatData = [];
      
      for (let i = 0; i < buildingData.length; i += batchSize) {
        const batch = buildingData.slice(i, i + batchSize);
        
        batch.forEach(b => {
          try {
            const coords = b.the_geom.coordinates[0][0];
            const lat = _.meanBy(coords, c => c[1]);
            const lng = _.meanBy(coords, c => c[0]);
            const intensity = 1 - b.condition;
            buildingHeatData.push([lat, lng, intensity]);
      
            const marker = L.marker([lat, lng], {
              icon: L.divIcon({
                html: `<div style="width:5px;height:5px;border-radius:50%;background:#008080;opacity:0.3;"></div>`,
                className: ''
              })
            }).bindPopup(`
              <strong>Building ID: ${b.objectid}</strong><br>
              Condition: ${(b.condition * 100).toFixed(1)}%<br>
              Height: ${b.max_height} ft<br>
              Built: ${b.source}
            `);
            buildingMarkerLayer.addLayer(marker);
          } catch {}
        });
        
        // Update loading progress
        setLoadingProgress(50 + (i / buildingData.length) * 15);
        
        // Wait a bit before adding next batch to create visual effect
        await new Promise(r => setTimeout(r, 100));
      }
      
      // Now add the heatmap for buildings
      const buildingHeatmap = window.L.heatLayer(buildingHeatData, {
        radius: heatmapRadius,
        max: heatmapIntensity,
        blur: 15,
        gradient: {
          0.1: COLORS.green,
          0.5: COLORS.yellow,
          0.9: COLORS.red
        }
      }).addTo(leafletMap);
      
      leafletMap.buildingHeatmap = buildingHeatmap;
      
      setLoadingProgress(65);
      await new Promise(r => setTimeout(r, 1500));
      
      // 4. Now add streets incrementally
      setLoadingStage('streets');
      
      const fetchStreetData = async () => {
        const res = await fetch('/data/street-data.json');
        return await res.json();
      };
      
      const streetData = await fetchStreetData();
      const streetMarkerLayer = L.layerGroup().addTo(leafletMap);
      leafletMap.streetMarkerLayer = streetMarkerLayer;
      
      const streetHeatData = [];
      
      // Process streets in batches for visual effect
      const streetBatchSize = Math.ceil(streetData.length / 10); // 10 batches
      
      for (let i = 0; i < streetData.length; i += streetBatchSize) {
        const batch = streetData.slice(i, i + streetBatchSize);
        
        batch.forEach(s => {
          try {
            if (s.the_geom.coordinates[0]) {
              s.the_geom.coordinates[0].forEach(coord => {
                const [lng, lat] = coord;
                const intensity = s.street_condition === '1' ? 0.3 : 0.9;
                streetHeatData.push([lat, lng, intensity]);
          
                const marker = L.marker([lat, lng], {
                  icon: L.divIcon({
                    html: `<div style="width:5px;height:5px;border-radius:50%;background:#008080;opacity:0.3;"></div>`,
                    className: ''
                  })
                }).bindPopup(`
                  <strong>${s.full_street_name_from_gis}</strong><br>
                  Grade: ${s.final_grade}<br>
                  Condition: ${s.street_condition === '1' ? 'Good' : 'Poor'}<br>
                  Type: ${s.functional_class}<br>
                  Pavement: ${s.pavement_type}
                `);
                streetMarkerLayer.addLayer(marker);
              });
            }
          } catch {}
        });
        
        // Update loading progress
        setLoadingProgress(65 + (i / streetData.length) * 35);
        
        // Wait a bit before adding next batch
        await new Promise(r => setTimeout(r, 100));
      }
      
      // Now add the street heatmap
      const streetHeatmap = window.L.heatLayer(streetHeatData, {
        radius: heatmapRadius * 0.7,
        max: heatmapIntensity,
        blur: 10,
        gradient: {
          0.1: COLORS.blue,
          0.5: COLORS.lightblue,
          0.9: COLORS.orange
        }
      }).addTo(leafletMap);
      
      leafletMap.streetHeatmap = streetHeatmap;
      
      setLoadingProgress(100);
    setLoadingStage('complete');
    if (onLayersReady) {
      onLayersReady();
    }
    
    if (window.setResponseReady) {
      window.setResponseReady(true);
    }
  };

    initializeMap();

    return () => map?.remove();
  }, []);

  useEffect(() => {
    if (!map) return;
    if (map.neighborhoodLayer) {
      if (activeLayers.neighborhoods) {
        map.addLayer(map.neighborhoodLayer);
      } else {
        map.removeLayer(map.neighborhoodLayer);
      }
    }
    if (map.buildingHeatmap && map.buildingMarkerLayer) {
      if (activeLayers.buildings) {
        map.addLayer(map.buildingHeatmap);
        map.addLayer(map.buildingMarkerLayer);
      } else {
        map.removeLayer(map.buildingHeatmap);
        map.removeLayer(map.buildingMarkerLayer);
      }
    }
    
    if (map.streetHeatmap && map.streetMarkerLayer) {
      if (activeLayers.streets) {
        map.addLayer(map.streetHeatmap);
        map.addLayer(map.streetMarkerLayer);
      } else {
        map.removeLayer(map.streetHeatmap);
        map.removeLayer(map.streetMarkerLayer);
      }
    }
  }, [map, activeLayers]);

  useEffect(() => {
    updateHeatmapSettings();
  }, [heatmapRadius, heatmapIntensity, map]);

  // Get loading status message
  const getLoadingMessage = () => {
    switch(loadingStage) {
      case 'initializing': return 'Initializing map...';
      case 'map': return 'Loading base map...';
      case 'neighborhoods': return 'Loading neighborhood boundaries...';
      case 'buildings': return 'Loading building data...';
      case 'streets': return 'Loading street network...';
      case 'complete': return 'Map ready';
      default: return 'Loading...';
    }
  };

  return (
    <div className={`flex flex-col h-full ${isFullScreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <div className="flex justify-between items-center p-3 border-b bg-white shadow-sm">
        <h2 className="text-lg font-semibold" style={{ color: COLORS.primary }}>
          Austin Infrastructure Resilience Map
        </h2>
        <div className="flex items-center space-x-1">
          <button onClick={() => setShowLegend(prev => !prev)} title="Layers & Legend"
            style={{ 
              color: COLORS.coral,
              backgroundColor: 'white',
              border: 'none',
              transition: 'all 0.2s ease-in-out',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.coral;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = COLORS.coral;
            }}>
            <Layers size={20} />
          </button>

          <button onClick={() => setShowSources(prev => !prev)} title="View Sources" style={{ 
            color: COLORS.coral,
            backgroundColor: 'white',
            border: 'none',
            transition: 'all 0.2s ease-in-out',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.coral;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = COLORS.coral;
          }}>
            <Info size={20} />
          </button>

          <button onClick={toggleFullScreen} title="Fullscreen" style={{ 
            color: COLORS.coral,
            backgroundColor: 'white',
            border: 'none',
            transition: 'all 0.2s ease-in-out',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.coral;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = COLORS.coral;
          }}>
            {isFullScreen ? <X size={20}/> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        {showSources && (
          <div ref = {infoRef}className="absolute top-4 right-4 w-[280px] bg-white border border-gray-200 rounded-xl shadow-lg p-5 z-50 animate-fade-in">
            <div className="space-y-2 text-sm text-gray-700">
              <div>
                <a
                  href="https://data.austintexas.gov/City-Infrastructure/Strategic-Measure_Infrastructure-Condition_Network/5sh6-vxv8/about_data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Infrastructure Stats
                </a>
              </div>
              <div>
                <a
                  href="https://data.austintexas.gov/City-Infrastructure/Strategic-Measure_Street-Segment-Condition-Data/pcwe-pwxe/about_data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Street Condition
                </a>
              </div>
              <div>
                <a>
                  Building Condition (contains building footprints, maintenance details, conditions, and year built)
                </a>
              </div>
              <div>
                <a
                  href="https://data.austintexas.gov/Locations-and-Maps/Neighborhoods/a7ap-j2yt/about_data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Neighborhoods
                </a>
              </div>
            </div>
          </div>
        )}

        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />
        
        {/* Enhanced loading indicator that shows the current stage, but allows map to be visible behind */}
        {loadingStage !== 'complete' && (
          <div className="absolute bottom-12 right-4 flex flex-col items-center bg-white bg-opacity-90 z-10 p-4 rounded-lg shadow-lg max-w-xs border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 border-3 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-gray-800">{getLoadingMessage()}</p>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            
            {/* Layer indicators */}
            <div className="grid grid-cols-4 gap-1 mt-2 w-full">
              <div className={`text-center p-1 rounded text-xs ${loadingStage === 'map' || loadingStage === 'neighborhoods' || loadingStage === 'buildings' || loadingStage === 'streets' || loadingStage === 'complete' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                Base Map
              </div>
              <div className={`text-center p-1 rounded text-xs ${loadingStage === 'neighborhoods' || loadingStage === 'buildings' || loadingStage === 'streets' || loadingStage === 'complete' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                Neighborhoods
              </div>
              <div className={`text-center p-1 rounded text-xs ${loadingStage === 'buildings' || loadingStage === 'streets' || loadingStage === 'complete' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                Buildings
              </div>
              <div className={`text-center p-1 rounded text-xs ${loadingStage === 'streets' || loadingStage === 'complete' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                Streets
              </div>
            </div>
          </div>
        )}
{showLegend && (
  <div className="absolute bottom-4 left-4 w-15 bg-white border rounded shadow-md p-3 text-sm resize"
    style={{ zIndex: 1000, overflow: 'auto', maxHeight: '70vh' }}
  >
    <div className="mb-4">
      <h3 className="font-semibold mb-2 text-primary">Legend</h3>
      {[
        {id: 'neighborhoods', label: 'Neighborhoods'},
        {id: 'buildings', label: 'Building Conditions'},
        {id: 'streets', label: 'Street Conditions'}
      ].map(item => (
        <label key={item.id} className="flex items-center space-x-2 mb-2">
          <input type="checkbox" checked={activeLayers[item.id]} onChange={() => toggleLayer(item.id)} />
          <span>{item.label}</span>
        </label>
      ))}
    </div>

    <div>
      {activeLayers.buildings && (
        <div className="mb-3">
          <strong className="text-sm">Building Condition</strong>
          <div className="mb-2">
            <div style={{ height: '10px', background: 'linear-gradient(to right, #2ECC71, #F1C40F, #E74C3C)' }} />
            <div className="flex justify-between text-xs"><span>Good</span><span>Poor</span></div>
          </div>
        </div>
      )}
      {activeLayers.streets && (
        <div className="mb-3">
          <strong className="text-sm">Street Condition</strong>
          <div className="mb-2">
            <div style={{ height: '10px', background: 'linear-gradient(to right, #3498DB, #85C1E9, #E67E22)' }} />
            <div className="flex justify-between text-xs"><span>Good</span><span>Poor</span></div>
          </div>
        </div>
      )}
      {activeLayers.neighborhoods && (
        <div className="mb-3">
          <strong className="text-sm">Neighborhood Boundary</strong>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-4 h-2 rounded-sm" style={{ backgroundColor: COLORS.primary }} />
            <span className="text-xs">Boundary Lines</span>
          </div>
        </div>
      )}
    </div>
  </div>
)}
      </div>

      <div className="p-2 bg-white border-t text-xs text-gray-500">
        <p><strong>Source:</strong> Austin Infrastructure Resilience Data (March 2025)</p>
      </div>
    </div>
  );
};

export default InfrastructureMap;