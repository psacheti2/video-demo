import React, { useEffect, useState, useRef, useMemo } from 'react';
import {X, ArrowLeft, MousePointerSquareDashed, TextCursorInput, Check
} from 'lucide-react';
import { TbMapSearch } from "react-icons/tb";
import html2canvas from 'html2canvas';
import { useNotificationStore } from '@/store/NotificationsStore';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import L from 'leaflet';
import 'leaflet-control-geocoder';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.js';
import MapDownloader from '../MapDownloader'
import TextToolbar from '../TextToolbar'
import _ from 'lodash';
import ShareDialog from '../ShareDialog'
import {
    createPolygonDrawTool,
    createFreehandTool,
    createSelectTool,
    setupClickToEdit,
    createTextTool
} from '../drawTools';
import { IconMapPinSearch } from '@tabler/icons-react';
import { MdDraw } from "react-icons/md";
import VirtualizedTable from './VirtualizedTable';
import ToolbarComponent from '../ToolbarComponent';
import DraggableLegend from './DraggableLegend';

const InfrastructureAnalysisMapComponent = ({ 
  onLayersReady, 
  onSaveMap, 
  savedMaps = [], 
  setSavedArtifacts, 
  title,
  onBack, 
  isPreview = false, 
  center = [40.4500, -3.7038], 
  onSendMessage, 
  originConversationId, 
  artifactsPanelWidth 
}) => {
   const [layerZIndexes, setLayerZIndexes] = useState({
  powerlines: 10,
  substations: 20,
  bufferZones: 25,
  uploadedLocations: 30
});
const [showTextToolbar, setShowTextToolbar] = useState(false);
    const [activeTextMarker, setActiveTextMarker] = useState(null);
    const [textToolbarPosition, setTextToolbarPosition] = useState({ top: 50, left: 50 });
    const [textFormat, setTextFormat] = useState({
      fontFamily: 'Arial, sans-serif',
      fontSize: 18,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'center',
      color: '#000000'
    });
    const bufferCirclesRef = useRef([]);
    const mapContainerRef = useRef(null);
    const [map, setMap] = useState(null);
    const infoRef = useRef(null);
    const [currentMapView, setCurrentMapView] = useState('light');
    const [baseMapLayer, setBaseMapLayer] = useState(null);
    // Table states
    const [showTable, setShowTable] = useState(false);
    const [tableHeight, setTableHeight] = useState(300);
    const [currentTableIndex, setCurrentTableIndex] = useState(0);
    const [tableData, setTableData] = useState([]);
const [tableTitles, setTableTitles] = useState(['Uploaded Locations', 'Substations', 'Power Lines']);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [showEmailNotification, setShowEmailNotification] = useState(false);
    const addNotification = useNotificationStore((state) => state.addNotification);
    const [downloadSelections, setDownloadSelections] = useState({});
    const [notificationMessage, setNotificationMessage] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [customSaveName, setCustomSaveName] = useState('');
    const [toolbarVisible, setToolbarVisible] = useState(true);
    const [toolbarPosition, setToolbarPosition] = useState(null);
    const [showGeocoder, setShowGeocoder] = useState(false);
    const geocoderRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [slideOut, setSlideOut] = useState(false);
    const [showDrawTools, setShowDrawTools] = useState(false);
    const editControlRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [activeDrawTool, setActiveDrawTool] = useState(null);
    const snapLayersRef = useRef([]);
    const pencilRef = useRef(null);
    const [isLoadingLayers, setIsLoadingLayers] = useState(false);
const [loadingProgress, setLoadingProgress] = useState(0);
const [currentLoadingLayer, setCurrentLoadingLayer] = useState('');
const [totalLayers] = useState(3);
const LoadingBar = () => {
  if (!isLoadingLayers) return null;

  const stages = [
    { key: 'Uploaded Locations', label: 'Locations' },
    { key: 'Substations', label: 'Substations' },
    { key: 'Power Lines', label: 'Power Lines' },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-72">
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
        <div className="text-sm font-semibold text-gray-800 mb-2">
          Loading Layers
        </div>

        <div className="flex flex-col space-y-2">
          {stages.map((stage, index) => {
            const isComplete = loadingProgress > index;
            return (
              <div key={stage.key} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{stage.label}</span>
                <Check
                  size={16}
                  className={`transition-colors duration-500`}
                  color={isComplete ? '#008080' : '#FFFFFF'}
                />
              </div>
            );
          })}
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
          <div
            className="h-full bg-[#008080] rounded-full transition-all duration-500"
            style={{ width: `${(loadingProgress / totalLayers) * 100}%` }}
          />
        </div>

        <div className="text-xs text-gray-500 mt-1 text-right">
          {loadingProgress}/{totalLayers} layers loaded
        </div>
      </div>
    </div>
  );
};

    const [drawDialogPos, setDrawDialogPos] = useState({ top: 0, left: 0 });
    const [selectedRowIndices, setSelectedRowIndices] = useState([]);
    const [selectedColIndex, setSelectedColIndex] = useState(null);
    const [showMapDownloader, setShowMapDownloader] = useState(false);
    const [scrollToRowIndex, setScrollToRowIndex] = useState(null);
    const [contextMenu, setContextMenu] = useState({
        visible: false, x: 0, y: 0, type: null, index: null,
        columnName: null,
    });

    const [customLayerNames, setCustomLayerNames] = useState(() => {
        const stored = localStorage.getItem('customLayerNames');
        return stored ? JSON.parse(stored) : {};
    });

    useEffect(() => {
        localStorage.setItem('customLayerNames', JSON.stringify(customLayerNames));
    }, [customLayerNames]);

    
    const [originalRowsMap, setOriginalRowsMap] = useState({});
    
    const [originalData, setOriginalData] = useState({});


    // Drag handle reference
    const dragHandleRef = useRef(null);
    // Enhanced loading states
    const [isFullscreen, setIsFullscreen] = useState(false);
    const initialActiveLayerCount = Object.values({
    uploadedLocations: true,
    substations: true,
    powerlines: true,
    bufferZones: false
}).filter(isActive => isActive).length;

    // Set showLegend to true if more than 4 layers are active
    const [showLegend, setShowLegend] = useState(initialActiveLayerCount > 4);
    const [showSources, setShowSources] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        drawnShapes: true 
      });    
    const [isModified, setIsModified] = useState(false);

    const [showSymbologyEditor, setShowSymbologyEditor] = useState(false);


    const [activeLayers, setActiveLayers] = useState({
  uploadedLocations: true,
  substations: true,
  powerlines: true,
  bufferZones: true
});

    const fallbackMapStyles = {
        light: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
        dark: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
        satellite: 'https://{s}.aerial.maps.ls.hereapi.com/maptile/2.1/maptile/newest/satellite.day/{z}/{x}/{y}/256/png8?apiKey=',
        streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        outdoors: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        hybrid: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
    };

    // Add an error handler for tile loading errors
    const setupTileErrorHandler = (layer) => {
        layer.on('tileerror', function (error) {
            console.log('Tile error occurred:', error);

            // If we have a fallback URL for this style, try to use it
            if (fallbackMapStyles[currentMapView]) {
                console.log('Attempting to use fallback tile source:', fallbackMapStyles[currentMapView]);

                // Remove the failed layer
                map.removeLayer(layer);

                // Create and add the fallback layer
                const fallbackLayer = L.tileLayer(fallbackMapStyles[currentMapView], {
                    attribution: attributions[currentMapView],
                    subdomains: 'abcd',
                    maxZoom: 19
                });

                fallbackLayer.addTo(map);
                setBaseMapLayer(fallbackLayer);

                // Only try the fallback once
                layer.off('tileerror');
            }
        });

        return layer;
    };

    const handleMapViewChange = (viewType) => {
        if (!map) return;
      
        mapContainerRef.current.style.backgroundColor = '#FFFFFF';
        mapContainerRef.current.style.background = '#FFFFFF';
        // First, remove the existing base layer if it exists
        if (baseMapLayer && baseMapLayer.main) {
            map.removeLayer(baseMapLayer.main);
            if (baseMapLayer.labels) {
                map.removeLayer(baseMapLayer.labels);
            }
        } else if (baseMapLayer) {
            map.removeLayer(baseMapLayer);
        }



        // Define tile URLs for different map styles
        const mapStyles = {
            light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', // Re-add dark map style
            cadastral: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', // ESRI street map with property lines
            satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            streets: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', // Using Carto's Voyager style for better reliability
            outdoors: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', // ESRI World Topo Map - high quality, modern terrain styling
            hybrid: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}' // USGS Imagery with Topo
        };

        // Define attribution for different map styles
        const attributions = {
            light: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            dark: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>', // Re-add dark map attribution
            cadastral: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
            satellite: '&copy; <a href="https://www.esri.com/">Esri</a>',
            streets: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            outdoors: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
            hybrid: 'Tiles &copy; USGS National Map'
        };

        // Create and add the new base layer
        const newBaseLayer = L.tileLayer(mapStyles[viewType], {
            attribution: attributions[viewType],
            subdomains: 'abcd',
            maxZoom: 19
        });
        
        newBaseLayer.addTo(map);
        setBaseMapLayer(newBaseLayer);

        // Update the current map view state
        setCurrentMapView(viewType);

        // Force a refresh of the map
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 100);
    };

    const [drawnLayers, setDrawnLayers] = useState({});
const [drawnLayersOrder, setDrawnLayersOrder] = useState([]);
const drawnLayersRef = useRef([]);

const [nextShapeIds, setNextShapeIds] = useState({
  polygon: 1,
  circle: 1,
  polyline: 1,
  marker: 1,
  triangle: 1,
  text: 1
});

    const COLORS = {
            existingDataCenter: '#4169E1',
        // UI Colors
        primary: '#2C3E50',
        coral: '#008080',
        white: '#FFFFFF'
    };

    const dragState = useRef({
        isDragging: false,
        startY: 0,
        startHeight: 0,
        containerHeight: 0,
        rafId: null,
        lastY: 0
    });

   const [layerColors, setLayerColors] = useState({
  uploadedLocations: '#008080',
  substations: '#4ECDC4',
  powerlines400kv: '#577A9E',
  powerlines220kv: '#89A3BE',
  powerlinesOther: '#BDCCDB',
  bufferZones: '#3498DB',
});
const uploadedLocationsRef = useRef([]);
const substationsRef = useRef([]);
const powerlinesRef = useRef([]);

    const fetchUploadedLocations = async () => {
  try {
    const res = await fetch('/data/uploaded-data.geojson');
    const locationData = await res.json();
    const locationLayer = L.layerGroup();

    if (locationData.features && locationData.features.length > 0) {
      locationData.features.forEach((feature, index) => {
        if (!feature.properties) {
          feature.properties = {};
        }
        feature.properties['Feature ID'] = feature.properties['Feature ID'] || `loc-${index + 1}`;
      });

      locationData.features.forEach((feature) => {
        if (feature.geometry && feature.geometry.type === 'Point') {
          const coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
          const featureId = feature.properties['Feature ID'];

          const marker = L.marker(coords, {
  icon: L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 24px;
        height: 30px;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      ">
        <div style="
          width: 20px;
          height: 20px;
          background-color: ${layerColors.uploadedLocations};
          border: 2px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          
        </div>
      </div>
    `,
    className: '',
    iconSize: [24, 30],
    iconAnchor: [12, 30]
  }),
  interactive: true
});

          marker.featureId = featureId;

          let popupContent = `<strong>${feature.properties.Name || 'Analysis Location'}</strong>`;
popupContent += `<br>Feature ID: ${featureId}`;
if (feature.properties.Description) popupContent += `<br>Description: ${feature.properties.Description}`;
if (feature.properties.Reference) popupContent += `<br>Reference: ${feature.properties.Reference}`;

          marker.bindPopup(popupContent, { className: 'custom-popup' });

          marker.on('click', function (e) {
            console.log('Location clicked:', featureId);
            if (e) L.DomEvent.stopPropagation(e);
            selectRowByFeatureProperties(feature.properties);
          });
const circle = L.circle(coords, {
  radius: 5000, 
  fillColor: layerColors.uploadedLocations,
  color: layerColors.uploadedLocations,
  weight: 2,        
  opacity: 0.8,     
  fillOpacity: 0.2  
});

circle.featureId = featureId;
bufferCirclesRef.current.push({ circle, featureId });
locationLayer.addLayer(circle);
          uploadedLocationsRef.current.push({ marker, featureId });
          locationLayer.addLayer(marker);
        }
      });
    }

    return { locationLayer, locationData };
  } catch (error) {
    console.error("Error fetching uploaded locations:", error);
    return { locationLayer: L.layerGroup(), locationData: { features: [] } };
  }
};

const fetchSubstations = async () => {
  try {
    const res = await fetch('/data/substations-data.geojson');
    const substationData = await res.json();
    const substationLayer = L.layerGroup();

    if (substationData.features && substationData.features.length > 0) {
      substationData.features.forEach((feature, index) => {
        if (!feature.properties) {
          feature.properties = {};
        }
        feature.properties['Feature ID'] = feature.properties['Feature ID'] || `sub-${index + 1}`;
      });

      substationData.features.forEach((feature) => {
        if (feature.geometry && feature.geometry.type === 'Point') {
          const coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
          const featureId = feature.properties['Feature ID'];

          // Determine substation size based on voltage or type
let size = 16;
let color = layerColors.substations;

// Check for voltage in the substation property or infer from type
if (feature.properties.substation) {
  const substationType = feature.properties.substation;
  if (substationType === 'transmission') size = 24;
  else if (substationType === 'distribution') size = 20;
  else if (substationType === 'minor_distribution') size = 16;
} else if (feature.properties.tags) {
  // Fallback to tags if available
  if (feature.properties.tags.voltage) {
    const voltage = parseInt(feature.properties.tags.voltage);
    if (voltage >= 400000) size = 24;
    else if (voltage >= 220000) size = 20;
    else if (voltage >= 132000) size = 18;
  }
} else {
  // Infer size from other properties if available
  if (feature.properties.power === 'substation' && !feature.properties.substation) {
    size = 20; // Medium size for general substations
  }
}

          const marker = L.marker(coords, {
            icon: L.divIcon({
  html: `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      border-radius: 50%;
    ">
    </div>
  `,
              className: '',
              iconSize: [size, size],
              iconAnchor: [size/2, size/2]
            }),
            interactive: true
          });

          marker.featureId = featureId;

          let popupContent = '<strong>Substation</strong>';
popupContent += `<br>Feature ID: ${featureId}`;

// Determine substation details based on size/type
let voltageLevel, capacity, operator, substationType, yearBuilt;

if (size === 24) {
  // Transmission substations (400kV+)
  voltageLevel = ['400kV', '500kV'][Math.floor(Math.random() * 2)];
  capacity = `${Math.floor(Math.random() * 800 + 200)}MVA`;
  substationType = 'Transmission';
  operator = ['Red Eléctrica de España', 'Iberdrola', 'Endesa'][Math.floor(Math.random() * 3)];
  yearBuilt = Math.floor(Math.random() * 40 + 1980);
} else if (size === 20) {
  // Distribution substations (220kV)
  voltageLevel = ['220kV', '132kV'][Math.floor(Math.random() * 2)];
  capacity = `${Math.floor(Math.random() * 150 + 50)}MVA`;
  substationType = 'Distribution';
  operator = ['Iberdrola', 'Endesa', 'Naturgy', 'EDP'][Math.floor(Math.random() * 4)];
  yearBuilt = Math.floor(Math.random() * 30 + 1990);
} else {
  // Minor distribution (16px)
  voltageLevel = ['66kV', '45kV', '20kV'][Math.floor(Math.random() * 3)];
  capacity = `${Math.floor(Math.random() * 50 + 10)}MVA`;
  substationType = 'Minor Distribution';
  operator = ['Local Distribution', 'Municipal Electric', 'Iberdrola', 'Endesa'][Math.floor(Math.random() * 4)];
  yearBuilt = Math.floor(Math.random() * 25 + 1995);
}

// Use actual data if available, otherwise use generated data
if (feature.properties.substation) {
  popupContent += `<br><strong>Type:</strong> ${feature.properties.substation}`;
} else {
  popupContent += `<br><strong>Type:</strong> ${substationType}`;
}

if (feature.properties.tags && feature.properties.tags.voltage) {
  popupContent += `<br><strong>Voltage:</strong> ${feature.properties.tags.voltage}V`;
} else {
  popupContent += `<br><strong>Voltage:</strong> ${voltageLevel}`;
}

// Add capacity information
popupContent += `<br><strong>Capacity:</strong> ${capacity}`;

// Add operator information
if (feature.properties.tags && feature.properties.tags.operator) {
  popupContent += `<br><strong>Operator:</strong> ${feature.properties.tags.operator}`;
} else {
  popupContent += `<br><strong>Operator:</strong> ${operator}`;
}

// Add year built
popupContent += `<br><strong>Built:</strong> ${yearBuilt}`;

// Add service area for distribution substations
if (substationType !== 'Transmission') {
  const serviceArea = Math.floor(Math.random() * 50000 + 5000);
  popupContent += `<br><strong>Service Area:</strong> ~${serviceArea.toLocaleString()} customers`;
}

          marker.bindPopup(popupContent, { className: 'custom-popup' });

          marker.on('click', function (e) {
            console.log('Substation clicked:', featureId);
            if (e) L.DomEvent.stopPropagation(e);
            selectRowByFeatureProperties(feature.properties);
          });

          substationsRef.current.push({ marker, featureId });
          substationLayer.addLayer(marker);
        }
      });
    }

    return { substationLayer, substationData };
  } catch (error) {
    console.error("Error fetching substations:", error);
    return { substationLayer: L.layerGroup(), substationData: { features: [] } };
  }
};

const fetchPowerlines = async () => {
  try {
    const res = await fetch('/data/powerlines-data.geojson');
    const powerlineData = await res.json();
    const powerlineLayer = L.layerGroup();

    if (powerlineData.features && powerlineData.features.length > 0) {
      powerlineData.features.forEach((feature, index) => {
        if (!feature.properties) {
          feature.properties = {};
        }
        feature.properties['Feature ID'] = feature.properties['Feature ID'] || `pl-${index + 1}`;
      });

      powerlineData.features.forEach((feature) => {
        if (feature.geometry && (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString')) {
          const featureId = feature.properties['Feature ID'];
          
          // Determine line color and weight based on voltage
          let color = layerColors.powerlinesOther;
          let weight = 2;
          
          if (feature.properties.tags && feature.properties.tags.voltage) {
            const voltage = parseInt(feature.properties.tags.voltage);
            if (voltage >= 400000) {
              color = layerColors.powerlines400kv;
              weight = 4;
            } else if (voltage >= 220000) {
              color = layerColors.powerlines220kv;
              weight = 3;
            }
          }

          let polyline;
          if (feature.geometry.type === 'MultiLineString') {
            // Convert MultiLineString to multiple polylines
            feature.geometry.coordinates.forEach((lineCoords, segIndex) => {
              const coords = lineCoords.map(coord => [coord[1], coord[0]]);
              polyline = L.polyline(coords, {
                color: color,
                weight: weight,
                opacity: 0.8,
                interactive: true
              });
              
              polyline.featureId = `${featureId}-${segIndex}`;
              
              let popupContent = '<strong>Power Line</strong>';
              popupContent += `<br>Feature ID: ${featureId}`;
              if (feature.properties.tags && feature.properties.tags.voltage) {
                popupContent += `<br>Voltage: ${feature.properties.tags.voltage}V`;
              }
              if (feature.properties.tags && feature.properties.tags.operator) {
                popupContent += `<br>Operator: ${feature.properties.tags.operator}`;
              }

              polyline.bindPopup(popupContent, { className: 'custom-popup' });
              
              powerlineLayer.addLayer(polyline);
              powerlinesRef.current.push({ polyline, featureId: polyline.featureId });
            });
          } else {
            const coords = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            polyline = L.polyline(coords, {
              color: color,
              weight: weight,
              opacity: 0.8,
              interactive: true
            });
            
            polyline.featureId = featureId;
            
            let popupContent = '<strong>Power Line</strong>';
            popupContent += `<br>Feature ID: ${featureId}`;
            if (feature.properties.tags && feature.properties.tags.voltage) {
              popupContent += `<br>Voltage: ${feature.properties.tags.voltage}V`;
            }
            if (feature.properties.tags && feature.properties.tags.operator) {
              popupContent += `<br>Operator: ${feature.properties.tags.operator}`;
            }

            polyline.bindPopup(popupContent, { className: 'custom-popup' });
            
            powerlineLayer.addLayer(polyline);
            powerlinesRef.current.push({ polyline, featureId });
          }
        }
      });
    }

    return { powerlineLayer, powerlineData };
  } catch (error) {
    console.error("Error fetching powerlines:", error);
    return { powerlineLayer: L.layerGroup(), powerlineData: { features: [] } };
  }
};
    // 3. Add CSS for custom popups - Add this to your component or a separate CSS file
    useEffect(() => {
        // Add custom CSS for popups
        const style = document.createElement('style');
        style.textContent = `
            .custom-popup .leaflet-popup-content-wrapper {
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .custom-popup .leaflet-popup-tip {
                background-color: white;
            }
            .custom-popup .leaflet-popup-content {
                margin: 10px;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);


    const resetLayerHighlighting = () => {
  // Reset uploaded locations
  uploadedLocationsRef.current.forEach(({ marker }) => {
    marker.setIcon(L.divIcon({
      html: `
        <div style="
          position: relative;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: ${layerColors.uploadedLocations || '#FF6B35'};
          border: 3px solid white;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    }));

    if (marker.isPopupOpen()) {
      marker.closePopup();
    }
  });

  // Reset substations
  substationsRef.current.forEach(({ marker }) => {
    // Reset to original styling - you may need to store original size/color
    if (marker.isPopupOpen()) {
      marker.closePopup();
    }
  });

  // Reset powerlines
  powerlinesRef.current.forEach(({ polyline }) => {
    // Reset to original styling
    if (polyline.isPopupOpen()) {
      polyline.closePopup();
    }
  });
};

    const handleCellEdit = (selectedRowIndices, columnName, newValue) => {
        setTableData(prev => {
            const updated = [...prev];
            updated[currentTableIndex].rows[selectedRowIndices][columnName] = newValue;
            return updated;
        });
    };

    const closeContextMenu = () => {
        setContextMenu({ visible: false, x: 0, y: 0, type: null, index: null });
    };

    useEffect(() => {
        const handleClick = () => closeContextMenu();
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);


    const runGeocodeSearch = async (query) => {
        if (!query) {
            setSearchResults([]);
            return;
        }

        try {
            const res = await fetch(
                `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`
            );
            const data = await res.json();
            const formattedResults = data.features.map(feature => ({
                name: feature.properties.name || feature.properties.street || feature.properties.city,
                fullName: [
                    feature.properties.name,
                    feature.properties.street,
                    feature.properties.city,
                    feature.properties.state,
                    feature.properties.country
                ].filter(Boolean).join(', '),
                center: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
                // Create a small bounding box around the point if no bbox is provided
                bbox: L.latLngBounds(
                    [feature.geometry.coordinates[1] - 0.01, feature.geometry.coordinates[0] - 0.01],
                    [feature.geometry.coordinates[1] + 0.01, feature.geometry.coordinates[0] + 0.01]
                )
            }));
            setSearchResults(formattedResults);
        } catch (err) {
            console.error("Geocoding error:", err);
            setSearchResults([]);
        }
    };

    const selectRowByFeatureProperties = (properties) => {
        if (!properties || !tableData.length) return;

        // Loop through each table to find the matching row
        for (let i = 0; i < tableData.length; i++) {
            let rowIndex = -1;

            // First try to match by Feature ID if available
            if (properties.id || properties['Feature ID']) {
                const featureId = properties.id || properties['Feature ID'];
                rowIndex = tableData[i]?.rows?.findIndex(row =>
                    row['Feature ID']?.toString() === featureId?.toString()
                );
            }

            // If no match by ID, fall back to property matching
            if (rowIndex < 0) {
                rowIndex = tableData[i]?.rows?.findIndex(row =>
                    Object.keys(properties).some(key => row[key] === properties[key])
                );
            }

            if (rowIndex >= 0) {
                console.log(`Found matching row at index ${rowIndex} in table ${i}`);

                // Important: First make the table visible before any scrolling attempts
                setShowTable(true);

                // Delay other operations to ensure the table is fully rendered
                setTimeout(() => {
                    // Set the correct table view
                    setCurrentTableIndex(i);

                    // Set selected row
                    setSelectedRowIndices([rowIndex]);

                    // Clear any previous scrollToRowIndex value first
                    // This ensures the effect will trigger even if selecting the same row again
                    setScrollToRowIndex(null);

                    // Then set the new value in the next render cycle
                    setTimeout(() => {
                        setScrollToRowIndex(rowIndex);
                        console.log(`Set scrollToRowIndex to ${rowIndex}`);
                    }, 50);
                }, 100);

                break;
            }
        }
    };
const highlightMultipleFeatures = (rowIndices) => {
    if (!rowIndices || rowIndices.length === 0 || !map) return;
    
    resetLayerHighlighting();
    
    rowIndices.forEach(rowIndex => {
        const row = tableData[currentTableIndex]?.rows[rowIndex];
        if (!row) return;
        
        switch (currentTableIndex) {
  case 0: // Uploaded Locations
    highlightUploadedLocation(row);
    break;
  case 1: // Substations
    highlightSubstation(row);
    break;
  case 2: // Power Lines
    highlightPowerline(row);
    break;
}
    });
    
    if (rowIndices.length > 1) {
        const bounds = L.latLngBounds([]);
        
        rowIndices.forEach(rowIndex => {
            const row = tableData[currentTableIndex]?.rows[rowIndex];
            if (!row || !row['Feature ID']) return;
            
            if (currentTableIndex === 0) {
    const location = uploadedLocationsRef.current.find(loc => loc.featureId === row['Feature ID']);
    if (location && location.marker) {
        bounds.extend(location.marker.getLatLng());
    }
} else if (currentTableIndex === 1) {
    const substation = substationsRef.current.find(sub => sub.featureId === row['Feature ID']);
    if (substation && substation.marker) {
        bounds.extend(substation.marker.getLatLng());
    }
}
        });
        
        if (bounds.isValid()) {
            map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 16,
                animate: true
            });
        }
    }
};

    
    const highlightFeatureByRowProperties = (rowIndices) => {
    if (!rowIndices || (Array.isArray(rowIndices) && rowIndices.length === 0) || !map) return;
    
    resetLayerHighlighting();
    
    if (Array.isArray(rowIndices)) {
        highlightMultipleFeatures(rowIndices);
    } else {
        const row = tableData[currentTableIndex]?.rows[rowIndices];
        if (!row) return;
        
        switch (currentTableIndex) {
    case 0: // Uploaded Locations
        highlightUploadedLocation(row);
        break;
    case 1: // Substations
        highlightSubstation(row);
        break;
    case 2: // Power Lines
        highlightPowerline(row);
        break;
}
    }
};

// Replace highlightDataCenter with these functions:
const highlightUploadedLocation = (row, isMultiSelect = false) => {
  if (!row || !map) return;

  const featureId = row['Feature ID'];

  if (featureId) {
    const matchedLocation = uploadedLocationsRef.current.find(loc => loc.featureId === featureId);

    if (matchedLocation) {
      highlightMarker(matchedLocation.marker, isMultiSelect);
      return;
    }
  }

  highlightByCoordinates(row);
};

const highlightSubstation = (row, isMultiSelect = false) => {
  if (!row || !map) return;

  const featureId = row['Feature ID'];

  if (featureId) {
    const matchedSubstation = substationsRef.current.find(sub => sub.featureId === featureId);

    if (matchedSubstation) {
      highlightMarker(matchedSubstation.marker, isMultiSelect);
      return;
    }
  }

  highlightByCoordinates(row);
};

const highlightPowerline = (row, isMultiSelect = false) => {
  if (!row || !map) return;

  const featureId = row['Feature ID'];

  if (featureId) {
    const matchedPowerline = powerlinesRef.current.find(pl => pl.featureId === featureId);

    if (matchedPowerline) {
      // Highlight polyline by changing its style
      matchedPowerline.polyline.setStyle({
        color: '#FFFF00',
        weight: 6,
        opacity: 1
      });

      if (!isMultiSelect) {
        const bounds = matchedPowerline.polyline.getBounds();
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 16,
          animate: true
        });
      }
      return;
    }
  }

  highlightByCoordinates(row);
};


    const highlightMarker = (marker, isMultiSelect = false) => {
        marker.setIcon(L.divIcon({
  html: `
    <div style="
      position: relative;
      width: 28px;
      height: 34px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    ">
      <div style="
        width: 24px;
        height: 24px;
        background-color: #FF6B35;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        
      </div>
    </div>
  `,
  className: '',
  iconSize: [28, 34],
  iconAnchor: [14, 34]
}));
          
          
        if (!isMultiSelect) {
            // Calculate visible map area when table is showing
            const containerHeight = mapContainerRef.current.clientHeight;
        
            // Get marker position and calculate offset to center it in the visible area
            const markerLatLng = marker.getLatLng();
        
            // Create a point that will be centered in the visible map area
            // The offset calculation moves the point up to account for the table
            const targetPoint = showTable
              ? map.project(markerLatLng).add([0, tableHeight/1.6])
              : map.project(markerLatLng);
        
            // Convert back to LatLng and pan the map to center on this point
            const targetLatLng = map.unproject(targetPoint);
        
            // Zoom and pan to the adjusted center
            map.setView(targetLatLng, 16, {
              animate: true,
              duration: 0.5
            });
          }
        };
        
    // Extract the coordinate-based highlighting into a separate function
    const highlightByCoordinates = (row) => {
        // Try to extract coordinates from the row data
        let lat, lng;

        // Check various possible property names for coordinates
        if (row.latitude && row.longitude) {
            lat = parseFloat(row.latitude);
            lng = parseFloat(row.longitude);
        } else if (row.lat && row.lng) {
            lat = parseFloat(row.lat);
            lng = parseFloat(row.lng);
        } else if (row.y && row.x) {
            lat = parseFloat(row.y);
            lng = parseFloat(row.x);
        } else if (row.coordinates) {
            try {
                // Try to parse a coordinates string like "40.7589, -73.9866"
                const coords = row.coordinates.split(',').map(c => parseFloat(c.trim()));
                if (coords.length >= 2) {
                    lat = coords[0];
                    lng = coords[1];
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }

        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            const latlng = L.latLng(lat, lng);

            // Calculate visible map area when table is showing
            const containerHeight = mapContainerRef.current.clientHeight;
            const visibleMapHeight = showTable ? containerHeight - tableHeight : containerHeight;

            // Get projected point and calculate offset
            const point = map.project(latlng);
            const offsetPoint = showTable
                ? point.add([0, tableHeight / 1.6])
                : point;
            // Convert back to LatLng and pan the map
            const targetLatLng = map.unproject(offsetPoint);

            // Set view with animation
            map.setView(targetLatLng, 16, {
                animate: true,
                duration: 0.5
            });

        }
    };


      useEffect(() => {
    if (map) {
        // Set up click-to-edit for automatically editing shapes when clicked
        const cleanup = setupClickToEdit(
            map,
            editControlRef,
            setIsEditing,
            setActiveDrawTool
        );

        if (map.drawControl) {
            // Add listener for delete events
            const originalOnDeleted = L.EditToolbar.Delete.prototype._removeLayer;
            
            L.EditToolbar.Delete.prototype._removeLayer = function(e) {
              const layer = e.layer || e;
              
              // Call original method
              originalOnDeleted.call(this, e);
              
              // Check if this is one of our tracked layers
              if (layer.layerId) {
                // Remove from drawn layers state
                setDrawnLayers(prev => {
                  const updated = { ...prev };
                  delete updated[layer.layerId];
                  return updated;
                });
                
                setDrawnLayersOrder(prev => {
                    // Ensure prev is an array
                    const prevArray = Array.isArray(prev) ? prev : [];
                    const newOrder = prevArray.filter(id => id !== layer.layerId);
                    drawnLayersRef.current = newOrder;
                    console.log("Updated drawn layers order:", newOrder);
                    return newOrder;
                });         
              }
            };
          }
        return cleanup;
    }
}, [map]);

    // Add this effect to properly clean up map styles when component unmounts
    useEffect(() => {
        // This cleanup function will run when the component unmounts
        return () => {
            if (map && baseMapLayer) {
                // Check if baseMapLayer is a composite layer (for hybrid view)
                if (baseMapLayer.main && baseMapLayer.labels) {
                    map.removeLayer(baseMapLayer.main);
                    map.removeLayer(baseMapLayer.labels);
                } else {
                    // Single layer case
                    map.removeLayer(baseMapLayer);
                }
            }
        };
    }, [map, baseMapLayer]);

    // Add a useEffect to handle changes to the currentMapView
    useEffect(() => {
        if (map && currentMapView) {
            // You could add any additional logic here that needs to run
            // when the map style changes, such as adjusting other visual elements

            // For example, for dark mode you might want to adjust some UI colors
            if (currentMapView === 'dark') {
                // Adjust any UI elements that need to change for dark backgrounds
                // Example: change popup styling for better contrast
                const style = document.createElement('style');
                style.id = 'dark-map-adjustments';
                style.textContent = `
          .custom-popup .leaflet-popup-content-wrapper {
            background-color: rgba(40, 40, 40, 0.9);
            color: white;
          }
          .custom-popup .leaflet-popup-tip {
            background-color: rgba(40, 40, 40, 0.9);
          }
        `;
                document.head.appendChild(style);

                return () => {
                    // Clean up when view changes
                    const styleElement = document.getElementById('dark-map-adjustments');
                    if (styleElement) document.head.removeChild(styleElement);
                };
            }
        }
    }, [map, currentMapView]);

 
    useEffect(() => {
        if (!map) return;
      
        // Assign callback functions for showing/hiding the text toolbar
        map._showTextToolbar = ({ marker, format }) => {
          setActiveTextMarker(marker);
          setTextFormat(format);
          // Position is now fixed at the top center of the map, regardless of where the marker is
          setTextToolbarPosition({ 
            top: 16, 
            left: mapContainerRef.current ? mapContainerRef.current.clientWidth / 2 : window.innerWidth / 2 
          });
          setShowTextToolbar(true);
        };
      
        map._hideTextToolbar = () => {
          setShowTextToolbar(false);
          setActiveTextMarker(null);
        };
      
        return () => {
          // Clean up when component unmounts
          if (map) {
            map._showTextToolbar = null;
            map._hideTextToolbar = null;
          }
        };
      }, [map]);

      useEffect(() => {
        if (Array.isArray(selectedRowIndices) && selectedRowIndices.length > 0) {
          highlightFeatureByRowProperties(selectedRowIndices);
        }
      }, [selectedRowIndices, currentTableIndex]);
      
    useEffect(() => {
        console.log("drawnLayersOrder changed:", drawnLayersOrder);
        console.log("drawnLayers state:", drawnLayers);
      }, [drawnLayersOrder, drawnLayers]);
    
    useEffect(() => {
  if (!map) return;

  map.on('click', function (e) {
    console.log('Map clicked at:', e.latlng);
    // Let the individual markers/layers handle their own clicks
    // No need for custom distance checking
  });
}, [map]);

    const handleResultClick = (result) => {
        setSearchResults([]);
        setSearchQuery(result.fullName || result.name);

        // Add marker and fit bounds as before
        map.fitBounds(result.bbox);
        L.marker(result.center, {
            icon: L.divIcon({
                html: `<div style="
          width: 20px;
          height: 20px;
          background-color: #FF5747;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 0 2px rgba(0,0,0,0.3);
        "></div>`,
                className: '',
                iconSize: [20, 20],
                iconAnchor: [10, 20]
            })
        }).addTo(map);
    };

    
    const sendQuestionToChat = (question) => {
        if (typeof onSendMessage === 'function') {
            onSendMessage({ text: question, file: null });
        } else {
            console.warn('No onSendMessage function available to send question to chat');
            // Fallback: Alert the user their question can't be sent
            alert(`Unable to send question: "${question}" to chat. The chat functionality may not be available.`);
        }
    };

    const handleMouseMove = (e) => {
        if (!dragState.current.isDragging) return;
        e.preventDefault();
        dragState.current.lastY = e.clientY;

        if (!dragState.current.rafId) {
            dragState.current.rafId = requestAnimationFrame(updateDragPosition);
        }
    };
    const handleTextFormatChange = (formatChanges) => {
        if (!activeTextMarker) return;
      
        // Update the text format state
        const newFormat = { ...textFormat, ...formatChanges };
        setTextFormat(newFormat);
      
        // Apply formatting to the marker
        if (activeTextMarker._textContent) {
          // Apply font properties
          if (formatChanges.fontFamily) {
            activeTextMarker._textContent.style.fontFamily = formatChanges.fontFamily;
          }
          
          if (formatChanges.fontSize) {
            activeTextMarker._textContent.style.fontSize = `${formatChanges.fontSize}px`;
          }
          
          if (formatChanges.fontWeight) {
            activeTextMarker._textContent.style.fontWeight = formatChanges.fontWeight;
          }
          
          if (formatChanges.fontStyle) {
            activeTextMarker._textContent.style.fontStyle = formatChanges.fontStyle;
          }
          
          if (formatChanges.textDecoration) {
            activeTextMarker._textContent.style.textDecoration = formatChanges.textDecoration;
          }
          
          if (formatChanges.textAlign) {
            activeTextMarker._textContent.style.textAlign = formatChanges.textAlign;
          }
          
          if (formatChanges.color) {
            activeTextMarker._textContent.style.color = formatChanges.color;
          }
      
          // Update marker state
          activeTextMarker._state = { ...activeTextMarker._state, ...formatChanges };
      
          // Update marker icon to refresh display
          if (activeTextMarker._icon && activeTextMarker.setIcon) {
            const el = activeTextMarker._textElement;
            const state = activeTextMarker._state;
            
            const width = el.offsetWidth || state.width || 100;
            const height = el.offsetHeight || state.height || 40;
            
            const icon = L.divIcon({
              html: el,
              className: '',
              iconSize: [width, height],
              iconAnchor: [width / 2, height / 2]
            });
            
            activeTextMarker.setIcon(icon);
          }
        }
      };
    const updateDragPosition = () => {
        dragState.current.rafId = null;

        if (!dragState.current.isDragging) return;

        const deltaY = dragState.current.startY - dragState.current.lastY;
        const containerHeight = dragState.current.containerHeight;
        const minTableHeight = 100;
        const maxTableHeight = containerHeight - 120;

        let newTableHeight = dragState.current.startHeight + deltaY;

        if (showTable) {
            newTableHeight = Math.max(minTableHeight, Math.min(maxTableHeight, newTableHeight));
            setTableHeight(newTableHeight);
        }

        if (dragState.current.isDragging) {
            dragState.current.rafId = requestAnimationFrame(updateDragPosition);
        }
    };

    const handleMouseUp = () => {
        if (dragState.current.rafId) {
            cancelAnimationFrame(dragState.current.rafId);
        }

        dragState.current.isDragging = false;
        dragState.current.rafId = null;

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';

        if (dragHandleRef.current) {
            dragHandleRef.current.classList.remove('dragging');
        }
    };

    const captureAndDownload = () => {
        if (!map) return;

        const mapNode = mapContainerRef.current;

        if (!mapNode) {
            console.error('Map element not found');
            return;
        }

        // If html2canvas is not loaded, load it
        if (typeof html2canvas === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = () => {
                html2canvas(mapNode, {
                    backgroundColor: 'white',
                    scale: 2,
                    logging: false,
                    allowTaint: true,
                    useCORS: true
                }).then(canvas => {
                    const imgData = canvas.toDataURL('image/jpeg', 0.9);
                    const link = document.createElement('a');
                    link.href = imgData;
link.download = `infrastructure_analysis_map_${new Date().toISOString().slice(0, 10)}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
            };
            document.head.appendChild(script);
        } else {
            html2canvas(mapNode, {
                backgroundColor: 'white',
                scale: 2,
                logging: false,
                allowTaint: true,
                useCORS: true
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/jpeg', 0.9);
                const link = document.createElement('a');
                link.href = imgData;
link.download = `infrastructure_analysis_map_${new Date().toISOString().slice(0, 10)}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
        if (map) {
            setTimeout(() => map.invalidateSize(), 300);
        }
    };
    
    const toggleDrawnLayer = (layerId) => {
        // First, check if we have the layer
        if (!drawnLayers || !drawnLayers[layerId] || !map) return;
        
        const layerInfo = drawnLayers[layerId];
        const layer = layerInfo.layer;
        const newVisibility = !layerInfo.visible;
        
        // Directly manipulate the visibility immediately
        if (newVisibility) {
          // Show the layer
          if (map.drawnItems && !map.drawnItems.hasLayer(layer)) {
            map.drawnItems.addLayer(layer);
          }
        } else {
          // Hide the layer
          if (map.drawnItems && map.drawnItems.hasLayer(layer)) {
            map.drawnItems.removeLayer(layer);
          }
        }
        
        // Then update the state
        setDrawnLayers(prev => {
          const updated = { ...prev };
          if (updated[layerId]) {
            updated[layerId] = {
              ...updated[layerId],
              visible: newVisibility
            };
          }
          return updated;
        });
      };

   const toggleLayer = (layerName) => {
    console.log('Toggling layer:', layerName, 'Current state:', activeLayers[layerName]);

    setActiveLayers(prev => ({
        ...prev,
        [layerName]: !prev[layerName]
    }));
};  

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    
   // In the useEffect for layer management, replace the dataCenters section with:
useEffect(() => {
  if (!map) return;

  // Handle uploaded locations layer
  if (map.uploadedLocationsLayer) {
    if (activeLayers.uploadedLocations) {
      map.addLayer(map.uploadedLocationsLayer);
      map.uploadedLocationsLayer.setZIndex(layerZIndexes.uploadedLocations);
      
      uploadedLocationsRef.current.forEach(({ marker }) => {
  marker.options.interactive = true;
});

substationsRef.current.forEach(({ marker }) => {
  marker.options.interactive = true;
});

powerlinesRef.current.forEach(({ polyline }) => {
  polyline.options.interactive = true;
});
    } else {
      map.removeLayer(map.uploadedLocationsLayer);
    }
  }
  bufferCirclesRef.current.forEach(({ circle }) => {
    if (activeLayers.bufferZones) {
      if (!map.hasLayer(circle)) {
        map.addLayer(circle);
      }
    } else {
      if (map.hasLayer(circle)) {
        map.removeLayer(circle);
      }
    }
  });

  // Handle substations layer
  if (map.substationsLayer) {
    if (activeLayers.substations) {
      map.addLayer(map.substationsLayer);
      map.substationsLayer.setZIndex(layerZIndexes.substations);
     
    } else {
      map.removeLayer(map.substationsLayer);
    }
  }

  // Handle powerlines layer
  if (map.powerlinesLayer) {
    if (activeLayers.powerlines) {
      map.addLayer(map.powerlinesLayer);
      map.powerlinesLayer.setZIndex(layerZIndexes.powerlines);
      
      
    } else {
      map.removeLayer(map.powerlinesLayer);
    }
  }

  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 10);
}, [map, activeLayers, layerZIndexes]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            // Prevent deselect if clicking on context menu or header
            if (e.target.closest('th') || e.target.closest('.context-menu')) return;
            setSelectedRowIndices([]);
            setSelectedColIndex(null);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (showDrawTools && pencilRef.current) {
            const rect = pencilRef.current.getBoundingClientRect();

            const top = isFullscreen
                ? rect.bottom + window.scrollY + 12
                : rect.top + window.scrollY + 12;

            const left = rect.left + window.scrollX - 120 + rect.width / 2;

            setDrawDialogPos({ top, left });
        }
    }, [showDrawTools, isFullscreen]);


    useEffect(() => {
        if (showEmailNotification) {
            const timer = setTimeout(() => {
                setSlideOut(true); // trigger slide-out animation
                setTimeout(() => {
                    setShowEmailNotification(false);
                    setSlideOut(false); // reset for next time
                }, 300); // match slide-out duration
            }, 4000); // show for 4s before sliding out

            return () => clearTimeout(timer);
        }
    }, [showEmailNotification]);

    useEffect(() => {
        if (!map) return;

        map.on(L.Draw.Event.CREATED, function (e) {
            
            const layer = e.layer;
            map.drawnItems.addLayer(layer);
        });
    }, [map]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setSelectedRowIndices([]);
                setSelectedColIndex(null);

                // Clear selection highlights from the map
                if (map) {
                    map.eachLayer(layer => {
                        if (layer._icon) {
                            layer._icon.style.backgroundColor = '';
                            layer._icon.style.border = '';
                            layer._icon.style.boxShadow = '';
                        }
                    });

                    // Also close any open popups
                    map.closePopup();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [map]);




    const convertGeoJSONToTable = (data, layerType) => {
        if (!data || !data.features || !data.features.length) return { headers: [], rows: [] };

        // Get all possible properties across features
        const allProperties = new Set();
        data.features.forEach(feature => {
            if (feature.properties) {
                Object.keys(feature.properties).forEach(key => allProperties.add(key));
            }
        });

        // Create table headers - put Feature ID first for clarity
        const headers = ["Feature ID", "Geometry Type", ...Array.from(allProperties).filter(prop => prop !== 'Feature ID')];

        // Create table rows
        const rows = data.features.map((feature) => {
            // Use the same Feature ID that was set on the feature
            const featureId = feature.properties && feature.properties['Feature ID']
                ? feature.properties['Feature ID']
                : null;

            const row = {
                "Feature ID": featureId, // Use the consistent Feature ID
                "Geometry Type": feature.geometry?.type || "Unknown"
            };

            // Add all properties
            allProperties.forEach(prop => {
                if (prop !== 'Feature ID') { // Skip Feature ID since we already added it
                    const value = feature.properties ? feature.properties[prop] : "";
                    row[prop] = typeof value === 'object' && value !== null
                        ? JSON.stringify(value)
                        : value ?? "";
                }
            });

            return row;
        });

        return { headers, rows };
    };

    const handleDownloadAll = () => {
        const downloadedFiles = [];       
        Object.entries(downloadSelections).forEach(([key, { filename, format }]) => {
            const fullName = `${filename}${format}`;
            downloadedFiles.push(fullName);

            if (key === 'map') {
                // Get the map container element
                const mapElement = mapContainerRef.current;

                if (!mapElement) {
                    console.error("Map element not found");
                    return;
                }

                if (format === '.pdf') {
                    // For PDF format
                    html2canvas(mapElement, {
                        backgroundColor: 'white',
                        scale: 2,
                        logging: true,
                        useCORS: true,
                        allowTaint: true
                    }).then(canvas => {
                        try {
                            // Convert canvas to image
                            const imgData = canvas.toDataURL('image/jpeg', 1.0);

                            // Check if jsPDF is available
                            if (typeof jsPDF === 'undefined') {
                                // Load jsPDF if not available
                                const script = document.createElement('script');
                                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                                script.onload = () => {
                                    const { jsPDF } = window.jspdf;
                                    // Initialize PDF
                                    const pdf = new jsPDF({
                                        orientation: 'landscape',
                                        unit: 'mm'
                                    });

                                    // Get canvas dimensions
                                    const imgWidth = 280; // mm
                                    const imgHeight = (canvas.height * imgWidth) / canvas.width;

                                    // Add image to PDF
                                    pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);

                                    // Save PDF
                                    pdf.save(`${filename}.pdf`);
                                };
                                document.head.appendChild(script);
                            } else {
                                // jsPDF is already available
                                const pdf = new jsPDF({
                                    orientation: 'landscape',
                                    unit: 'mm'
                                });
                                const imgWidth = 280; // mm
                                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                                pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
                                pdf.save(`${filename}.pdf`);
                            }
                        } catch (err) {
                            console.error("Error creating PDF:", err);
                        }
                    }).catch(err => {
                        console.error("Error rendering canvas for PDF:", err);
                    });
                } else if (format === '.shp' || format === '.gdb' || format === '.csv') {
                    // For GIS formats that need server-side processing
                    // First show loading notification
                    setNotificationMessage(`Processing ${format} export...`);
                    setShowEmailNotification(true);

                   

                    // Collect infrastructure data instead
const mapData = {
    uploadedLocations: [],
    substations: [],
    powerlines: []
};

// Add uploaded locations
if (map && uploadedLocationsRef.current.length > 0) {
    uploadedLocationsRef.current.forEach(({ marker }) => {
        const position = marker.getLatLng();
        const popupContent = marker.getPopup()?.getContent() || '';
        
        let name = "Analysis Location";
        const nameMatch = popupContent.match(/Name: ([^<]+)/);
        if (nameMatch && nameMatch[1]) {
            name = nameMatch[1].trim();
        }

        mapData.uploadedLocations.push({
            lat: position.lat,
            lng: position.lng,
            name: name,
            type: 'Analysis Location'
        });
    });
}

// Add substations
if (map && substationsRef.current.length > 0) {
    substationsRef.current.forEach(({ marker }) => {
        const position = marker.getLatLng();
        mapData.substations.push({
            lat: position.lat,
            lng: position.lng,
            type: 'Substation'
        });
    });
}

                   

                    // Send to server for processing
                    fetch('/api/export-map', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            format,
                            mapData
                        }),
                    })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }

                            // Get filename from content-disposition header if available
                            let serverFilename = fullName;
                            const contentDisposition = response.headers.get('content-disposition');
                            if (contentDisposition) {
                                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                                if (filenameMatch && filenameMatch[1]) {
                                    serverFilename = filenameMatch[1];
                                }
                            }

                            // Different handling based on the response type
                            if (format === '.csv') {
                                return response.text().then(text => ({
                                    data: text,
                                    type: 'text/csv',
                                    filename: serverFilename || `${filename}.csv`
                                }));
                            } else {
                                return response.arrayBuffer().then(buffer => ({
                                    data: buffer,
                                    type: 'application/zip',
                                    filename: serverFilename || `${filename}${format}.zip`
                                }));
                            }
                        })
                        .then(({ data, type, filename }) => {
                            // Create blob and trigger download
                            const blob = new Blob([data], { type });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = filename;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);

                            // Success notification
                            setNotificationMessage(`Successfully exported as ${format}`);
                            setShowEmailNotification(true);
                        })
                        .catch(error => {
                            console.error('Error exporting map:', error);
                            setNotificationMessage(`Error exporting as ${format}. See console for details.`);
                            setShowEmailNotification(true);
                        });
                } else {
                    // For JPG and PNG formats
                    html2canvas(mapElement, {
                        backgroundColor: 'white',
                        scale: 2,
                        logging: true,
                        useCORS: true,
                        allowTaint: true
                    }).then(canvas => {
                        try {
                            const mimeType = format === '.png' ? 'image/png' : 'image/jpeg';
                            const imageData = canvas.toDataURL(mimeType, 0.9);
                            const link = document.createElement('a');
                            link.href = imageData;
                            link.download = fullName;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        } catch (err) {
                            console.error("Error creating download:", err);
                        }
                    }).catch(err => {
                        console.error("Error rendering canvas:", err);
                    });
                }
            } else if (key.startsWith('table-')) {
                // Existing table download functionality
                const tableIndex = parseInt(key.split('-')[1], 10);
                const data = tableData[tableIndex];

                if (!data || !data.headers || !data.rows) return;

                const csvRows = [
                    data.headers.join(','),
                    ...data.rows.map(row => data.headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
                ];
                const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });

                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', fullName);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });

        // Push notification
        if (downloadedFiles.length > 0) {
            const fileList = downloadedFiles.join(', ');
            setShowShareDialog(false);
            setNotificationMessage(`Downloaded ${downloadedFiles.length} file${downloadedFiles.length > 1 ? 's' : ''}: ${fileList}`);
            setShowEmailNotification(true);
            addNotification(`Downloaded ${downloadedFiles.length} file${downloadedFiles.length > 1 ? 's' : ''}: ${fileList}`);
        }
    };
    const safeSetDrawnLayersOrder = (value) => {
        if (value !== null && typeof value !== 'undefined') {
          setDrawnLayersOrder(value);
        }
      };
      
    useEffect(() => {
        if (tableData.length > 0 && !isModified &&
            tableData[currentTableIndex] &&
            tableData[currentTableIndex].rows) {
            setOriginalRowsMap(prev => ({
                ...prev,
                [currentTableIndex]: JSON.parse(JSON.stringify(tableData[currentTableIndex].rows))
            }));
        }
    }, [tableData, currentTableIndex, isModified]);

    useEffect(() => {
        if (!map) return;

        // ✅ Only create and add drawnItems if it doesn't already exist
        if (!map.drawnItems) {
            const drawnItems = new L.FeatureGroup();
            drawnItems.setZIndex(1000);
            map.addLayer(drawnItems);
            map.drawnItems = drawnItems;

            const drawControl = new L.Control.Draw({
                draw: {
                    polygon: false,
                    polyline: false,
                    rectangle: false,
                    circle: false,
                    marker: false,
                    circlemarker: false
                },
                edit: {
                    featureGroup: drawnItems
                }
            });

            map.drawControl = drawControl;
        }
    }, [map]);

useEffect(() => {
    if (!map) return;

    Object.entries(layerZIndexes).forEach(([layerId, zIndex]) => {
    let layer;
    if (layerId === 'uploadedLocations') layer = map.uploadedLocationsLayer;
    else if (layerId === 'substations') layer = map.substationsLayer;
    else if (layerId === 'powerlines') layer = map.powerlinesLayer;

    if (layer) {
        layer.setZIndex(zIndex);
    }
});

    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 10);
}, [map, layerZIndexes]);


    // Add this function in your CoffeeShopMapComponent
const updateDrawnLayerColor = (layerId, newColor) => {
    // First update the state
    setDrawnLayers(prev => {
      const updated = { ...prev };
      if (updated[layerId]) {
        updated[layerId] = {
          ...updated[layerId],
          color: newColor
        };
      }
      return updated;
    });
    
    // Then apply the color to the actual layer
    if (map && drawnLayers[layerId] && drawnLayers[layerId].layer) {
      const layer = drawnLayers[layerId].layer;
      const layerType = drawnLayers[layerId].type;
      
      // Apply color based on layer type
      if (layerType === 'polygon' || layerType === 'triangle') {
        layer.setStyle({
          color: newColor,
          fillColor: newColor,
          fillOpacity: 0.3
        });
      } else if (layerType === 'polyline') {
        layer.setStyle({
          color: newColor
        });
      } else if (layerType === 'circle') {
        layer.setStyle({
          color: newColor,
          fillColor: newColor,
          fillOpacity: 0.2
        });
      } else if (layerType === 'marker') {
        // For markers with icons, we may need custom handling
        if (layer._icon) {
          const icon = layer._icon;
          // Apply color to the marker's icon if it has a background color
          const iconElement = icon.querySelector('div');
          if (iconElement) {
            iconElement.style.backgroundColor = newColor;
          }
        }
      } else if (layerType === 'text') {
        // For text markers
        if (layer._textContent) {
          // Store the new color in the marker's state
          if (layer._state) {
            layer._state.color = newColor;
          }
          // Apply the color to the text content
          layer._textContent.style.color = newColor;
        }
      }
    }
  };

    useEffect(() => {
        const initializeMap = async () => {
            const L = await import('leaflet');
            await import('leaflet/dist/leaflet.css');

            if (map || !mapContainerRef.current) return;


            // Initialize base map
            const leafletMap = L.map(mapContainerRef.current, {
                zoomControl: false,
                attributionControl: false,
                minZoom: 5,
                maxZoom: 18,
                doubleClickZoom: false
            }).setView([40.4168, -3.7038], 10);

            mapContainerRef.current.style.backgroundColor = '#FFFFFF';
mapContainerRef.current.style.background = '#FFFFFF';

// Optional: Add a white background tile layer
const whiteBackground = L.tileLayer('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=', {
  attribution: '',
  minZoom: 0,
  maxZoom: 22
});
whiteBackground.addTo(leafletMap);
whiteBackground.setZIndex(-1000);

            // Initialize drawnItems and other setup code...
            const drawnItems = new L.FeatureGroup();
            drawnItems.setZIndex(650);
            leafletMap.addLayer(drawnItems);
            leafletMap.drawnItems = drawnItems;
            leafletMap.createPane('drawPane');
            leafletMap.getPane('drawPane').style.zIndex = 100000000000;

            const drawControl = new L.Control.Draw({
                draw: {
                    polygon: false,
                    polyline: false,
                    rectangle: false,
                    circle: false,
                    marker: false,
                    circlemarker: false
                },
                edit: {
                    featureGroup: drawnItems,
                    remove: true
                }
            });

            leafletMap.drawControl = drawControl;
// Set up event handlers for layer deletion
leafletMap.on(L.Draw.Event.DELETED, function(e) {
    const layers = e.layers;
    
    layers.eachLayer(layer => {
      if (layer.layerId) {
        // Remove from drawn layers state
        setDrawnLayers(prev => {
          const updated = { ...prev };
          delete updated[layer.layerId];
          return updated;
        });
        
        // Remove from order array instead of adding
        setDrawnLayersOrder(prev => {
          // Ensure prev is an array
          const prevArray = Array.isArray(prev) ? prev : [];
          const newOrder = prevArray.filter(id => id !== layer.layerId);
          drawnLayersRef.current = newOrder; // Store in a ref for debugging
          console.log("Updated drawn layers order:", newOrder);
          return newOrder;
        });
      }
    });
  });
            // In the main map event handler:
leafletMap.on(L.Draw.Event.CREATED, function(e) {
    const layer = e.layer;
    const layerType = e.layerType || (layer.layerType || 'shape');
    
    // Generate a unique ID for this shape if not already present
    if (!layer.layerId) {
      const nextId = nextShapeIds[layerType] || 1;
      const layerId = `${layerType}-${nextId}`;
      layer.layerId = layerId;
      
      // Update next IDs
      setNextShapeIds(prev => ({
        ...prev,
        [layerType]: nextId + 1
      }));
    }
    
    // Safely add to drawn items if available
    if (leafletMap.drawnItems) {
      if (!leafletMap.drawnItems.hasLayer(layer)) {
        leafletMap.drawnItems.addLayer(layer);
      }
    }
    
    console.log("Shape created:", {
      layerId: layer.layerId,
      layerType: layerType,
      shape: layer
    });
  
    // Update drawn layers state
    setDrawnLayers(prev => {
      const updated = { ...prev };
      updated[layer.layerId] = {
        layer: layer,
        type: layerType,
        visible: true,
        name: `${layerType.charAt(0).toUpperCase() + layerType.slice(1)} ${nextShapeIds[layerType] || 1}`
      };
      return updated;
    });
    
    // Add to the order array
    setDrawnLayersOrder(prev => {
      // Ensure prev is an array
      const prevArray = Array.isArray(prev) ? prev : [];
      const newOrder = [...prevArray, layer.layerId];
      return newOrder;
    });
  });
  
  // Add handler for when layers are removed
  leafletMap.on(L.Draw.Event.DELETED, function(e) {
    const layers = e.layers;
    
    layers.eachLayer(layer => {
      if (layer.layerId) {
        // Remove from drawn layers state
        setDrawnLayers(prev => {
          const updated = { ...prev };
          delete updated[layer.layerId];
          return updated;
        });
        
        // Remove from order array instead of adding
        setDrawnLayersOrder(prev => {
          // Ensure prev is an array
          const prevArray = Array.isArray(prev) ? prev : [];
          const newOrder = prevArray.filter(id => id !== layer.layerId);
          drawnLayersRef.current = newOrder; // Store in a ref for debugging
          console.log("Updated drawn layers order:", newOrder);
          return newOrder;
        });
      }
    });
  });
  

            // Add the initial base tile layer - light theme by default
            const initialBaseLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(leafletMap);

            // Store the base layer reference for later replacement
            setBaseMapLayer(initialBaseLayer)
            setMap(leafletMap);

            // Initialize geocoder
            const geocoderControl = L.Control.geocoder({
                defaultMarkGeocode: false
            });
            geocoderRef.current = geocoderControl;

            geocoderControl.on('markgeocode', function (e) {
                const bbox = e.geocode.bbox;
                const poly = L.polygon([
                    bbox.getSouthEast(),
                    bbox.getNorthEast(),
                    bbox.getNorthWest(),
                    bbox.getSouthWest()
                ]);
                leafletMap.fitBounds(poly.getBounds());
            });

        setIsLoadingLayers(true);
setLoadingProgress(0);

// Load uploaded locations first
setCurrentLoadingLayer('Loading analysis locations...');
const uploadedLocationsResult = await fetchUploadedLocations();
setLoadingProgress(1);

// Add uploaded locations layer immediately after loading
uploadedLocationsResult.locationLayer.setZIndex(layerZIndexes.uploadedLocations);
uploadedLocationsResult.locationLayer.addTo(leafletMap);
leafletMap.uploadedLocationsLayer = uploadedLocationsResult.locationLayer;

// Small delay for visual effect
await new Promise(resolve => setTimeout(resolve, 2000));

// Load substations second
setCurrentLoadingLayer('Loading substations...');
const substationsResult = await fetchSubstations();
setLoadingProgress(2);

// Add substations layer immediately after loading
substationsResult.substationLayer.setZIndex(layerZIndexes.substations);
substationsResult.substationLayer.addTo(leafletMap);
leafletMap.substationsLayer = substationsResult.substationLayer;

await new Promise(resolve => setTimeout(resolve, 2000));

// Load powerlines last
setCurrentLoadingLayer('Loading power lines...');
const powerlinesResult = await fetchPowerlines();
setLoadingProgress(3);

// Add powerlines layer immediately after loading
powerlinesResult.powerlineLayer.setZIndex(layerZIndexes.powerlines);
powerlinesResult.powerlineLayer.addTo(leafletMap);
leafletMap.powerlinesLayer = powerlinesResult.powerlineLayer;

await new Promise(resolve => setTimeout(resolve, 2000));

setCurrentLoadingLayer('Finalizing map...');

// Generate table data from all loaded layers
if (uploadedLocationsResult.locationData) {
  const locationTable = convertGeoJSONToTable(uploadedLocationsResult.locationData, 'uploadedLocations');
  const substationTable = convertGeoJSONToTable(substationsResult.substationData, 'substations');
  const powerlineTable = convertGeoJSONToTable(powerlinesResult.powerlineData, 'powerlines');
  setTableData([locationTable, substationTable, powerlineTable]);
}

// Finish loading
setIsLoadingLayers(false);
setCurrentLoadingLayer('');


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

 

    // Add this at the start of your component to ensure custom popups are styled
    useEffect(() => {
        // First, let's make sure the custom-popup class exists and is properly styled
        if (!document.getElementById('custom-popup-style')) {
            const style = document.createElement('style');
            style.id = 'custom-popup-style';
            style.textContent = `
        .custom-popup .leaflet-popup-content-wrapper {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 5px;
        }
        .custom-popup .leaflet-popup-tip {
          background-color: white;
        }
        .custom-popup .leaflet-popup-content {
          margin: 5px;
          min-width: 150px;
        }
      `;
            document.head.appendChild(style);
        }
    }, []);

    
    const classifyShape = (layer) => {
        if (layer instanceof L.Polygon) {
          // Check if it's a triangle (3 vertices)
          const latlngs = layer.getLatLngs()[0];
          if (latlngs.length === 4 && latlngs[0].equals(latlngs[latlngs.length-1])) {
            // Polygon with 3 points plus closing point
            return 'triangle';
          }
          return 'polygon';
        } else if (layer instanceof L.Circle) {
          return 'circle';
        } else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
          return 'polyline';
        } else if (layer instanceof L.Marker) {
          if (layer._textContent) {
            return 'text';
          }
          return 'marker';
        }
        return 'shape';
      };
    useEffect(() => {
        // Expose function to global scope so it can be called from map selection
        window.selectRowsByFeatureIds = (featureIds) => {
            if (!featureIds || featureIds.length === 0) return;

            // First, make sure the table is visible
            setShowTable(true);

            // Process tables sequentially to find all matching rows
            const matchingRows = {};
            let totalFound = 0;
            let firstTable = null;
            let firstIndex = -1;

            // Search through each table for matching rows
            tableData.forEach((table, tableIndex) => {
                if (!table || !table.rows) return;

                const tableMatches = [];

                // Find all rows that match any of the feature IDs
                table.rows.forEach((row, rowIndex) => {
                    if (row['Feature ID'] && featureIds.includes(row['Feature ID'].toString())) {
                        tableMatches.push(rowIndex);
                        totalFound++;

                        // Keep track of first match for initial focus
                        if (firstTable === null) {
                            firstTable = tableIndex;
                            firstIndex = rowIndex;
                        }
                    }
                });

                if (tableMatches.length > 0) {
                    matchingRows[tableIndex] = tableMatches;
                }
            });

            // If we found matches, process them
            if (totalFound > 0) {
                // Switch to the table with the first match
                setCurrentTableIndex(firstTable);

                // Create sorted table data with matching rows at the top
                const updatedTableData = [...tableData];

                // For each table with matches, move those rows to the top
                Object.entries(matchingRows).forEach(([tableIndex, rowIndices]) => {
                    const tableIdx = parseInt(tableIndex);
                    const table = { ...updatedTableData[tableIdx] };

                    // Extract the matching rows
                    const matchedRows = rowIndices.map(idx => table.rows[idx]);

                    // Remove the matched rows from their original positions
                    const remainingRows = table.rows.filter((_, idx) => !rowIndices.includes(idx));

                    // Combine matched rows at the top with remaining rows
                    table.rows = [...matchedRows, ...remainingRows];

                    // Update the table data
                    updatedTableData[tableIdx] = table;
                });

                // Update table data with new ordering
                setTableData(updatedTableData);

                // Update selectedRowIndices to highlight the rows
                // Since we've moved them to the top, their indices are now 0 to matchedRows.length-1
                const selectedIndices = Array.from(
                    { length: matchingRows[firstTable]?.length || 0 },
                    (_, i) => i
                );

                setSelectedRowIndices(selectedIndices);

                // Ensure the table scrolls to show the first selected row
                setScrollToRowIndex(0);
            }
        };

        return () => {
            // Clean up global function when component unmounts
            delete window.selectRowsByFeatureIds;
        };
    }, [tableData, setShowTable, setCurrentTableIndex, setTableData, setSelectedRowIndices, setScrollToRowIndex]);


  
 // Add this useEffect to update map layers when colors change
useEffect(() => {
  if (!map) return;

  // Update uploaded locations
  uploadedLocationsRef.current.forEach(({ marker }) => {
   marker.setIcon(L.divIcon({
  html: `
    <div style="
      position: relative;
      width: 24px;
      height: 30px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    ">
      <div style="
        width: 20px;
        height: 20px;
        background-color: ${layerColors.uploadedLocations};
        border: 2px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        
      </div>
    </div>
  `,
  className: '',
  iconSize: [24, 30],
  iconAnchor: [12, 30]
}));
  });

substationsRef.current.forEach(({ marker }) => {
  // Get the current size from the existing icon
  const currentIcon = marker.getIcon();
  const currentSize = currentIcon.options.iconSize ? currentIcon.options.iconSize[0] : 16;
  
  marker.setIcon(L.divIcon({
    html: `
      <div style="
        position: relative;
        width: ${currentSize}px;
        height: ${currentSize}px;
        background-color: ${layerColors.substations};
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        border-radius: 50%;
      ">
      </div>
    `,
    className: '',
    iconSize: [currentSize, currentSize],
    iconAnchor: [currentSize/2, currentSize/2]
  }));
});

  // Update powerlines
  powerlinesRef.current.forEach(({ polyline, featureId }) => {
    // Determine the voltage level and apply appropriate color
    let color = layerColors.powerlinesOther;
    let weight = 2;
    
    // Try to get voltage from the popup content or feature properties
    const popupContent = polyline.getPopup()?.getContent() || '';
    const voltageMatch = popupContent.match(/Voltage: (\d+)V/);
    
    if (voltageMatch) {
      const voltage = parseInt(voltageMatch[1]);
      if (voltage >= 400000) {
        color = layerColors.powerlines400kv;
        weight = 4;
      } else if (voltage >= 220000) {
        color = layerColors.powerlines220kv;
        weight = 3;
      }
    }

    polyline.setStyle({
      color: color,
      weight: weight,
      opacity: 0.8
    });
  });
// Update buffer circles
bufferCirclesRef.current.forEach(({ circle }) => {
  circle.setStyle({
    fillColor: layerColors.uploadedLocations,
    color: layerColors.uploadedLocations
  });
});
}, [layerColors, map]);

    useEffect(() => {
        // Only store original data when it's first loaded
        tableData.forEach((table, index) => {
            if (table && table.rows && !originalData[index]) {
                setOriginalData(prev => ({
                    ...prev,
                    [index]: JSON.parse(JSON.stringify(table.rows))
                }));
            }
        });
    }, [tableData]);
    
    useEffect(() => {
        if (!isFullscreen && !toolbarPosition) {
          // Position the toolbar with spacing from the bottom edge in regular view
          setToolbarPosition({
            top: 'auto', 
            left: 'auto'
          });
        } else if (isFullscreen) {
          // Position on the left side with proper spacing in fullscreen mode
          const windowHeight = window.innerHeight;
          const windowWidth = window.innerWidth;
          
          // Calculate position with margins
          const topPosition = Math.min(windowHeight / 2 - 200, windowHeight - 400);
          
          setToolbarPosition({
            top: 70,
            left: 20 
          });
        }
      }, [isFullscreen, toolbarPosition]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeammate, setSelectedTeammate] = useState(null);

    const teammateList = [
        "Alice Johnson", "Bob Smith", "Catherine Nguyen", "David Li", "Emma Patel"
    ];

    const filteredTeammates = teammateList.filter(name =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`flex flex-col overflow-visible transition-all duration-300 ${isFullscreen
            ? 'fixed top-12 bottom-4 left-4 right-4 z-50 bg-transparent rounded-2xl shadow-2xl border border-gray-300'
            : 'h-full max-h-screen'
            }`}>
            {isFullscreen && title && (
                <div className="absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md shadow-md border border-gray-200">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-1 rounded-full border border-[#008080] hover:bg-[#008080] bg-white group transition-colors"
                            aria-label="Back to List"
                        >
                            <ArrowLeft className="h-4 w-4 text-[#008080] group-hover:text-white" />
                        </button>
                    )}
                    <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
                </div>
            )}
            <div className="flex-1 relative">
                {showSources && (
    <div ref={infoRef} className="absolute top-4 right-4 w-[280px] bg-white border border-gray-200 rounded-xl shadow-lg p-5 z-50 animate-fade-in">
        <div className="space-y-2 text-sm text-gray-700">
            <h3 className="font-semibold text-primary">Data Sources</h3>
            <div>
                <a href="#" className="text-blue-600 underline hover:text-blue-800">
                    OpenStreetMap Power Infrastructure
                </a>
            </div>
            <div>
                <a href="#" className="text-blue-600 underline hover:text-blue-800">
                    Red Eléctrica de España
                </a>
            </div>
            <div>
                <a href="#" className="text-blue-600 underline hover:text-blue-800">
                    Client Location Data
                </a>
            </div>
        </div>
    </div>
)}

                {showSaveDialog && (
                    <div className="absolute bottom-[60px] right-6 z-[1000]">
                        <div className="bg-white w-[300px] rounded-xl shadow-xl p-6 border border-gray-200 relative">
                            <button
                                onClick={() => setShowSaveDialog(false)}
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>

                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Save Map</h2>
                            <input
                                type="text"
                                placeholder="Enter a name"
                                value={customSaveName}
                                onChange={(e) => setCustomSaveName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#008080] focus:outline-none"
                            />
                            <button
                                className="mt-4 w-full py-2 rounded-md text-sm font-semibold bg-[#008080] text-white hover:bg-teal-700"
                                onClick={() => {
                                    const name = customSaveName.trim() || 'Untitled Map';
                                    const artifact = {
                                        id: Date.now().toString(),
                                        title: name,
                                        type: 'map',
                                        component: 'InfrastructureAnalysisMap',
props: {
    center: [-3.7038, 40.4168],
    activeLayers: activeLayers,
    layerColors: layerColors,
},
                                        data: {
                                            conversationId: localStorage.getItem('activeConversationId') || '',
                                            chatId: localStorage.getItem('activeConversationId') || '',
                                        },
                                        date: new Date().toLocaleDateString(),
                                    };

                                    if (typeof setSavedArtifacts === 'function') {
                                        setSavedArtifacts((prev) => {
                                            const updated = [...prev, artifact];
                                            localStorage.setItem('savedArtifacts', JSON.stringify(updated));
                                            return updated;
                                        });
                                    }

                                    const msg = `${name} has been saved`;
                                    setShowSaveDialog(false);
                                    setCustomSaveName('');
                                    setNotificationMessage(msg);
                                    setShowEmailNotification(true);
                                    addNotification(msg);
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                )}
{showTextToolbar && (
    <TextToolbar
    position={textToolbarPosition}
    currentTextFormat={textFormat}
      onFormatChange={handleTextFormatChange}
      onClose={() => map._hideTextToolbar?.()}
      isFullscreen={isFullscreen}
    />
)}

                {showSymbologyEditor && (
                    <div className="absolute top-16 right-4 z-[1000]">
                        <div className="bg-white p-5 rounded-xl w-[380px] max-h-[75vh] overflow-y-auto shadow-xl border border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-base font-semibold text-gray-800">Customize Layer Colors</h3>
                                <button onClick={() => setShowSymbologyEditor(false)}>
                                    <X size={16} className="text-gray-500 hover:text-gray-700" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {Object.entries(layerColors).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center">
                                        <label className="capitalize text-sm text-gray-700">{key.replace(/([A-Z])/g, ' $1')}</label>
                                        <input
                                            type="color"
                                            value={value}
                                            onChange={(e) =>
                                                setLayerColors((prev) => ({
                                                    ...prev,
                                                    [key]: e.target.value
                                                }))
                                            }
                                            className="w-10 h-6 border rounded"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={() => {
                                        const updatedColors = { ...layerColors };
                                        setLayerColors(updatedColors);
                                        setShowSymbologyEditor(false);

                                        if (map) {
                                            setTimeout(() => map.invalidateSize(), 100);
                                        }
                                    }}
                                    className="px-4 py-1 bg-[#008080] text-white rounded hover:bg-teal-700 text-sm"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {showGeocoder && (
  <div className="absolute top-6 left-6 z-[999999] w-[300px] overflow-visible">
    <div className="relative w-full max-w-xs z-10">
      <input
        type="text"
        placeholder="Search a location..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          runGeocodeSearch(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setShowGeocoder(false);
            setSearchQuery('');
            setSearchResults([]);
          }
        }}
        className="w-full px-4 pr-10 py-2 text-sm rounded-full shadow-md border"
        style={{
          backgroundColor: 'white',
          borderColor: '#008080',
          outline: 'none',
          boxShadow: '0 0 0 2px rgba(0,128,128,0.1)',
          transition: 'border 0.2s ease-in-out'
        }}
        onFocus={(e) => (e.target.style.boxShadow = '0 0 0 3px rgba(0,128,128,0.3)')}
        onBlur={(e) => (e.target.style.boxShadow = '0 0 0 2px rgba(0,128,128,0.1)')}
      />
<button
  onClick={() => {
    setShowGeocoder(false);
    setSearchQuery('');
    setSearchResults([]);
  }}
  className="absolute right-2 top-1/2 transform -translate-y-1/2"
  aria-label="Close search"
>
  <X size={16} className="text-gray-500 hover:text-[#008080] transition-colors" />
</button>

    </div>

    {searchResults.length > 0 && (
      <div className="bg-white border border-gray-200 rounded-lg shadow-md mt-1 max-h-48 overflow-y-auto divide-y divide-gray-100">
        {searchResults.map((result, idx) => (
          <div
            key={idx}
            onClick={() => handleResultClick(result)}
            className="px-4 py-2 hover:bg-[#008080]/10 cursor-pointer text-sm transition-colors duration-150"
          >
            <div className="font-medium text-gray-800">{result.name}</div>
            <div className="text-xs text-gray-500 truncate">{result.fullName}</div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
                {showDrawTools && (
                    <div
                        className="absolute z-[9999] w-[130px] bg-white border border-gray-200 rounded-xl shadow-lg p-2 transition-all animate-fade-in"
                        style={{
                            top: isFullscreen ? '80px' : '360px',
                            left: isFullscreen ? '80px' : '130px',
                        }}
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-semibold text-gray-800">Drawing Tools</h3>
                            <button onClick={() => setShowDrawTools(false)}>
                                <X size={16} className=" text-gray-500 hover:text-[#008080]" />
                            </button>
                        </div>
                        <div className="grid gap-1">
                            <button
                                onClick={() => { 
                                    setShowDrawTools(false); 
                                    setShowGeocoder(!showGeocoder)
                                }}
                                data-tooltip="Search Location"
                                className="w-full px-2 py-1 rounded-full border text-xs font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
                                style={{
                                    color: COLORS.coral,
                                    border: `1px solid ${COLORS.coral}`,
                                    transition: 'all 0.2s ease-in-out'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = COLORS.coral;
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                    e.currentTarget.style.color = COLORS.coral;
                                }}
                            >
                                <div className="flex items-center">
                                    <TbMapSearch className="mr-1" size={12} style={{ minWidth: '12px' }} />
                                    <span>Search</span>
                                </div>
                            </button>
                            <button
                                className="w-full px-2 py-1 rounded-full border text-xs font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
                                onClick={() => {
                                    setShowDrawTools(false);
                                    createSelectTool(map, setActiveDrawTool, nextShapeIds, setNextShapeIds, setDrawnLayers, setDrawnLayersOrder);
                                }}
                            >
                                <div className="flex items-center">
                                    <MousePointerSquareDashed className="mr-1" size={12} style={{ minWidth: '12px' }} />
                                    <span>Select</span>
                                </div>
                            </button>
                            
                          

                            <button
                                className="w-full px-2 py-1 rounded-full border text-xs font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
                                onClick={() => {
                                    setShowDrawTools(false);
                                    createFreehandTool(map, setActiveDrawTool, nextShapeIds, setNextShapeIds, setDrawnLayers, setDrawnLayersOrder);
                                }}
                            >
                                <div className="flex items-center">
                                    <MdDraw className="mr-1" size={12} style={{ minWidth: '12px' }} />
                                    <span>Freehand</span>
                                </div></button>

                            <button
                                className="w-full px-2 py-1 rounded-full border text-xs font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
                                onClick={() => {
                                    setShowDrawTools(false);
                                    createTextTool(
                                        map, 
                                        setActiveDrawTool, 
                                        nextShapeIds, 
                                        setNextShapeIds, 
                                        setDrawnLayers, 
                                        setDrawnLayersOrder
                                      );                                }}>
                                <div className="flex items-center">
                                    <TextCursorInput className="mr-1" size={12} style={{ minWidth: '12px' }} />
                                    <span>Text</span>
                                </div>
                            </button>

                        </div>
                    </div>
                )}
                {isEditing && (
                    <button
                        className="block w-full text-left font-semibold text-[#008080] border-t border-gray-200 pt-2 mt-2"
                        onClick={() => {
                            if (editControlRef.current) {
                                editControlRef.current.disable();
                                editControlRef.current = null;
                            }
                            setIsEditing(false);
                        }}
                    >
                        Done Editing
                    </button>
                )}







                <div ref={mapContainerRef} className="absolute inset-0 w-full h-full map-container" style={{ zIndex: 0 }} />

                {/* Table section */}
                {showTable && (
                    <VirtualizedTable
                        tableData={tableData}
                        setTableData={setTableData} // Pass the setter function
                        currentTableIndex={currentTableIndex}
                        setCurrentTableIndex={setCurrentTableIndex}
                        tableTitles={tableTitles}
                        selectedRowIndices={selectedRowIndices}
                        setSelectedRowIndices={setSelectedRowIndices}
                        selectedColIndex={selectedColIndex}
                        setSelectedColIndex={setSelectedColIndex}
                        highlightFeatureByRowProperties={highlightFeatureByRowProperties}
                        resetLayerHighlighting={resetLayerHighlighting}
                        handleCellEdit={handleCellEdit}
                        tableHeight={tableHeight}
                        setTableHeight={setTableHeight}
                        showTable={showTable}
                        setIsModified={setIsModified} // Pass the setIsModified function
                        originalRowsMap={originalData} // Pass this instead of originalRowsMap
                        setOriginalRowsMap={setOriginalData}  // Pass the setter for original data
                        scrollToRowIndex={scrollToRowIndex}

                    />
                )}
                {showMapDownloader && (
                    <MapDownloader
                        isOpen={showMapDownloader}
                        onClose={() => setShowMapDownloader(false)}
                        mapContainerRef={mapContainerRef}
uploadedLocationsRef={uploadedLocationsRef}
                        activeLayers={activeLayers}
                        layerColors={layerColors}
                        addNotification={addNotification}
                    />
                )}
              {showShareDialog && (
  <ShareDialog
    isOpen={showShareDialog}
    onClose={() => setShowShareDialog(false)}
    onShare={(teammates) => {
      setShowShareDialog(false);
      const msg = `Map shared with: ${teammates.join(', ')}`;
      setNotificationMessage(msg);
      setShowEmailNotification(true);
      addNotification(msg);
    }}
    onShowDownloader={() => setShowMapDownloader(true)}
    title="Share This Map"
    position={{ 
      bottom: isFullscreen ? '80px' : '60px', 
      right: '16px' 
    }}
  />
)}


                <ToolbarComponent
                    isFullscreen={isFullscreen}
                    showTable={showTable}
                    setShowTable={setShowTable}
                    onSaveMap={onSaveMap}
                    savedMaps={savedMaps}
                    onBack={onBack}
                    isPreview={isPreview}
                    captureAndDownload={() => setShowMapDownloader(true)}
                    setShowLegend={setShowLegend}
                    setShowSources={setShowSources}
                    toggleFullscreen={toggleFullscreen}
                    toolbarVisible={toolbarVisible}
                    setToolbarVisible={setToolbarVisible}
                    toolbarPosition={toolbarPosition}
                    setToolbarPosition={setToolbarPosition}
                    setShowSaveDialog={setShowSaveDialog}
                    setShowGeocoder={setShowGeocoder}
                    showGeocoder={showGeocoder}
                    setShowDrawTools={setShowDrawTools}
                    showDrawTools={showDrawTools}
                    pencilRef={pencilRef}
                    setShowShareDialog={setShowShareDialog}
                    setMapView={handleMapViewChange}
                    activeMapView={currentMapView}
                    showTextToolbar={showTextToolbar}
                    map={map}
    createPolygonDrawTool={createPolygonDrawTool}
    snapLayersRef={snapLayersRef}
    setActiveDrawTool={setActiveDrawTool}
    sendQuestionToChat={sendQuestionToChat}
    nextShapeIds={nextShapeIds}
    setNextShapeIds={setNextShapeIds}
    setDrawnLayers={setDrawnLayers}
    setDrawnLayersOrder={setDrawnLayersOrder}
    
                />



                {showLegend && (
                    <DraggableLegend
                    mapContainerRef={mapContainerRef}
                    isFullscreen={isFullscreen} 
                    showLegend={showLegend}
                    setShowLegend={setShowLegend}
                    activeLayers={activeLayers}
                    toggleLayer={toggleLayer}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                    layerColors={layerColors}
                    setLayerColors={setLayerColors}
                    layerZIndexes={layerZIndexes}
                    setLayerZIndexes={setLayerZIndexes}
                    customLayerNames={customLayerNames}
                    setCustomLayerNames={setCustomLayerNames}
                    currentMapView={currentMapView}
                    handleMapViewChange={handleMapViewChange}
                    baseMapLayer={baseMapLayer}
                    toggleBaseMap={(visible) => {
                        if (visible && map && !map.hasLayer(baseMapLayer)) {
                            map.addLayer(baseMapLayer);
                        } else if (!visible && map && map.hasLayer(baseMapLayer)) {
                            map.removeLayer(baseMapLayer);
                        }
                    }}
                    drawnLayers={drawnLayers || {}}
                    drawnLayersOrder={drawnLayersOrder || []}
                    toggleDrawnLayer={toggleDrawnLayer}    
                    setDrawnLayers={setDrawnLayers} 
                    updateDrawnLayerColor={updateDrawnLayerColor}
                />
                )}
            </div>

            {showEmailNotification && (
                <div className="fixed top-6 right-6 z-[9999] animate-slide-in transition-opacity duration-300">
                    <div className="bg-white border border-[#008080] text-[#008080] px-5 py-3 rounded-lg shadow-lg text-sm font-medium">
                        {notificationMessage}
                    </div>
                </div>
            )}
<LoadingBar />



        </div>
    );
};

export default InfrastructureAnalysisMapComponent;